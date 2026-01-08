package com.keyless.rexroth.dto;

import java.util.List;


public class RCUAssignDTO {
    private Long rcuId;
    private List<Long> smartphoneIds; // mehrere IDs

    public Long getRcuId() { return rcuId; }
    public void setRcuId(Long rcuId) { this.rcuId = rcuId; }

    public List<Long> getSmartphoneIds() { return smartphoneIds; }
    public void setSmartphoneIds(List<Long> smartphoneIds) { this.smartphoneIds = smartphoneIds; }
}
