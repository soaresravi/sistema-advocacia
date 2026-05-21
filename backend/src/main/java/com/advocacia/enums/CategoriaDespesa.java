package com.advocacia.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum CategoriaDespesa {
    
    AGUA("Água"),
    ALIMENTACAO("Alimentação"),
    ALUGUEL("Aluguel"),
    CELULAR("Celular"),
    COMPRAS("Compras"),
    GAS("Gás"),
    INTERNET("Internet"),
    INVESTIMENTO("Investimento"),
    LIMPEZA("Limpeza"),
    LUZ("Luz"),
    MANUTENCAO("Manutenção"),
    MATERIAIS("Materiais"),
    MERCADO("Mercado"),
    OUTRAS("Outras"),
    OUTRAS_DESPESAS_FUNCIONARIO("Outras Despesas com Funcionário"),
    PUBLICIDADE("Publicidade"),
    SALARIO_FUNCIONARIO("Salário de Funcionário"),
    TRANSPORTE("Transporte");

    private String descricao;

    CategoriaDespesa(String descricao) {
        this.descricao = descricao;
    }

    @JsonValue

    public String getDescricao() {
        return descricao;
    }
    
}
