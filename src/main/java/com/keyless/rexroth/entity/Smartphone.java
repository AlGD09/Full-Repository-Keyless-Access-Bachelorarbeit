package com.keyless.rexroth.entity;


import jakarta.persistence.Entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;



@Entity
@Table(name = "smartphones")
public class Smartphone {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String deviceId;

    private String userName;
    private String secretHash;
    private String bleId;
    private String status;
    private LocalDateTime lastSeen;

    public Smartphone() {}

    public Smartphone(String deviceId, String userName, String secretHash, String bleId, String status) {
        this.deviceId = deviceId;
        this.userName = userName;
        this.secretHash = secretHash;
        this.bleId = bleId;
        this.status = status;
        this.lastSeen = LocalDateTime.now();
    }

    // --- Getter & Setter ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getSecretHash() { return secretHash; }
    public void setSecretHash(String secretHash) { this.secretHash = secretHash; }

    public String getBleId() { return bleId; }
    public void setBleId(String bleId) { this.bleId = bleId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getLastSeen() { return lastSeen; }
    public void setLastSeen(LocalDateTime lastSeen) { this.lastSeen = lastSeen; }





}
