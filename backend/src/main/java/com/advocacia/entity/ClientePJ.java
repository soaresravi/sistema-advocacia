package com.advocacia.entity;

import com.advocacia.enums.*;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "clientes_pj")

public class ClientePJ extends PanacheEntity {
    
    public String nomeFantasia, razaoSocial, cnpj, telefone, email, endereco, bairro, cep, cidade;

    @Enumerated(EnumType.STRING)
    public Estado estado;

    @Enumerated(EnumType.STRING)
    public SegmentoAtuacao segmento;

    public String responsavelLegal;

    @Enumerated(EnumType.STRING)
    public ComoConheceu comoConheceu;

    @Column(columnDefinition = "TEXT")
    public String observacoes;

    public LocalDateTime dataCadastro;
    public Long userId;

    @PrePersist

    public void prePersist() {
        dataCadastro = LocalDateTime.now();
    }
    
}
