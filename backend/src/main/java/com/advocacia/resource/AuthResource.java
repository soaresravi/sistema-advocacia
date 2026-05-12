package com.advocacia.resource;

import com.advocacia.dto.LoginRequest;
import com.advocacia.dto.LoginResponse;
import com.advocacia.dto.RegisterRequest;

import com.advocacia.entity.User;

import com.advocacia.service.HashService;
import com.advocacia.service.TokenService;
import com.advocacia.util.ErroResponse;

import jakarta.annotation.security.PermitAll;
import jakarta.annotation.security.RolesAllowed;

import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;

import org.eclipse.microprofile.jwt.JsonWebToken;
import java.time.LocalDateTime;

@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)

public class AuthResource {
    
    @Inject
    HashService hashService;

    @Inject
    TokenService tokenService;

    @Inject
    JsonWebToken jwt;

    @Context
    UriInfo uriInfo;

    @POST
    @Transactional
    @PermitAll  
    @Path("/register")

    public Response register(@Valid RegisterRequest request) {

        User existingUser = User.find("email", request.email).firstResult();

        if (existingUser != null) {
            return Response.status(Response.Status.CONFLICT).entity(new ErroResponse(409, "Conflito", "Email já cadastrado: " + request.email, uriInfo.getPath())).build();
        }

        User user = new User();

        user.nome = request.nome;
        user.email = request.email;
        user.nomeEscritorio = request.nomeEscritorio;
        user.senha = hashService.gerarHash(request.senha);
        user.createdAt = LocalDateTime.now();
        user.updatedAt = LocalDateTime.now();

        user.persist();

        String token = tokenService.gerarToken(user.id, user.email, user.nome);
        return Response.status(Response.Status.CREATED).entity(new LoginResponse(token, user.id, user.nome, user.email)).build();

    }

    @POST
    @PermitAll
    @Path("/login")

    public Response login(@Valid LoginRequest request) {

        User user = User.find("email", request.email).firstResult();

        if (user == null || !hashService.verificarSenha(request.senha, user.senha)) {
            return Response.status(Response.Status.UNAUTHORIZED).entity(new ErroResponse(401, "Não autorizado", "Credenciais inválidas", uriInfo.getPath())).build();
        }

        String token = tokenService.gerarToken(user.id, user.email, user.nome);
        return Response.ok(new LoginResponse(token, user.id, user.nome, user.email)).build();

    }

    @GET
    @RolesAllowed("user")
    @Path("/me")

    public Response getCurrentUser() {

        String email = jwt.getName();
        User user = User.find("email", email).firstResult();

        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        return Response.ok(new LoginResponse(null, user.id, user.nome, user.email)).build();
    }
}
