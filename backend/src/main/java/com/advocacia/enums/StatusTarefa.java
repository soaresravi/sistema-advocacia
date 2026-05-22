package com.advocacia.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum StatusTarefa {
    
    NAO_INICIADA("Não iniciada"),
    EM_ANDAMENTO("Em andamento"),
    CONCLUIDA("Concluída");

    private String descricao;

    StatusTarefa(String descricao) {
        this.descricao = descricao;
    }

    @JsonValue

    public String getDescricao() {
        return descricao;
    }
}
