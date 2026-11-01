package com.print3dmanager.erp.cnpj;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.print3dmanager.erp.cnpj.dto.CnpjResponse;
import com.print3dmanager.erp.common.exception.BusinessException;
import com.print3dmanager.erp.common.exception.ExternalServiceException;
import com.print3dmanager.erp.common.exception.ResourceNotFoundException;
import java.io.IOException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

/** A BrasilAPI real nunca é chamada: o HTTP é simulado com MockRestServiceServer. */
class CnpjServiceTest {

    private static final String BASE = "https://brasilapi.test/api/cnpj/v1";
    private static final String CNPJ_VALIDO = "00000000000191";

    private MockRestServiceServer server;
    private CnpjService service;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        service = new CnpjService(new BrasilApiClient(builder.baseUrl(BASE).build()));
    }

    private static final String CORPO = """
            {"cnpj":"00000000000191","razao_social":"BANCO DO BRASIL SA","nome_fantasia":"DIRECAO GERAL",
             "email":null,"ddd_telefone_1":"6134939002","cep":"70040912",
             "logradouro":"SAUN QUADRA 5","numero":"SN","complemento":"%s","bairro":"ASA NORTE",
             "municipio":"BRASILIA","uf":"DF","descricao_situacao_cadastral":"ATIVA","qualquer_outro":1}
            """;

    @Test
    @DisplayName("CNPJ válido devolve dados enxutos da empresa")
    void cnpjValido() {
        server.expect(requestTo(BASE + "/" + CNPJ_VALIDO))
                .andRespond(withSuccess(CORPO.formatted("ANDAR T I"), MediaType.APPLICATION_JSON));

        CnpjResponse r = service.buscar(CNPJ_VALIDO);

        assertThat(r.cnpj()).isEqualTo("00000000000191");
        assertThat(r.razaoSocial()).isEqualTo("BANCO DO BRASIL SA");
        assertThat(r.nomeFantasia()).isEqualTo("DIRECAO GERAL");
        assertThat(r.telefone()).isEqualTo("6134939002");
        assertThat(r.situacao()).isEqualTo("ATIVA");
        assertThat(r.endereco().cep()).isEqualTo("70040912");
        assertThat(r.endereco().cidade()).isEqualTo("BRASILIA");
        assertThat(r.endereco().estado()).isEqualTo("DF");
        assertThat(r.endereco().complemento()).isEqualTo("ANDAR T I");
    }

    @Test
    @DisplayName("aceita CNPJ com máscara")
    void cnpjComMascara() {
        server.expect(requestTo(BASE + "/" + CNPJ_VALIDO))
                .andRespond(withSuccess(CORPO.formatted("X"), MediaType.APPLICATION_JSON));

        assertThat(service.buscar("00.000.000/0001-91").razaoSocial()).isEqualTo("BANCO DO BRASIL SA");
    }

    @Test
    @DisplayName("complemento longo é cortado em 80 caracteres (limite do cadastro de cliente)")
    void complementoLongo() {
        server.expect(requestTo(BASE + "/" + CNPJ_VALIDO))
                .andRespond(withSuccess(CORPO.formatted("A".repeat(200)), MediaType.APPLICATION_JSON));

        assertThat(service.buscar(CNPJ_VALIDO).endereco().complemento()).hasSize(80);
    }

    @Test
    @DisplayName("CNPJ malformado ou com dígito verificador errado é rejeitado sem chamar a API")
    void cnpjInvalido() {
        assertThatThrownBy(() -> service.buscar("123")).isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> service.buscar("abc")).isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> service.buscar(null)).isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> service.buscar("11111111111111")).isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> service.buscar("00000000000192"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("CNPJ inválido");
        server.verify();
    }

    @Test
    @DisplayName("CNPJ inexistente (404) vira 404 com mensagem clara")
    void cnpjInexistente() {
        server.expect(requestTo(BASE + "/" + CNPJ_VALIDO)).andRespond(withStatus(HttpStatus.NOT_FOUND));

        assertThatThrownBy(() -> service.buscar(CNPJ_VALIDO))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("CNPJ não encontrado");
    }

    @Test
    @DisplayName("limite de requisições (429) e erro 5xx viram serviço indisponível")
    void provedorIndisponivel() {
        server.expect(requestTo(BASE + "/" + CNPJ_VALIDO)).andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS));
        assertThatThrownBy(() -> service.buscar(CNPJ_VALIDO))
                .isInstanceOf(ExternalServiceException.class)
                .hasMessageContaining("indisponível");

        server.reset();
        server.expect(requestTo(BASE + "/" + CNPJ_VALIDO)).andRespond(withStatus(HttpStatus.BAD_GATEWAY));
        assertThatThrownBy(() -> service.buscar(CNPJ_VALIDO)).isInstanceOf(ExternalServiceException.class);
    }

    @Test
    @DisplayName("falha de conexão/timeout vira serviço indisponível")
    void timeout() {
        server.expect(requestTo(BASE + "/" + CNPJ_VALIDO)).andRespond(request -> {
            throw new IOException("timeout");
        });

        assertThatThrownBy(() -> service.buscar(CNPJ_VALIDO)).isInstanceOf(ExternalServiceException.class);
    }
}
