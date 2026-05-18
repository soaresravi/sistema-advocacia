package com.advocacia.resource;

import com.advocacia.dto.*;
import com.advocacia.entity.*;
import com.advocacia.enums.StatusEvento;

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

@Path("/audiencias")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("user")

public class AudienciaResource {
    
    @Inject
    JsonWebToken jwt;

    private Long getUserId() {
        return Long.parseLong(jwt.getSubject());
    }

    @GET
    public Response listar(@QueryParam("page") @DefaultValue("0") int page, @QueryParam("size") @DefaultValue("10") int size, @QueryParam("status") String status, @QueryParam("dataInicio") String dataInicio, @QueryParam("dataFim") String dataFim, @QueryParam("search") String search) {

        StringBuilder query = new StringBuilder("userId = ?1");
        List<Object> params = new ArrayList<>();

        params.add(getUserId());

        if (status != null && !status.isEmpty()) {
            query.append(" and status = ?").append(params.size() + 1);
            params.add(StatusEvento.valueOf(status));
        }

        if (dataInicio != null && !dataInicio.isEmpty()) {
            query.append(" and data >= ?").append(params.size() + 1);
            params.add(LocalDate.parse(dataInicio));
        }

        if (dataFim != null && !dataFim.isEmpty()) {
            query.append(" and data <= ?").append(params.size() + 1);
            params.add(LocalDate.parse(dataFim));
        }

        if (search != null && !search.isEmpty()) {
            query.append(" and (lower(processoNumero) like ?").append(params.size() + 1);
            params.add("%" + search.toLowerCase() + "%");
            query.append(" or lower(detalhes) like ?").append(params.size() + 1);
            params.add("%" + search.toLowerCase() + "%");
            query.append(")");
        }

        query.append(" order by data asc");

        long total = Audiencia.find(query.toString(), params.toArray()).count();

        List<Audiencia> lista = Audiencia.find(query.toString(), params.toArray()).page(Page.of(page, size)).list();
        List<AudienciaResponse> responseList = lista.stream().map(this::toResponse).collect(Collectors.toList());

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
        Audiencia entity = Audiencia.find("id = ?1 and userId = ?2", id, getUserId()).firstResult();
        if (entity == null) return Response.status(404).build();
        return Response.ok(toResponse(entity)).build();
    }

    @POST
    @Transactional

    public Response criar(AudienciaRequest request) {

        Processo processo = Processo.find("id = ?1 and userId = ?2", request.processoId, getUserId()).firstResult();
        if (processo == null) return Response.status(404).entity(Map.of("error", "Processo não encontrado")).build();

        Audiencia entity = new Audiencia();

        entity.userId = getUserId();
        updateEntity(entity, request);
        entity.processoNumero = processo.numeroProcesso;
        entity.persist();

        return Response.status(Response.Status.CREATED).entity(toResponse(entity)).build();

    }

    @PUT
    @Path("/{id}")
    @Transactional

    public Response atualizar(@PathParam("id") Long id, AudienciaRequest request) {

        Audiencia entity = Audiencia.find("id = ?1 and userId = ?2", id, getUserId()).firstResult();
        if (entity == null) return Response.status(404).build();

        Processo processo = Processo.find("id = ?1 and userId = ?2", request.processoId, getUserId()).firstResult();
        if (processo == null) return Response.status(404).entity(Map.of("error", "Processo não encontrado")).build();

        updateEntity(entity, request);
        entity.processoNumero = processo.numeroProcesso;

        entity.persist();
        return Response.ok(toResponse(entity)).build();

    }

    @DELETE
    @Path("/{id}")
    @Transactional

    public Response deletar(@PathParam("id") Long id) {
        long deleted = Audiencia.delete("id = ?1 and userId = ?2", id, getUserId());
        if (deleted == 0) return Response.status(404).build();
        return Response.noContent().build();
    }
    
    @GET
    @Path("/dashboard")

