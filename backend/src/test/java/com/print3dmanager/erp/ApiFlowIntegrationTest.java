package com.print3dmanager.erp;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.print3dmanager.erp.testsupport.AbstractApiIntegrationTest;
import java.time.LocalDate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

/** Fluxo completo pela API: login, cliente, pedido, dashboard e regras de erro. */
class ApiFlowIntegrationTest extends AbstractApiIntegrationTest {

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
                .andExpect(jsonPath("$.ultimosPedidos[0].id").value(pedidoId));
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
}
