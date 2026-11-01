package com.print3dmanager.erp;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.print3dmanager.erp.testsupport.AbstractApiIntegrationTest;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.MediaType;

/** Fluxo completo pela API: login, cliente, pedido, dashboard e regras de erro. */
class ApiFlowIntegrationTest extends AbstractApiIntegrationTest {

    @Autowired
    private JdbcTemplate jdbc;

    @BeforeEach
    void limparDados() {
        jdbc.execute("TRUNCATE pedidos, clientes RESTART IDENTITY CASCADE");
    }

    @Test
    @DisplayName("login com senha errada devolve 401 no formato padrão")
    void loginInvalido() throws Exception {
        mockMvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"demo@print3d.com\",\"senha\":\"errada\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    @DisplayName("rotas protegidas sem token devolvem 401")
    void semTokenNaoAcessa() throws Exception {
        mockMvc.perform(get("/clients")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/dashboard")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("cliente com pedido não pode ser excluído (409); pedido segue o ciclo de status")
    void fluxoClientePedido() throws Exception {
        String auth = bearer(loginDemo());

        String cliente = mockMvc.perform(post("/clients").header(HttpHeaders.AUTHORIZATION, auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Maria Silva\",\"email\":\"maria@ex.com\","
                                + "\"telefone\":\"(11) 91234-5678\","
                                + "\"endereco\":{\"cep\":\"01001-000\",\"estado\":\"SP\"}}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long clienteId = objectMapper.readTree(cliente).get("id").asLong();

        String pedido = mockMvc.perform(post("/orders").header(HttpHeaders.AUTHORIZATION, auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"clienteId\":%d,\"descricao\":\"Suporte\",\"material\":\"pla\","
                                .formatted(clienteId)
                                + "\"pesoGramas\":120,\"valor\":45.90,\"prazo\":\""
                                + LocalDate.now().plusDays(5) + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDENTE"))
                .andExpect(jsonPath("$.material").value("PLA"))
                .andReturn().getResponse().getContentAsString();
        long pedidoId = objectMapper.readTree(pedido).get("id").asLong();

        mockMvc.perform(delete("/clients/" + clienteId).header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONFLICT"));

        mockMvc.perform(patch("/orders/" + pedidoId + "/status")
                        .header(HttpHeaders.AUTHORIZATION, auth)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"ENTREGUE\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BUSINESS_RULE"));

        mockMvc.perform(patch("/orders/" + pedidoId + "/status")
                        .header(HttpHeaders.AUTHORIZATION, auth)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"EM_PRODUCAO\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("EM_PRODUCAO"));

        mockMvc.perform(get("/dashboard").header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalClientes").value(1))
                .andExpect(jsonPath("$.pedidosAbertos").value(1))
                .andExpect(jsonPath("$.ultimosPedidos[0].id").value(pedidoId))
                // indicadores adicionais (um pedido PLA de 120 g e R$ 45,90, criado agora)
                .andExpect(jsonPath("$.ticketMedio").value(45.9))
                .andExpect(jsonPath("$.valorEmAberto").value(45.9))
                .andExpect(jsonPath("$.pesoTotalGramas").value(120))
                .andExpect(jsonPath("$.vendasMensais.length()").value(6))
                .andExpect(jsonPath("$.vendasMensais[5].total").value(45.9))
                .andExpect(jsonPath("$.vendasMensais[5].pedidos").value(1))
                .andExpect(jsonPath("$.vendasMensais[0].total").value(0))
                .andExpect(jsonPath("$.maioresClientes[0].nome").value("Maria Silva"))
                .andExpect(jsonPath("$.maioresClientes[0].pedidos").value(1))
                .andExpect(jsonPath("$.materiais[0].material").value("PLA"))
                .andExpect(jsonPath("$.materiais[0].pesoGramas").value(120))
                .andExpect(jsonPath("$.proximosVencimentos[0].id").value(pedidoId));
    }

    @Test
    @DisplayName("validação devolve fieldErrors")
    void validacao() throws Exception {
        String auth = bearer(loginDemo());
        mockMvc.perform(post("/orders").header(HttpHeaders.AUTHORIZATION, auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"clienteId\":1,\"descricao\":\"x\",\"material\":\"PLA\","
                                + "\"pesoGramas\":0,\"valor\":-1,\"prazo\":\"2000-01-01\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors.length()").value(3));
    }

    @Test
    @DisplayName("CEP: exige autenticação e rejeita CEP malformado com 400 (sem chamar a ViaCEP)")
    void cep() throws Exception {
        mockMvc.perform(get("/cep/01001000")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/cep/123").header(HttpHeaders.AUTHORIZATION, bearer(loginDemo())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("CEP inválido")));
    }

    @Test
    @DisplayName("cliente sem pedidos: busca encontra, exclusão devolve 204 e depois 404")
    void buscaEExclusaoDeCliente() throws Exception {
        String auth = bearer(loginDemo());
        String criado = mockMvc.perform(post("/clients").header(HttpHeaders.AUTHORIZATION, auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Zeca Teste Busca\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long id = objectMapper.readTree(criado).get("id").asLong();

        mockMvc.perform(get("/clients").param("busca", "zeca teste")
                        .header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].nome").value("Zeca Teste Busca"));

        mockMvc.perform(delete("/clients/" + id).header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/clients/" + id).header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("pedido: edita enquanto aberto, filtra por status, cancela e depois só pode excluir")
    void ciclaPedido() throws Exception {
        String auth = bearer(loginDemo());
        long clienteId = objectMapper.readTree(mockMvc.perform(post("/clients")
                        .header(HttpHeaders.AUTHORIZATION, auth).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Cliente Ciclo\"}"))
                .andReturn().getResponse().getContentAsString()).get("id").asLong();
        String corpo = "{\"clienteId\":%d,\"descricao\":\"Engrenagem\",\"material\":\"petg\","
                .formatted(clienteId) + "\"pesoGramas\":80.5,\"valor\":30,\"prazo\":\""
                + LocalDate.now().plusDays(3) + "\"}";
        long id = objectMapper.readTree(mockMvc.perform(post("/orders")
                        .header(HttpHeaders.AUTHORIZATION, auth).contentType(MediaType.APPLICATION_JSON)
                        .content(corpo))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/orders/" + id)
                        .header(HttpHeaders.AUTHORIZATION, auth).contentType(MediaType.APPLICATION_JSON)
                        .content(corpo.replace("\"valor\":30", "\"valor\":99.9")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valor").value(99.9));

        mockMvc.perform(get("/orders").param("status", "PENDENTE").param("busca", "engrenagem")
                        .header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(id));

        mockMvc.perform(patch("/orders/" + id + "/status").header(HttpHeaders.AUTHORIZATION, auth)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"CANCELADO\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/orders/" + id)
                        .header(HttpHeaders.AUTHORIZATION, auth).contentType(MediaType.APPLICATION_JSON)
                        .content(corpo))
                .andExpect(status().isBadRequest());
        mockMvc.perform(delete("/orders/" + id).header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("CNPJ: exige autenticação e rejeita CNPJ inválido com 400 (sem chamar a BrasilAPI)")
    void cnpj() throws Exception {
        mockMvc.perform(get("/cnpj/00000000000191")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/cnpj/11111111111111").header(HttpHeaders.AUTHORIZATION, bearer(loginDemo())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("CNPJ inválido")));
    }
}
