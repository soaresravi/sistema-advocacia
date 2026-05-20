package com.advocacia.service;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.googleapis.auth.oauth2.*;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;

import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;

import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import java.util.Collections;

@ApplicationScoped

public class GoogleCalendarService {
    
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    private static final String APPLICATION_NAME = "Sistema Advocacia";
    private static final String CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

    @ConfigProperty(name = "google.client.id")
    String clientId;

    @ConfigProperty(name = "google.client.secret")
    String clientSecret;

    @ConfigProperty(name = "google.redirect.uri")
    String redirectUri;

    private GoogleAuthorizationCodeFlow createFlow() {

        GoogleClientSecrets.Details details = new GoogleClientSecrets.Details();

        details.setClientId(clientId);
        details.setClientSecret(clientSecret);
        details.setRedirectUris(Collections.singletonList(redirectUri));

        GoogleClientSecrets secrets = new GoogleClientSecrets();
        secrets.setInstalled(details);

        return new GoogleAuthorizationCodeFlow.Builder(new NetHttpTransport(), JSON_FACTORY, secrets, Collections.singletonList(CALENDAR_SCOPE)).setAccessType("offline").build();
    
    }

    public String gerarAuthUrl(String userId) {
        GoogleAuthorizationCodeFlow flow = createFlow();
        return flow.newAuthorizationUrl().setRedirectUri(redirectUri).setState(userId).set("prompt", "consent").build();
    }

    public String[] trocarCodigoPorToken(String code) throws Exception {
        GoogleAuthorizationCodeFlow flow = createFlow();
        GoogleTokenResponse tokenResponse = flow.newTokenRequest(code).setRedirectUri(redirectUri).execute();
        return new String[]{tokenResponse.getRefreshToken(), tokenResponse.getAccessToken()};
    }

    public String criarEvento(String refreshToken, String email, String titulo, String descricao, LocalDate data, String hora, Long duracaoMinutos) throws Exception {
        
        Credential credential = createCredential(refreshToken);
        Calendar service = new Calendar.Builder(new NetHttpTransport(), JSON_FACTORY, credential).setApplicationName(APPLICATION_NAME).build();
        
        LocalDateTime startDateTime = LocalDateTime.of(data, LocalTime.parse(hora));
        LocalDateTime endDateTime = startDateTime.plusMinutes(duracaoMinutos);
        
        java.time.ZonedDateTime startZoned = startDateTime.atZone(java.time.ZoneId.systemDefault());
        java.time.ZonedDateTime endZoned = endDateTime.atZone(java.time.ZoneId.systemDefault());
        
        EventDateTime start = new EventDateTime().setDateTime(new com.google.api.client.util.DateTime(startZoned.toInstant().toEpochMilli()));
        EventDateTime end = new EventDateTime().setDateTime(new com.google.api.client.util.DateTime(endZoned.toInstant().toEpochMilli()));
        Event event = new Event().setSummary(titulo).setDescription(descricao).setStart(start).setEnd(end);
        
        return service.events().insert("primary", event).execute().getId();

    }

    private Credential createCredential(String refreshToken) throws Exception { com.google.api.client.http.GenericUrl tokenServerUrl = new com.google.api.client.http.GenericUrl("https://oauth2.googleapis.com/token");
        return new Credential.Builder(com.google.api.client.auth.oauth2.BearerToken.authorizationHeaderAccessMethod()).setTransport(new NetHttpTransport()).setJsonFactory(JSON_FACTORY).setTokenServerUrl(tokenServerUrl).setClientAuthentication(new com.google.api.client.auth.oauth2.ClientParametersAuthentication(clientId, clientSecret)).build().setRefreshToken(refreshToken);
    }

    public void atualizarEvento(String refreshToken, String eventId, String titulo, String descricao, LocalDate data, String hora, Long duracaoMinutos) throws Exception {

        Credential credential = createCredential(refreshToken);
        Calendar service = new Calendar.Builder(new NetHttpTransport(), JSON_FACTORY, credential).setApplicationName(APPLICATION_NAME).build();
        Event existingEvent = service.events().get("primary", eventId).execute();

        LocalDateTime startDateTime = LocalDateTime.of(data, LocalTime.parse(hora));
        LocalDateTime endDateTime = startDateTime.plusMinutes(duracaoMinutos);

        java.time.ZonedDateTime startZoned = startDateTime.atZone(java.time.ZoneId.systemDefault());
        java.time.ZonedDateTime endZoned = endDateTime.atZone(java.time.ZoneId.systemDefault());

        EventDateTime start = new EventDateTime().setDateTime(new com.google.api.client.util.DateTime(startZoned.toInstant().toEpochMilli()));
        EventDateTime end = new EventDateTime().setDateTime(new com.google.api.client.util.DateTime(endZoned.toInstant().toEpochMilli()));

        existingEvent.setSummary(titulo);
        existingEvent.setDescription(descricao);
        existingEvent.setStart(start);
        existingEvent.setEnd(end);

        service.events().update("primary", eventId, existingEvent).execute();

    }

    public void deletarEvento(String refreshToken, String eventId) throws Exception {
        Credential credential = createCredential(refreshToken);
        Calendar service = new Calendar.Builder(new NetHttpTransport(), JSON_FACTORY, credential).setApplicationName(APPLICATION_NAME).build();
        service.events().delete("primary", eventId).execute();
    }
}
