package com.print3dmanager.erp.order.service;

import com.print3dmanager.erp.client.model.Client;
import com.print3dmanager.erp.client.repository.ClientRepository;
import com.print3dmanager.erp.common.dto.PageResponse;
import com.print3dmanager.erp.common.exception.BusinessException;
import com.print3dmanager.erp.common.exception.ResourceNotFoundException;
import com.print3dmanager.erp.order.dto.OrderCreateRequest;
import com.print3dmanager.erp.order.dto.OrderResponse;
import com.print3dmanager.erp.order.dto.OrderUpdateRequest;
import com.print3dmanager.erp.order.mapper.OrderMapper;
import com.print3dmanager.erp.order.model.Order;
import com.print3dmanager.erp.order.model.OrderStatus;
import com.print3dmanager.erp.order.repository.OrderRepository;
import com.print3dmanager.erp.order.repository.OrderSpecifications;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Regras de pedidos: ciclo de vida PENDENTE → EM_PRODUCAO → CONCLUIDO → ENTREGUE
 * (CANCELADO a partir de PENDENTE ou EM_PRODUCAO) e edição só enquanto em aberto.
 */
@Service
@RequiredArgsConstructor
public class OrderService {

    static final Map<OrderStatus, Set<OrderStatus>> TRANSICOES = Map.of(
            OrderStatus.PENDENTE, Set.of(OrderStatus.EM_PRODUCAO, OrderStatus.CANCELADO),
            OrderStatus.EM_PRODUCAO, Set.of(OrderStatus.CONCLUIDO, OrderStatus.CANCELADO),
            OrderStatus.CONCLUIDO, Set.of(OrderStatus.ENTREGUE),
            OrderStatus.ENTREGUE, Set.of(),
            OrderStatus.CANCELADO, Set.of());

    private final OrderRepository orderRepository;
    private final ClientRepository clientRepository;
    private final OrderMapper orderMapper;

    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> listar(String busca, OrderStatus status, Long clienteId,
                                              Pageable pageable) {
        return PageResponse.de(
                orderRepository.findAll(OrderSpecifications.comFiltros(busca, status, clienteId), pageable)
                        .map(orderMapper::toResponse));
    }

    @Transactional(readOnly = true)
    public OrderResponse buscarPorId(Long id) {
        return orderMapper.toResponse(obterPedido(id));
    }

    @Transactional
    public OrderResponse criar(OrderCreateRequest request) {
        Order pedido = new Order();
        pedido.setCliente(obterCliente(request.clienteId()));
        pedido.setDescricao(request.descricao().trim());
        pedido.setMaterial(request.material().trim().toUpperCase());
        pedido.setPesoGramas(request.pesoGramas());
        pedido.setValor(request.valor());
        pedido.setPrazo(request.prazo());
        return orderMapper.toResponse(orderRepository.save(pedido));
    }

    @Transactional
    public OrderResponse atualizar(Long id, OrderUpdateRequest request) {
        Order pedido = obterPedido(id);
        if (pedido.getStatus() != OrderStatus.PENDENTE && pedido.getStatus() != OrderStatus.EM_PRODUCAO) {
            throw new BusinessException(
                    "Pedido %s não pode ser editado.".formatted(pedido.getStatus()));
        }
        pedido.setCliente(obterCliente(request.clienteId()));
        pedido.setDescricao(request.descricao().trim());
        pedido.setMaterial(request.material().trim().toUpperCase());
        pedido.setPesoGramas(request.pesoGramas());
        pedido.setValor(request.valor());
        pedido.setPrazo(request.prazo());
        return orderMapper.toResponse(pedido);
    }

    @Transactional
    public OrderResponse alterarStatus(Long id, OrderStatus novoStatus) {
        Order pedido = obterPedido(id);
        if (!TRANSICOES.get(pedido.getStatus()).contains(novoStatus)) {
            throw new BusinessException("Transição de status inválida: %s → %s."
                    .formatted(pedido.getStatus(), novoStatus));
        }
        pedido.setStatus(novoStatus);
        return orderMapper.toResponse(pedido);
    }

    @Transactional
    public void excluir(Long id) {
        Order pedido = obterPedido(id);
        if (pedido.getStatus() != OrderStatus.PENDENTE && pedido.getStatus() != OrderStatus.CANCELADO) {
            throw new BusinessException(
                    "Somente pedidos PENDENTES ou CANCELADOS podem ser excluídos.");
        }
        orderRepository.delete(pedido);
    }

    private Client obterCliente(Long id) {
        return clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", id));
    }

    private Order obterPedido(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido", id));
    }
}
