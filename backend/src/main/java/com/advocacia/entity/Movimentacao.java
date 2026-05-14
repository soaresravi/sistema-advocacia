package com.advocacia.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "movimentacoes")

public class Movimentacao extends PanacheEntity {
    
    @Column(nullable = false)
    public Long processoId;

    @Column(nullable = false, columnDefinition = "TEXT")
    public String descricao;

    public LocalDate data;
    public Long userId;
}
