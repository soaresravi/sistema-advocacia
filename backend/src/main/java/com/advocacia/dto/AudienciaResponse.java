package com.advocacia.dto;

import com.advocacia.enums.StatusEvento;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class AudienciaResponse {
    public Long id;
    public LocalDate data;
    public String hora;
    public StatusEvento status;
    public Long processoId;
    public String processoNumero, detalhes, local, observacoes;
    public Long diasAteEvento;
    public LocalDateTime createdAt, updatedAt;
    public String googleEventId;
}
