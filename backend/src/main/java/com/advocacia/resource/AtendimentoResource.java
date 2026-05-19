package com.advocacia.resource;

import com.advocacia.dto.*;
import com.advocacia.entity.*;
import com.advocacia.enums.*;
import com.advocacia.service.GoogleCalendarService;

import io.quarkus.panache.common.Page;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import org.eclipse.microprofile.jwt.JsonWebToken;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Path("/atendimentos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("user")

public class AtendimentoResource {
    
    @Inject
    JsonWebToken jwt;

    @Inject
    GoogleCalendarService googleCalendarService;

    private Long getUserId() {
        return Long.parseLong(jwt.getSubject());
    }

    @GET
    public Response listar(@QueryParam("page") @DefaultValue("0") int page, @QueryParam("size") @DefaultValue("10") int size, @QueryParam("dataInicio") String dataInicio, @QueryParam("dataFim") String dataFim, @QueryParam("clienteNovo") String clienteNovo, @QueryParam("fechouContrato") String fechouContrato, @QueryParam("search") String search) {

        StringBuilder query = new StringBuilder("userId = ?1");
        List<Object> params = new ArrayList<>();

        params.add(getUserId());

        if (dataInicio != null && !dataInicio.isEmpty()) {
            query.append(" and data >= ?").append(params.size() + 1);
            params.add(LocalDate.parse(dataInicio));
        }

        if (dataFim != null && !dataFim.isEmpty()) {
            query.append(" and data <= ?").append(params.size() + 1);
            params.add(LocalDate.parse(dataFim));
        }

        if (clienteNovo != null && !clienteNovo.isEmpty()) {
            query.append(" and clienteNovo = ?").append(params.size() + 1);
            params.add(SimNao.valueOf(clienteNovo));
        }

        if (fechouContrato != null && !fechouContrato.isEmpty()) {
            query.append(" and fechouContrato = ?").append(params.size() + 1);
            params.add(SimNao.valueOf(fechouContrato));
        }

        if (search != null && !search.isEmpty()) {
            query.append(" and (lower(nome) like ?").append(params.size() + 1);
            params.add("%" + search.toLowerCase() + "%");
            query.append(" or lower(assunto) like ?").append(params.size() + 1);
            params.add("%" + search.toLowerCase() + "%");
            query.append(" or telefone like ?").append(params.size() + 1);
            params.add("%" + search + "%");
            query.append(")");
        }

        query.append(" order by data desc");
        long total = Atendimento.find(query.toString(), params.toArray()).count();

        List<Atendimento> lista = Atendimento.find(query.toString(), params.toArray()).page(Page.of(page, size)).list();
        List<AtendimentoResponse> responseList = lista.stream().map(this::toResponse).collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();

        result.put("content", responseList);
        result.put("page", page);
        result.put("size", size);
        result.put("total", total);
        result.put("totalPages", (int) Math.ceil((double) total / size));

        return Response.ok(result).build();

    }

    @GET
    @Path("/{id}")

    public Response buscar(@PathParam("id") Long id) {
        Atendimento entity = Atendimento.find("id = ?1 and userId = ?2", id, getUserId()).firstResult();
        if (entity == null) return Response.status(404).build();
        return Response.ok(toResponse(entity)).build();
    }

    @POST
    @Transactional

    public Response criar(AtendimentoRequest request) {
        
        Atendimento entity = new Atendimento();
        entity.userId = getUserId();
        updateEntity(entity, request);
        entity.persist();

        try {

            User user = User.findById(getUserId());

            if (user.googleRefreshToken != null && !user.googleRefreshToken.isEmpty()) {
                
                String titulo = "Atendimento - " + entity.nome;
                String descricao = "Assunto: " + (entity.assunto != null ? entity.assunto : "") + "\n" + "Telefone: " + (entity.telefone != null ? entity.telefone : "") + "\n" + "Email: " + (entity.email != null ? entity.email : "");
                String eventId = googleCalendarService.criarEvento(user.googleRefreshToken, user.googleEmail, titulo, descricao, entity.data, entity.hora, 30L);

                entity.googleEventId = eventId;
                entity.persist();
            }

        } catch (Exception e) {
            System.err.println("Erro ao criar evento no Google Calendar: " + e.getMessage());
        }

        return Response.status(Response.Status.CREATED).entity(toResponse(entity)).build();

    }

    @PUT
    @Path("/{id}")
    @Transactional

    public Response atualizar(@PathParam("id") Long id, AtendimentoRequest request) {

        Atendimento entity = Atendimento.find("id = ?1 and userId = ?2", id, getUserId()).firstResult();
        if (entity == null) return Response.status(404).build();

        updateEntity(entity, request);
        entity.persist();

        try {

            User user = User.findById(getUserId());

            if (user.googleRefreshToken != null && !user.googleRefreshToken.isEmpty() && entity.googleEventId != null) {
          
                String titulo = "Atendimento - " + entity.nome;
                String descricao = "Assunto: " + (entity.assunto != null ? entity.assunto : "") + "\n" + "Telefone: " + (entity.telefone != null ? entity.telefone : "") + "\n" + "Email: " + (entity.email != null ? entity.email : "");
                googleCalendarService.atualizarEvento(user.googleRefreshToken, entity.googleEventId, titulo, descricao, entity.data, entity.hora, 30L);
          
            } else if (user.googleRefreshToken != null && !user.googleRefreshToken.isEmpty() && entity.googleEventId == null) {

                String titulo = "Atendimento - " + entity.nome;
                String descricao = "Assunto: " + (entity.assunto != null ? entity.assunto : "") + "\n" + "Telefone: " + (entity.telefone != null ? entity.telefone : "") + "\n" + "Email: " + (entity.email != null ? entity.email : "");
                String eventId = googleCalendarService.criarEvento(user.googleRefreshToken, user.googleEmail, titulo, descricao, entity.data, entity.hora, 30L);

                entity.googleEventId = eventId;
                entity.persist();

            }

        } catch (Exception e) {
            System.err.println("Erro ao atualizar evento no Google Calendar: " + e.getMessage());
        }

        return Response.ok(toResponse(entity)).build();

    }

    @DELETE
    @Path("/{id}")
    @Transactional

    public Response deletar(@PathParam("id") Long id) {

        Atendimento entity = Atendimento.find("id = ?1 and userId = ?2", id, getUserId()).firstResult();
        if (entity == null) return Response.status(404).build();

        String googleEventId = entity.googleEventId;

        long deleted = Atendimento.delete("id = ?1 and userId = ?2", id, getUserId());
        if (deleted == 0) return Response.status(404).build();

        try {

            User user = User.findById(getUserId());
            
            if (user.googleRefreshToken != null && !user.googleRefreshToken.isEmpty() && googleEventId != null) {
                googleCalendarService.deletarEvento(user.googleRefreshToken, googleEventId);
            }

        } catch (Exception e) {
            System.err.println("Erro ao deletar evento do Google Calendar: " + e.getMessage());
        }

        return Response.noContent().build();
    }

    @GET
    @Path("/dashboard")

    public Response dashboard(@QueryParam("ano") Integer ano) {

        List<Atendimento> todos = Atendimento.list("userId", getUserId());
        Map<String, Object> dashboard = new HashMap<>();

        dashboard.put("total", todos.size());

        BigDecimal totalConsultas = todos.stream().filter(a -> a.valorConsulta != null).map(a -> a.valorConsulta).reduce(BigDecimal.ZERO, BigDecimal::add);
        dashboard.put("totalConsultas", totalConsultas);
        
        long novos = todos.stream().filter(a -> a.clienteNovo == SimNao.SIM).count();
        long antigos = todos.stream().filter(a -> a.clienteNovo == SimNao.NAO).count();

        Map<String, Object> novosAntigos = new LinkedHashMap<>();

        novosAntigos.put("Novos", Map.of("quantidade", novos, "percentual", todos.size() > 0 ? (novos * 100 / todos.size()) : 0));
        novosAntigos.put("Antigos", Map.of("quantidade", antigos, "percentual", todos.size() > 0 ? (antigos * 100 / todos.size()) : 0));

        dashboard.put("novosAntigos", novosAntigos);

        long fechou = todos.stream().filter(a -> a.fechouContrato == SimNao.SIM).count();
        long naoFechou = todos.stream().filter(a -> a.fechouContrato == SimNao.NAO).count();

        Map<String, Object> fechouContrato = new LinkedHashMap<>();

        fechouContrato.put("Fechou", Map.of("quantidade", fechou, "percentual", todos.size() > 0 ? (fechou * 100 / todos.size()) : 0));
        fechouContrato.put("Não fechou", Map.of("quantidade", naoFechou, "percentual", todos.size() > 0 ? (naoFechou * 100 / todos.size()) : 0));

        dashboard.put("fechouContrato", fechouContrato);

        int anoFiltro = ano != null ? ano : LocalDate.now().getYear();
        Map<Integer, Long> porMes = todos.stream().filter(a -> a.data != null && a.data.getYear() == anoFiltro).collect(Collectors.groupingBy(a -> a.data.getMonthValue(), Collectors.counting()));
        
        dashboard.put("porMes", porMes);
        dashboard.put("ano", anoFiltro);

        return Response.ok(dashboard).build();

    }

    @GET
    @Path("/contatos/hoje")

    public Response contatosHoje() {

        LocalDate hoje = LocalDate.now();
        List<Atendimento> contatos = Atendimento.list("userId = ?1 and dataProximoContato = ?2", getUserId(), hoje);
        
        List<Map<String, Object>> result = contatos.stream().map(a -> {

            Map<String, Object> map = new HashMap<>();

            map.put("id", a.id);
            map.put("nome", a.nome);
            map.put("telefone", a.telefone);
            map.put("email", a.email);
            map.put("assunto", a.assunto);

            return map;

        }).collect(Collectors.toList());

        return Response.ok(result).build();
        
    }

    private AtendimentoResponse toResponse(Atendimento entity) {

        AtendimentoResponse response = new AtendimentoResponse();

        response.id = entity.id;
        response.data = entity.data;
        response.hora = entity.hora;
        response.clienteNovo = entity.clienteNovo;
        response.nome = entity.nome;
        response.assunto = entity.assunto;
        response.telefone = entity.telefone;
        response.email = entity.email;
        response.dataProximoContato = entity.dataProximoContato;
        response.comoConheceu = entity.comoConheceu;
        response.fechouContrato = entity.fechouContrato;
        response.valorConsulta = entity.valorConsulta;
        response.observacoes = entity.observacoes;
        response.createdAt = entity.createdAt;
        response.updatedAt = entity.updatedAt;

        return response;

    }

    private void updateEntity(Atendimento entity, AtendimentoRequest request) {
        entity.data = request.data;
        entity.hora = request.hora;
        entity.clienteNovo = request.clienteNovo != null ? request.clienteNovo : SimNao.NAO;
        entity.nome = request.nome;
        entity.assunto = request.assunto;
        entity.telefone = request.telefone;
        entity.email = request.email;
        entity.dataProximoContato = request.dataProximoContato;
        entity.comoConheceu = request.comoConheceu;
        entity.fechouContrato = request.fechouContrato != null ? request.fechouContrato : SimNao.NAO;
        entity.valorConsulta = request.valorConsulta != null ? request.valorConsulta : BigDecimal.ZERO;
        entity.observacoes = request.observacoes;
    }
}
