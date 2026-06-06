package com.advocacia.resource;

import com.advocacia.dto.*;
import com.advocacia.entity.Despesa;
import com.advocacia.enums.CategoriaDespesa;
import com.advocacia.service.*;

import io.quarkus.panache.common.Page;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;

import org.eclipse.microprofile.jwt.JsonWebToken;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Path("/financeiro/despesas")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("user")

public class DespesaResource {
    
    @Inject
    JsonWebToken jwt;

    @Inject
    AtividadeLogService logService;
    
    @Context
    SecurityContext securityContext;

    @Context
    HttpHeaders httpHeaders;

    private Long getUserId() {
        return Long.parseLong(jwt.getSubject());
    }

    private String getUserAgent() {
        return httpHeaders.getHeaderString("User-Agent");
    }

    private String getClientIp() {

        String ip = httpHeaders.getHeaderString("X-Forwarded-For");

        if (ip != null && !ip.isEmpty()) {
            return ip.split(",")[0].trim();
        }

        ip = httpHeaders.getHeaderString("X-Real-IP");

        if (ip != null && !ip.isEmpty()) {
            return ip;
        }

        return null;
        
    }

    @GET

    public Response listar(@QueryParam("page") @DefaultValue("0") int page, @QueryParam("size") @DefaultValue("10") int size, @QueryParam("dataInicio") String dataInicio, @QueryParam("dataFim") String dataFim, @QueryParam("categoria") String categoria, @QueryParam("pago") String pago, @QueryParam("search") String search) {

        StringBuilder query = new StringBuilder("userId = ?1");
        List<Object> params = new ArrayList<>();

        params.add(getUserId());

        if (dataInicio != null && !dataInicio.isEmpty()) {
            query.append(" and dataEfetivaPagamento >= ?").append(params.size() + 1);
            params.add(LocalDate.parse(dataInicio));
        }

        if (dataFim != null && !dataFim.isEmpty()) {
            query.append(" and dataEfetivaPagamento <= ?").append(params.size() + 1);
            params.add(LocalDate.parse(dataFim));
        }

        if (categoria != null && !categoria.isEmpty()) {
            query.append(" and categoria = ?").append(params.size() + 1);
            params.add(CategoriaDespesa.valueOf(categoria));
        }

        if (pago != null && !pago.isEmpty()) {
            query.append(" and pago = ?").append(params.size() + 1);
            params.add("SIM".equals(pago));
        }

        if (search != null && !search.isEmpty()) {
            query.append(" and (lower(despesa) like ?").append(params.size() + 1);
            params.add("%" + search.toLowerCase() + "%");
            query.append(" or lower(detalhes) like ?").append(params.size() + 1);
            params.add("%" + search.toLowerCase() + "%");
            query.append(")");
        }

        query.append(" order by dataEfetivaPagamento desc");
        long total = Despesa.find(query.toString(), params.toArray()).count();

        List<Despesa> lista = Despesa.find(query.toString(), params.toArray()).page(Page.of(page, size)).list();
        List<DespesaResponse> responseList = lista.stream().map(this::toResponse).collect(Collectors.toList());

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
        Despesa entity = Despesa.find("id = ?1 and userId = ?2", id, getUserId()).firstResult();
        if (entity == null) return Response.status(404).build();
        return Response.ok(toResponse(entity)).build();
    }

    @POST
    @Transactional

    public Response criar(DespesaRequest request) {
        Despesa entity = new Despesa();
        entity.userId = getUserId();
        updateEntity(entity, request);
        entity.persist();
        logService.registrar(getUserId(), "CREATE", "Despesa", entity.id, "Criou despesa: " + entity.despesa + " - Valor: R$ " + entity.valor, getClientIp(), getUserAgent());
        return Response.status(Response.Status.CREATED).entity(toResponse(entity)).build();
    }

    @PUT
    @Path("/{id}")
    @Transactional

    public Response atualizar(@PathParam("id") Long id, DespesaRequest request) {
        Despesa entity = Despesa.find("id = ?1 and userId = ?2", id, getUserId()).firstResult();
        if (entity == null) return Response.status(404).build();
        String despesaAntiga = entity.despesa;
        updateEntity(entity, request);
        entity.persist();
        logService.registrar(getUserId(), "UPDATE", "Despesa", entity.id, "Atualizou despesa: " + despesaAntiga + " -> " + entity.despesa, getClientIp(), getUserAgent());
        return Response.ok(toResponse(entity)).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional

    public Response deletar(@PathParam("id") Long id) {
        Despesa entity = Despesa.find("id = ?1 and userId = ?2", id, getUserId()).firstResult();
        if (entity == null) return Response.status(404).build();
        String despesaNome = entity.despesa;
        long deleted = Despesa.delete("id = ?1 and userId = ?2", id, getUserId());
        if (deleted == 0) return Response.status(404).build();
        logService.registrar(getUserId(), "DELETE", "Despesa", id, "Excluiu despesa: " + despesaNome, getClientIp(), getUserAgent());
        return Response.noContent().build();
    }

    @GET
    @Path("/alertas/atrasados")

    public Response alertasAtrasados() {
        
        LocalDate hoje = LocalDate.now();
        List<Despesa> atrasados = Despesa.list("userId = ?1 and pago = false and dataPrevistaPagamento < ?2", getUserId(), hoje);
        
        List<Map<String, Object>> result = atrasados.stream().map(d -> {

            Map<String, Object> map = new HashMap<>();

            map.put("id", d.id);
            map.put("valor", d.valor);
            map.put("categoria", d.categoria.getDescricao());
            map.put("despesa", d.despesa);
            map.put("dataPrevistaPagamento", d.dataPrevistaPagamento);
            map.put("diasAtraso", java.time.temporal.ChronoUnit.DAYS.between(d.dataPrevistaPagamento, hoje));

            return map;

        }).collect(Collectors.toList());

        return Response.ok(result).build();

    }

    private DespesaResponse toResponse(Despesa entity) {

        DespesaResponse response = new DespesaResponse();

        response.id = entity.id;
        response.dataPrevistaPagamento = entity.dataPrevistaPagamento;
        response.valor = entity.valor;
        response.categoria = entity.categoria;
        response.despesa = entity.despesa;
        response.pago = entity.pago;
        response.dataEfetivaPagamento = entity.dataEfetivaPagamento;
        response.detalhes = entity.detalhes;
        response.createdAt = entity.createdAt;
        response.updatedAt = entity.updatedAt;

        return response;

    }

    private void updateEntity(Despesa entity, DespesaRequest request) {
        entity.dataPrevistaPagamento = request.dataPrevistaPagamento;
        entity.valor = request.valor;
        entity.categoria = request.categoria;
        entity.despesa = request.despesa;
        entity.pago = request.pago != null ? request.pago : false;
        entity.dataEfetivaPagamento = request.dataEfetivaPagamento;
        entity.detalhes = request.detalhes;
    }
}
