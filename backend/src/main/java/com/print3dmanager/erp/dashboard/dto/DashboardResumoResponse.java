package com.print3dmanager.erp.dashboard.dto;

import com.print3dmanager.erp.order.dto.OrderResponse;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Schema(description = "Tudo que a tela de dashboard precisa, em uma única chamada")
public record DashboardResumoResponse(
        long totalClientes,
        @Schema(description = "Pedidos PENDENTE + EM_PRODUCAO")
        long pedidosAbertos,
        @Schema(description = "Soma dos valores dos pedidos criados no mês (exceto cancelados)")
        BigDecimal faturamentoMes,
        @Schema(description = "Quantidade por status (todos os status presentes, ausência = 0)")
        Map<String, Long> pedidosPorStatus,
        @Schema(description = "Total de pedidos em aberto com prazo vencido")
        long totalAtrasados,
        @Schema(description = "Até 5 pedidos atrasados, o mais antigo primeiro")
        List<OrderResponse> pedidosAtrasados,
        @Schema(description = "Últimos 5 pedidos criados")
        List<OrderResponse> ultimosPedidos
) {
}
