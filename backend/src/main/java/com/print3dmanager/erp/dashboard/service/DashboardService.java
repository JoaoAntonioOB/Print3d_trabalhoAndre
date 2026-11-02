package com.print3dmanager.erp.dashboard.service;

import com.print3dmanager.erp.client.repository.ClientRepository;
import com.print3dmanager.erp.dashboard.dto.ClienteTop;
import com.print3dmanager.erp.dashboard.dto.DashboardResumoResponse;
import com.print3dmanager.erp.dashboard.dto.FilamentoBaixo;
import com.print3dmanager.erp.dashboard.dto.MaterialUso;
import com.print3dmanager.erp.filament.repository.FilamentRepository;
import com.print3dmanager.erp.dashboard.dto.VendaMensal;
import com.print3dmanager.erp.order.dto.OrderResponse;
import com.print3dmanager.erp.order.mapper.OrderMapper;
import com.print3dmanager.erp.order.model.Order;
import com.print3dmanager.erp.order.model.OrderStatus;
import com.print3dmanager.erp.order.repository.OrderRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
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
    private static final int MESES = 6;
    private static final int DIAS_PROXIMOS_VENCIMENTOS = 7;

    private final OrderRepository orderRepository;
    private final ClientRepository clientRepository;
    private final OrderMapper orderMapper;
    private final FilamentRepository filamentRepository;

    @Transactional(readOnly = true)
    public DashboardResumoResponse resumo() {
        Map<String, Long> porStatus = new LinkedHashMap<>();
        for (OrderStatus s : OrderStatus.values()) {
            porStatus.put(s.name(), 0L);
        }
        orderRepository.contarPorStatus()
                .forEach(linha -> porStatus.put(((OrderStatus) linha[0]).name(), (Long) linha[1]));

        YearMonth mes = YearMonth.now(ZoneOffset.UTC);
        BigDecimal faturamento = orderRepository.somarValorNoPeriodo(OrderStatus.CANCELADO,
                inicio(mes), inicio(mes.plusMonths(1)));

        Object[] totais = orderRepository.totais(OrderStatus.CANCELADO).get(0);
        long qtd = (Long) totais[0];
        BigDecimal valorTotal = (BigDecimal) totais[1];
        BigDecimal pesoTotal = (BigDecimal) totais[2];
        BigDecimal ticketMedio = qtd == 0
                ? BigDecimal.ZERO
                : valorTotal.divide(BigDecimal.valueOf(qtd), 2, RoundingMode.HALF_UP);

        LocalDate hoje = LocalDate.now();
        return new DashboardResumoResponse(
                clientRepository.count(),
                ABERTOS.stream().mapToLong(s -> porStatus.get(s.name())).sum(),
                faturamento,
                porStatus,
                orderRepository.countByStatusInAndPrazoBefore(ABERTOS, hoje),
                paraResposta(orderRepository.findByStatusInAndPrazoBeforeOrderByPrazoAsc(ABERTOS, hoje, TOP_5)),
                paraResposta(orderRepository.findAllByOrderByCriadoEmDesc(TOP_5)),
                ticketMedio,
                orderRepository.somarValorPorStatus(ABERTOS),
                pesoTotal,
                vendasMensais(mes),
                maioresClientes(),
                materiais(),
                paraResposta(orderRepository.findByStatusInAndPrazoBetweenOrderByPrazoAsc(
                        ABERTOS, hoje, hoje.plusDays(DIAS_PROXIMOS_VENCIMENTOS), TOP_5)),
                filamentRepository.abaixoDoMinimo(TOP_5).stream()
                        .map(f -> new FilamentoBaixo(f.getId(), f.getNome(),
                                f.getQuantidadeGramas(), f.getEstoqueMinimoGramas()))
                        .toList());
    }

    /** Últimos {@value MESES} meses em ordem cronológica; meses sem venda saem com zero. */
    private List<VendaMensal> vendasMensais(YearMonth atual) {
        YearMonth primeiro = atual.minusMonths(MESES - 1L);
        Map<YearMonth, BigDecimal> totais = new HashMap<>();
        Map<YearMonth, Long> quantidades = new HashMap<>();
        for (Object[] linha : orderRepository.vendasDesde(OrderStatus.CANCELADO, inicio(primeiro))) {
            YearMonth ym = YearMonth.from(((Instant) linha[0]).atZone(ZoneOffset.UTC));
            totais.merge(ym, (BigDecimal) linha[1], BigDecimal::add);
            quantidades.merge(ym, 1L, Long::sum);
        }
        List<VendaMensal> serie = new ArrayList<>();
        for (int i = 0; i < MESES; i++) {
            YearMonth ym = primeiro.plusMonths(i);
            serie.add(new VendaMensal(ym.toString(),
                    totais.getOrDefault(ym, BigDecimal.ZERO), quantidades.getOrDefault(ym, 0L)));
        }
        return serie;
    }

    private List<ClienteTop> maioresClientes() {
        return orderRepository.maioresClientes(OrderStatus.CANCELADO, TOP_5).stream()
                .map(l -> new ClienteTop((Long) l[0], (String) l[1], (Long) l[2], (BigDecimal) l[3]))
                .toList();
    }

    private List<MaterialUso> materiais() {
        return orderRepository.usoPorMaterial(OrderStatus.CANCELADO).stream()
                .map(l -> new MaterialUso((String) l[0], (Long) l[1], (BigDecimal) l[2], (BigDecimal) l[3]))
                .toList();
    }

    private List<OrderResponse> paraResposta(List<Order> pedidos) {
        return pedidos.stream().map(orderMapper::toResponse).toList();
    }

    private static Instant inicio(YearMonth mes) {
        return mes.atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC);
    }
}
