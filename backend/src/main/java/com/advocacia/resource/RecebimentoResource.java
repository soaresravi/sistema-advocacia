package com.advocacia.resource;

import com.advocacia.dto.*;
import com.advocacia.entity.Recebimento;
import com.advocacia.enums.TipoRecebimento;

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

@Path("/financeiro/recebimentos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("user")

public class RecebimentoResource {
    
    @Inject
    JsonWebToken jwt;

    private Long getUserId() {
        return Long.parseLong(jwt.getSubject());
    }

    @GET
    public Response listar(@QueryParam("page") @DefaultValue("0") int page, @QueryParam("size") @DefaultValue("10") int size, @QueryParam("dataInicio") String dataInicio, @QueryParam("dataFim") String dataFim, @QueryParam("tipo") String tipo, @QueryParam("tipoCliente") String tipoCliente, @QueryParam("recebido") String recebido, @QueryParam("search") String search) {

        StringBuilder query = new StringBuilder("userId = ?1");
        List<Object> params = new ArrayList<>();
       
        params.add(getUserId());

        if (dataInicio != null && !dataInicio.isEmpty()) {
            query.append(" and dataRecebimento >= ?").append(params.size() + 1);
            params.add(LocalDate.parse(dataInicio));
        }

        if (dataFim != null && !dataFim.isEmpty()) {
            query.append(" and dataRecebimento <= ?").append(params.size() + 1);
            params.add(LocalDate.parse(dataFim));
        }

        if (tipo != null && !tipo.isEmpty()) {
            query.append(" and tipo = ?").append(params.size() + 1);
            params.add(TipoRecebimento.valueOf(tipo));
        }

        if (tipoCliente != null && !tipoCliente.isEmpty()) {
            query.append(" and tipoCliente = ?").append(params.size() + 1);
            params.add(tipoCliente);
        }

        if (recebido != null && !recebido.isEmpty()) {
            query.append(" and recebido = ?").append(params.size() + 1);
            params.add("SIM".equals(recebido));
        }

        if (search != null && !search.isEmpty()) {
            query.append(" and (lower(clienteNome) like ?").append(params.size() + 1);
            params.add("%" + search.toLowerCase() + "%");
            query.append(" or lower(processoNumero) like ?").append(params.size() + 1);
            params.add("%" + search.toLowerCase() + "%");
            query.append(")");
        }

        query.append(" order by dataRecebimento desc");
        long total = Recebimento.find(query.toString(), params.toArray()).count();

        List<Recebimento> lista = Recebimento.find(query.toString(), params.toArray()).page(Page.of(page, size)).list();
        List<RecebimentoResponse> responseList = lista.stream().map(this::toResponse).collect(Collectors.toList());

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
        Recebimento entity = Recebimento.find("id = ?1 and userId = ?2", id, getUserId()).firstResult();
        if (entity == null) return Response.status(404).build();
        return Response.ok(toResponse(entity)).build();
    }

    @POST
    @Transactional

    public Response criar(RecebimentoRequest request) {
        Recebimento entity = new Recebimento();
        entity.userId = getUserId();
        updateEntity(entity, request);
        entity.persist();
        return Response.status(Response.Status.CREATED).entity(toResponse(entity)).build();
    }

    @PUT
    @Path("/{id}")
    @Transactional

    public Response atualizar(@PathParam("id") Long id, RecebimentoRequest request) {
        Recebimento entity = Recebimento.find("id = ?1 and userId = ?2", id, getUserId()).firstResult();
        if (entity == null) return Response.status(404).build();
        updateEntity(entity, request);
        entity.persist();
        return Response.ok(toResponse(entity)).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional

    public Response deletar(@PathParam("id") Long id) {
        long deleted = Recebimento.delete("id = ?1 and userId = ?2", id, getUserId());
        if (deleted == 0) return Response.status(404).build();
        return Response.noContent().build();
    }

    @GET
    @Path("/alertas/atrasados")

    public Response alertasAtrasados() {

        LocalDate hoje = LocalDate.now();
        List<Recebimento> atrasados = Recebimento.list("userId = ?1 and recebido = false and dataPrevistaRecebimento < ?2", getUserId(), hoje);

        List<Map<String, Object>> result = atrasados.stream().map(r -> {

            Map<String, Object> map = new HashMap<>();

            map.put("id", r.id);
            map.put("valor", r.valor);
            map.put("tipo", r.tipo.getDescricao());
            map.put("clienteNome", r.clienteNome);
            map.put("dataPrevistaRecebimento", r.dataPrevistaRecebimento);
            map.put("diasAtraso", java.time.temporal.ChronoUnit.DAYS.between(r.dataPrevistaRecebimento, hoje));

            return map;

        }).collect(Collectors.toList());

        return Response.ok(result).build();

    }

    private RecebimentoResponse toResponse(Recebimento entity) {

        RecebimentoResponse response = new RecebimentoResponse();

        response.id = entity.id;
        response.dataPrevistaRecebimento = entity.dataPrevistaRecebimento;
        response.valor = entity.valor;
        response.tipo = entity.tipo;
        response.processoId = entity.processoId;
        response.processoNumero = entity.processoNumero;
        response.tipoCliente = entity.tipoCliente;
        response.clienteNome = entity.clienteNome;
        response.parcela = entity.parcela;
        response.recebido = entity.recebido;
        response.dataRecebimento = entity.dataRecebimento;
        response.detalhes = entity.detalhes;
        response.createdAt = entity.createdAt;
        response.updatedAt = entity.updatedAt;

        return response;
    }

    private void updateEntity(Recebimento entity, RecebimentoRequest request) {
        entity.dataPrevistaRecebimento = request.dataPrevistaRecebimento;
        entity.valor = request.valor;
        entity.tipo = request.tipo;
        entity.processoId = request.processoId;
        entity.processoNumero = request.processoNumero;
        entity.tipoCliente = request.tipoCliente;
        entity.clienteNome = request.clienteNome;
        entity.parcela = request.parcela;
        entity.recebido = request.recebido != null ? request.recebido : false;
        entity.dataRecebimento = request.dataRecebimento;
        entity.detalhes = request.detalhes;
    }
}
