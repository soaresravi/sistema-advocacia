package com.advocacia.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "tipo_acao_personalizados")

public class TipoAcaoPersonalizado extends PanacheEntity {

    @Column(nullable = false, unique = true)
    public String nome;

    @Column(nullable = false)
    public Long userId;

    public String descricao;
}
