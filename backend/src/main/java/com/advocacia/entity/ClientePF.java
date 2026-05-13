package com.advocacia.entity;

import com.advocacia.enums.*;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.time.Period;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "clientes_pf")

public class ClientePF extends PanacheEntity {
    
    public String nome, cpf, sexo;
    public LocalDate dataNascimento;
    public String telefone, email, endereco, bairro, cep, cidade;

    @Enumerated(EnumType.STRING)
    public Estado estado;

    public String profissao;

    @Enumerated(EnumType.STRING)
    public EstadoCivil estadoCivil;

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

    public int getIdade() {
        if (dataNascimento == null) return 0;
        return Period.between(dataNascimento, LocalDate.now()).getYears();
    }
    
}
