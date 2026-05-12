package com.advocacia.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios")

public class User extends PanacheEntity {

    @Column(nullable = false, unique = true)
    public String email;

    @Column(nullable = false)
    public String senha;

    @Column(nullable = false)
    public String nome;

    @Column(name = "nome_escritorio")
    public String nomeEscritorio;

    @Column(name = "created_at")
    public LocalDateTime createdAt;

    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

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
