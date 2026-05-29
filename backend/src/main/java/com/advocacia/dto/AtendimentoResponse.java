package com.advocacia.dto;

import com.advocacia.enums.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
;
public class AtendimentoResponse {
    public Long id;
    public LocalDate data;
    public String hora;
    public SimNao clienteNovo;
    public String nome, assunto, telefone, email;
    public LocalDate dataProximoContato;
    public ComoConheceu comoConheceu;
    public SimNao fechouContrato;
    public BigDecimal valorConsulta;
    public String observacoes;
    public LocalDateTime createdAt, updatedAt;    
    public String googleEventId;
}