    public Response dashboard() {

        List<Audiencia> todas = Audiencia.list("userId", getUserId());
        Map<String, Object> dashboard = new HashMap<>();

        dashboard.put("total", todas.size());
        dashboard.put("agendadas", todas.stream().filter(a -> a.status == StatusEvento.AGENDADO).count());
        dashboard.put("concluidas", todas.stream().filter(a -> a.status == StatusEvento.CONCLUIDO).count());
        dashboard.put("canceladas", todas.stream().filter(a -> a.status == StatusEvento.CANCELADO).count());

        Map<String, Long> horarios = new LinkedHashMap<>();

        horarios.put("07h-09h", todas.stream().filter(a -> a.hora != null && a.hora.compareTo("07:00") >= 0 && a.hora.compareTo("09:00") < 0).count());
        horarios.put("09h-11h", todas.stream().filter(a -> a.hora != null && a.hora.compareTo("09:00") >= 0 && a.hora.compareTo("11:00") < 0).count());
        horarios.put("11h-13h", todas.stream().filter(a -> a.hora != null && a.hora.compareTo("11:00") >= 0 && a.hora.compareTo("13:00") < 0).count());
        horarios.put("13h-15h", todas.stream().filter(a -> a.hora != null && a.hora.compareTo("13:00") >= 0 && a.hora.compareTo("15:00") < 0).count());
        horarios.put("15h-17h", todas.stream().filter(a -> a.hora != null && a.hora.compareTo("15:00") >= 0 && a.hora.compareTo("17:00") < 0).count());
        horarios.put("17h+", todas.stream().filter(a -> a.hora != null && a.hora.compareTo("17:00") >= 0).count());

        dashboard.put("horarios", horarios);

        Map<Integer, Long> porMes = todas.stream().filter(a -> a.data != null).collect(Collectors.groupingBy(a -> a.data.getMonthValue(), Collectors.counting()));
        dashboard.put("porMes", porMes);

        return Response.ok(dashboard).build();

    }

    @GET
    @Path("/hoje")

    public Response alertasHoje() {

        LocalDate hoje = LocalDate.now();
        List<Audiencia> hojeList = Audiencia.list("userId = ?1 and data = ?2 and status = ?3", getUserId(), hoje, StatusEvento.AGENDADO);
        
        List<Map<String, Object>> result = hojeList.stream().map(a -> {

            Map<String, Object> map = new HashMap<>();

            map.put("id", a.id);
            map.put("data", a.data);
            map.put("hora", a.hora);
            map.put("processoNumero", a.processoNumero);
            map.put("detalhes", a.detalhes);
            map.put("local", a.local);

            return map;

        }).collect(Collectors.toList());

        return Response.ok(result).build();

    }

    @GET
    @Path("/proximos")

    public Response alertaProximos() {

        LocalDate hoje = LocalDate.now();
        LocalDate daqui7Dias = hoje.plusDays(7);

        List<Audiencia> proximos = Audiencia.list("userId = ?1 and data >= ?2 and data <= ?3 and status = ?4 order by data asc", getUserId(), hoje, daqui7Dias, StatusEvento.AGENDADO);
        
        List<Map<String, Object>> result = proximos.stream().map(a -> {

            Map<String, Object> map = new HashMap<>();

            map.put("id", a.id);
            map.put("data", a.data);
            map.put("hora", a.hora);
            map.put("processoNumero", a.processoNumero);
            map.put("detalhes", a.detalhes);
            map.put("diasRestantes", a.getDiasAteEvento());

            return map;

        }).collect(Collectors.toList());

        return Response.ok(result).build();

    }

    private AudienciaResponse toResponse(Audiencia entity) {

        AudienciaResponse response = new AudienciaResponse();

        response.id = entity.id;
        response.data = entity.data;
        response.hora = entity.hora;
        response.status = entity.status;
        response.processoId = entity.processoId;
        response.processoNumero = entity.processoNumero;
        response.detalhes = entity.detalhes;
        response.local = entity.local;
        response.observacoes = entity.observacoes;
        response.diasAteEvento = entity.getDiasAteEvento();
        response.createdAt = entity.createdAt;
        response.updatedAt = entity.updatedAt;

        return response;

    }

    private void updateEntity(Audiencia entity, AudienciaRequest request) {
        entity.data = request.data;
        entity.hora = request.hora;
        entity.status = request.status != null ? request.status : StatusEvento.AGENDADO;
        entity.processoId = request.processoId;
        entity.detalhes = request.detalhes;
        entity.local = request.local;
        entity.observacoes = request.observacoes;
    }
}
