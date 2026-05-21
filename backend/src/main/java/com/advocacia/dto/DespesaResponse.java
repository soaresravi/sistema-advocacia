package com.advocacia.dto;

import com.advocacia.enums.CategoriaDespesa;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class DespesaResponse {
    public Long id;
    public LocalDate dataPrevistaPagamento;
    public BigDecimal valor;
    public CategoriaDespesa categoria;
    public String despesa;
    public Boolean pago;
    public LocalDate dataEfetivaPagamento;
    public String detalhes;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;    
}
