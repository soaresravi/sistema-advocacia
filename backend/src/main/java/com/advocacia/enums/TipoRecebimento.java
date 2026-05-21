package com.advocacia.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum TipoRecebimento {
    
    COMISSAO("Comissão"),
    CONSULTA("Consulta"),
    ENTRADA("Entrada"),
    HONORARIOS("Honorários"),
    MENSALIDADE("Mensalidade"),
    MULTA("Multa"),
    OUTROS("Outros");

    private String descricao;

    TipoRecebimento(String descricao) {
        this.descricao = descricao;
    }

    @JsonValue
    
    public String getDescricao() {
        return descricao;
    }

}
