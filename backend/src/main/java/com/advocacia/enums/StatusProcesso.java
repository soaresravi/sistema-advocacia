package com.advocacia.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum StatusProcesso {

    ATIVO("Ativo"),
    ENCERRADO("Encerrado");

    private String descricao;

    StatusProcesso(String descricao) {
        this.descricao = descricao;
    }

    @JsonValue

    public String getDescricao() {
        return descricao;
    }
}
