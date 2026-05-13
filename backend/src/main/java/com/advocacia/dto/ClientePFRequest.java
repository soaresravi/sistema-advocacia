package com.advocacia.dto;

import com.advocacia.enums.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

public class ClientePFRequest {
    
    @NotBlank(message = "Nome é obrigatório")
    public String nome;

    public String cpf, sexo;
    public LocalDate dataNascimento;
    public String telefone;

    @Email(message = "Email é inválido")
    public String email;

    public String endereco, bairro, cep, cidade, profissao;
    public Estado estado;
    public EstadoCivil estadoCivil;
    public ComoConheceu comoConheceu;
    public String observacoes;
}
