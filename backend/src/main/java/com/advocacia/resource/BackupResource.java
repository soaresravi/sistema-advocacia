package com.advocacia.resource;

import com.advocacia.service.*;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;

import org.eclipse.microprofile.jwt.JsonWebToken;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Path("/backup")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("user")

public class BackupResource {
    
    @Inject
    JsonWebToken jwt;

    @Inject
    BackupService backupService;

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

    private Long getUserId() {
        return Long.parseLong(jwt.getSubject());
    }

    @GET
    @Path("/download")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)

    public Response downloadBackup() {

        try {
            byte[] backup = backupService.gerarBackup(getUserId());
            String filename = "backup_usuario_" + getUserId() + "_" + System.currentTimeMillis() + ".zip";
            logService.registrar(getUserId(), "BACKUP_DOWNLOAD", "Sistema", null, "Baixou backup do sistema", getClientIp(), getUserAgent());
            return Response.ok(backup).header("Content-Disposition", "attachment; filename=\"" + filename + "\"").header("Content-Type", "application/zip").build();
        } catch (Exception e) {
            return Response.status(500).entity(Map.of("error", "Erro ao gerar backup: " + e.getMessage())).build();
        }

    }

    @POST
    @Path("/restaurar")
    @Consumes(MediaType.MULTIPART_FORM_DATA)

    public Response restaurarBackup(@RestForm("file") FileUpload file) {

        try {
            byte[] conteudo = file.filePath().toFile().toURI().toURL().openStream().readAllBytes();
            Map<String, Object> resultado = backupService.restaurarBackup(conteudo, getUserId());
            logService.registrar(getUserId(), "BACKUP_RESTORE", "Sistema", null, "Restaurou backup do sistema", getClientIp(), getUserAgent());
            return Response.ok(resultado).build();
        } catch (Exception e) {
            return Response.status(500).entity(Map.of("error", "Erro ao restaurar backup: " + e.getMessage())).build();
        }

    }

    @GET
    @Path("/listar")

    public Response listarBackups() {

        try {
            List<Map<String, Object>> backups = backupService.listarBackups(getUserId());
            logService.registrar(getUserId(), "BACKUP_LIST", "Sistema", null, "Listou backups disponíveis", getClientIp(), getUserAgent());
            return Response.ok(Map.of("backups", backups)).build();
        } catch (Exception e) {
            return Response.status(500).entity(Map.of("error", e.getMessage())).build();
        }

    }

    @DELETE
    @Path("/limpar")

    public Response limparBackups(@QueryParam("dias") @DefaultValue("30") int dias) {

        try {
            backupService.limparBackupsAntigos(getUserId(), dias);
            logService.registrar(getUserId(), "BACKUP_CLEANUP", "Sistema", null, "Removeu backups com mais de " + dias + " dias", getClientIp(), getUserAgent());
            return Response.ok(Map.of("message", "Backups antigos removidos")).build();
        } catch (Exception e) {
            return Response.status(500).entity(Map.of("error", e.getMessage())).build();
        }

    }

    @GET
    @Path("/exportar/{entidade}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)

    public Response exportarCSV(@PathParam("entidade") String entidade, @QueryParam("formato") @DefaultValue("csv") String formato) {

        try {

            Long userId = getUserId();
            String csvData = backupService.gerarCSV(userId, entidade);
            String filename = entidade + "_" + LocalDate.now() + ".csv";

            logService.registrar(userId, "EXPORT", "CSV", null, "Exportou dados de " + entidade + " para CSV", getClientIp(), getUserAgent());
            return Response.ok(csvData).header("Content-Disposition", "attachment; filename=\"" + filename + "\"").header("Content-Type", "text/csv; charset=UTF-8").build();
        
        } catch (Exception e) {
            return Response.status(500).entity(Map.of("error", e.getMessage())).build();
        }
        
    }

}
