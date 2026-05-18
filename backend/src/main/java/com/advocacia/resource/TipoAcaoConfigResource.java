package com.advocacia.resource;

import com.advocacia.dto.TipoAcaoDTO;
import com.advocacia.enums.TipoAcao;
import com.advocacia.entity.TipoAcaoPersonalizado;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import org.eclipse.microprofile.jwt.JsonWebToken;
import java.util.*;

@Path("/config/tipos-acao")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("user")

public class TipoAcaoConfigResource {
    
    @Inject
    JsonWebToken jwt;

    private Long getUserId() {
        return Long.parseLong(jwt.getSubject());
    }

    @GET
    public Response listarTodos() {

        List<TipoAcaoDTO> tipos = new ArrayList<>();

        for (TipoAcao ta : TipoAcao.values()) {
            TipoAcaoDTO dto = new TipoAcaoDTO();
            dto.nome = ta.getDescricao();
            dto.isPadrao = true;
            tipos.add(dto);
        }

        List<TipoAcaoPersonalizado> personalizados = TipoAcaoPersonalizado.list("userId", getUserId());

        for (TipoAcaoPersonalizado tp : personalizados) {
            TipoAcaoDTO dto = new TipoAcaoDTO();
            dto.nome = tp.nome;
            dto.isPadrao = false;
            tipos.add(dto);
        }

        tipos.sort(Comparator.comparing(t -> t.nome));
        return Response.ok(tipos).build();

    }

    @POST
    @Transactional

    public Response criar(Map<String, String> request) {

        String nome = request.get("nome");

        if (nome == null || nome.trim().isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", "Nome é obrigatório")).build();
        }

        for (TipoAcao ta : TipoAcao.values()) {

            if (ta.getDescricao().equalsIgnoreCase(nome)) {
                return Response.status(Response.Status.CONFLICT).entity(Map.of("error", "Este tipo de ação já existe no sistema padrão")).build();
            }

        }

        TipoAcaoPersonalizado existente = TipoAcaoPersonalizado.find("nome = ?1 and userId = ?2", nome, getUserId()).firstResult();

        if (existente != null) {
            return Response.status(Response.Status.CONFLICT).entity(Map.of("error", "Você já possui este tipo de ação cadastrado")).build();
        }

        TipoAcaoPersonalizado novo = new TipoAcaoPersonalizado();

        novo.nome = nome;
        novo.userId = getUserId();
        
        novo.persist();
        return Response.status(Response.Status.CREATED).entity(Map.of("id", novo.id, "nome", novo.nome, "isPadrao", false)).build();
    
    }

    @DELETE
    @Path("/{id}")
    @Transactional

    public Response deletar(@PathParam("id") Long id) {
        long deleted = TipoAcaoPersonalizado.delete("id = ?1 and userId = ?2", id, getUserId());
        if (deleted == 0) return Response.status(404).build();
        return Response.noContent().build();
    }
}
