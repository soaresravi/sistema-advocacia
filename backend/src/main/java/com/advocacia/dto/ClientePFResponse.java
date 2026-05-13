package com.advocacia.dto;

import com.advocacia.enums.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class ClientePFResponse {
    public Long id;
    public String nome, cpf, sexo;
    public LocalDate dataNascimento;
    public Integer idade;
    public String telefone, email, endereco, bairro, cep, cidade;
    public Estado estado;
    public String profissao;
    public EstadoCivil estadoCivil;
    public ComoConheceu comoConheceu;
    public String observacoes;
    public LocalDateTime dataCadastro;
}
