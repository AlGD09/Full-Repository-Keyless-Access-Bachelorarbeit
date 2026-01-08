package com.keyless.rexroth.dto;

import java.util.List;

public class SmartphoneAssignDTO {
    private Long smartphoneId;
    private List<Long> userIds;

    public Long getsmartphoneId() { return smartphoneId; }
    public void setsmartphoneId(Long smartphoneId) { this.smartphoneId = smartphoneId; }

    public List<Long> getUserIds() { return userIds; }
    public void setUserIds(List<Long> userIds) { this.userIds = userIds; }

}
