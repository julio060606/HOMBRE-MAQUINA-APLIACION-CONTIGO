package com.sanpablo.contigo;

import com.sanpablo.contigo.domain.clinical.ClinicalSyncState;
import com.sanpablo.contigo.domain.clinical.Medication;
import com.sanpablo.contigo.domain.telemetry.PillIntake;
import com.sanpablo.contigo.repository.ClinicalSyncStateRepository;
import com.sanpablo.contigo.repository.MedicationRepository;
import com.sanpablo.contigo.repository.PillIntakeRepository;
import com.sanpablo.contigo.service.clinical.ClinicalProvider;
import com.sanpablo.contigo.service.clinical.ClinicalSyncService;
import com.sanpablo.contigo.service.clinical.SimulatedClinicalProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class ClinicalProviderSyncTest {

    @Autowired
    private ClinicalSyncService syncService;

    @Autowired
    private SimulatedClinicalProvider simulatedProvider;

    @Autowired
    private MedicationRepository medicationRepository;

    @Autowired
    private PillIntakeRepository intakeRepository;

    @Autowired
    private ClinicalSyncStateRepository syncStateRepository;

    @Test
    @DisplayName("Sincronización clínica importa prescripciones y citas sin duplicar ni borrar historial")
    void testClinicalSyncPreservesHistory() {
        String patientId = "pat_001";

        // 1. Ejecutar sincronización inicial
        syncService.syncPatient(patientId);

        List<Medication> meds = medicationRepository.findByPatientId(patientId);
        assertFalse(meds.isEmpty(), "Deben haberse importado medicamentos");

        Medication losartan = meds.stream()
                .filter(m -> "Losartán".equals(m.getName()))
                .findFirst()
                .orElseThrow();
        assertEquals(1, losartan.getVersion());

        // Simular una dosis pasada ya tomada
        PillIntake pastAnswered = new PillIntake();
        pastAnswered.setId("past-answered-1");
        pastAnswered.setPatientId(patientId);
        pastAnswered.setOrganizationId("clinic_demo");
        pastAnswered.setMedicationId(losartan.getId());
        pastAnswered.setMedicationName(losartan.getName());
        pastAnswered.setDosage(losartan.getDosage());
        pastAnswered.setScheduledTime("08:00");
        pastAnswered.setScheduledDate("2026-10-06");
        pastAnswered.setScheduledAt(Instant.now().minusSeconds(86400));
        pastAnswered.setStatus("TAKEN");
        pastAnswered.setTakenAt(Instant.now().minusSeconds(86400));
        pastAnswered.setVersion(1);
        intakeRepository.save(pastAnswered);

        // 2. Simular actualización clínica con versión 2 (cambio de dosis a 100 mg)
        simulatedProvider.setCustomPrescriptions("demo-pat_001", List.of(
                new ClinicalProvider.PrescriptionData(
                        "rx-med_001",
                        2,
                        "Losartán",
                        "100 mg",
                        "TABLET",
                        List.of("08:00", "20:00"),
                        "DAILY",
                        "2026-10-07",
                        null,
                        "Dosis aumentada por indicación del cardiólogo",
                        true,
                        BigDecimal.ONE,
                        "tabletas"
                )
        ));

        syncService.syncPatient(patientId);

        // Verificar que la receta se actualizó a versión 2 y dosis 100 mg
        Medication updated = medicationRepository.findByPatientIdAndExternalPrescriptionId(patientId, "rx-med_001")
                .orElseThrow();
        assertEquals(2, updated.getVersion());
        assertEquals("100 mg", updated.getDosage());

        // Verificar que la dosis tomada pasada NO se borró ni alteró
        PillIntake checkPast = intakeRepository.findById(pastAnswered.getId()).orElseThrow();
        assertEquals("TAKEN", checkPast.getStatus());
        assertEquals("50 mg", checkPast.getDosage(), "La dosis pasada conserva su dosificación histórica original");

        // Verificar estado de sincronización
        ClinicalSyncState syncState = syncStateRepository.findByPatientId(patientId).orElseThrow();
        assertEquals("SYNCED", syncState.getStatus());
    }
}
