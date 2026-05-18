package com.advocacia.dto;

import com.advocacia.enums.*;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.LocalDate;

public class AtendimentoRequest {
    
    @NotBlank(message = "Data é obrigatória")
    public LocalDate data;

    public String hora;
    public SimNao clienteNovo;

    @NotBlank(message = "Nome é obrigatório")
    public String nome;

    public String assunto, telefone, email;
    public LocalDate dataProximoContato;
    public ComoConheceu comoConheceu;
    public SimNao fechouContrato;
    public BigDecimal valorConsulta;
    public String observacoes;
}
