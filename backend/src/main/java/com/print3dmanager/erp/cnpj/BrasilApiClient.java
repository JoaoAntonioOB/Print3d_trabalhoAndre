package com.print3dmanager.erp.cnpj;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.print3dmanager.erp.common.exception.ExternalServiceException;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/** Cliente HTTP da BrasilAPI: https://brasilapi.com.br/api/cnpj/v1/{cnpj} */
public class BrasilApiClient {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CnpjPayload(
            String cnpj,
            @JsonProperty("razao_social") String razaoSocial,
            @JsonProperty("nome_fantasia") String nomeFantasia,
            String email,
            @JsonProperty("ddd_telefone_1") String telefone,
            @JsonProperty("descricao_situacao_cadastral") String situacao,
            String cep,
            String logradouro,
            String numero,
            String complemento,
            String bairro,
            String municipio,
            String uf
    ) {
    }

    private final RestClient restClient;

    public BrasilApiClient(RestClient restClient) {
        this.restClient = restClient;
    }

    /**
     * @return o payload, ou {@code null} se a empresa não existir (404/400 do provedor).
     * @throws ExternalServiceException provedor fora do ar, limite de requisições (429) ou timeout.
     */
    public CnpjPayload consultar(String cnpjSomenteDigitos) {
        try {
            return restClient.get()
                    .uri("/{cnpj}", cnpjSomenteDigitos)
                    .retrieve()
                    .body(CnpjPayload.class);
        } catch (HttpClientErrorException e) {
            int status = e.getStatusCode().value();
            if (status == 404 || status == 400) {
                return null;
            }
            throw indisponivel(e);
        } catch (RestClientException e) {
            // Não loga o CNPJ nem a resposta: evita dado de cliente em log.
            throw indisponivel(e);
        }
    }

    private static ExternalServiceException indisponivel(Throwable cause) {
        return new ExternalServiceException(
                "Serviço de consulta de CNPJ indisponível, preencha manualmente.", cause);
    }
}
