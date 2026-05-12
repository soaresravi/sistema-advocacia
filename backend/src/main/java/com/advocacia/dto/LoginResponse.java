package com.advocacia.dto;

public class LoginResponse {
    
    public String token, tipo = "Bearer", nome, email;
    public Long userId;

    public LoginResponse(String token, Long userId, String nome, String email) {
        this.token = token;
        this.userId = userId;
        this.nome = nome;
        this.email = email;
    }
    
}
