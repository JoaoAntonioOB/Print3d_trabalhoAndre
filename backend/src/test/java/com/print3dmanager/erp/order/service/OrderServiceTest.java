package com.print3dmanager.erp.order.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.print3dmanager.erp.client.repository.ClientRepository;
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
    private final OrderService service =
            new OrderService(orderRepository, mock(ClientRepository.class), orderMapper);

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
                LocalDate.now().plusDays(1));
        assertThatThrownBy(() -> service.atualizar(1L, request)).isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("só pedido PENDENTE ou CANCELADO pode ser excluído")
    void exclusaoRestrita() {
        pedidoCom(OrderStatus.EM_PRODUCAO);
        assertThatThrownBy(() -> service.excluir(1L)).isInstanceOf(BusinessException.class);
    }
}
