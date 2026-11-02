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
        List<OrderResponse> ultimosPedidos,
        @Schema(description = "Valor médio por pedido (exceto cancelados); 0 se não houver pedidos")
        BigDecimal ticketMedio,
        @Schema(description = "Soma dos valores dos pedidos PENDENTE + EM_PRODUCAO")
        BigDecimal valorEmAberto,
        @Schema(description = "Peso total de material, em gramas, de todos os pedidos (exceto cancelados)")
        BigDecimal pesoTotalGramas,
        @Schema(description = "Vendas dos últimos 6 meses, em ordem cronológica (meses sem venda vêm zerados)")
        List<VendaMensal> vendasMensais,
        @Schema(description = "Até 5 clientes com maior valor em pedidos (exceto cancelados)")
        List<ClienteTop> maioresClientes,
        @Schema(description = "Uso por material, do mais pedido para o menos pedido (exceto cancelados)")
        List<MaterialUso> materiais,
        @Schema(description = "Até 5 pedidos em aberto que vencem nos próximos 7 dias (inclui hoje)")
        List<OrderResponse> proximosVencimentos,
        @Schema(description = "Até 5 filamentos com saldo menor ou igual ao estoque mínimo, os mais críticos primeiro")
        List<FilamentoBaixo> filamentosAbaixoMinimo
) {
}
