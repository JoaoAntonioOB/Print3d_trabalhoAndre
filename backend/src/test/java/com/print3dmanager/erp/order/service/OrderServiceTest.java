package com.print3dmanager.erp.order.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.print3dmanager.erp.client.model.Client;
import com.print3dmanager.erp.client.repository.ClientRepository;
import com.print3dmanager.erp.filament.model.Filament;
import com.print3dmanager.erp.filament.service.FilamentService;
import org.mockito.InOrder;
import com.print3dmanager.erp.common.exception.BusinessException;
import com.print3dmanager.erp.order.dto.OrderUpdateRequest;
import com.print3dmanager.erp.order.mapper.OrderMapper;
import com.print3dmanager.erp.order.model.Order;
import com.print3dmanager.erp.order.model.OrderStatus;
import com.print3dmanager.erp.order.repository.OrderRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class OrderServiceTest {

    private final OrderRepository orderRepository = mock(OrderRepository.class);
    private final OrderMapper orderMapper = mock(OrderMapper.class);
    private final ClientRepository clientRepository = mock(ClientRepository.class);
    private final FilamentService filamentService = mock(FilamentService.class);
    private final OrderService service =
            new OrderService(orderRepository, clientRepository, orderMapper, filamentService);

    private Filament filamento(long id, String material) {
        Filament f = new Filament();
        f.setId(id);
        f.setNome("PLA Branco");
        f.setMaterial(material);
        when(filamentService.obter(id)).thenReturn(f);
        return f;
    }

    private Order pedidoComFilamento(OrderStatus status, Filament filamento, String peso) {
        Order pedido = pedidoCom(status);
        pedido.setId(1L);
        pedido.setFilamento(filamento);
        pedido.setPesoGramas(new BigDecimal(peso));
        return pedido;
    }

    private OrderUpdateRequest edicao(String peso, Long filamentoId) {
        return new OrderUpdateRequest(1L, "Peça", "PLA", new BigDecimal(peso), BigDecimal.TEN,
                LocalDate.now().plusDays(1), filamentoId);
    }

    @Test
    @DisplayName("PENDENTE -> EM_PRODUCAO desconta o peso do filamento")
    void descontaAoIniciarProducao() {
        Order pedido = pedidoComFilamento(OrderStatus.PENDENTE, filamento(5L, "PLA"), "120");
        service.alterarStatus(1L, OrderStatus.EM_PRODUCAO);
        verify(filamentService).baixar(5L, new BigDecimal("120"), 1L);
        assertThat(pedido.getGramasDescontadas()).isEqualByComparingTo("120");
    }

    @Test
    @DisplayName("sem filamento nada é descontado nem estornado")
    void semFilamentoNaoMexeNoEstoque() {
        pedidoCom(OrderStatus.PENDENTE);
        service.alterarStatus(1L, OrderStatus.EM_PRODUCAO);
        service.alterarStatus(1L, OrderStatus.CANCELADO);
        verifyNoInteractions(filamentService);
    }

    @Test
    @DisplayName("EM_PRODUCAO -> CANCELADO estorna o que foi descontado")
    void estornaAoCancelar() {
        Order pedido = pedidoComFilamento(OrderStatus.EM_PRODUCAO, filamento(5L, "PLA"), "120");
        pedido.setGramasDescontadas(new BigDecimal("120"));
        service.alterarStatus(1L, OrderStatus.CANCELADO);
        verify(filamentService).estornar(5L, new BigDecimal("120"), 1L);
        assertThat(pedido.getGramasDescontadas()).isNull();
    }

    @Test
    @DisplayName("PENDENTE -> CANCELADO não estorna")
    void cancelarPendenteNaoEstorna() {
        pedidoComFilamento(OrderStatus.PENDENTE, filamento(5L, "PLA"), "120");
        service.alterarStatus(1L, OrderStatus.CANCELADO);
        verify(filamentService, never()).estornar(any(), any(), any());
    }

    @Test
    @DisplayName("estoque insuficiente aborta a transição e mantém o status")
    void estoqueInsuficienteMantemStatus() {
        Order pedido = pedidoComFilamento(OrderStatus.PENDENTE, filamento(5L, "PLA"), "600");
        doThrow(new BusinessException("Estoque insuficiente de PLA Branco: disponível 500g, necessário 600g"))
                .when(filamentService).baixar(any(), any(), any());
        assertThatThrownBy(() -> service.alterarStatus(1L, OrderStatus.EM_PRODUCAO))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Estoque insuficiente");
        assertThat(pedido.getStatus()).isEqualTo(OrderStatus.PENDENTE);
        assertThat(pedido.getGramasDescontadas()).isNull();
    }

    @Test
    @DisplayName("editar pedido EM_PRODUCAO estorna o antigo e baixa o novo peso/filamento")
    void reconciliaEdicaoEmProducao() {
        Filament antigo = filamento(5L, "PLA");
        Order pedido = pedidoComFilamento(OrderStatus.EM_PRODUCAO, antigo, "120");
        pedido.setGramasDescontadas(new BigDecimal("120"));
        when(clientRepository.findById(1L)).thenReturn(Optional.of(new Client()));
        filamento(6L, "PETG");

        service.atualizar(1L, edicao("200", 6L));

        InOrder ordem = inOrder(filamentService);
        ordem.verify(filamentService).estornar(5L, new BigDecimal("120"), 1L);
        ordem.verify(filamentService).baixar(6L, new BigDecimal("200"), 1L);
        assertThat(pedido.getMaterial()).isEqualTo("PETG");
        assertThat(pedido.getGramasDescontadas()).isEqualByComparingTo("200");
    }

    @Test
    @DisplayName("editar pedido PENDENTE vincula o filamento e usa o material dele, sem mexer no estoque")
    void editarPendenteSoVincula() {
        Order pedido = pedidoCom(OrderStatus.PENDENTE);
        when(clientRepository.findById(1L)).thenReturn(Optional.of(new Client()));
        filamento(6L, "PETG");

        service.atualizar(1L, edicao("200", 6L));

        assertThat(pedido.getFilamento().getId()).isEqualTo(6L);
        assertThat(pedido.getMaterial()).isEqualTo("PETG");
        verify(filamentService, never()).baixar(any(), any(), any());
    }

    private Order pedidoCom(OrderStatus status) {
        Order pedido = new Order();
        pedido.setStatus(status);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(pedido));
        return pedido;
    }

    @ParameterizedTest
    @CsvSource({
            "PENDENTE,EM_PRODUCAO", "PENDENTE,CANCELADO",
            "EM_PRODUCAO,CONCLUIDO", "EM_PRODUCAO,CANCELADO",
            "CONCLUIDO,ENTREGUE"})
    @DisplayName("transições válidas são aceitas")
    void transicaoValida(OrderStatus de, OrderStatus para) {
        Order pedido = pedidoCom(de);
        service.alterarStatus(1L, para);
        assertThat(pedido.getStatus()).isEqualTo(para);
    }

    @ParameterizedTest
    @CsvSource({
            "PENDENTE,CONCLUIDO", "PENDENTE,ENTREGUE", "EM_PRODUCAO,PENDENTE",
            "CONCLUIDO,CANCELADO", "ENTREGUE,CANCELADO", "CANCELADO,PENDENTE"})
    @DisplayName("transições inválidas são rejeitadas e o status não muda")
    void transicaoInvalida(OrderStatus de, OrderStatus para) {
        Order pedido = pedidoCom(de);
        assertThatThrownBy(() -> service.alterarStatus(1L, para))
                .isInstanceOf(BusinessException.class);
        assertThat(pedido.getStatus()).isEqualTo(de);
    }

    @ParameterizedTest
    @CsvSource({"CONCLUIDO", "ENTREGUE", "CANCELADO"})
    @DisplayName("pedido finalizado ou cancelado não pode ser editado")
    void naoEditaFinalizado(OrderStatus status) {
        pedidoCom(status);
        var request = new OrderUpdateRequest(1L, "Peça", "PLA", BigDecimal.TEN, BigDecimal.TEN,
                LocalDate.now().plusDays(1), null);
        assertThatThrownBy(() -> service.atualizar(1L, request)).isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("só pedido PENDENTE ou CANCELADO pode ser excluído")
    void exclusaoRestrita() {
        pedidoCom(OrderStatus.EM_PRODUCAO);
        assertThatThrownBy(() -> service.excluir(1L)).isInstanceOf(BusinessException.class);
    }
}
