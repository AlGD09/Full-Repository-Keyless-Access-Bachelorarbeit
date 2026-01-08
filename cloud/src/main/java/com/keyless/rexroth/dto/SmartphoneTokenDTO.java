package com.keyless.rexroth.dto;

public class SmartphoneTokenDTO {
    private String deviceId;
    private String username;
    private String secretHash;

    public SmartphoneTokenDTO() {}

    public SmartphoneTokenDTO(String deviceId, String secretHash) {
        this.deviceId = deviceId;
        this.secretHash = secretHash;
    }

    public String getDeviceId() {
        return deviceId;
    }
    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }
    public String getSecretHash() {
        return secretHash;
    }
    public void setSecretHash(String secretHash) {
        this.secretHash = secretHash;
    }
    public String getUserName() { return username; }
    public void setUserName(String userName) { this.username = userName; }

}