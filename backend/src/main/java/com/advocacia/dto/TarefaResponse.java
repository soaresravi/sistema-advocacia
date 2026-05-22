package com.advocacia.dto;

import com.advocacia.enums.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class TarefaResponse {
    public Long id;
    public LocalDate dataCadastro;
    public StatusTarefa status;
    public String tarefa;
    public LocalDate prazoTarefa;
    public UrgenciaTarefa urgencia;
    public String responsavel;
    public String andamento;
    public Long processoId;
    public String processoNumero;
    public String tipoCliente;
    public String clienteNome;
    public Long diasAtePrazo;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
}
