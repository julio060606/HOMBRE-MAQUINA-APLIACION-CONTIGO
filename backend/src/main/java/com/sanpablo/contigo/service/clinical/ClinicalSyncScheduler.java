package com.sanpablo.contigo.service.clinical;

import com.sanpablo.contigo.repository.PatientRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicBoolean;

@Component
@ConditionalOnProperty(name = "contigo.clinical-provider.mode", havingValue = "database")
public class ClinicalSyncScheduler {
    private static final Logger log = LoggerFactory.getLogger(ClinicalSyncScheduler.class);
    private final ClinicalSyncService syncService;
    private final PatientRepository patients;
    private final boolean enabled;
    private final boolean onStartup;
    private final String organizationId;
    private final AtomicBoolean running = new AtomicBoolean();

    public ClinicalSyncScheduler(ClinicalSyncService syncService, PatientRepository patients,
            @Value("${contigo.clinical-provider.sync.enabled:true}") boolean enabled,
            @Value("${contigo.clinical-provider.sync.on-startup:true}") boolean onStartup,
            @Value("${contigo.clinical-provider.database.organization-id:clinic_demo}") String organizationId) {
        this.syncService = syncService; this.patients = patients; this.enabled = enabled;
        this.onStartup = onStartup; this.organizationId = organizationId;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void applicationReady() { if (onStartup) synchronizePatients(); }

    @Scheduled(fixedDelayString = "${contigo.clinical-provider.sync.interval-ms:60000}", initialDelayString = "${contigo.clinical-provider.sync.initial-delay-ms:15000}")
    public void synchronizePatients() {
        if (!enabled || !running.compareAndSet(false, true)) return;
        try {
            for (var patient : patients.findByOrganizationId(organizationId)) {
                try { syncService.syncPatient(patient.getId()); }
                catch (RuntimeException failure) {
                    log.warn("Sincronización clínica pendiente para {}. Se reintentará en el próximo ciclo.", patient.getId());
                    try { syncService.ensureDosesForToday(patient.getId()); }
                    catch (RuntimeException localFailure) { log.warn("No se pudieron preparar dosis locales para {}.", patient.getId()); }
                }
            }
        } finally { running.set(false); }
    }
}
