package com.advocacia.resource;

import com.advocacia.dto.*;
import com.advocacia.entity.*;
import com.advocacia.enums.*;

import io.quarkus.panache.common.Page;
import java.math.BigDecimal;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import org.eclipse.microprofile.jwt.JsonWebToken;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

import java.util.*;
import java.util.stream.Collectors;

@Path("/processos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("user")

public class ProcessoResource {
    
    @Inject
    JsonWebToken jwt;

    private Long getUserId() {
        return Long.parseLong(jwt.getSubject());
    }

    @GET

    public Response listar(@QueryParam("page") @DefaultValue("0") int page, @QueryParam("size") @DefaultValue("10") int size, @QueryParam("status") String status, @QueryParam("tipoCliente") String tipoCliente, @QueryParam("prazoAberto") String prazoAberto, @QueryParam("fase") String fase, @QueryParam("search") String search) {

        StringBuilder query = new StringBuilder("userId = ?1");
        List<Object> params = new ArrayList<>();

        params.add(getUserId());

        if (status != null && !status.isEmpty() && !status.equals("TODOS")) {
            query.append(" and status = ?2");
            params.add(StatusProcesso.valueOf(status));
        }

        if (tipoCliente != null && !tipoCliente.isEmpty() && !tipoCliente.equals("TODOS")) {
            query.append(" and tipoCliente = ?").append(params.size() + 1);
            params.add(tipoCliente);
        }

        if (prazoAberto != null && !prazoAberto.isEmpty() && !prazoAberto.equals("TODOS")) {
            query.append(" and prazoAberto = ?").append(params.size() + 1);
            params.add("SIM".equals(prazoAberto));
        }

        if (fase != null && !fase.isEmpty()) {
            query.append(" and fase = ?").append(params.size() + 1);
            params.add(FaseProcesso.valueOf(fase));
        }

        if (search != null && !search.isEmpty()) {
            query.append(" and (lower(numeroProcesso) like ?").append(params.size() + 1);
            params.add("%" + search.toLowerCase() + "%");
            query.append(" or lower(clienteNome) like ?").append(params.size() + 1);
            params.add("%" + search.toLowerCase() + "%");
            query.append(")");
        }

        long total = Processo.find(query.toString(), params.toArray()).count();

        List<Processo> lista = Processo.find(query.toString(), params.toArray()).page(Page.of(page, size)).list();
        List<ProcessoResponse> responseList = new ArrayList<>();

        for (Processo processo : lista) {
            responseList.add(toResponse(processo));
        }

        Map<String, Object> result = new HashMap<>();

        result.put("content", responseList);
        result.put("page", page);
        result.put("size", size);
        result.put("total", total);
        result.put("totalPages", (int) Math.ceil((double) total / size ));

        return Response.ok(result).build();

    }

    @GET
    @Path("/{id}")

    public Response buscar(@PathParam("id") Long id) {
        Processo processo = Processo.find("id = ?1 and userId = ?2", id, getUserId()).firstResult();
        if (processo == null) return Response.status(404).build();
        return Response.ok(toResponse(processo)).build();
    }

    @POST
    @Transactional

    public Response criar(ProcessoRequest request) {
        Processo processo = new Processo();
        processo.userId = getUserId();
        updateEntity(processo, request);
        processo.persist();
        return Response.status(Response.Status.CREATED).entity(toResponse(processo)).build();
    }

    @PUT 
    @Path("/{id}")
    @Transactional

    public Response atualizar(@PathParam("id") Long id, ProcessoRequest request) {
        Processo processo = Processo.find("id = ?1 and userId = ?2", id, getUserId()).firstResult();
        if (processo == null) return Response.status(404).build();
        updateEntity(processo, request);
        processo.persist();
        return Response.ok(toResponse(processo)).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional

    public Response deletar(@PathParam("id") Long id) {
        long deleted = Processo.delete("id = ?1 and userId = ?2", id, getUserId());
        if (deleted == 0) return Response.status(404).build();
        return Response.noContent().build();
    }

    @GET
    @Path("/{id}/movimentacoes")

    public Response listarMovimentacoes(@PathParam("id") Long id) {

        Processo processo = Processo.find("id = ?1 and userId = ?2", id, getUserId()).firstResult();
        if (processo == null) return Response.status(404).build();

        List<Movimentacao> movimentacoes = Movimentacao.find("processoId = ?1 and userId = ?2 order by data desc", id, getUserId()).list();
        List<MovimentacaoResponse> responseList = new ArrayList<>();

        for (Movimentacao mov : movimentacoes) {

            MovimentacaoResponse resp = new MovimentacaoResponse();

            resp.id = mov.id;
            resp.processoId = mov.processoId;
            resp.descricao = mov.descricao;
            resp.data = mov.data;
            responseList.add(resp);
        
        }

        return Response.ok(responseList).build();

    }

    @POST
    @Path("/{id}/movimentacoes")
    @Transactional

    public Response criarMovimentacao(@PathParam("id") Long id, MovimentacaoRequest request) {

        Processo processo = Processo.find("id = ?1 and userId = ?2", id, getUserId()).firstResult();
        if (processo == null) return Response.status(404).build();

        Movimentacao movimentacao = new Movimentacao();

        movimentacao.processoId = id;
        movimentacao.descricao = request.descricao;
        movimentacao.data = request.data != null ? request.data : LocalDate.now();
        movimentacao.userId = getUserId();
        movimentacao.persist();

        MovimentacaoResponse response = new MovimentacaoResponse();

        response.id = movimentacao.id;
        response.processoId = movimentacao.processoId;
        response.descricao = movimentacao.descricao;
        response.data = movimentacao.data;

        return Response.status(Response.Status.CREATED).entity(response).build();

    }

    @PUT
    @Path("/{id}/movimentacoes/{movId}")
    @Transactional

    public Response atualizarMovimentacao(@PathParam("id") Long id, @PathParam("movId") Long movId, MovimentacaoRequest request) {

        Processo processo = Processo.find("id = ?1 and userId = ?2", id, getUserId()).firstResult();
        if (processo == null) return Response.status(404).build();

        Movimentacao movimentacao = Movimentacao.find("id = ?1 and processoId = ?2 and userId = ?3", movId, id, getUserId()).firstResult();
        if (movimentacao == null) return Response.status(404).build();

        movimentacao.descricao = request.descricao;

        if (request.data != null) {
            movimentacao.data = request.data;
        }

        movimentacao.persist();
        MovimentacaoResponse response = new MovimentacaoResponse();

        response.id = movimentacao.id;
        response.processoId = movimentacao.processoId;
        response.descricao = movimentacao.descricao;
        response.data = movimentacao.data;

        return Response.ok(response).build();
        
    }

    @DELETE
    @Path("/{id}/movimentacoes/{movId}")
    @Transactional

    public Response deletarMovimentacao(@PathParam("id") Long id, @PathParam("movId") Long movId) {
        Processo processo = Processo.find("id = ?1 and userId = ?2", id, getUserId()).firstResult();
        if (processo == null) return Response.status(404).build();
        long deleted = Movimentacao.delete("id = ?1 and processoId = ?2 and userId = ?3", movId, id, getUserId());
        if (deleted == 0) return Response.status(404).build();
        return Response.noContent().build();
    }

    @GET
    @Path("/dashboard")

    public Response dashboard() {

        List<Processo> processos = Processo.list("userId", getUserId());
        List<Processo> processosAtivos = processos.stream().filter(p -> p.status == StatusProcesso.ATIVO).collect(Collectors.toList());
        List<Processo> processosEncerrados = processos.stream().filter(p -> p.status == StatusProcesso.ENCERRADO).collect(Collectors.toList());
        
        Map<String, Object> dashboard = new HashMap<>();

        dashboard.put("totalProcessos", processos.size());
        dashboard.put("processosAtivos", processosAtivos.size());
        dashboard.put("processosEncerrados", processosEncerrados.size());

        double duracaoMedia = processosEncerrados.stream().filter(p -> p.duracaoDias != null).mapToInt(p -> p.duracaoDias).average().orElse(0);
        dashboard.put("duracaoMediaDias", Math.round(duracaoMedia));

        BigDecimal valorCausasAberto = processosAtivos.stream().filter(p -> p.valorCausa != null).map(p -> p.valorCausa).reduce(BigDecimal.ZERO, BigDecimal::add);
        dashboard.put("valorCausasEmAberto", valorCausasAberto);

        BigDecimal totalHonorarios = processos.stream().filter(p -> p.totalHonorarios != null).map(p -> p.totalHonorarios).reduce(BigDecimal.ZERO, BigDecimal::add);
        dashboard.put("totalHonorarios", totalHonorarios);

        BigDecimal maiorValorCausa = processos.stream().filter(p -> p.valorCausa != null).map(p -> p.valorCausa).max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
        dashboard.put("maiorValorCausa", maiorValorCausa);

        BigDecimal maiorHonorario = processos.stream().filter(p -> p.totalHonorarios != null).map(p -> p.totalHonorarios).max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
        dashboard.put("maiorHonorario", maiorHonorario);

        long pfCount = processos.stream().filter(p -> "PF".equals(p.tipoCliente)).count();
        long pjCount = processos.stream().filter(p -> "PJ".equals(p.tipoCliente)).count();

        Map<String, Object> tipoClienteGrafico = new HashMap<>();

        tipoClienteGrafico.put("PF", Map.of("quantidade", pfCount, "percentual", processos.size() > 0 ? (pfCount * 100 / processos.size()) : 0));
        tipoClienteGrafico.put("PJ", Map.of("quantidade", pjCount, "percentual", processos.size() > 0 ? (pjCount * 100 / processos.size()) : 0));

        dashboard.put("tipoCliente", tipoClienteGrafico);

        Map<String, Object> resultados = new LinkedHashMap<>();

        for (ResultadoProcesso r : ResultadoProcesso.values()) {

            long count = processos.stream().filter(p -> p.resultado == r).count();

            if (count > 0 || r == ResultadoProcesso.ACORDO) {
                resultados.put(r.getDescricao(), Map.of("quantidade", count, "percentual", processos.size() > 0 ? (count * 100 / processos.size()) : 0));
            }

        }

        dashboard.put("resultados", resultados);
        return Response.ok(dashboard).build();

    }

    @GET
    @Path("/prazos/hoje")

    public Response prazosHoje() {

        LocalDate hoje = LocalDate.now();
        List<Processo> processos = Processo.list("userId = ?1 and prazoAberto = true and dataPrazo = ?2", getUserId(), hoje);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Processo p : processos) {

            Map<String, Object> item = new HashMap<>();

            item.put("id", p.id);
            item.put("numeroProcesso", p.numeroProcesso);
            item.put("clienteNome", p.clienteNome);
            item.put("dataPrazo", p.dataPrazo);

            result.add(item);

        }

        return Response.ok(result).build();

    }

    @GET
    @Path("/prazos/proximos")

    public Response prazosProximos() {

        LocalDate hoje = LocalDate.now();
        LocalDate daqui7DIas = hoje.plusDays(7);
        List<Processo> processos = Processo.list("userId = ?1 and prazoAberto = true and dataPrazo >= ?2 and dataPrazo <= ?3", getUserId(), hoje, daqui7DIas);

        processos.sort(Comparator.comparing(p -> p.dataPrazo));

        List<Map<String, Object>> result = new ArrayList<>();

        for (Processo p : processos) {

            Map<String, Object> item = new HashMap<>();

            item.put("id", p.id);
            item.put("numeroProcesso", p.numeroProcesso);
            item.put("clienteNome", p.clienteNome);
            item.put("dataPrazo", p.dataPrazo);
            item.put("diasRestantes", (int) ChronoUnit.DAYS.between(hoje, p.dataPrazo));

            result.add(item);

        }

        return Response.ok(result).build();

    }

    @GET
    @Path("/prazos/calendario")

    public Response calendarioPrazos(@QueryParam("semana") Integer semana) {

        LocalDate hoje = LocalDate.now();
        LocalDate inicio = semana != null && semana == 1 ? hoje : hoje;
        LocalDate fim = inicio.plusDays(7);

        List<Processo> processos = Processo.list("userId = ?1 and prazoAberto = true and dataPrazo >= ?2 and dataPrazo <= ?3", getUserId(), inicio, fim);
        Map<LocalDate, List<Map<String, Object>>> calendario = new LinkedHashMap<>();

        for (Processo p : processos) {

            calendario.computeIfAbsent(p.dataPrazo, k -> new ArrayList<>()).add(Map.of(
                "id", p.id,
                "numeroProcesso", p.numeroProcesso,
                "clienteNome", p.clienteNome
            ));

        }

        return Response.ok(calendario).build();

    }

    private ProcessoResponse toResponse(Processo entity) {

        ProcessoResponse response = new ProcessoResponse();

        response.id = entity.id;
        response.numeroProcesso = entity.numeroProcesso;
        response.status = entity.status;
        response.tipoAcao = entity.tipoAcao;
        response.tipoCliente = entity.tipoCliente;
        response.clienteId = entity.clienteId;
        response.clienteNome = entity.clienteNome;
        response.qualificacao = entity.qualificacao;
        response.prazoAberto = entity.prazoAberto;
        response.dataPrazo = entity.dataPrazo;
        response.outroEnvolvido = entity.outroEnvolvido;
        response.qualificacaoOutro = entity.qualificacaoOutro;
        response.valorCausa = entity.valorCausa;
        response.valorAcordoSentenca = entity.valorAcordoSentenca;
        response.honorariosReais = entity.honorariosReais;
        response.honorariosPercentual = entity.honorariosPercentual;
        response.sucumbencias = entity.sucumbencias;
        response.totalHonorarios = entity.totalHonorarios;
        response.fase = entity.fase;
        response.instancia = entity.instancia;
        response.comarca = entity.comarca;
        response.vara = entity.vara;
        response.observacoes = entity.observacoes;
        response.dataInicio = entity.dataInicio;
        response.dataFim = entity.dataFim;
        response.duracaoDias = entity.duracaoDias;
        response.resultado = entity.resultado;
        response.linkProcesso = entity.linkProcesso;
        response.userId = entity.userId;
        response.createdAt = entity.createdAt;
        response.updatedAt = entity.updatedAt;

        return response;

    }

    private void updateEntity(Processo entity, ProcessoRequest request) {
        
        entity.numeroProcesso = request.numeroProcesso;
        entity.status = request.status != null ? request.status : StatusProcesso.ATIVO;
        entity.tipoAcao = request.tipoAcao;
        entity.tipoCliente = request.tipoCliente;
        entity.clienteId = request.clienteId;
        entity.clienteNome = request.clienteNome;
        entity.qualificacao = request.qualificacao;
        entity.prazoAberto = request.prazoAberto;
        entity.dataPrazo = request.dataPrazo;
        entity.outroEnvolvido = request.outroEnvolvido;
        entity.qualificacaoOutro = request.qualificacaoOutro;
        entity.valorCausa = request.valorCausa;
        entity.valorAcordoSentenca = request.valorAcordoSentenca;
        entity.honorariosReais = request.honorariosReais;
        entity.honorariosPercentual = request.honorariosPercentual;
        entity.sucumbencias = request.sucumbencias;
        entity.fase = request.fase;
        entity.instancia = request.instancia;
        entity.comarca = request.comarca;
        entity.vara = request.vara;
        entity.observacoes = request.observacoes;
        entity.dataInicio = request.dataInicio;
        entity.dataFim = request.dataFim;
        entity.resultado = request.resultado;
        entity.linkProcesso = request.linkProcesso;

        entity.calcularTotalHonorarios();
        entity.calcularDuracao();

    }
}
