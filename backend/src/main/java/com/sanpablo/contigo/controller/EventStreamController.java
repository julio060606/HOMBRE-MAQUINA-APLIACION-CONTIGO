package com.sanpablo.contigo.controller;

import com.sanpablo.contigo.domain.auth.User;
import com.sanpablo.contigo.service.AuthorizationService;
import com.sanpablo.contigo.service.EventPublishingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/events")
@Tag(name = "Eventos en Vivo", description = "Suscripción SSE autenticada para sincronización reactiva entre dispositivos")
public class EventStreamController {

    private final EventPublishingService eventService;
    private final AuthorizationService authorizationService;

    public EventStreamController(EventPublishingService eventService, AuthorizationService authorizationService) {
        this.eventService = eventService;
        this.authorizationService = authorizationService;
    }

    @GetMapping(value = {"/subscribe", "/stream"}, produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Suscribirse a eventos de un paciente", description = "Abre un canal Server-Sent Events (SSE) autenticado para recibir cambios en tiempo real")
    public SseEmitter subscribe(
            @AuthenticationPrincipal User actor,
            @RequestParam("patientId") String patientId) {
        authorizationService.authorizePatientAccess(actor, patientId);
        return eventService.subscribe(actor.getId(), patientId);
    }
}
