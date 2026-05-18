package com.advocacia.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum SimNao {
    
    SIM("Sim"),
    NAO("Não");

    private String descricao;

    SimNao(String descricao) {
        this.descricao = descricao;
    }

    @JsonValue
    public String getDescricao() {
        return descricao;
    }
}
