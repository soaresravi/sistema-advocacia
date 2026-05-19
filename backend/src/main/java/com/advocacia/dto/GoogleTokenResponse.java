package com.advocacia.dto;

public class GoogleTokenResponse {

    public boolean connected;
    public String email;

    public GoogleTokenResponse(boolean connected, String email) {
        this.connected = connected;
        this.email = email;
    }
}
