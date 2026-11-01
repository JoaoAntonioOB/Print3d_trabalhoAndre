package com.print3dmanager.erp.client.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "Dados de um cliente")
public record ClientResponse(
        Long id,
        String nome,
        String email,
        String telefone,
        String cpfCnpj,
        AddressDto endereco,
        Instant criadoEm,
        Instant atualizadoEm
) {
}
