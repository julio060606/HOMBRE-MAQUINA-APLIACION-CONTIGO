package com.sanpablo.contigo.dto.auth;

import com.sanpablo.contigo.domain.auth.User;
import com.sanpablo.contigo.domain.auth.UserRole;

public class UserMeResponse {
    private String id;
    private String email;
    private String name;
    private UserRole role;
    private String organizationId;
    private String patientId;

    public UserMeResponse() {}

    public UserMeResponse(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.name = user.getName();
        this.role = user.getRole();
        this.organizationId = user.getOrganizationId();
        this.patientId = user.getPatientId();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }
    public String getOrganizationId() { return organizationId; }
    public void setOrganizationId(String organizationId) { this.organizationId = organizationId; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
}
