package com.sanpablo.contigo;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanpablo.contigo.domain.telemetry.PillIntake;
import com.sanpablo.contigo.repository.*;
import com.sanpablo.contigo.service.clinical.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;
import java.util.*;
import java.math.BigDecimal;
import java.time.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

/** Review-only probes: copied project, synthetic H2 database, expected safe behavior. */
@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test")
class ReviewRegressionProbeTest {
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired UserRepository users;
  @Autowired PillIntakeRepository doses;
  @Autowired StockMovementRepository movements;
  @Autowired ClinicalSyncService sync;
  @Autowired SimulatedClinicalProvider provider;
  @Autowired ClinicalSyncStateRepository syncStates;
  @Autowired MedicationRepository medications;

  @org.junit.jupiter.api.BeforeEach
  void resetFixtures() {
    provider.setCustomPrescriptions("demo-pat_001", List.of());
    medications.findByPatientIdAndExternalPrescriptionId("pat_001", "rx-med_001").ifPresent(m -> {
      m.setVersion(1);
      m.setTimesList(List.of("08:00", "20:00"));
      m.setDosage("50 mg");
      medications.save(m);
    });
  }

  private String login(String email) throws Exception {
    var res=mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
      .content(json.writeValueAsString(Map.of("email",email,"password","Contigo2026!")))).andReturn().getResponse();
    assertEquals(200,res.getStatus());
    return json.readTree(res.getContentAsString()).get("token").asText();
  }
  private PillIntake dose(String status) {
    var d=new PillIntake(); d.setId(UUID.randomUUID().toString()); d.setPatientId("pat_001");
    d.setOrganizationId("clinic_demo"); d.setMedicationId("med_001"); d.setMedicationName("Losartán");
    d.setDosage("50 mg"); d.setScheduledTime("08:00");
    d.setScheduledDate(LocalDate.now(ZoneId.of("America/Lima")).toString()); d.setScheduledAt(Instant.now());
    d.setStatus(status); d.setVersion(1); d.setUnitsPerDose(BigDecimal.ONE); d.setStockUnit("tabletas");
    return doses.save(d);
  }
  private int response(String token, PillIntake d, int version, String op) throws Exception {
    return mvc.perform(post("/api/v1/patients/pat_001/doses/"+d.getId()+"/responses")
      .header("Authorization","Bearer "+token).contentType(MediaType.APPLICATION_JSON)
      .content(json.writeValueAsString(Map.of("response","TAKEN","expectedDoseVersion",version,"operationId",op))))
      .andReturn().getResponse().getStatus();
  }
  @Test void hardcodedPasswordMustNotBypassStoredHash() throws Exception {
    var u=users.findById("admin_demo").orElseThrow(); var original=u.getPasswordHash();
    try {
      u.setPasswordHash("$2a$10$invalidChangedHashForReviewOnly"); users.save(u);
      var res=mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
        .content(json.writeValueAsString(Map.of("email","admin@contigo.example","password","DemoPatient2026!"))))
        .andReturn().getResponse();
      assertEquals(401,res.getStatus(),"Universal fallback password accepted for administrator");
    } finally { u.setPasswordHash(original); users.save(u); }
  }
  @Test void cancelledDoseMustRejectResponse() throws Exception {
    var d=dose("CANCELLED");
    assertEquals(409,response(login("dacio@contigo.example"),d,1,UUID.randomUUID().toString()),"Cancelled clinical dose accepted as TAKEN");
  }
  @Test void aSecondOperationMustNotConsumeSameDoseAgain() throws Exception {
    var d=dose("PENDING"); var t=login("dacio@contigo.example");
    assertEquals(200,response(t,d,1,UUID.randomUUID().toString()));
    int second=response(t,d,2,UUID.randomUUID().toString());
    long consumed=movements.findByPatientIdAndMedicationId("pat_001","med_001").stream()
      .filter(m->d.getId().equals(m.getIntakeId()) && "CONSUMPTION".equals(m.getKind())).count();
    assertEquals(1,consumed,"HTTP second response="+second+"; same dose consumed twice with distinct operationIds");
  }
  @Test void anotherPatientsAlertMustRejectAcknowledgement() throws Exception {
    String rosa=login("rosa@contigo.example");
    var created=mvc.perform(post("/api/v1/patients/pat_002/alerts/sos").header("Authorization","Bearer "+rosa)
      .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("operationId",UUID.randomUUID().toString()))))
      .andReturn().getResponse();
    assertEquals(200,created.getStatus());
    String alertId=json.readTree(created.getContentAsString()).get("id").asText();
    var ack=mvc.perform(post("/api/v1/patients/pat_001/alerts/"+alertId+"/acknowledgements")
      .header("Authorization","Bearer "+login("dacio@contigo.example"))).andReturn().getResponse();
    assertTrue(ack.getStatus()==403 || ack.getStatus()==404,"Dacio acknowledged Rosa alert: HTTP "+ack.getStatus());
  }
  @Test void unchangedSyncMustKeepFutureDoseActive() {
    provider.setCustomPrescriptions("demo-pat_001",List.of(new ClinicalProvider.PrescriptionData("rx-med_001",1,
      "Losartán","50 mg","TABLET",List.of("23:59"),"DAILY",LocalDate.now(ZoneId.of("America/Lima")).toString(),null,
      "Review synthetic",true,BigDecimal.ONE,"tabletas")));
    try {
      sync.syncPatient("pat_001"); sync.syncPatient("pat_001");
      boolean active=doses.findByPatientId("pat_001").stream().anyMatch(d->"23:59".equals(d.getScheduledTime()) && "PENDING".equals(d.getStatus()));
      assertTrue(active,"Repeated unchanged version cancels future dose and never replaces it");
    } finally { provider.setCustomPrescriptions("demo-pat_001",List.of()); }
  }
  @Test void importingNewPrescriptionMustFitDosePrimaryKey() {
    provider.setCustomPrescriptions("demo-pat_001",List.of(new ClinicalProvider.PrescriptionData("review-new-rx",1,
      "Synthetic","1 unit","TABLET",List.of("13:00"),"DAILY",LocalDate.now(ZoneId.of("America/Lima")).toString(),null,
      "Review synthetic",true,BigDecimal.ONE,"tabletas")));
    try { assertDoesNotThrow(()->sync.syncPatient("pat_001"),"New UUID medicine produces dose ID longer than VARCHAR(36)"); }
    finally { provider.setCustomPrescriptions("demo-pat_001",List.of()); }
  }
  @Test void notYetEffectivePrescriptionMustNotGenerateTodayDoses() {
    provider.setCustomPrescriptions("demo-pat_001",List.of(new ClinicalProvider.PrescriptionData("rx-med_002",10,
      "Vitamina D3","2000 UI","TABLET",List.of("22:47"),"DAILY",LocalDate.now(ZoneId.of("America/Lima")).plusDays(5).toString(),null,
      "Review synthetic",true,BigDecimal.ONE,"tabletas")));
    try {
      sync.syncPatient("pat_001");
      assertFalse(doses.findByPatientId("pat_001").stream().anyMatch(d->"22:47".equals(d.getScheduledTime())),"Today dose created before prescription startDate");
    } finally { provider.setCustomPrescriptions("demo-pat_001",List.of()); }
  }
  @Test void failingSyncMustPersistFailedStatus() {
    provider.setCustomPrescriptions("demo-pat_001",List.of(new ClinicalProvider.PrescriptionData("rx-med_001",500,
      "Synthetic","1 unit","TABLET",List.of("bad-time"),"DAILY",LocalDate.now().toString(),null,
      "Review synthetic",true,BigDecimal.ONE,"tabletas")));
    try {
      assertThrows(Exception.class,()->sync.syncPatient("pat_001"));
      assertEquals("FAILED",syncStates.findByPatientId("pat_001").map(s->s.getStatus()).orElse("ABSENT"),"Failure state rolled back with import");
    } finally { provider.setCustomPrescriptions("demo-pat_001",List.of()); }
  }
  @Test void logoutMustInvalidateAccessTokenAccordingToDocumentedContract() throws Exception {
    var t=login("dacio@contigo.example");
    var out=mvc.perform(post("/api/v1/auth/logout").header("Authorization","Bearer "+t)).andReturn().getResponse();
    assertEquals(204,out.getStatus());
    var after=mvc.perform(get("/api/v1/patients").header("Authorization","Bearer "+t)).andReturn().getResponse();
    assertTrue(after.getStatus()==401 || after.getStatus()==403,"Access token remains accepted after logout: HTTP "+after.getStatus());
  }
}
