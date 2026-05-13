package com.advocacia.dto;

import com.advocacia.enums.*;
import jakarta.validation.constraints.*;

public class ClientePJRequest {
    
    @NotBlank(message = "Nome fantasia é obrigatório")
    public String nomeFantasia;

    public String razaoSocial, cnpj, telefone;

    @Email(message = "Email é inválido")
    public String email;

    public String endereco, bairro, cep, cidade;
    public Estado estado;
    public SegmentoAtuacao segmento;
    public String responsavelLegal;
    public ComoConheceu comoConheceu;
    public String observacoes;
}
