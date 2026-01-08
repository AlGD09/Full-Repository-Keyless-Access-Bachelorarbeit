package com.keyless.rexroth.dto;

public class UserRegistrationDTO {
    private String username;
    private String email;
    private String secretHash;

    public String getUsername() {
        return username;
    }
    public void setUsername(String username) {
        this.username = username;
    }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getSecretHash() { return secretHash; }
    public void setSecretHash(String secretHash) { this.secretHash = secretHash; }

}
