package com.print3dmanager.erp.cep;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.print3dmanager.erp.common.exception.ExternalServiceException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/** Cliente HTTP da ViaCEP: https://viacep.com.br/ws/{cep}/json/ */
public class ViaCepClient {

    /** Resposta crua da ViaCEP; CEP inexistente volta 200 com {@code "erro": true}. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ViaCepPayload(String cep, String logradouro, String bairro,
                                String localidade, String uf, Boolean erro) {
    }

    private final RestClient restClient;

    public ViaCepClient(RestClient restClient) {
        this.restClient = restClient;
    }

    /** @return o payload da ViaCEP, ou {@code null} se o corpo vier vazio. */
    public ViaCepPayload consultar(String cepSomenteDigitos) {
        try {
            return restClient.get()
                    .uri("/{cep}/json/", cepSomenteDigitos)
                    .retrieve()
                    .body(ViaCepPayload.class);
        } catch (RestClientException e) {
            // Não loga o CEP nem a resposta: evita dado pessoal em log.
            throw new ExternalServiceException(
                    "Serviço de CEP indisponível, preencha manualmente.", e);
        }
    }
}
