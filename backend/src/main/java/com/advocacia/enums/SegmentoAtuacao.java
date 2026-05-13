package com.advocacia.enums;

public enum SegmentoAtuacao {

    AGRONEGOCIO("Agronegócio"),
    ALIMENTOS_BEBIDAS("Alimentos e bebidas"),
    ARQUITETURA("Arquitetura"),
    ATACADO_DISTRIBUICAO("Atacado e distribuição"),
    BEBIDAS("Bebidas"),
    BELEZA("Beleza"),
    CARTORIO("Cartório"),
    COMERCIO_GERAL("Comércio em geral"),
    CONDOMINIO_ADMINISTRADORA("Condomínio e administradora"),
    CONSTRUCAO_CIVIL("Construção civil"),
    CONTABILIDADE("Contabilidade"),
    CORRETORA_IMOVEIS("Corretora de imóveis"),
    CORRETORA_SEGUROS("Corretora de seguros"),
    EDUCACAO("Educação"),
    INDUSTRIA("Indústria"),
    MATERIAL_CONSTRUCAO("Material de construção"),
    MEDICINA_SAUDE("Medicina e saúde"),
    METALURGICA("Metalúrgica"),
    MODA("Moda"),
    OUTROS("Outros"),
    TECNOLOGIA("Tecnologia"),
    VEICULOS_PECAS("Veículos e peças");

    private String descricao;

    SegmentoAtuacao(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
