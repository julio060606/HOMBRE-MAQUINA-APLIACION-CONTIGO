package com.sanpablo.contigo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.util.Locale;
import java.util.Map;

@RestController
public class HealthController {
    private final DataSource applicationDataSource;
    public HealthController(DataSource applicationDataSource) { this.applicationDataSource = applicationDataSource; }

    @GetMapping("/api/v1/health")
    public ResponseEntity<Map<String, String>> health() {
        try (var connection = applicationDataSource.getConnection()) {
            if (!connection.isValid(2)) return ResponseEntity.status(503).body(Map.of("status", "DOWN", "app", "CONTIGO", "storage", "unavailable"));
            return ResponseEntity.ok(Map.of("status", "UP", "app", "CONTIGO", "storage", connection.getMetaData().getDatabaseProductName().toLowerCase(Locale.ROOT)));
        } catch (Exception unavailable) {
            return ResponseEntity.status(503).body(Map.of("status", "DOWN", "app", "CONTIGO", "storage", "unavailable"));
        }
    }
}
