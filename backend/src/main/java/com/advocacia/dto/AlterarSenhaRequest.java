package com.advocacia.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AlterarSenhaRequest {

    @NotBlank(message = "Senha atual é obrigatória")
    public String senhaAtual;

    @NotBlank(message = "Nova senha é obrigatória")
    @Size(min = 6, message = "Nova senha deve ter pelo menos 6 caracteres")

    public String novaSenha;

    @NotBlank(message = "Confirmação de senha é obrigatória")
    public String confirmarSenha;
}
