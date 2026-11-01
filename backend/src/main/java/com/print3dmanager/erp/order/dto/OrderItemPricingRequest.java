package com.print3dmanager.erp.order.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

@Schema(description = "Dados para simular o preço sugerido de um item de pedido, sem "
        + "persistir nada — mesma regra de negócio usada nos orçamentos "
        + "(custo filamento + energia + hora máquina + desgaste + markup)")
public record OrderItemPricingRequest(

        @Schema(description = "Filamento previsto para a peça; sem filamento, o custo de "
                + "material entra como zero")
        Long filamentoId,

        @Schema(description = "Peso estimado por unidade, em gramas", example = "35.5")
        @Positive(message = "O peso estimado deve ser maior que zero")
        BigDecimal pesoEstimadoG,

        @Schema(description = "Tempo estimado de impressão por unidade, em minutos", example = "90")
        @Positive(message = "O tempo de impressão deve ser maior que zero")
        Integer tempoImpressaoMinutos,

        @Schema(description = "Margem de lucro em %; se omitida, usa o markup padrão da "
                + "configuração global (fallback: 100)", example = "100.00")
        @PositiveOrZero(message = "O markup não pode ser negativo")
        @DecimalMax(value = "999.99", message = "O markup deve ser no máximo 999.99")
        BigDecimal markup
) {
}
