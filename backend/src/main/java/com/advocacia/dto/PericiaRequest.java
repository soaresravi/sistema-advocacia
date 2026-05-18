package com.advocacia.dto;

import com.advocacia.enums.StatusEvento;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

public class PericiaRequest {

    @NotNull(message = "Data é obrigatória")
    public LocalDate data;

    @NotBlank(message = "Hora é obrigatória")
    public String hora;

    public StatusEvento status;

    @NotNull(message = "Processo é obrigatório")
    public Long processoId;

    public String processoNumero, detalhes, local, observacoes;
    
}
