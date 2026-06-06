package com.advocacia.dto;

import jakarta.validation.constraints.*;

public class AtualizarPerfilRequest {
    
    @NotBlank(message = "Nome é obrigatório")
    public String nome;

    @NotBlank(message = "Email é obrigatório")
    @Email(message = "Email é inválido")

    public String email;

    @NotBlank(message = "Nome do escritório é obrigatório")
    public String nomeEscritorio;
}
