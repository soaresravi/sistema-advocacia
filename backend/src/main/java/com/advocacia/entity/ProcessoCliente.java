package com.advocacia.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "processo_clientes")

public class ProcessoCliente extends PanacheEntity {
    
    @Column(name = "processo_id", insertable = false, updatable = false)
    public Long processoId;
    
    @Column(name = "cliente_id", nullable = false)
    public Long clienteId;
    
    @Column(name = "cliente_nome")
    public String clienteNome;
    
    @Column(name = "tipo_cliente")
    public String tipoCliente;
    
    @Column(name = "qualificacao")
    public String qualificacao;
}
