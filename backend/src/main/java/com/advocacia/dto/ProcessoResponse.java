package com.advocacia.dto;

import com.advocacia.enums.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class ProcessoResponse {
    public Long id;
    public String numeroProcesso;
    public StatusProcesso status;
    public TipoAcao tipoAcao;
    public String tipoCliente;
    public Long clienteId;
    public String clienteNome;
    public Qualificacao qualificacao;
    public Boolean prazoAberto;
    public LocalDate dataPrazo;
    public String outroEnvolvido;
    public Qualificacao qualificacaoOutro;
    public BigDecimal valorCausa, valorAcordoSentenca, honorariosReais, honorariosPercentual;
    public String sucumbencias;
    public BigDecimal totalHonorarios;
    public FaseProcesso fase;
    public Instancia instancia;
    public String comarca, vara, observacoes;
    public LocalDate dataInicio, dataFim;
    public Integer duracaoDias;
    public ResultadoProcesso resultado;
    public String linkProcesso;
    public Long userId;
    public LocalDateTime createdAt, updatedAt;
}
