package com.advocacia.service;

import com.advocacia.dto.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.client.Client;
import jakarta.ws.rs.client.ClientBuilder;
import jakarta.ws.rs.core.MediaType;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Map;

@ApplicationScoped

public class ExternalApiService {
    
    private static final String VIA_CEP_URL = "https://viacep.com.br/ws";
    private static final String IBGE_URL = "https://servicodados.ibge.gov.br/api/v1/localidades/estados";

    private Client client = ClientBuilder.newClient();

    public CepResponse buscarCep(String cep) {

        try {

            String url = String.format("%s/%s/json/", VIA_CEP_URL, cep.replace("-", ""));
            CepResponse response = client.target(url).request(MediaType.APPLICATION_JSON).get(CepResponse.class);

            if (response.getCep() == null) {
                response.setErro(true);
            }

            return response;

        } catch (Exception e) {
            CepResponse error = new CepResponse();
            error.setErro(true);
            return error;
        }

    }

    public List<String> buscarCidades(String uf) {

        try {

            String url = String.format("%s/%s/municipios", IBGE_URL, uf.toUpperCase());
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> response = client.target(url).request(MediaType.APPLICATION_JSON).get(List.class);

            return response.stream().map(cidade -> (String) cidade.get("nome")).sorted().collect(Collectors.toList());

        } catch (Exception e) {
            e.printStackTrace();
            return List.of();
        }

    }

    public List<java.util.Map<String, String>> buscarEstados() {

        try {

            String url = String.format("%s?orderBy=nome", IBGE_URL);

            @SuppressWarnings("unchecked")
            List<java.util.Map<String, Object>> response = client.target(url).request(MediaType.APPLICATION_JSON).get(List.class);

            return response.stream().map(estado -> {
                java.util.Map<String, String> map = new java.util.HashMap<>();
                map.put("sigla", (String) estado.get("sigla"));
                map.put("nome", (String) estado.get("nome"));
                return map;
            }).collect(Collectors.toList());

        } catch (Exception e) {
            return List.of();
        }

    }
}
