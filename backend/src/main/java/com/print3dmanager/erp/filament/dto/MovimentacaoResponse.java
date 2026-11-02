package com.print3dmanager.erp.filament.dto;

import com.print3dmanager.erp.filament.model.TipoMovimento;
import java.math.BigDecimal;
import java.time.Instant;

public record MovimentacaoResponse(
        Long id,
        TipoMovimento tipo,
        BigDecimal gramas,
        Long pedidoId,
        Instant criadoEm
) {
}
