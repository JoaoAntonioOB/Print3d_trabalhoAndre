package com.print3dmanager.erp.dashboard.service;

import com.print3dmanager.erp.client.repository.ClientRepository;
import com.print3dmanager.erp.dashboard.dto.DashboardResumoResponse;
import com.print3dmanager.erp.order.mapper.OrderMapper;
import com.print3dmanager.erp.order.model.OrderStatus;
import com.print3dmanager.erp.order.repository.OrderRepository;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final Set<OrderStatus> ABERTOS =
            EnumSet.of(OrderStatus.PENDENTE, OrderStatus.EM_PRODUCAO);
    private static final PageRequest TOP_5 = PageRequest.of(0, 5);

    private final OrderRepository orderRepository;
    private final ClientRepository clientRepository;
    private final OrderMapper orderMapper;

    @Transactional(readOnly = true)
    public DashboardResumoResponse resumo() {
        Map<String, Long> porStatus = new LinkedHashMap<>();
        for (OrderStatus s : OrderStatus.values()) {
            porStatus.put(s.name(), 0L);
        }
        orderRepository.contarPorStatus()
                .forEach(linha -> porStatus.put(((OrderStatus) linha[0]).name(), (Long) linha[1]));

        YearMonth mes = YearMonth.now(ZoneOffset.UTC);
        var faturamento = orderRepository.somarValorNoPeriodo(OrderStatus.CANCELADO,
                mes.atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC),
                mes.plusMonths(1).atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC));

        LocalDate hoje = LocalDate.now();
        return new DashboardResumoResponse(
                clientRepository.count(),
                ABERTOS.stream().mapToLong(s -> porStatus.get(s.name())).sum(),
                faturamento,
                porStatus,
                orderRepository.countByStatusInAndPrazoBefore(ABERTOS, hoje),
                orderRepository.findByStatusInAndPrazoBeforeOrderByPrazoAsc(ABERTOS, hoje, TOP_5)
                        .stream().map(orderMapper::toResponse).toList(),
                orderRepository.findAllByOrderByCriadoEmDesc(TOP_5)
                        .stream().map(orderMapper::toResponse).toList());
    }
}
