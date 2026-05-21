package com.advocacia.entity;

import com.advocacia.enums.TipoRecebimento;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "recebimentos")

public class Recebimento extends PanacheEntity {
    
    public LocalDate dataPrevistaRecebimento;
    public BigDecimal valor;

    @Enumerated(EnumType.STRING)
    public TipoRecebimento tipo;

    public Long processoId;
    public String processoNumero, tipoCliente, clienteNome, parcela;
    public Boolean recebido;
    public LocalDate dataRecebimento;

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
