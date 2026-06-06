package com.advocacia.dto;

import jakarta.validation.constraints.NotBlank;

public class DeletarContaRequest {
    @NotBlank(message = "Senha é obrigatória")
    public String senha;
}
