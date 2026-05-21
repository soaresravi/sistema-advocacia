package com.advocacia.dto;

import com.advocacia.enums.TipoRecebimento;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public class RecebimentoRequest {
    
    public LocalDate dataPrevistaRecebimento;

    @NotNull(message = "Valor é obrigatório")
    public BigDecimal valor;

    public TipoRecebimento tipo;

    public Long processoId;
    public String processoNumero, tipoCliente, clienteNome, parcela;
    public Boolean recebido;
    public LocalDate dataRecebimento;
    public String detalhes;
}
