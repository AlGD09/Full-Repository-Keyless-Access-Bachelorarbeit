package com.keyless.rexroth.dto;

public class UserUnassignDTO {
    private String smartphoneId;  //Smartphone device id
    private Long userId;          //User cloud id


    public String getSmartphoneId() { return smartphoneId; }
    public void setSmartphoneId(String smartphoneId) { this.smartphoneId = smartphoneId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

}
