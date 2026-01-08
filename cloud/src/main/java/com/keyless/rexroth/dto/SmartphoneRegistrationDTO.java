package com.keyless.rexroth.dto;

public class SmartphoneRegistrationDTO {
    private String deviceId;
    private String name;

    public SmartphoneRegistrationDTO() {}

    public SmartphoneRegistrationDTO(String deviceId) {
        this.deviceId = deviceId;
    }

    public String getDeviceId() {
        return deviceId;
    }
    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }
    public String getName() { return name; }
    public void setName(String Name) { this.name = Name; }

}