package com.advocacia.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum StatusEvento {
    
    AGENDADO("Agendado"),
    CONCLUIDO("Concluído"),
    CANCELADO("Cancelado");

    private String descricao;

    StatusEvento(String descricao) {
        this.descricao = descricao;
    }

    @JsonValue

    public String getDescricao() {
        return descricao;
    }
}
