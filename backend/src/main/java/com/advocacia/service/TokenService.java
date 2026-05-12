package com.advocacia.service;

import io.smallrye.jwt.build.Jwt;
import io.smallrye.jwt.auth.principal.JWTParser;
import io.smallrye.jwt.auth.principal.ParseException;
import org.eclipse.microprofile.jwt.JsonWebToken;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.Duration;
import java.util.Set;

@ApplicationScoped

public class TokenService {
    
    @Inject
    JWTParser jwtParser;

    public String gerarToken(Long userId, String email, String nome) {
        return Jwt.issuer("sistema-advocacia").subject(userId.toString()).upn(email).claim("nome", nome).groups(Set.of("user")).expiresIn(Duration.ofDays(1)).sign();
    }

    public JsonWebToken validarToken(String token) throws ParseException {
        return jwtParser.parse(token);
    }

    public Long getUserIdFromToken(String token) {

        try {
            JsonWebToken jwt = validarToken(token);
            return Long.parseLong(jwt.getSubject());
        } catch (ParseException error) {
            return null;
        }

    }

    public String getEmailFromToken(String token) {

        try {
            JsonWebToken jwt = validarToken(token);
            return jwt.getName();
        } catch (ParseException error) {
            return null;
        }
        
    }

}
