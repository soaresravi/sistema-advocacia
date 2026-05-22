package com.advocacia.resource;

import com.advocacia.dto.*;
import com.advocacia.entity.Tarefa;
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

@Path("/tarefas")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("user")

public class TarefaResource {
    
    @Inject
    JsonWebToken jwt;

    private Long getUserId() {
        return Long.parseLong(jwt.getSubject());
    }

    @GET

    public Response listar(@QueryParam("page") @DefaultValue("0") int page, @QueryParam("size") @DefaultValue("10") int size, @QueryParam("status") String status, @QueryParam("urgencia") String urgencia, @QueryParam("dataInicio") String dataInicio, @QueryParam("dataFim") String dataFim, @QueryParam("search") String search) {

        StringBuilder query = new StringBuilder("userId = ?1");
        List<Object> params = new ArrayList<>();

        params.add(getUserId());

        if (status != null && !status.isEmpty()) {
            query.append(" and status = ?").append(params.size() + 1);
            params.add(StatusTarefa.valueOf(status));
        }

        if (urgencia != null && !urgencia.isEmpty()) {
            query.append(" and urgencia = ?").append(params.size() + 1);
            params.add(UrgenciaTarefa.valueOf(urgencia));
        }

        if (dataInicio != null && !dataInicio.isEmpty()) {
            query.append(" and prazoTarefa >= ?").append(params.size() + 1);
            params.add(LocalDate.parse(dataInicio));
        }

        if (dataFim != null && !dataFim.isEmpty()) {
            query.append(" and prazoTarefa <= ?").append(params.size() + 1);
            params.add(LocalDate.parse(dataFim));
        }

        if (search != null && !search.isEmpty()) {
            query.append(" and (lower(tarefa) like ?").append(params.size() + 1);
            params.add("%" + search.toLowerCase() + "%");
            query.append(" or lower(clienteNome) like ?").append(params.size() + 1);
            params.add("%" + search.toLowerCase() + "%");
            query.append(" or lower(processoNumero) like ?").append(params.size() + 1);
            params.add("%" + search.toLowerCase() + "%");
            query.append(")");
        }

        query.append(" order by prazoTarefa asc");
        long total = Tarefa.find(query.toString(), params.toArray()).count();

        List<Tarefa> lista = Tarefa.find(query.toString(), params.toArray()).page(Page.of(page, size)).list();
        List<TarefaResponse> responseList = lista.stream().map(this::toResponse).collect(Collectors.toList());

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
        Tarefa entity = Tarefa.find("id = ?1 and userId = ?2", id, getUserId()).firstResult();
        if (entity == null) return Response.status(404).build();
        return Response.ok(toResponse(entity)).build();
    }

    @POST
    @Transactional

    public Response criar(TarefaRequest request) {
        Tarefa entity = new Tarefa();
        entity.userId = getUserId();
        updateEntity(entity, request);
        entity.persist();
        return Response.status(Response.Status.CREATED).entity(toResponse(entity)).build();
    }

    @PUT
    @Path("/{id}")
    @Transactional

