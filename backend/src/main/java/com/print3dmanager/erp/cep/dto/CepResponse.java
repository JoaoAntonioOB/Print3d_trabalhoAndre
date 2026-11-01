package com.print3dmanager.erp.cep.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Endereço resolvido a partir do CEP")
public record CepResponse(
        @Schema(example = "01001-000") String cep,
        String logradouro,
        String bairro,
        String cidade,
        @Schema(example = "SP") String estado
) {
}
