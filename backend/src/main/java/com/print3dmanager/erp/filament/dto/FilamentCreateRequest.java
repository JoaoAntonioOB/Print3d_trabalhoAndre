package com.print3dmanager.erp.filament.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

@Schema(description = "Dados para cadastrar um filamento (com saldo inicial)")
public record FilamentCreateRequest(
        @NotBlank(message = "O nome é obrigatório")
        @Size(max = 120, message = "O nome deve ter no máximo 120 caracteres")
        String nome,
        @Schema(example = "PLA")
        @NotBlank(message = "O material é obrigatório")
        @Size(max = 30, message = "O material deve ter no máximo 30 caracteres")
        String material,
        @Size(max = 40, message = "A cor deve ter no máximo 40 caracteres")
        String cor,
        @Size(max = 60, message = "A marca deve ter no máximo 60 caracteres")
        String marca,
        @NotNull(message = "A quantidade é obrigatória")
        @PositiveOrZero(message = "A quantidade não pode ser negativa")
        @Digits(integer = 10, fraction = 2, message = "Quantidade inválida (até 2 casas decimais)")
        BigDecimal quantidadeGramas,
        @NotNull(message = "O estoque mínimo é obrigatório")
        @PositiveOrZero(message = "O estoque mínimo não pode ser negativo")
        @Digits(integer = 10, fraction = 2, message = "Estoque mínimo inválido (até 2 casas decimais)")
        BigDecimal estoqueMinimoGramas
) {
}
