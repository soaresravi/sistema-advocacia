package com.advocacia.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public class MovimentacaoRequest {
    
    @NotBlank(message = "Descrição da movimentação é obrigatória")
    public String descricao;

    public LocalDate data;
    
}
