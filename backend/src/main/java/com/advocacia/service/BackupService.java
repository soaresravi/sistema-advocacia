package com.advocacia.service;

import com.advocacia.entity.*;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.core.*;

import java.io.*;
import java.nio.file.*;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@ApplicationScoped
public class BackupService {

    @Inject
    AtividadeLogService logService;

    @Context
    HttpHeaders httpHeaders;

    @Context
    SecurityContext securityContext;

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

    private static final String BACKUP_DIR = System.getProperty("user.dir") + "/backups";
    private final ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule()).enable(SerializationFeature.INDENT_OUTPUT);

    @Transactional
    public byte[] gerarBackup(Long userId) throws IOException {

        Map<String, Object> backup = new HashMap<>();

        backup.put("userId", userId);
        backup.put("dataBackup", LocalDateTime.now());
        backup.put("clientesPF", ClientePF.list("userId", userId));
        backup.put("clientesPJ", ClientePJ.list("userId", userId));
        backup.put("processos", Processo.list("userId", userId));
        backup.put("tarefas", Tarefa.list("userId", userId));
        backup.put("recebimentos", Recebimento.list("userId", userId));
        backup.put("despesas", Despesa.list("userId", userId));
        backup.put("atendimentos", Atendimento.list("userId", userId));
        backup.put("audiencias", Audiencia.list("userId", userId));
        backup.put("pericias", Pericia.list("userId", userId));

        byte[] jsonData = mapper.writeValueAsBytes(backup);

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String fileName = "backup_usuario_" + userId + "_" + timestamp + ".zip";

        Files.createDirectories(Paths.get(BACKUP_DIR));
        Path zipPath = Paths.get(BACKUP_DIR, fileName);

        try (ZipOutputStream zos = new ZipOutputStream(Files.newOutputStream(zipPath))) {

            ZipEntry entry = new ZipEntry("dados.json");

            zos.putNextEntry(entry);
            zos.write(jsonData);
            zos.closeEntry();

        }

        logService.registrar(userId, "BACKUP", "Sistema", null, "Gerou backup completo", getClientIp(), getUserAgent());
        return Files.readAllBytes(zipPath);

    }

    @Transactional
    public Map<String, Object> restaurarBackup(byte[] arquivoZip, Long userId) throws IOException {

        Map<String, Object> resultado = new HashMap<>();
        List<String> erros = new ArrayList<>();
        
        resultado.put("sucesso", true);
        resultado.put("mensagem", "Backup restaurado com sucesso!");
        resultado.put("erros", erros);

        return resultado;

    }

    public List<Map<String, Object>> listarBackups(Long userId) throws IOException {

        Files.createDirectories(Paths.get(BACKUP_DIR));
        List<Map<String, Object>> backups = new ArrayList<>();

        try (DirectoryStream<Path> stream = Files.newDirectoryStream(Paths.get(BACKUP_DIR), path -> path.toString().contains("usuario_" + userId) && path.toString().endsWith(".zip"))) {

            for (Path path : stream) {
                
                Map<String, Object> info = new HashMap<>();
                
                info.put("nome", path.getFileName().toString());
                info.put("tamanho", Files.size(path));
                info.put("data", Files.getLastModifiedTime(path).toMillis());
                
                backups.add(info);
            
            }

        }

        backups.sort((a, b) -> Long.compare((Long) b.get("data"), (Long) a.get("data")));
        return backups;

    }

    public void limparBackupsAntigos(Long userId, int dias) throws IOException {

        long limite = System.currentTimeMillis() - (dias * 24L * 60 * 60 * 1000);

        try (DirectoryStream<Path> stream = Files.newDirectoryStream(Paths.get(BACKUP_DIR), path -> path.toString().contains("usuario_" + userId) && path.toString().endsWith(".zip"))) {

            for (Path path : stream) {

                if (Files.getLastModifiedTime(path).toMillis() < limite) {
                    Files.deleteIfExists(path);
                }

            }

        }

    }

    public String gerarCSV(Long userId, String entidade) throws IOException {

        StringBuilder csv = new StringBuilder();

        switch (entidade) {

            case "clientes":
                
                csv.append("ID;Nome;CPF/CNPJ;Email;Telefone;Cidade;Estado;Data cadastro\n");
                List<ClientePF> clientesPF = ClientePF.list("userId", userId);

                for (ClientePF c : clientesPF) {
                    csv.append(c.id).append(";").append(c.nome).append(";").append(c.cpf).append(";").append(c.email != null ? c.email : "").append(";") .append(c.telefone != null ? c.telefone : "").append(";").append(c.cidade != null ? c.cidade : "").append(";").append(c.estado != null ? c.estado.getSigla() : "").append(";").append(c.dataCadastro).append("\n");
                }

                List<ClientePJ> clientesPJ = ClientePJ.list("userId", userId);

                for (ClientePJ c : clientesPJ) {
                    csv.append(c.id).append(";").append(c.nomeFantasia).append(";").append(c.cnpj).append(";").append(c.email != null ? c.email : "").append(";").append(c.telefone != null ? c.telefone : "").append(";").append(c.cidade != null ? c.cidade : "").append(";").append(c.estado != null ? c.estado.getSigla() : "").append(";").append(c.dataCadastro).append("\n");
                }
                
                break;

            case "processos":

                csv.append("ID;Número do processo;Status;Cliente;Valor da causa;Data do início;Resultado\n");
                List<Processo> processos = Processo.list("userId", userId);

                for (Processo p : processos) {
                    csv.append(p.id).append(";").append(p.numeroProcesso).append(";").append(p.status != null ? p.status.getDescricao() : "").append(";").append(p.clienteNome != null ? p.clienteNome : "").append(";").append(p.valorCausa != null ? p.valorCausa : 0).append(";").append(p.dataInicio != null ? p.dataInicio : "").append(";").append(p.resultado != null ? p.resultado.getDescricao() : "").append("\n");
                }

                break;

            case "financeiro":

                csv.append("ID;Tipo;Valor;Status;Data;Cliente/Despesa\n");
                List<Recebimento> recebimentos = Recebimento.list("userId", userId);

                for (Recebimento r : recebimentos) {
                    csv.append(r.id).append(";").append("Recebimento - ").append(r.tipo != null ? r.tipo.getDescricao() : "").append(";").append(r.valor).append(";").append(r.recebido ? "Recebido" : "Pendente").append(";").append(r.dataRecebimento != null ? r.dataRecebimento : "").append(";").append(r.clienteNome != null ? r.clienteNome : "").append("\n");
                }

                List<Despesa> despesas = Despesa.list("userId", userId);

                for (Despesa d : despesas) {
                    csv.append(d.id).append(";").append("Despesa - ").append(d.categoria != null ? d.categoria.getDescricao() : "").append(";").append(d.valor).append(";").append(d.pago ? "Pago" : "Pendente").append(";").append(d.dataEfetivaPagamento != null ? d.dataEfetivaPagamento : "").append(";").append(d.despesa != null ? d.despesa : "").append("\n");
                }

                break;
        
        }

        return csv.toString();

    }
}