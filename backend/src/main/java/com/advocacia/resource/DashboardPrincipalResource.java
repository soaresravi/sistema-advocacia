package com.advocacia.resource;

import com.advocacia.entity.*;
import com.advocacia.enums.StatusEvento;
import com.advocacia.enums.StatusProcesso;
import com.advocacia.enums.StatusTarefa;
import com.advocacia.enums.UrgenciaTarefa;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Path("/dashboard")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("user")

public class DashboardPrincipalResource {
    
    @Inject
    JsonWebToken jwt;

    private Long getUserId() {
        return Long.parseLong(jwt.getSubject());
    }

    @GET

    public Response getDashboard() {

        LocalDate hoje = LocalDate.now();
        LocalDate daqui7Dias = hoje.plusDays(7);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        Map<String, Object> dashboard = new LinkedHashMap<>();

        dashboard.put("dataHoje", hoje.format(formatter));
        dashboard.put("dataHojeISO", hoje.toString());

        Map<String, Object> cards = new LinkedHashMap<>();

        long processosAtivos = Processo.count("userId = ?1 and status = ?2", getUserId(), StatusProcesso.ATIVO);
        cards.put("processosAtivos", processosAtivos);

        long clientesPF = ClientePF.count("userId", getUserId());
        long clientesPJ = ClientePJ.count("userId", getUserId());

        cards.put("clientesCadastrados", clientesPF + clientesPJ);
        cards.put("clientesPF", clientesPF);
        cards.put("clientesPJ", clientesPJ);

        long audienciasAgendadas = Audiencia.count("userId = ?1 and status = ?2 and data >= ?3", getUserId(), StatusEvento.AGENDADO, hoje);
        cards.put("audienciasAgendadas", audienciasAgendadas);

        long periciasAgendadas = Pericia.count("userId = ?1 and status = ?2 and data >= ?3", getUserId(), StatusEvento.AGENDADO, hoje);
        cards.put("periciasAgendadas", periciasAgendadas);
        dashboard.put("cards", cards);

        Map<String, Object> alertasHoje = new LinkedHashMap<>();

        long prazosHoje = Processo.count("userId = ?1 and prazoAberto = true and dataPrazo = ?2", getUserId(), hoje);
        alertasHoje.put("prazosAbertosHoje", prazosHoje);

        long periciasHoje = Pericia.count("userId = ?1 and status = ?2 and data = ?3", getUserId(), StatusEvento.AGENDADO, hoje);
        alertasHoje.put("periciasHoje", periciasHoje);

        long audienciasHoje = Audiencia.count("userId = ?1 and status = ?2 and data = ?3", getUserId(), StatusEvento.AGENDADO, hoje);
        alertasHoje.put("audienciasHoje", audienciasHoje);

        long contatosHoje = Atendimento.count("userId = ?1 and dataProximoContato = ?2", getUserId(), hoje);
        alertasHoje.put("clientesParaRetornarHoje", contatosHoje);

        List<ClientePF> aniversariantesHoje = ClientePF.<ClientePF>list("userId", getUserId()).stream().filter(c -> c.dataNascimento != null && c.dataNascimento.getMonthValue() == hoje.getMonthValue() && c.dataNascimento.getDayOfMonth() == hoje.getDayOfMonth()).collect(Collectors.toList());
        alertasHoje.put("clientesAniversariantesHoje", aniversariantesHoje.size());
        dashboard.put("alertasHoje", alertasHoje);

        Map<String, Object> alertasProximos = new LinkedHashMap<>();

        long prazosProximos = Processo.count("userId = ?1 and prazoAberto = true and dataPrazo >= ?2 and dataPrazo <= ?3", getUserId(), hoje, daqui7Dias);
        alertasProximos.put("prazosAbertosProximos7Dias", prazosProximos);

        long periciasProximos = Pericia.count("userId = ?1 and status = ?2 and data >= ?3 and data <= ?4", getUserId(), StatusEvento.AGENDADO, hoje, daqui7Dias);
        alertasProximos.put("periciasProximos7Dias", periciasProximos);

        long audienciasProximos = Audiencia.count("userId = ?1 and status = ?2 and data >= ?3 and data <= ?4", getUserId(), StatusEvento.AGENDADO, hoje, daqui7Dias);
        alertasProximos.put("audienciasProximos7Dias", audienciasProximos);
        
        dashboard.put("alertasProximos7Dias", alertasProximos);

        Map<String, Object> tarefasAtrasadas = new LinkedHashMap<>();
        List<Tarefa> tarefas = Tarefa.list("userId = ?1 and status != ?2 and prazoTarefa < ?3", getUserId(), StatusTarefa.CONCLUIDA, hoje);

        long exigeAtencaoImediata = tarefas.stream().filter(t -> t.urgencia == UrgenciaTarefa.EXIGE_ATENCAO_IMEDIATA).count();
        long muitoUrgente = tarefas.stream().filter(t -> t.urgencia == UrgenciaTarefa.MUITO_URGENTE).count();
        long requerAtencao = tarefas.stream().filter(t -> t.urgencia == UrgenciaTarefa.REQUER_ATENCAO).count();
        long poucoUrgente = tarefas.stream().filter(t -> t.urgencia == UrgenciaTarefa.POUCO_URGENTE).count();
        long podeEsperar = tarefas.stream().filter(t -> t.urgencia == UrgenciaTarefa.PODE_ESPERAR).count();

        tarefasAtrasadas.put("exigeAtencaoImediata", exigeAtencaoImediata);
        tarefasAtrasadas.put("muitoUrgente", muitoUrgente);
        tarefasAtrasadas.put("requerAtencao", requerAtencao);
        tarefasAtrasadas.put("poucoUrgente", poucoUrgente);
        tarefasAtrasadas.put("podeEsperar", podeEsperar);
        tarefasAtrasadas.put("total", tarefas.size());

        List<Map<String, Object>> listaTarefasAtrasadas = tarefas.stream().sorted(Comparator.comparing(t -> {

            switch (t.urgencia) {
                case EXIGE_ATENCAO_IMEDIATA: return 1;
                case MUITO_URGENTE: return 2;
                case REQUER_ATENCAO: return 3;
                case POUCO_URGENTE: return 4;
                case PODE_ESPERAR: return 5;
                default: return 6;
            }

        })).map(t -> {

            Map<String, Object> map = new LinkedHashMap<>();

            map.put("id", t.id);
            map.put("tarefa", t.tarefa);
            map.put("prazoTarefa", t.prazoTarefa);
            map.put("urgencia", t.urgencia.getDescricao());
            map.put("diasAtraso", java.time.temporal.ChronoUnit.DAYS.between(t.prazoTarefa, hoje));

            return map;

        }).collect(Collectors.toList());

        tarefasAtrasadas.put("lista", listaTarefasAtrasadas);
        dashboard.put("tarefasAtrasadas", tarefasAtrasadas);

        Map<String, Object> financeiro = new LinkedHashMap<>();

        List<Recebimento> recebimentos = Recebimento.list("userId", getUserId());
        BigDecimal totalAReceberHoje = recebimentos.stream().filter(r -> r.dataPrevistaRecebimento != null && r.dataPrevistaRecebimento.equals(hoje)).filter(r -> !Boolean.TRUE.equals(r.recebido)).map(r -> r.valor != null ? r.valor : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalRecebimentosAtraso = recebimentos.stream().filter(r -> r.dataPrevistaRecebimento != null && r.dataPrevistaRecebimento.isBefore(hoje)).filter(r -> !Boolean.TRUE.equals(r.recebido)).map(r -> r.valor != null ? r.valor : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
        
        List<Despesa> despesas = Despesa.list("userId", getUserId());
        BigDecimal totalAPagarHoje = despesas.stream().filter(d -> d.dataPrevistaPagamento != null && d.dataPrevistaPagamento.equals(hoje)).filter(d -> !Boolean.TRUE.equals(d.pago)).map(d -> d.valor != null ? d.valor : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalDespesasAtraso = despesas.stream().filter(d -> d.dataPrevistaPagamento != null && d.dataPrevistaPagamento.isBefore(hoje)).filter(d -> !Boolean.TRUE.equals(d.pago)).map(d -> d.valor != null ? d.valor : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);

        financeiro.put("totalAReceberHoje", totalAReceberHoje);
        financeiro.put("totalAPagarHoje", totalAPagarHoje);
        financeiro.put("totalRecebimentosAtraso", totalRecebimentosAtraso);
        financeiro.put("totalDespesasAtraso", totalDespesasAtraso);
        dashboard.put("financeiro", financeiro);

        List<Map<String, Object>> prazosHojeLista = Processo.<Processo>find("userId = ?1 and prazoAberto = true and dataPrazo = ?2", getUserId(), hoje).stream().map(p -> {

            Map<String, Object> map = new LinkedHashMap<>();

            map.put("id", p.id);
            map.put("numeroProcesso", p.numeroProcesso);
            map.put("clienteNome", p.clienteNome);
            map.put("dataPrazo", p.dataPrazo);

            return map;

        }).collect(Collectors.toList());

        dashboard.put("prazosHojeLista", prazosHojeLista);

        List<Map<String, Object>> prazosProximosLista = Processo.<Processo>list("userId = ?1 and prazoAberto = true and dataPrazo >= ?2 and dataPrazo <= ?3 order by dataPrazo asc", getUserId(), hoje, daqui7Dias).stream().map(p -> {

            Map<String, Object> map = new LinkedHashMap<>();

            map.put("id", p.id);
            map.put("numeroProcesso", p.numeroProcesso);
            map.put("clienteNome", p.clienteNome);
            map.put("dataPrazo", p.dataPrazo);
            map.put("diasRestantes", java.time.temporal.ChronoUnit.DAYS.between(hoje, p.dataPrazo));

            return map;

        }).collect(Collectors.toList());

        dashboard.put("prazosProximosLista", prazosProximosLista);
        return Response.ok(dashboard).build();
    }
}
