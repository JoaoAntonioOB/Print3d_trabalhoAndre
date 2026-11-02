package com.print3dmanager.erp.filament.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

@Schema(description = "Entrada de estoque (compra ou reposição)")
public record EntradaEstoqueRequest(
        @NotNull(message = "As gramas são obrigatórias")
        @Positive(message = "As gramas devem ser maiores que zero")
        @Digits(integer = 10, fraction = 2, message = "Gramas inválidas (até 2 casas decimais)")
        BigDecimal gramas
) {
}
