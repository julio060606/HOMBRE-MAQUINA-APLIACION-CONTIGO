package com.sanpablo.contigo.service;

import com.sanpablo.contigo.domain.auth.User;
import com.sanpablo.contigo.dto.clinical.AppointmentDto;
import com.sanpablo.contigo.dto.clinical.MedicationDto;
import com.sanpablo.contigo.dto.clinical.PatientDto;
import com.sanpablo.contigo.dto.telemetry.BloodPressureLogDto;
import com.sanpablo.contigo.dto.telemetry.PillIntakeDto;
import com.sanpablo.contigo.dto.telemetry.ReportSummaryDto;
import com.sanpablo.contigo.dto.telemetry.WeightLogDto;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Instant;
import java.util.List;

@Service
public class ReportService {

    private final PatientService patientService;
    private final IntakeService intakeService;
    private final TelemetryService telemetryService;

    public ReportService(PatientService patientService,
                         IntakeService intakeService,
                         TelemetryService telemetryService) {
        this.patientService = patientService;
        this.intakeService = intakeService;
        this.telemetryService = telemetryService;
    }

    public ReportSummaryDto getSummary(User actor, String patientId, String from, String to) {
        PatientDto patient = patientService.getPatient(actor, patientId);
        List<MedicationDto> medications = patientService.getPrescriptions(actor, patientId);
        List<PillIntakeDto> doses = intakeService.getDoses(actor, patientId, from, to);
        List<BloodPressureLogDto> pressures = telemetryService.getPressures(actor, patientId, from, to);
        List<WeightLogDto> weights = telemetryService.getWeights(actor, patientId, from, to);
        List<AppointmentDto> appointments = patientService.getAppointments(actor, patientId);

        Instant now = Instant.now();
        int taken = 0;
        int notTaken = 0;
        int unconfirmed = 0;
        for (PillIntakeDto d : doses) {
            if ("CANCELLED".equals(d.getStatus())) continue;
            boolean isDue = d.getScheduledAt() != null && !d.getScheduledAt().isAfter(now);
            if ("TAKEN".equals(d.getStatus())) taken++;
            else if ("NOT_TAKEN".equals(d.getStatus())) notTaken++;
            else if ("UNCONFIRMED".equals(d.getStatus())) unconfirmed++;
            else if ("PENDING".equals(d.getStatus()) && isDue) unconfirmed++;
        }

        int denominator = taken + notTaken + unconfirmed;
        double adherence = denominator > 0 ? (double) taken / denominator * 100.0 : 0.0;

        Double avgSys = null, avgDia = null, avgPulse = null;
        if (!pressures.isEmpty()) {
            avgSys = pressures.stream().mapToInt(BloodPressureLogDto::getSystolic).average().orElse(0.0);
            avgDia = pressures.stream().mapToInt(BloodPressureLogDto::getDiastolic).average().orElse(0.0);
            var pulseOpt = pressures.stream().filter(p -> p.getPulse() != null).mapToInt(BloodPressureLogDto::getPulse).average();
            avgPulse = pulseOpt.isPresent() ? pulseOpt.getAsDouble() : null;
        }

        ReportSummaryDto summary = new ReportSummaryDto();
        summary.setPatient(patient);
        summary.setFromDate(from != null ? from : "Inicio");
        summary.setToDate(to != null ? to : "Actualidad");
        summary.setGeneratedAt(Instant.now());
        summary.setAdherencePercentage(adherence);
        summary.setDosesScheduled(doses.size());
        summary.setDosesTaken(taken);
        summary.setDosesNotTaken(notTaken);
        summary.setDosesUnconfirmed(unconfirmed);
        summary.setMedications(medications);
        summary.setPressures(pressures);
        summary.setWeights(weights);
        summary.setAppointments(appointments);
        summary.setAverageSystolic(avgSys);
        summary.setAverageDiastolic(avgDia);
        summary.setAveragePulse(avgPulse);

        return summary;
    }

    public byte[] generatePdf(User actor, String patientId, String from, String to) throws IOException {
        ReportSummaryDto summary = getSummary(actor, patientId, from, to);

        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
                PDType1Font fontRegular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

                contentStream.beginText();
                contentStream.setFont(fontBold, 18);
                contentStream.newLineAtOffset(50, 800);
                contentStream.showText(sanitize("Informe de Seguimiento - San Pablo Contigo"));
                contentStream.endText();

                contentStream.beginText();
                contentStream.setFont(fontRegular, 11);
                contentStream.newLineAtOffset(50, 770);
                contentStream.showText(sanitize("Paciente: " + summary.getPatient().getFullName() + " | Edad: " + summary.getPatient().getAge() + " anos"));
                contentStream.newLineAtOffset(0, -18);
                contentStream.showText(sanitize("Periodo: " + summary.getFromDate() + " a " + summary.getToDate() + " | Fecha de emision: " + summary.getGeneratedAt()));
                contentStream.newLineAtOffset(0, -18);
                contentStream.showText(sanitize(String.format("Adherencia declarada: %.1f%% (%d tomadas de %d dosis vencidas)",
                        summary.getAdherencePercentage(), summary.getDosesTaken(), summary.getDosesTaken() + summary.getDosesNotTaken() + summary.getDosesUnconfirmed())));

                contentStream.newLineAtOffset(0, -30);
                contentStream.setFont(fontBold, 13);
                contentStream.showText(sanitize("Tratamientos Vigentes:"));
                contentStream.setFont(fontRegular, 11);

                if (summary.getMedications() != null) {
                    for (MedicationDto med : summary.getMedications()) {
                        contentStream.newLineAtOffset(0, -16);
                        String times = med.getTimes() != null ? String.join(", ", med.getTimes()) : "";
                        contentStream.showText(sanitize("- " + med.getName() + " (" + med.getDosage() + ") Horarios: " + times));
                    }
                }

                contentStream.newLineAtOffset(0, -30);
                contentStream.setFont(fontBold, 13);
                contentStream.showText(sanitize("Presion Arterial y Signos:"));
                contentStream.setFont(fontRegular, 11);
                contentStream.newLineAtOffset(0, -16);
                if (summary.getAverageSystolic() != null) {
                    String pulseStr = summary.getAveragePulse() != null ? String.format("%.0f bpm", summary.getAveragePulse()) : "No registrado";
                    contentStream.showText(sanitize(String.format("Promedio: %.0f / %.0f mmHg | Pulso promedio: %s",
                            summary.getAverageSystolic(), summary.getAverageDiastolic(), pulseStr)));
                } else {
                    contentStream.showText(sanitize("Sin registros de presion arterial en el periodo seleccionado."));
                }

                contentStream.newLineAtOffset(0, -30);
                contentStream.setFont(fontBold, 13);
                contentStream.showText(sanitize("Proximas Citas Clinicas:"));
                contentStream.setFont(fontRegular, 11);
                if (summary.getAppointments() != null) {
                    for (AppointmentDto appt : summary.getAppointments()) {
                        contentStream.newLineAtOffset(0, -16);
                        contentStream.showText(sanitize("- " + appt.getSpecialty() + " con " + appt.getDoctor() + " (" + appt.getLocation() + ")"));
                    }
                }

                contentStream.newLineAtOffset(0, -40);
                contentStream.setFont(fontRegular, 9);
                contentStream.showText(sanitize("Documento de seguimiento domiciliario. No constituye certificado medico pericial."));
                contentStream.endText();
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        }
    }

    private String sanitize(String text) {
        if (text == null) return "";
        return java.text.Normalizer.normalize(text, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("[^\\x20-\\x7E]", " ")
                .trim();
    }
}
