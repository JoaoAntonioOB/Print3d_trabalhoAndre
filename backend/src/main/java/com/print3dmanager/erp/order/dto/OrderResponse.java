package com.print3dmanager.erp.order.dto;

import com.print3dmanager.erp.order.model.OrderStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record OrderResponse(
        Long id,
        Long clienteId,
        String clienteNome,
        String descricao,
        String material,
        BigDecimal pesoGramas,
        BigDecimal valor,
        LocalDate prazo,
        OrderStatus status,
        Long filamentoId,
        String filamentoNome,
        Instant criadoEm,
        Instant atualizadoEm
) {
}
