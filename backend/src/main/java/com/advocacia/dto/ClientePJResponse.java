package com.advocacia.dto;

import com.advocacia.enums.*;
import java.time.LocalDateTime;

public class ClientePJResponse {
    public Long id;
    public String nomeFantasia, razaoSocial, cnpj, telefone, email, endereco, bairro, cep, cidade;
    public Estado estado;
    public SegmentoAtuacao segmento;
    public String responsavelLegal;
    public ComoConheceu comoConheceu;
    public String observacoes;
    public LocalDateTime dataCadastro;
}
