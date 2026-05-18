package com.advocacia.entity;

import com.advocacia.enums.StatusEvento;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "pericias")

public class Pericia extends PanacheEntity {
    
    public LocalDate data;
    public String hora;
    public StatusEvento status;
    public Long processoId;
    public String processoNumero, detalhes, local, observacoes;
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

    public Long getDiasAteEvento() {
        if (data == null) return null;
        return ChronoUnit.DAYS.between(LocalDate.now(), data);
    }
}
