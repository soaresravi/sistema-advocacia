package com.advocacia.resource;

import com.advocacia.entity.AtividadeLog;
import com.advocacia.service.AtividadeLogService;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Path("/logs")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("user")

public class AtividadeLogResource {
    
    @Inject
    JsonWebToken jwt;

    @Inject
    AtividadeLogService logService;

    private Long getUserId() {
        return Long.parseLong(jwt.getSubject());
    }

    @GET

    public Response listar(@QueryParam("page") @DefaultValue("0") int page, @QueryParam("size") @DefaultValue("20") int size) {

        List<AtividadeLog> logs = logService.listar(getUserId(), page, size);
        long total = logService.count(getUserId());

        Map<String, Object> result = new HashMap<>();

        result.put("content", logs);
        result.put("page", page);
        result.put("size", size);
        result.put("total", total);
        result.put("totalPages", (int) Math.ceil((double) total / size));

        return Response.ok(result).build();

    }

    @DELETE
    @Path("/limpar")

    public Response limparLogs(@QueryParam("dias") @DefaultValue("30") int dias) {
        logService.limparLogsAntigos(getUserId(), dias);
        return Response.ok(Map.of("message", "Logs com mais de \" + dias + \" dias foram removidos")).build();
    }
}
