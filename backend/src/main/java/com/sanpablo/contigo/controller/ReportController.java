package com.sanpablo.contigo.controller;

import com.sanpablo.contigo.domain.auth.User;
import com.sanpablo.contigo.dto.telemetry.ReportSummaryDto;
import com.sanpablo.contigo.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/patients/{patientId}/reports")
@Tag(name = "Reportes y Documentos", description = "Generación de resumen clínico para consulta y descarga de archivo PDF")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/summary")
    @Operation(summary = "Resumen de informe", description = "Devuelve las métricas, adherencia calculada y promedios para el período")
    public ResponseEntity<ReportSummaryDto> getSummary(
            @AuthenticationPrincipal User actor,
            @PathVariable("patientId") String patientId,
            @RequestParam(value = "from", required = false) String from,
            @RequestParam(value = "to", required = false) String to) {
        return ResponseEntity.ok(reportService.getSummary(actor, patientId, from, to));
    }

    @GetMapping(value = "/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Operation(summary = "Descargar PDF oficial", description = "Genera y descarga el archivo PDF de seguimiento del paciente")
    public ResponseEntity<byte[]> getPdf(
            @AuthenticationPrincipal User actor,
            @PathVariable("patientId") String patientId,
            @RequestParam(value = "from", required = false) String from,
            @RequestParam(value = "to", required = false) String to) throws IOException {
        byte[] pdfBytes = reportService.generatePdf(actor, patientId, from, to);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"informe-contigo-" + patientId + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}
