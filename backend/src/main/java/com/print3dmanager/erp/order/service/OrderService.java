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
import com.print3dmanager.erp.filament.model.Filament;
import com.print3dmanager.erp.filament.service.FilamentService;
import java.math.BigDecimal;
import java.time.LocalDate;
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
    private final FilamentService filamentService;

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
        preencher(pedido, request.clienteId(), request.descricao(), request.material(),
                request.pesoGramas(), request.valor(), request.prazo(), request.filamentoId());
        return orderMapper.toResponse(orderRepository.save(pedido));
    }

    @Transactional
    public OrderResponse atualizar(Long id, OrderUpdateRequest request) {
        Order pedido = obterPedido(id);
        if (pedido.getStatus() != OrderStatus.PENDENTE && pedido.getStatus() != OrderStatus.EM_PRODUCAO) {
            throw new BusinessException(
                    "Pedido %s não pode ser editado.".formatted(pedido.getStatus()));
        }
        // Em produção o estoque já foi descontado: devolve o que saiu e baixa de novo com os dados novos.
        boolean emProducao = pedido.getStatus() == OrderStatus.EM_PRODUCAO;
        if (emProducao) {
            estornarSeDescontado(pedido);
        }
        preencher(pedido, request.clienteId(), request.descricao(), request.material(),
                request.pesoGramas(), request.valor(), request.prazo(), request.filamentoId());
        if (emProducao) {
            baixarSeHouverFilamento(pedido);
        }
        return orderMapper.toResponse(pedido);
    }

    @Transactional
    public OrderResponse alterarStatus(Long id, OrderStatus novoStatus) {
        Order pedido = obterPedido(id);
        if (!TRANSICOES.get(pedido.getStatus()).contains(novoStatus)) {
            throw new BusinessException("Transição de status inválida: %s → %s."
                    .formatted(pedido.getStatus(), novoStatus));
        }
        if (pedido.getStatus() == OrderStatus.PENDENTE && novoStatus == OrderStatus.EM_PRODUCAO) {
            baixarSeHouverFilamento(pedido);
        } else if (pedido.getStatus() == OrderStatus.EM_PRODUCAO && novoStatus == OrderStatus.CANCELADO) {
            estornarSeDescontado(pedido);
        }
        pedido.setStatus(novoStatus);
        return orderMapper.toResponse(pedido);
    }

    private void preencher(Order pedido, Long clienteId, String descricao, String material,
                           BigDecimal pesoGramas, BigDecimal valor, LocalDate prazo, Long filamentoId) {
        pedido.setCliente(obterCliente(clienteId));
        pedido.setDescricao(descricao.trim());
        if (filamentoId != null) {
            Filament filamento = filamentService.obter(filamentoId);
            pedido.setFilamento(filamento);
            pedido.setMaterial(filamento.getMaterial());
        } else {
            pedido.setFilamento(null);
            pedido.setMaterial(material.trim().toUpperCase());
        }
        pedido.setPesoGramas(pesoGramas);
        pedido.setValor(valor);
        pedido.setPrazo(prazo);
    }

    private void baixarSeHouverFilamento(Order pedido) {
        if (pedido.getFilamento() != null) {
            filamentService.baixar(pedido.getFilamento().getId(), pedido.getPesoGramas(), pedido.getId());
            pedido.setGramasDescontadas(pedido.getPesoGramas());
        }
    }

    private void estornarSeDescontado(Order pedido) {
        if (pedido.getGramasDescontadas() != null && pedido.getFilamento() != null) {
            filamentService.estornar(pedido.getFilamento().getId(), pedido.getGramasDescontadas(), pedido.getId());
        }
        pedido.setGramasDescontadas(null);
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
