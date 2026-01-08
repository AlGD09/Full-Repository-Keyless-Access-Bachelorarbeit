package com.keyless.rexroth.dto;

public class RCULockDTO {
    private String rcuId;
    private String deviceName;
    private String deviceId;

    public String getRcuId() { return rcuId; }
    public void setRcuId(String rcuId) { this.rcuId = rcuId; }

    public String getDeviceName() {
        return deviceName;
    }
    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }

    public String getDeviceId() {
        return deviceId;
    }
    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

}
