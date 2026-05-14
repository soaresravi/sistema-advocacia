package com.advocacia.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum ResultadoProcesso {

    ACORDO("Acordo"),
    EXTINTO("Extinto"),
    IMPROCEDENTE("Improcedente"),
    PARCIALMENTE_PROCEDENTE("Parcialmente Procedente"),
    PROCEDENTE("Procedente");

    private String descricao;

    ResultadoProcesso(String descricao) {
        this.descricao = descricao;
    }

    @JsonValue

    public String getDescricao() {
        return descricao;
    }
}
