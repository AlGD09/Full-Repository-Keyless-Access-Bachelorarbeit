package com.keyless.rexroth.dto;

public class RCURegistrationDTO {
    private String rcuId;
    private String name;
    private String location;

    public String getRcuId() {
        return rcuId;
    }
    public void setRcuId(String rcuId) {
        this.rcuId = rcuId;
    }

    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }

    public String getLocation() {
        return location;
    }
    public void setLocation(String location) {
        this.location = location;
    }
}
