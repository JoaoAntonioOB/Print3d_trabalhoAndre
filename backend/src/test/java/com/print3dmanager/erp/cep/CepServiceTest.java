package com.print3dmanager.erp.cep;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.print3dmanager.erp.cep.dto.CepResponse;
import com.print3dmanager.erp.common.exception.BusinessException;
import com.print3dmanager.erp.common.exception.ExternalServiceException;
import com.print3dmanager.erp.common.exception.ResourceNotFoundException;
import java.io.IOException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

/** A ViaCEP real nunca é chamada: o HTTP é simulado com MockRestServiceServer. */
class CepServiceTest {

    private static final String BASE = "https://viacep.test/ws";

    private MockRestServiceServer server;
    private CepService service;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        service = new CepService(new ViaCepClient(builder.baseUrl(BASE).build()));
    }

    @Test
    @DisplayName("CEP válido devolve o endereço enxuto")
    void cepValido() {
        server.expect(requestTo(BASE + "/01001000/json/"))
                .andRespond(withSuccess("""
                        {"cep":"01001-000","logradouro":"Praça da Sé","complemento":"lado ímpar",
                         "bairro":"Sé","localidade":"São Paulo","uf":"SP","ibge":"3550308"}
                        """, MediaType.APPLICATION_JSON));

        CepResponse r = service.buscar("01001000");

        assertThat(r).isEqualTo(new CepResponse("01001-000", "Praça da Sé", "Sé", "São Paulo", "SP"));
    }

    @Test
    @DisplayName("aceita CEP com máscara")
    void cepComMascara() {
        server.expect(requestTo(BASE + "/01001000/json/"))
                .andRespond(withSuccess("""
                        {"cep":"01001-000","logradouro":"Praça da Sé","bairro":"Sé",
                         "localidade":"São Paulo","uf":"SP"}
                        """, MediaType.APPLICATION_JSON));

        assertThat(service.buscar("01001-000").cidade()).isEqualTo("São Paulo");
    }

    @Test
    @DisplayName("CEP malformado é rejeitado sem chamar a ViaCEP")
    void cepMalformado() {
        assertThatThrownBy(() -> service.buscar("123")).isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> service.buscar("abcdefgh")).isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> service.buscar(null)).isInstanceOf(BusinessException.class);
        server.verify();
    }

    @Test
    @DisplayName("CEP inexistente (200 com erro:true) vira 404 com mensagem clara")
    void cepInexistente() {
        server.expect(requestTo(BASE + "/99999999/json/"))
                .andRespond(withSuccess("{\"erro\": true}", MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> service.buscar("99999999"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("CEP não encontrado");
    }

    @Test
    @DisplayName("ViaCEP com erro 5xx vira serviço indisponível")
    void viaCepFora() {
        server.expect(requestTo(BASE + "/01001000/json/")).andRespond(withServerError());

        assertThatThrownBy(() -> service.buscar("01001000"))
                .isInstanceOf(ExternalServiceException.class)
                .hasMessageContaining("indisponível");
    }

    @Test
    @DisplayName("falha de conexão/timeout vira serviço indisponível")
    void timeout() {
        server.expect(requestTo(BASE + "/01001000/json/"))
                .andRespond(request -> {
                    throw new IOException("timeout");
                });

        assertThatThrownBy(() -> service.buscar("01001000"))
                .isInstanceOf(ExternalServiceException.class);
    }
}
