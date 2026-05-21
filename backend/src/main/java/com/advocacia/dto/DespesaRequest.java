package com.advocacia.dto;

import com.advocacia.enums.CategoriaDespesa;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public class DespesaRequest {
    
    public LocalDate dataPrevistaPagamento;

    @NotNull(message = "Valor é obrigatório")
    public BigDecimal valor;

    public CategoriaDespesa categoria;
    public String despesa;
    public Boolean pago;
    public LocalDate dataEfetivaPagamento;
    public String detalhes;
}
