package com.advocacia.dto;

import com.advocacia.enums.*;
import java.time.LocalDate;

public class TarefaRequest {
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
}
