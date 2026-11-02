package com.print3dmanager.erp.filament.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record FilamentResponse(
        Long id,
        String nome,
        String material,
        String cor,
        String marca,
        BigDecimal quantidadeGramas,
        BigDecimal estoqueMinimoGramas,
        boolean abaixoDoMinimo,
        Instant criadoEm,
        Instant atualizadoEm
) {
}
