package com.advocacia.entity;

import com.advocacia.enums.*;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Entity
@Table(name = "processos")

public class Processo extends PanacheEntity {
    
    @Column(nullable = false, unique = true)
    public String numeroProcesso;

    @Enumerated(EnumType.STRING)
    public StatusProcesso status;

    public String tipoAcao, tipoCliente;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "processo_id", nullable = false)
    public List<ProcessoCliente> clientes = new ArrayList<>();

    public Long clienteId;
    public String clienteNome;

    @Enumerated(EnumType.STRING)
    public Qualificacao qualificacao;

    public Boolean prazoAberto;
    public LocalDate dataPrazo;
    public String outroEnvolvido;

    @Enumerated(EnumType.STRING)
    public Qualificacao qualificacaoOutro;

    public BigDecimal valorCausa, valorAcordoSentenca, honorariosReais, honorariosPercentual;

    @Column(columnDefinition = "TEXT")
    public String sucumbencias;

    public BigDecimal totalHonorarios;

    @Enumerated(EnumType.STRING)
    public FaseProcesso fase;

    @Enumerated(EnumType.STRING)
    public Instancia instancia;

    public String comarca, vara;

    @Column(columnDefinition = "TEXT")
    public String observacoes;

    public LocalDate dataInicio, dataFim;
    public Integer duracaoDias;

    @Enumerated(EnumType.STRING)
    public ResultadoProcesso resultado;

    public String linkProcesso;
    public Long userId;
    public LocalDateTime createdAt, updatedAt;

    @PrePersist 
    
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        calcularTotalHonorarios();
        calcularDuracao();
    }

    @PreUpdate

    public void preUpdate() {
        updatedAt = LocalDateTime.now();
        calcularTotalHonorarios();
        calcularDuracao();
    }

    public void calcularTotalHonorarios() {

        if (honorariosReais != null && honorariosReais.compareTo(BigDecimal.ZERO) > 0) {
            this.totalHonorarios = honorariosReais;
        } else if (honorariosPercentual != null && valorCausa != null && valorCausa.compareTo(BigDecimal.ZERO) > 0) {
            this.totalHonorarios = valorCausa.multiply(honorariosPercentual).divide(BigDecimal.valueOf(100));
        } else {
            this.totalHonorarios = BigDecimal.ZERO;
        }
        
    }

    public void calcularDuracao() {

        if (dataInicio != null && dataFim != null) {
            this.duracaoDias = (int) ChronoUnit.DAYS.between(dataInicio, dataFim);
        }
        
    }
}
