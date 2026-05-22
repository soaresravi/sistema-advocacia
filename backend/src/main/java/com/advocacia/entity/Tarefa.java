package com.advocacia.entity;

import com.advocacia.enums.*;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tarefas")

public class Tarefa extends PanacheEntity {
    
    public LocalDate dataCadastro;

    @Enumerated(EnumType.STRING)
    public StatusTarefa status;

    public String tarefa;
    public LocalDate prazoTarefa;

    @Enumerated(EnumType.STRING)
    public UrgenciaTarefa urgencia;

    public String responsavel;

    @Column(columnDefinition = "TEXT")
    public String andamento;

    public Long processoId;
    public String processoNumero, tipoCliente, clienteNome;
    public Long userId;
    public LocalDateTime createdAt, updatedAt;

    @PrePersist

    public void prePersist() {

        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();

        if (dataCadastro == null) {
            dataCadastro = LocalDate.now();
        }

    }

    @PreUpdate

    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getDiasAtePrazo() {
        if (prazoTarefa == null) return null;
        return java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), prazoTarefa);
    }
}