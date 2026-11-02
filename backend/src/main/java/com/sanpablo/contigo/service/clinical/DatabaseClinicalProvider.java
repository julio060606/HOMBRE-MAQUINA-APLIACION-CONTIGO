package com.sanpablo.contigo.service.clinical;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.stereotype.Component;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;

/** Reads only the integration views of the separate, fictional clinic database. */
@Component("databaseClinicalProvider")
@ConditionalOnProperty(name = "contigo.clinical-provider.mode", havingValue = "database")
public class DatabaseClinicalProvider implements ClinicalProvider, AutoCloseable {
    // Deliberately not exposed as a DataSource bean: the application's JPA DataSource stays auto-configured.
    private final HikariDataSource clinicDataSource;
    private final JdbcTemplate clinicJdbc;
    private final TransactionTemplate clinicReadTransaction;

    public DatabaseClinicalProvider(
            @Value("${contigo.clinical-provider.database.url}") String url,
            @Value("${contigo.clinical-provider.database.username}") String username,
            @Value("${contigo.clinical-provider.database.password}") String password,
            @Value("${contigo.clinical-provider.database.driver-class-name:org.postgresql.Driver}") String driver,
            @Value("${contigo.clinical-provider.database.connection-timeout-ms:5000}") long timeoutMs) {
        HikariConfig config = new HikariConfig();
        config.setPoolName("contigo-clinic-read-only");
        config.setJdbcUrl(url);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName(driver);
        config.setReadOnly(true);
        config.setMaximumPoolSize(2);
        config.setMinimumIdle(0);
        config.setConnectionTimeout(timeoutMs);
        config.setInitializationFailTimeout(-1);
        clinicDataSource = new HikariDataSource(config);
        clinicJdbc = new JdbcTemplate(clinicDataSource);
        clinicJdbc.setQueryTimeout(Math.max(1, (int) Math.ceil(timeoutMs / 1000.0)));
        clinicReadTransaction = new TransactionTemplate(new DataSourceTransactionManager(clinicDataSource));
        clinicReadTransaction.setReadOnly(true);
        clinicReadTransaction.setIsolationLevel(TransactionDefinition.ISOLATION_REPEATABLE_READ);
        clinicReadTransaction.setTimeout(Math.max(3, (int) Math.ceil(timeoutMs / 1000.0)));
    }

    @Override
    public Snapshot fetchSnapshot(String externalPatientId) {
        if (externalPatientId == null || externalPatientId.isBlank()) throw new IllegalArgumentException("Falta el identificador externo del paciente.");
        return clinicReadTransaction.execute(status -> {
            Snapshot snapshot = new Snapshot(fetchPrescriptions(externalPatientId), fetchAppointments(externalPatientId), fetchProfile(externalPatientId));
            if (snapshot.prescriptions().isEmpty() && snapshot.appointments().isEmpty() && snapshot.profile() == null) {
                throw new IllegalArgumentException("El paciente no figura en las vistas de integración de la clínica ficticia.");
            }
            return snapshot;
        });
    }

    @Override
    public List<PrescriptionData> fetchPrescriptions(String externalPatientId) {
        return clinicJdbc.query("""
                SELECT external_prescription_id, version, name, dosage, form_factor, times, frequency_type,
                       start_date, end_date, instructions, is_active, units_per_dose, stock_unit, image_url, diagnosis, doctor
                FROM clinic.contigo_prescriptions WHERE external_patient_id = ? ORDER BY external_prescription_id
                """, (rs, row) -> new PrescriptionData(
                rs.getString("external_prescription_id"), rs.getInt("version"), rs.getString("name"), rs.getString("dosage"),
                rs.getString("form_factor"), times(rs.getString("times")), rs.getString("frequency_type"),
                rs.getString("start_date"), rs.getString("end_date"), rs.getString("instructions"), rs.getBoolean("is_active"),
                rs.getBigDecimal("units_per_dose"), rs.getString("stock_unit"), rs.getString("image_url"),
                rs.getString("diagnosis"), rs.getString("doctor")), externalPatientId);
    }

    @Override
    public List<AppointmentData> fetchAppointments(String externalPatientId) {
        return clinicJdbc.query("""
                SELECT external_id, starts_at, specialty, doctor, location, status, instructions
                FROM clinic.contigo_appointments WHERE external_patient_id = ? ORDER BY starts_at, external_id
                """, (rs, row) -> new AppointmentData(rs.getString("external_id"), instant(rs, "starts_at"),
                rs.getString("specialty"), rs.getString("doctor"), rs.getString("location"), rs.getString("status"), rs.getString("instructions")), externalPatientId);
    }

    @Override
    public ProfileData fetchProfile(String externalPatientId) {
        List<ProfileData> profiles = clinicJdbc.query("""
                SELECT height_cm, weight_kg, measured_at, notes
                FROM clinic.contigo_profiles WHERE external_patient_id = ?
                """, (rs, row) -> new ProfileData(rs.getBigDecimal("height_cm"), rs.getBigDecimal("weight_kg"),
                instant(rs, "measured_at"), rs.getString("notes")), externalPatientId);
        if (profiles.size() > 1) throw new IllegalArgumentException("La clínica devolvió más de una ficha para el paciente.");
        return profiles.isEmpty() ? null : profiles.getFirst();
    }

    private static List<String> times(String csv) {
        return csv == null || csv.isBlank() ? List.of() : Arrays.stream(csv.split(",")).map(String::trim).toList();
    }

    private static Instant instant(ResultSet rs, String field) throws SQLException {
        var value = rs.getTimestamp(field);
        return value == null ? null : value.toInstant();
    }

    @Override public boolean isLiveConnection() { return true; }
    @Override public String description() { return "base PostgreSQL de la clínica ficticia mediante JDBC de solo lectura"; }
    @jakarta.annotation.PreDestroy
    @Override public void close() { clinicDataSource.close(); }
}
