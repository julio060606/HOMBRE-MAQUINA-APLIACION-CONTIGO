package com.sanpablo.contigo.controller;

import com.sanpablo.contigo.domain.auth.User;
import com.sanpablo.contigo.dto.telemetry.SupportDtos.*;
import com.sanpablo.contigo.service.SupportSessionService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/patients/{patientId}/support-sessions")
@Tag(name = "Comunicación SOS", description = "Conversación autorizada por texto y señalización de audio WebRTC. No conecta una central telefónica ni servicios de emergencia.")
public class SupportSessionController {
    private final SupportSessionService support;
    public SupportSessionController(SupportSessionService support) { this.support = support; }
    @PostMapping
    public SessionDto create(@AuthenticationPrincipal User actor, @PathVariable String patientId, @Valid @RequestBody CreateInput input) {
        return support.create(actor, patientId, input);
    }
    @GetMapping
    public List<SessionDto> list(@AuthenticationPrincipal User actor, @PathVariable String patientId) { return support.list(actor, patientId); }
    @GetMapping("/{id}")
    public SessionDto get(@AuthenticationPrincipal User actor, @PathVariable String patientId, @PathVariable String id) { return support.get(actor, patientId, id); }
    @GetMapping("/{id}/events")
    public EventPage events(@AuthenticationPrincipal User actor, @PathVariable String patientId, @PathVariable String id, @RequestParam(defaultValue = "0") long after) {
        return support.readEvents(actor, patientId, id, after);
    }
    @PostMapping("/{id}/accept")
    public SessionDto accept(@AuthenticationPrincipal User actor, @PathVariable String patientId, @PathVariable String id) { return support.accept(actor, patientId, id); }
    @PostMapping("/{id}/events")
    public EventDto send(@AuthenticationPrincipal User actor, @PathVariable String patientId, @PathVariable String id, @Valid @RequestBody EventInput input) {
        return support.send(actor, patientId, id, input);
    }
    @PostMapping("/{id}/end")
    public SessionDto end(@AuthenticationPrincipal User actor, @PathVariable String patientId, @PathVariable String id, @Valid @RequestBody(required = false) EndInput input) {
        return support.end(actor, patientId, id, input);
    }
    @PostMapping("/{id}/extend")
    public SessionDto extend(@AuthenticationPrincipal User actor, @PathVariable String patientId, @PathVariable String id, @Valid @RequestBody ExtendInput input) {
        return support.extend(actor, patientId, id, input);
    }
}