    public Response atualizar(@PathParam("id") Long id, TarefaRequest request) {
        Tarefa entity = Tarefa.find("id = ?1 and userId = ?2", id, getUserId()).firstResult();
        if (entity == null) return Response.status(404).build();
        updateEntity(entity, request);
        entity.persist();
        return Response.ok(toResponse(entity)).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional

    public Response deletar(@PathParam("id") Long id) {
        long deleted = Tarefa.delete("id = ?1 and userId = ?2", id, getUserId());
        if (deleted == 0) return Response.status(404).build();
        return Response.noContent().build();
    }

    @GET
    @Path("/dashboard")

    public Response dashboard(@QueryParam("ano") Integer ano) {

        int anoFiltro = ano != null ? ano : LocalDate.now().getYear();

        List<Tarefa> todas = Tarefa.list("userId", getUserId());
        Map<String, Object> dashboard = new HashMap<>();

        dashboard.put("total", todas.size());
        dashboard.put("concluidas", todas.stream().filter(t -> t.status == StatusTarefa.CONCLUIDA).count());
        dashboard.put("naoConcluidas", todas.stream().filter(t -> t.status != StatusTarefa.CONCLUIDA).count());

        long total = todas.size();
        long concluidas = todas.stream().filter(t -> t.status == StatusTarefa.CONCLUIDA).count();
        
        dashboard.put("progresso", total > 0 ? (concluidas * 100 / total) : 0);
        LocalDate hoje = LocalDate.now();

        List<Tarefa> atrasadas = todas.stream().filter(t -> t.prazoTarefa != null && t.prazoTarefa.isBefore(hoje)).filter(t -> t.status != StatusTarefa.CONCLUIDA).collect(Collectors.toList());
        Map<String, Long> atrasadasPorUrgencia = new LinkedHashMap<>();

        for (UrgenciaTarefa u : UrgenciaTarefa.values()) {

            long count = atrasadas.stream().filter(t -> t.urgencia == u).count();

            if (count > 0) {
                atrasadasPorUrgencia.put(u.getDescricao(), count);
            }

        }

        dashboard.put("atrasadasPorUrgencia", atrasadasPorUrgencia);
        dashboard.put("totalAtrasadas", atrasadas.size());

        Map<Integer, Map<String, Long>> tarefasPorMes = new LinkedHashMap<>();

        for (int mes = 1; mes <= 12; mes++) {

            final int mesFinal = mes;

            long totalMes = todas.stream().filter(t -> t.dataCadastro != null && t.dataCadastro.getYear() == anoFiltro && t.dataCadastro.getMonthValue() == mesFinal).count();
            long concluidasMes = todas.stream().filter(t -> t.dataCadastro != null && t.dataCadastro.getYear() == anoFiltro && t.dataCadastro.getMonthValue() == mesFinal).filter(t -> t.status == StatusTarefa.CONCLUIDA).count();
            long naoConcluidasMes = totalMes - concluidasMes;

            Map<String, Long> valores = new HashMap<>();

            valores.put("concluidas", concluidasMes);
            valores.put("naoConcluidas", naoConcluidasMes);
            valores.put("total", totalMes);

            tarefasPorMes.put(mes, valores);

        }

        dashboard.put("tarefasPorMes", tarefasPorMes);
        dashboard.put("ano", anoFiltro);

        return Response.ok(dashboard).build();

    }

    @GET
    @Path("/alertas/atrasadas")

    public Response alertasAtrasadas() {
        
        LocalDate hoje = LocalDate.now();
        List<Tarefa> atrasadas = Tarefa.list("userId = ?1 and prazoTarefa < ?2 and status != ?3", getUserId(), hoje, StatusTarefa.CONCLUIDA);

        atrasadas.sort(Comparator.comparing(t -> {
            
            switch (t.urgencia) {
                case EXIGE_ATENCAO_IMEDIATA: return 1;
                case MUITO_URGENTE: return 2;
                case REQUER_ATENCAO: return 3;
                case POUCO_URGENTE: return 4;
                case PODE_ESPERAR: return 5;
                default: return 6;
            }

        }));

        List<Map<String, Object>> result = atrasadas.stream().map(t -> {

            Map<String, Object> map = new HashMap<>();

            map.put("id", t.id);
            map.put("tarefa", t.tarefa);
            map.put("prazoTarefa", t.prazoTarefa);
            map.put("urgencia", t.urgencia.getDescricao());
            map.put("responsavel", t.responsavel);
            map.put("diasAtraso", java.time.temporal.ChronoUnit.DAYS.between(t.prazoTarefa, hoje));

            return map;

        }).collect(Collectors.toList());

        return Response.ok(result).build();

    }

    private TarefaResponse toResponse(Tarefa entity) {

        TarefaResponse response = new TarefaResponse();
        
        response.id = entity.id;
        response.dataCadastro = entity.dataCadastro;
        response.status = entity.status;
        response.tarefa = entity.tarefa;
        response.prazoTarefa = entity.prazoTarefa;
        response.urgencia = entity.urgencia;
        response.responsavel = entity.responsavel;
        response.andamento = entity.andamento;
        response.processoId = entity.processoId;
        response.processoNumero = entity.processoNumero;
        response.tipoCliente = entity.tipoCliente;
        response.clienteNome = entity.clienteNome;
        response.diasAtePrazo = entity.getDiasAtePrazo();
        response.createdAt = entity.createdAt;
        response.updatedAt = entity.updatedAt;

        return response;

    }

    private void updateEntity(Tarefa entity, TarefaRequest request) {
        entity.dataCadastro = request.dataCadastro != null ? request.dataCadastro : LocalDate.now();
        entity.status = request.status != null ? request.status : StatusTarefa.NAO_INICIADA;
        entity.tarefa = request.tarefa;
        entity.prazoTarefa = request.prazoTarefa;
        entity.urgencia = request.urgencia;
        entity.responsavel = request.responsavel;
        entity.andamento = request.andamento;
        entity.processoId = request.processoId;
        entity.processoNumero = request.processoNumero;
        entity.tipoCliente = request.tipoCliente;
        entity.clienteNome = request.clienteNome;
    }
}
