package com.advocacia.resource;

import com.advocacia.service.DocumentoService;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;

import jakarta.ws.rs.*;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;

import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import org.eclipse.microprofile.jwt.JsonWebToken;
import java.io.IOException;
import java.nio.file.Files;
import java.util.Map;

@Path("/documentos")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed("user")

public class EspacoResource {
    
    @Inject
    JsonWebToken jwt;
    
    @Inject
    DocumentoService documentoService;
    
    private Long getUserId() {
        return Long.parseLong(jwt.getSubject());
    }
    
    @GET
    @Path("/usuario/espaco")
    
    public Response getEspacoUsuario() {
    
        Long userId = getUserId();
        var userDir = documentoService.getUserUploadDir(userId);
        long espacoUsado = 0;
    
        try {
            
            if (Files.exists(userDir)) {
                
                espacoUsado = Files.walk(userDir).filter(Files::isRegularFile).mapToLong(path -> {
                    
                    try {
                        return Files.size(path);
                    } catch (IOException e) {
                        return 0;
                    }

                }).sum();
            
            }
        
        } catch (IOException e) {
            return Response.status(500).entity(Map.of("error", "Erro ao calcular espaço: " + e.getMessage())).build();
        }
    
        long espacoTotal = 50L * 1024 * 1024 * 1024;
        long espacoLivre = espacoTotal - espacoUsado; 
        int percentualUsado = espacoTotal > 0 ? (int) (espacoUsado * 100 / espacoTotal) : 0;
    
        return Response.ok(Map.of("total", espacoTotal,"usado", espacoUsado,"livre", espacoLivre, "percentualUsado", percentualUsado)).build();
    
    }
}