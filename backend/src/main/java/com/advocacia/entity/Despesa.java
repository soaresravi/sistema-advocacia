package com.advocacia.entity;

import com.advocacia.enums.CategoriaDespesa;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "despesas")

public class Despesa extends PanacheEntity {
    
    public LocalDate dataPrevistaPagamento;
    public BigDecimal valor;

    @Enumerated(EnumType.STRING)
    public CategoriaDespesa categoria;

    public String despesa;
    public Boolean pago;
    public LocalDate dataEfetivaPagamento;

    @Column(columnDefinition = "TEXT")
    public String detalhes;

    public Long userId;
    public LocalDateTime createdAt, updatedAt;

    @PrePersist

    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate

    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
