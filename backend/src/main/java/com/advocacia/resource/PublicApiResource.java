package com.advocacia.resource;

import com.advocacia.dto.CepResponse;
import com.advocacia.service.ExternalApiService;
import jakarta.annotation.security.PermitAll;
import jakarta.inject.Inject;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.Map;

@Path("/public")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@PermitAll

public class PublicApiResource {
    
    @Inject
    ExternalApiService externalApiService;

    @GET
    @Path("/cep/{cep}")

    public Response buscarCep(@PathParam("cep") String cep) {

        CepResponse result = externalApiService.buscarCep(cep);

        if (result.isErro()) {
            return Response.status(Response.Status.NOT_FOUND).entity(Map.of("erro", true, "mensagem", "CEP não encontrado")).build();
        }

        return Response.ok(result).build();

    }

    @GET
    @Path("/cidades/{uf}")

    public Response buscarCidades(@PathParam("uf") String uf) {

        List<String> cidades = externalApiService.buscarCidades(uf);

        if (cidades.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND).entity(Map.of("erro", true, "mensagem", "UF não encontrada ou sem cidades")).build();
        }

        return Response.ok(Map.of("uf", uf.toUpperCase(), "cidades", cidades, "total", cidades.size())).build();

    }

    @GET
    @Path("/estados")

    public Response buscarEstados() {

        List<Map<String, String>> estados = externalApiService.buscarEstados();

        if (estados.isEmpty()) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(Map.of("erro", true, "mensagem", "Erro ao buscar estados")).build();
        }

        return Response.ok(Map.of("estados", estados, "total", estados.size())).build();

    }
}
