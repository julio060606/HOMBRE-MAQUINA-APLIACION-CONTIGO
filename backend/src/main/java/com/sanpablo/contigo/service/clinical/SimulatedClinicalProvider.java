package com.sanpablo.contigo.service.clinical;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component("simulatedClinicalProvider")
public class SimulatedClinicalProvider implements ClinicalProvider {

    // Dynamic fixtures map: externalPatientId -> list of prescriptions
    private final Map<String, List<PrescriptionData>> customPrescriptions = new ConcurrentHashMap<>();
    private final Map<String, List<AppointmentData>> customAppointments = new ConcurrentHashMap<>();
    private final Map<String, ProfileData> customProfiles = new ConcurrentHashMap<>();

    public void setCustomPrescriptions(String externalPatientId, List<PrescriptionData> prescriptions) {
        customPrescriptions.put(externalPatientId, prescriptions);
    }

    public void setCustomAppointments(String externalPatientId, List<AppointmentData> appointments) {
        customAppointments.put(externalPatientId, appointments);
    }

    public void setCustomProfile(String externalPatientId, ProfileData profile) {
        customProfiles.put(externalPatientId, profile);
    }

    @Override
    public List<PrescriptionData> fetchPrescriptions(String externalPatientId) {
        if (customPrescriptions.containsKey(externalPatientId)) {
            return customPrescriptions.get(externalPatientId);
        }

        String today = LocalDate.now(ZoneId.of("America/Lima")).toString();
        if ("demo-pat_002".equals(externalPatientId)) {
            return List.of(new PrescriptionData("rx-med_003", 1, "Tratamiento de ejemplo", "Consultar indicación clínica", "TABLET",
                    List.of("09:00"), "DAILY", today, null, "Escenario ficticio independiente para Rosa.", true,
                    BigDecimal.ONE, "unidades", null, "Diagnóstico del escenario ficticio de Rosa", "Profesional ficticio de Rosa"));
        }
        if (!"demo-pat_001".equals(externalPatientId)) return List.of();
        List<PrescriptionData> list = new ArrayList<>();
        list.add(new PrescriptionData(
                "rx-med_001",
                1,
                "Losartán",
                "50 mg",
                "TABLET",
                List.of("08:00", "20:00"),
                "DAILY",
                today,
                null,
                "Tomar con abundante agua después de los alimentos.",
                true,
                BigDecimal.ONE,
                "tabletas", "/images/losartan_pill.jpg", "Diagnóstico del escenario ficticio de Dacio", "Profesional ficticio de Dacio"
        ));
        list.add(new PrescriptionData(
                "rx-med_002",
                1,
                "Vitamina D3",
                "2000 UI",
                "TABLET",
                List.of("14:00"),
                "DAILY",
                today,
                null,
                "Tomar al mediodía con almuerzo.",
                true,
                BigDecimal.ONE,
                "tabletas", "/images/vitamina_d3.jpg", "Diagnóstico del escenario ficticio de Dacio", "Profesional ficticio de Dacio"
        ));
        return list;
    }

    @Override
    public List<AppointmentData> fetchAppointments(String externalPatientId) {
        if (customAppointments.containsKey(externalPatientId)) {
            return customAppointments.get(externalPatientId);
        }

        if (!List.of("demo-pat_001", "demo-pat_002").contains(externalPatientId)) return List.of();
        boolean rosa = "demo-pat_002".equals(externalPatientId);
        return List.of(
                new AppointmentData(
                        "external-" + externalPatientId.substring(5),
                        Instant.now().plusSeconds(2 * 86400),
                        rosa ? "Medicina general" : "Geriatría",
                        "Profesional del escenario ficticio",
                        "Consultorio de prueba de la clínica ficticia",
                        "SCHEDULED",
                        "Cita sintética para comprobar la consulta de información."
                )
        );
    }

    @Override
    public ProfileData fetchProfile(String externalPatientId) {
        if (customProfiles.containsKey(externalPatientId)) {
            return customProfiles.get(externalPatientId);
        }

        if (!List.of("demo-pat_001", "demo-pat_002").contains(externalPatientId)) return null;
        boolean rosa = "demo-pat_002".equals(externalPatientId);
        return new ProfileData(
                BigDecimal.valueOf(rosa ? 159.0 : 168.0),
                BigDecimal.valueOf(rosa ? 61.0 : 72.0),
                Instant.now().minusSeconds(7 * 86400),
                "Ficha sintética del proyecto académico"
        );
    }

    @Override
    public boolean isLiveConnection() {
        return false;
    }
}
