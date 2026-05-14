package com.advocacia.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "documentos")

public class Documento extends PanacheEntity {

    @Column(nullable = false, unique = true)
    public String uuid;

    @Column(nullable = false)
    public Long processoId;

    @Column(nullable = false)
    public String nome;

    public String tipo;
    public Long tamanho;
    public String url;

    @Column(nullable = false)
    public Long userId;

    public LocalDateTime uploadedAt;

    @PrePersist

    public void prePersist() {
        uploadedAt = LocalDateTime.now();
    }
}
