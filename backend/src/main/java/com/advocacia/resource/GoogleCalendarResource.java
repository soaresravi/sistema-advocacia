package com.advocacia.resource;

import com.advocacia.dto.GoogleAuthUrlResponse;
import com.advocacia.dto.GoogleTokenResponse;
import com.advocacia.entity.User;

import com.advocacia.service.GoogleCalendarService;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;

import org.eclipse.microprofile.jwt.JsonWebToken;

@Path("/auth/google")
@Produces("application/json")
@Consumes("application/json")

public class GoogleCalendarResource {
    
    @Inject
    JsonWebToken jwt;

    @Inject
    GoogleCalendarService googleService;

    @Context
    UriInfo uriInfo;

    private Long getUserId() {
        return Long.parseLong(jwt.getSubject());
    }

    @GET
    @Path("/auth-url")
    @RolesAllowed("user")

    public Response getAuthUrl() {
        String url = googleService.gerarAuthUrl(getUserId().toString());
        return Response.ok(new GoogleAuthUrlResponse(url)).build();
    }

    @GET
    @Path("/callback")
    @Transactional

    public Response callback(@QueryParam("code") String code, @QueryParam("state") String state) {

        try {

            if (code == null || state == null) {
                return Response.seeOther(java.net.URI.create("http://localhost:3000/configuracoes?google=error")).build();
            }

            String[] tokens = googleService.trocarCodigoPorToken(code);
            String refreshToken = tokens[0];

            Long userId = Long.parseLong(state);
            User user = User.findById(userId);

            if (user != null) {
                user.googleRefreshToken = refreshToken;
                user.googleEmail = user.email; 
                user.persist();
            }

            return Response.seeOther(java.net.URI.create("http://localhost:3000/configuracoes?google=success")).build();

        } catch (Exception e) {
            return Response.seeOther(java.net.URI.create("http://localhost:3000/configuracoes?google=error")).build();
        }

    }

    @GET
    @Path("/status")
    @RolesAllowed("user")

    public Response getStatus() {
        User user = User.findById(getUserId());
        boolean connected = user.googleRefreshToken != null && !user.googleRefreshToken.isEmpty();
        return Response.ok(new GoogleTokenResponse(connected, user.googleEmail)).build();
    }

    @DELETE
    @Path("/disconnect")
    @RolesAllowed("user")
    @Transactional

    public Response disconnect() {
        User user = User.findById(getUserId());
        user.googleRefreshToken = null;
        user.googleEmail = null;
        user.persist();
        return Response.noContent().build();
    }
}
