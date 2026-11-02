package com.print3dmanager.erp.order.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

@Schema(description = "Dados para atualizar um pedido (somente PENDENTE ou EM_PRODUCAO)")
public record OrderUpdateRequest(
        @NotNull(message = "O cliente é obrigatório")
        Long clienteId,
        @NotBlank(message = "A descrição é obrigatória")
        @Size(max = 500, message = "A descrição deve ter no máximo 500 caracteres")
        String descricao,
        @NotBlank(message = "O material é obrigatório")
        @Size(max = 30, message = "O material deve ter no máximo 30 caracteres")
        String material,
        @NotNull(message = "O peso é obrigatório")
        @Positive(message = "O peso deve ser maior que zero")
        @Digits(integer = 8, fraction = 2, message = "Peso inválido (até 2 casas decimais)")
        BigDecimal pesoGramas,
        @NotNull(message = "O valor é obrigatório")
        @Positive(message = "O valor deve ser maior que zero")
        @Digits(integer = 10, fraction = 2, message = "Valor inválido (até 2 casas decimais)")
        BigDecimal valor,
        @NotNull(message = "O prazo é obrigatório")
        LocalDate prazo,
        @Schema(description = "Filamento do estoque usado (opcional); define o material do pedido")
        Long filamentoId
) {
}
