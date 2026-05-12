package com.advocacia.dto;

import jakarta.validation.constraints.*;

public class LoginRequest {
    
    @NotBlank(message = "Email é obrigatório")
    @Email(message = "Email é inválido")

    public String email;

    @NotBlank(message = "Senha é obrigatória")
    public String senha;

}
