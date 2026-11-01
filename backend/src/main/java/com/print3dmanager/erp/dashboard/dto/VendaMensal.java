package com.print3dmanager.erp.dashboard.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

@Schema(description = "Vendas de um mês (pedidos criados no mês, exceto cancelados)")
public record VendaMensal(
        @Schema(description = "Mês no formato AAAA-MM", example = "2026-11") String mes,
        BigDecimal total,
        long pedidos
) {
}
