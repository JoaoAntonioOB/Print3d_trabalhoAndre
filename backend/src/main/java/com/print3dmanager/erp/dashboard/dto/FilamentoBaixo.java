package com.print3dmanager.erp.dashboard.dto;

import java.math.BigDecimal;

public record FilamentoBaixo(
        Long id,
        String nome,
        BigDecimal quantidadeGramas,
        BigDecimal estoqueMinimoGramas
) {
}
