package com.keyless.rexroth.entity;

import jakarta.persistence.Entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;


@Entity
@Table(name = "programmed")
public class Programmed {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column()
    private String rcuId;
    private LocalDateTime unlockTime;  // Format: "2025-01-20T08:00"
    private LocalDateTime lockTime;


    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRcuId() { return rcuId; }
    public void setRcuId(String rcuId) { this.rcuId = rcuId; }

    public LocalDateTime getUnlockTime() { return unlockTime; }
    public void setUnlockTime(LocalDateTime unlockTime) { this.unlockTime = unlockTime; }

    public LocalDateTime getLockTime() { return lockTime; }
    public void setLockTime(LocalDateTime lockTime) { this.lockTime = lockTime; }


}
