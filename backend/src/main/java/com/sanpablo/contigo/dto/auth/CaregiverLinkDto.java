package com.sanpablo.contigo.dto.auth;

public class CaregiverLinkDto {
    private String userId;
    private String name;
    private String relationship;
    private boolean active;

    public CaregiverLinkDto() {}
    public CaregiverLinkDto(String userId, String name, String relationship, boolean active) {
        this.userId = userId;
        this.name = name;
        this.relationship = relationship;
        this.active = active;
    }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getRelationship() { return relationship; }
    public void setRelationship(String relationship) { this.relationship = relationship; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
