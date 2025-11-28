package com.keyless.rexroth.dto;

import java.time.LocalDateTime;

public class RCUProgrammedDTO {

    private String rcuId;
    private LocalDateTime unlockTime;  // Format: "2025-01-20T08:00"
    private LocalDateTime lockTime;

    public String getRcuId() { return rcuId; }
    public void setRcuId(String rcuId) { this.rcuId = rcuId; }

    public LocalDateTime getUnlockTime() { return unlockTime; }
    public void setUnlockTime(LocalDateTime unlockTime) { this.unlockTime = unlockTime; }

    public LocalDateTime getLockTime() { return lockTime; }
    public void setLockTime(LocalDateTime lockTime) { this.lockTime = lockTime; }

}