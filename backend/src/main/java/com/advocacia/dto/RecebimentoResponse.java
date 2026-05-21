package com.advocacia.dto;

import com.advocacia.enums.TipoRecebimento;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class RecebimentoResponse {
    public Long id;
    public LocalDate dataPrevistaRecebimento;
    public BigDecimal valor;
    public TipoRecebimento tipo;
    public Long processoId;
    public String processoNumero;
    public String tipoCliente;
    public String clienteNome;
    public String parcela;
    public Boolean recebido;
    public LocalDate dataRecebimento;
    public String detalhes;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
}
