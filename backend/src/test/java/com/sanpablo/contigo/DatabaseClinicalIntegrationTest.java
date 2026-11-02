package com.sanpablo.contigo;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanpablo.contigo.domain.telemetry.PillIntake;
import com.sanpablo.contigo.repository.*;
import com.sanpablo.contigo.service.IntakeService;
import com.sanpablo.contigo.service.clinical.ClinicalSyncService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class DatabaseClinicalIntegrationTest {
    private static final ZoneId LIMA = ZoneId.of("America/Lima");
    private static final String SUFFIX = UUID.randomUUID().toString().replace("-", "");
    private static final String SOURCE_URL = "jdbc:h2:mem:clinic_source_" + SUFFIX;
    private static final JdbcTemplate SOURCE = createSource();

    private static JdbcTemplate createSource() {
        var source = new JdbcTemplate(new DriverManagerDataSource(SOURCE_URL + ";MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1", "sa", ""));
        source.execute("CREATE SCHEMA clinic");
        source.execute("CREATE TABLE clinic.rx (external_patient_id VARCHAR, external_prescription_id VARCHAR, version INT, name VARCHAR, dosage VARCHAR, form_factor VARCHAR, times VARCHAR, frequency_type VARCHAR, start_date DATE, end_date DATE, instructions VARCHAR, is_active BOOLEAN, units_per_dose NUMERIC(6,2), stock_unit VARCHAR, image_url VARCHAR, diagnosis VARCHAR, doctor VARCHAR)");
        source.execute("CREATE TABLE clinic.appt (external_patient_id VARCHAR, external_id VARCHAR, starts_at TIMESTAMP WITH TIME ZONE, specialty VARCHAR, doctor VARCHAR, location VARCHAR, status VARCHAR, instructions VARCHAR)");
        source.execute("CREATE TABLE clinic.profile (external_patient_id VARCHAR, height_cm NUMERIC, weight_kg NUMERIC, measured_at TIMESTAMP WITH TIME ZONE, notes VARCHAR)");
        source.execute("CREATE VIEW clinic.contigo_prescriptions AS SELECT * FROM clinic.rx");
        source.execute("CREATE VIEW clinic.contigo_appointments AS SELECT * FROM clinic.appt");
        source.execute("CREATE VIEW clinic.contigo_profiles AS SELECT * FROM clinic.profile");
        source.execute("CREATE USER clinic_reader PASSWORD 'test_reader_only'");
        for (String view : List.of("contigo_prescriptions", "contigo_appointments", "contigo_profiles")) source.execute("GRANT SELECT ON clinic." + view + " TO clinic_reader");
        return source;
    }

    @DynamicPropertySource
    static void configure(DynamicPropertyRegistry properties) {
        properties.add("spring.datasource.url", () -> "jdbc:h2:mem:contigo_app_" + SUFFIX + ";MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH;DB_CLOSE_DELAY=-1");
        properties.add("contigo.clinical-provider.mode", () -> "database");
        properties.add("contigo.clinical-provider.database.url", () -> SOURCE_URL);
        properties.add("contigo.clinical-provider.database.username", () -> "clinic_reader");
        properties.add("contigo.clinical-provider.database.password", () -> "test_reader_only");
        properties.add("contigo.clinical-provider.database.driver-class-name", () -> "org.h2.Driver");
        properties.add("contigo.clinical-provider.sync.enabled", () -> false);
    }

    @Autowired DataSource applicationDataSource;
    @Autowired ClinicalSyncService sync;
    @Autowired MedicationRepository medications;
    @Autowired PillIntakeRepository intakes;
    @Autowired ClinicalSyncStateRepository states;
    @Autowired UserRepository users;
    @Autowired IntakeService intakeService;
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    @BeforeEach void fixtures() {
        SOURCE.update("DELETE FROM clinic.rx"); SOURCE.update("DELETE FROM clinic.appt"); SOURCE.update("DELETE FROM clinic.profile");
        LocalDate today = LocalDate.now(LIMA);
        for (var row : List.of(new String[]{"demo-pat_001", "rx-med_001", "Losartán", "50 mg", "08:00,23:59", "/images/losartan_pill.jpg"}, new String[]{"demo-pat_001", "rx-med_002", "Vitamina D3", "2000 UI", "14:00", "/images/vitamina_d3.jpg"}, new String[]{"demo-pat_002", "rx-med_003", "Tratamiento de Rosa", "Dosis ficticia de Rosa", "09:00", ""})) {
            SOURCE.update("INSERT INTO clinic.rx VALUES (?, ?, 1, ?, ?, 'TABLET', ?, 'DAILY', ?, ?, 'Pauta ficticia de prueba', TRUE, 1, 'tabletas', ?, 'Diagnóstico ficticio', 'Profesional ficticio')", row[0], row[1], row[2], row[3], row[4], today.minusDays(3), today.plusDays(30), row[5]);
        }
        for (String id : List.of("001", "002")) {
            SOURCE.update("INSERT INTO clinic.appt VALUES (?, ?, ?, 'Consulta de prueba', 'Profesional ficticio', 'Consultorio ficticio', 'SCHEDULED', 'Datos sintéticos')", "demo-pat_" + id, "external-pat_" + id, java.sql.Timestamp.from(Instant.now().plusSeconds(172800)));
            SOURCE.update("INSERT INTO clinic.profile VALUES (?, 168, 72, ?, 'Ficha ficticia')", "demo-pat_" + id, java.sql.Timestamp.from(Instant.now()));
        }
        var local = new JdbcTemplate(applicationDataSource);
        local.update("DELETE FROM telemetry.pill_intakes"); local.update("DELETE FROM clinical.clinical_sync_state");
        local.update("UPDATE clinical.medications SET version=1, is_active=TRUE WHERE patient_id IN ('pat_001','pat_002')");
        local.update("UPDATE clinical.medications SET dosage='50 mg', times='08:00,23:59', start_date=?, end_date=? WHERE id='med_001'", today.minusDays(3).toString(), today.plusDays(30).toString());
    }

    @Test void separateReadOnlyDatabaseDoesNotReplaceApplicationDataSourceAndSyncIsIdempotent() throws Exception {
        try (var connection = applicationDataSource.getConnection()) { assertTrue(connection.getMetaData().getURL().contains("contigo_app_")); }
        sync.syncPatient("pat_001");
        Set<String> firstDoseIds = new HashSet<>(intakes.findByPatientId("pat_001").stream().map(PillIntake::getId).toList());
        sync.syncPatient("pat_001");
        assertEquals(firstDoseIds, new HashSet<>(intakes.findByPatientId("pat_001").stream().map(PillIntake::getId).toList()));
        assertEquals(2, medications.findByPatientId("pat_001").size());
        var med = medications.findById("med_001").orElseThrow();
        assertEquals("Diagnóstico ficticio", med.getDiagnosis()); assertEquals("Profesional ficticio", med.getDoctor()); assertEquals("/images/losartan_pill.jpg", med.getImageUrl());
        assertTrue(intakes.findByPatientId("pat_001").stream().allMatch(d -> "Diagnóstico ficticio".equals(d.getDiagnosis())));
        assertEquals("SYNCED", states.findByPatientId("pat_001").orElseThrow().getStatus());
        assertEquals(3, firstDoseIds.size());
    }

    @Test void queryIsScopedToExternalPatientAndCannotWriteTheSource() {
        sync.syncPatient("pat_002");
        assertEquals(1, medications.findByPatientId("pat_002").size());
        assertEquals("Tratamiento de Rosa", medications.findByPatientId("pat_002").getFirst().getName());
        assertTrue(intakes.findByPatientId("pat_002").stream().allMatch(d -> "pat_002".equals(d.getPatientId()) && "med_003".equals(d.getMedicationId())));
        var reader = new JdbcTemplate(new DriverManagerDataSource(SOURCE_URL, "clinic_reader", "test_reader_only"));
        assertThrows(DataAccessException.class, () -> reader.update("DELETE FROM clinic.contigo_prescriptions"));
    }

    @Test void commitFailureRollsBackImportedDataAndKeepsHonestFailureState() {
        sync.syncPatient("pat_001");
        Instant previousSuccess = states.findByPatientId("pat_001").orElseThrow().getLastSuccessfulSyncAt();
        SOURCE.update("UPDATE clinic.rx SET version=2, dosage='100 mg' WHERE external_prescription_id='rx-med_001'");
        SOURCE.update("UPDATE clinic.profile SET height_cm=10000 WHERE external_patient_id='demo-pat_001'");
        assertThrows(Exception.class, () -> sync.syncPatient("pat_001"));
        assertEquals("50 mg", medications.findById("med_001").orElseThrow().getDosage());
        assertEquals("FAILED", states.findByPatientId("pat_001").orElseThrow().getStatus());
        assertEquals(previousSuccess, states.findByPatientId("pat_001").orElseThrow().getLastSuccessfulSyncAt());
    }

    @Test void updatedPrescriptionCancelsFuturePendingButKeepsAnsweredHistory() {
        Assumptions.assumeTrue(LocalTime.now(LIMA).isBefore(LocalTime.of(23, 58)));
        sync.syncPatient("pat_001");
        var historical = new PillIntake(); historical.setId(UUID.randomUUID().toString()); historical.setPatientId("pat_001"); historical.setOrganizationId("clinic_demo"); historical.setMedicationId("med_001"); historical.setMedicationName("Losartán"); historical.setDosage("50 mg"); historical.setScheduledTime("08:00"); historical.setScheduledDate(LocalDate.now(LIMA).minusDays(1).toString()); historical.setScheduledAt(Instant.now().minusSeconds(86400)); historical.setStatus("TAKEN"); historical.setVersion(1); historical.setUnitsPerDose(BigDecimal.ONE); intakes.save(historical);
        SOURCE.update("UPDATE clinic.rx SET version=2, dosage='100 mg' WHERE external_prescription_id='rx-med_001'");
        sync.syncPatient("pat_001");
        assertEquals("50 mg", intakes.findById(historical.getId()).orElseThrow().getDosage());
        assertEquals("TAKEN", intakes.findById(historical.getId()).orElseThrow().getStatus());
        assertTrue(intakes.findByPatientId("pat_001").stream().anyMatch(d -> "23:59".equals(d.getScheduledTime()) && "CANCELLED".equals(d.getStatus()) && "50 mg".equals(d.getDosage())));
        assertTrue(intakes.findByPatientId("pat_001").stream().anyMatch(d -> "23:59".equals(d.getScheduledTime()) && "PENDING".equals(d.getStatus()) && "100 mg".equals(d.getDosage())));
    }

    @Test void localDoseGenerationContinuesFromPersistedPrescriptionsWhenSourceFails() {
        sync.syncPatient("pat_001"); intakes.deleteAllInBatch();
        SOURCE.execute("DROP VIEW clinic.contigo_profiles");
        try {
            assertThrows(Exception.class, () -> sync.syncPatient("pat_001"));
            assertEquals(3, intakeService.getDoses(users.findById("patient_dacio").orElseThrow(), "pat_001", null, null).size());
            assertEquals("FAILED", states.findByPatientId("pat_001").orElseThrow().getStatus());
        } finally { SOURCE.execute("CREATE VIEW clinic.contigo_profiles AS SELECT * FROM clinic.profile"); SOURCE.execute("GRANT SELECT ON clinic.contigo_profiles TO clinic_reader"); }
    }

    @Test void manualSyncRequiresAdministratorAndAuthenticationUses401() throws Exception {
        mvc.perform(get("/api/v1/health")).andExpect(status().isOk()).andExpect(jsonPath("$.app").value("CONTIGO"));
        mvc.perform(post("/api/v1/clinical-sync/pat_001")).andExpect(status().isUnauthorized());
        for (String email : List.of("dacio@contigo.example", "cuidador@contigo.example")) mvc.perform(post("/api/v1/clinical-sync/pat_001").header("Authorization", "Bearer " + login(email))).andExpect(status().isForbidden());
        String admin = login("admin@contigo.example");
        mvc.perform(post("/api/v1/clinical-sync/pat_001").header("Authorization", "Bearer " + admin)).andExpect(status().isOk());
        mvc.perform(get("/api/v1/patients/pat_001/prescriptions").header("Authorization", "Bearer " + admin)).andExpect(status().isOk()).andExpect(jsonPath("$[0].isActive").isBoolean());
    }

    private String login(String email) throws Exception {
        var response = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("email", email, "password", "Contigo2026!")))).andExpect(status().isOk()).andReturn().getResponse();
        return json.readTree(response.getContentAsString()).get("token").asText();
    }
}
