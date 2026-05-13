package com.advocacia.resource;

import com.advocacia.dto.*;
import com.advocacia.entity.*;
import com.advocacia.enums.*;

import io.quarkus.panache.common.Page;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import org.eclipse.microprofile.jwt.JsonWebToken;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Path("/clientes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("user")

public class ClienteResource {
    
    @Inject
    JsonWebToken jwt;

    private Long getUserId() {
        return Long.parseLong(jwt.getSubject());
    }

    @GET
    @Path("/pf")

    public Response listarPF( @QueryParam("page") @DefaultValue("0") int page, @QueryParam("size") @DefaultValue("10") int size, @QueryParam("search") String search) {

        List<ClientePF> lista;
        long total;

        if (search != null && !search.isEmpty()) {
            lista = ClientePF.find("userId = ?1 and (lower(nome) like ?2 or lower(cpf) like ?2)", getUserId(), "%" + search.toLowerCase() + "%").page(Page.of(page, size)).list();
            total = ClientePF.find("userId = ?1 and (lower(nome) like ?2 or lower(cpf) like ?2)", getUserId(), "%" + search.toLowerCase() + "%").count();
        } else {
            lista = ClientePF.find("userId", getUserId()).page(Page.of(page, size)).list();
            total = ClientePF.find("userId", getUserId()).count();
        }

        List<ClientePFResponse> responseList = new ArrayList<>();

        for (ClientePF cliente : lista) {
            responseList.add(toResponse(cliente));
        }

        Map<String, Object> result = new HashMap<>();

        result.put("content", responseList);
        result.put("page", page);
        result.put("size", size);
        result.put("total", total);
        result.put("totalPages", (int) Math.ceil((double) total / size));

        return Response.ok(result).build();

    }

    @GET
    @Path("/pf/{id}")

    public Response buscarPF(@PathParam("id") Long id) {

        ClientePF cliente = ClientePF.find("id = ?1 and userId = ?2", id, getUserId()).firstResult();

        if (cliente == null) return Response.status(404).build();
        return Response.ok(toResponse(cliente)).build();

    }

    @POST
    @Path("/pf")
    @Transactional

    public Response criarPF(ClientePFRequest request) {
        ClientePF cliente = new ClientePF();
        cliente.userId = getUserId();
        updateEntity(cliente, request);
        cliente.persist();
        return Response.status(Response.Status.CREATED).entity(toResponse(cliente)).build();
    }

    @PUT
    @Path("/pf/{id}")
    @Transactional

    public Response atualizarPF(@PathParam("id") Long id, ClientePFRequest request) {
        ClientePF cliente = ClientePF.find("id = ?1 and userId = ?2", id, getUserId()).firstResult();
        if (cliente == null) return Response.status(404).build();
        updateEntity(cliente, request);
        cliente.persist();
        return Response.ok(toResponse(cliente)).build();
    }

    @DELETE
    @Path("/pf/{id}")
    @Transactional

    public Response deletarPF(@PathParam("id") Long id) {
        long deleted = ClientePF.delete("id = ?1 and userId = ?2", id, getUserId());
        if (deleted == 0) return Response.status(404).build();
        return Response.noContent().build();
    }

    @GET
    @Path("/pf/dashboard")

    public Response dashboardPF() {

        List<ClientePF> clientes = ClientePF.list("userId", getUserId());

        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("total", clientes.size());

        Map<String, Object> estadoCivil = new LinkedHashMap<>();

        for (EstadoCivil ec : EstadoCivil.values()) {
            
            long count = clientes.stream().filter(c -> c.estadoCivil == ec).count();

            if (count > 0) {
                estadoCivil.put(ec.getDescricao(), Map.of("quantidade", count, "percentual", (count * 100 / clientes.size())));
            }

        }

        dashboard.put("estadoCivil", estadoCivil);

        long homens = clientes.stream().filter(c -> "M".equals(c.sexo)).count();
        long mulheres = clientes.stream().filter(c -> "F".equals(c.sexo)).count();
        
        Map<String, Object> sexo = new LinkedHashMap<>();

        sexo.put("Homem", Map.of("quantidade", homens, "percentual", (homens * 100 / clientes.size())));
        sexo.put("Mulher", Map.of("quantidade", mulheres, "percentual", (mulheres * 100.0 / clientes.size())));
        
        dashboard.put("sexo", sexo);

        Map<String, Long> faixaEtaria = new LinkedHashMap<>();
    
        faixaEtaria.put("0-17", clientes.stream().filter(c -> c.getIdade() <= 17).count());
        faixaEtaria.put("18-25", clientes.stream().filter(c -> c.getIdade() >= 18 && c.getIdade() <= 25).count());
        faixaEtaria.put("26-35", clientes.stream().filter(c -> c.getIdade() >= 26 && c.getIdade() <= 35).count());
        faixaEtaria.put("36-45", clientes.stream().filter(c -> c.getIdade() >= 36 && c.getIdade() <= 45).count());
        faixaEtaria.put("46-59", clientes.stream().filter(c -> c.getIdade() >= 46 && c.getIdade() <= 59).count());
        faixaEtaria.put("60+", clientes.stream().filter(c -> c.getIdade() >= 60).count());

        dashboard.put("faixaEtaria", faixaEtaria);

        Map<String, Long> localizacao = clientes.stream().filter(c -> c.estado != null).collect(Collectors.groupingBy(c -> c.estado.getSigla(), Collectors.counting()));
        dashboard.put("localizacao", localizacao);

        Map<String, Long> comoConheceu = new LinkedHashMap<>();
        
        for (ComoConheceu cc : ComoConheceu.values()) {
            
            long count = clientes.stream().filter(c -> c.comoConheceu == cc).count();

            if (count > 0) {
                comoConheceu.put(cc.getDescricao(), count);
            }

        }

        dashboard.put("comoConheceu", comoConheceu);
        return Response.ok(dashboard).build();

    }

    @GET
    @Path("/pf/aniversariantes")

    public Response aniversariantes(@QueryParam("mes") Integer mes) {

        int mesParam = (mes == null) ? LocalDate.now().getMonthValue() : mes;

        List<ClientePF> clientes = ClientePF.list("userId", getUserId());
        List<Map<String, Object>> aniversariantes = new ArrayList<>();
        
        for (ClientePF cliente : clientes) {

            if (cliente.dataNascimento != null && cliente.dataNascimento.getMonthValue() == mesParam) {

                Map<String, Object> map = new LinkedHashMap<>();

                map.put("id", cliente.id);
                map.put("nome", cliente.nome);
                map.put("dataNascimento", cliente.dataNascimento);
                map.put("idade", cliente.getIdade());
                map.put("telefone", cliente.telefone);
                map.put("email", cliente.email);

                aniversariantes.add(map);

            }
        }

        return Response.ok(aniversariantes).build();

    }

    @GET
    @Path("/pf/aniversariantes/hoje")

    public Response aniversariantesHoje() {

        int hojeMes = LocalDate.now().getMonthValue();
        int hojeDia = LocalDate.now().getDayOfMonth();

        List<ClientePF> clientes = ClientePF.list("userId", getUserId());
        List<Map<String, Object>> aniversariantes = new ArrayList<>();

        for (ClientePF cliente : clientes) {

            if (cliente.dataNascimento != null && cliente.dataNascimento.getMonthValue() == hojeMes && cliente.dataNascimento.getDayOfMonth() == hojeDia) {

                Map<String, Object> map = new LinkedHashMap<>();

                map.put("id", cliente.id);
                map.put("nome", cliente.nome);
                map.put("telefone", cliente.telefone);
                map.put("email", cliente.email);

                aniversariantes.add(map);

            }
        }

        return Response.ok(aniversariantes).build();

    }

    @GET
    @Path("/pj")

    public Response listarPJ(@QueryParam("page") @DefaultValue("0") int page, @QueryParam("size") @DefaultValue("10") int size, @QueryParam("search") String search) {

        List<ClientePJ> lista;
        long total;

        if (search != null && !search.isEmpty()) {
            lista = ClientePJ.find("userId = ?1 and (lower(nomeFantasia) like ?2 or lower(cnpj) like ?2)", getUserId(), "%" + search.toLowerCase() + "%").page(Page.of(page, size)).list();
            total = ClientePJ.find("userId = ?1 and (lower(nomeFantasia) like ?2 or lower(cnpj) like ?2)", getUserId(), "%" + search.toLowerCase() + "%").count();
        } else {
            lista = ClientePJ.find("userId", getUserId()).page(Page.of(page, size)).list();
            total = ClientePJ.find("userId", getUserId()).count();
        }

        List<ClientePJResponse> responseList = new ArrayList<>();

        for (ClientePJ cliente : lista) {
            responseList.add(toResponse(cliente));
        }

        Map<String, Object> result = new HashMap<>();

        result.put("content", responseList);
        result.put("page", page);
        result.put("size", size);
        result.put("total", total);
        result.put("totalPages", (int) Math.ceil((double) total / size));

        return Response.ok(result).build();

    }

    @GET
    @Path("/pj/{id}")

    public Response buscarPJ(@PathParam("id") Long id) {
        ClientePJ cliente = ClientePJ.find("id = ?1 and userId = ?2", id, getUserId()).firstResult();
        if (cliente == null) return Response.status(404).build();
        return Response.ok(toResponse(cliente)).build();
    }

    @POST
    @Path("/pj")
    @Transactional

    public Response criarPJ(ClientePJRequest request) {
        ClientePJ cliente = new ClientePJ();
        cliente.userId = getUserId();
        updateEntity(cliente, request);
        cliente.persist();
        return Response.status(Response.Status.CREATED).entity(toResponse(cliente)).build();
    }

    @PUT
    @Path("/pj/{id}")
    @Transactional

    public Response atualizarPJ(@PathParam("id") Long id, ClientePJRequest request) {
        ClientePJ cliente = ClientePJ.find("id = ?1 and userId = ?2", id, getUserId()).firstResult();
        if (cliente == null) return Response.status(404).build();
        updateEntity(cliente, request);
        cliente.persist();
        return Response.ok(toResponse(cliente)).build();
    }

    @DELETE
    @Path("/pj/{id}")
    @Transactional

    public Response deletarPJ(@PathParam("id") Long id) {
        long deleted = ClientePJ.delete("id = ?1 and userId = ?2", id, getUserId());
        if (deleted == 0) return Response.status(404).build();
        return Response.noContent().build();
    }

    @GET
    @Path("/pj/dashboard")

    public Response dashboardPJ() {

        List<ClientePJ> clientes = ClientePJ.list("userId", getUserId());
        Map<String, Object> dashboard = new HashMap<>();

        dashboard.put("total", clientes.size());

        Map<String, Long> localizacao = clientes.stream().filter(c -> c.estado != null).collect(Collectors.groupingBy(c -> c.estado.getSigla(), Collectors.counting()));
        dashboard.put("localizacao", localizacao);

        Map<String, Long> comoConheceu = new LinkedHashMap<>();

        for (ComoConheceu cc : ComoConheceu.values()) {

            long count = clientes.stream().filter(c -> c.comoConheceu == cc).count();

            if (count > 0) {
                comoConheceu.put(cc.getDescricao(), count);
            }

        }

        dashboard.put("comoConheceu", comoConheceu);

        Map<String, Long> segmento = new LinkedHashMap<>();

        for (SegmentoAtuacao sa : SegmentoAtuacao.values()) {

            long count = clientes.stream().filter(c -> c.segmento == sa).count();

            if (count > 0) {
                segmento.put(sa.getDescricao(), count);
            }

        }

        dashboard.put("segmento", segmento);
        return Response.ok(dashboard).build();

    }

    private ClientePFResponse toResponse(ClientePF entity) {

        ClientePFResponse response = new ClientePFResponse();

        response.id = entity.id;
        response.nome = entity.nome;
        response.cpf = entity.cpf;
        response.sexo = entity.sexo;
        response.dataNascimento = entity.dataNascimento;
        response.idade = entity.getIdade();
        response.telefone = entity.telefone;
        response.email = entity.email;
        response.endereco = entity.endereco;
        response.bairro = entity.bairro;
        response.cep = entity.cep;
        response.cidade = entity.cidade;
        response.estado = entity.estado;
        response.profissao = entity.profissao;
        response.estadoCivil = entity.estadoCivil;
        response.comoConheceu = entity.comoConheceu;
        response.observacoes = entity.observacoes;
        response.dataCadastro = entity.dataCadastro;

        return response;

    }

    private void updateEntity(ClientePF entity, ClientePFRequest request) {
        entity.nome = request.nome;
        entity.cpf = request.cpf;
        entity.sexo = request.sexo;
        entity.dataNascimento = request.dataNascimento;
        entity.telefone = request.telefone;
        entity.email = request.email;
        entity.endereco = request.endereco;
        entity.bairro = request.bairro;
        entity.cep = request.cep;
        entity.cidade = request.cidade;
        entity.estado = request.estado;
        entity.profissao = request.profissao;
        entity.estadoCivil = request.estadoCivil;
        entity.comoConheceu = request.comoConheceu;
        entity.observacoes = request.observacoes;
    }

    private ClientePJResponse toResponse(ClientePJ entity) {

        ClientePJResponse response = new ClientePJResponse();

        response.id = entity.id;
        response.nomeFantasia = entity.nomeFantasia;
        response.razaoSocial = entity.razaoSocial;
        response.cnpj = entity.cnpj;
        response.telefone = entity.telefone;
        response.email = entity.email;
        response.endereco = entity.endereco;
        response.bairro = entity.bairro;
        response.cep = entity.cep;
        response.cidade = entity.cidade;
        response.estado = entity.estado;
        response.segmento = entity.segmento;
        response.responsavelLegal = entity.responsavelLegal;
        response.comoConheceu = entity.comoConheceu;
        response.observacoes = entity.observacoes;
        response.dataCadastro = entity.dataCadastro;

        return response;

    }

    private void updateEntity(ClientePJ entity, ClientePJRequest request) {
        entity.nomeFantasia = request.nomeFantasia;
        entity.razaoSocial = request.razaoSocial;
        entity.cnpj = request.cnpj;
        entity.telefone = request.telefone;
        entity.email = request.email;
        entity.endereco = request.endereco;
        entity.bairro = request.bairro;
        entity.cep = request.cep;
        entity.cidade = request.cidade;
        entity.estado = request.estado;
        entity.segmento = request.segmento;
        entity.responsavelLegal = request.responsavelLegal;
        entity.comoConheceu = request.comoConheceu;
        entity.observacoes = request.observacoes;
    }
}
