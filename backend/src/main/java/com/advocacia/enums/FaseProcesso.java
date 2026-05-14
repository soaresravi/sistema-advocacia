package com.advocacia.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum FaseProcesso {
    
    INICIAL("Fase Inicial"),
    AUDIENCIA("Fase de Audiência"),
    CITACAO("Fase de Citação"),
    CONCILIACAO("Fase de Conciliação"),
    CONTESTACAO("Fase de Contestação"),
    SENTENCA("Fase de Sentença");

    public String descricao;
    
    FaseProcesso(String descricao) {
        this.descricao = descricao;
    }

    @JsonValue

    public String getDescricao() {
        return descricao;
    }
}
