package com.advocacia.dto;

public class UserResponse {
    
    public Long id;
    public String nome;
    public String email;
    public String nomeEscritorio;
    
    public UserResponse(Long id, String nome, String email, String nomeEscritorio) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.nomeEscritorio = nomeEscritorio;
    }
    
}
