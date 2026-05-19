package com.advocacia.entity;

import com.advocacia.enums.*;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "atendimentos")

public class Atendimento extends PanacheEntity {
    
    public LocalDate data;
    public String hora;

    @Enumerated(EnumType.STRING)
    public SimNao clienteNovo;

    public String nome, assunto, telefone, email;
    public LocalDate dataProximoContato;

    @Enumerated(EnumType.STRING)
    public ComoConheceu comoConheceu;

    @Enumerated(EnumType.STRING)
    public SimNao fechouContrato;

    public BigDecimal valorConsulta;

    @Column(columnDefinition = "TEXT")
    public String observacoes;

    @Column(name = "google_event_id")
    public String googleEventId;

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
