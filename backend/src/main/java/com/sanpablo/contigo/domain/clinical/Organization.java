package com.sanpablo.contigo.domain.clinical;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "organizations", schema = "clinical")
public class Organization {

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(name = "tax_id", length = 50)
    private String taxId;

    @Column(name = "time_zone", nullable = false, length = 50)
    private String timeZone = "America/Lima";

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public Organization() {}

    public Organization(String id, String name, String taxId, String timeZone) {
        this.id = id;
        this.name = name;
        this.taxId = taxId;
        this.timeZone = timeZone != null ? timeZone : "America/Lima";
        this.active = true;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getTaxId() { return taxId; }
    public void setTaxId(String taxId) { this.taxId = taxId; }
    public String getTimeZone() { return timeZone; }
    public void setTimeZone(String timeZone) { this.timeZone = timeZone; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
