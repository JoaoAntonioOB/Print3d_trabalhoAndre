package com.print3dmanager.erp.cnpj.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Dados públicos de uma empresa a partir do CNPJ")
public record CnpjResponse(
        @Schema(example = "00000000000191") String cnpj,
        String razaoSocial,
        String nomeFantasia,
        String email,
        @Schema(description = "DDD + número, somente dígitos", example = "6134939002") String telefone,
        @Schema(description = "Situação cadastral na Receita", example = "ATIVA") String situacao,
        Endereco endereco
) {

    public record Endereco(
            String cep,
            String logradouro,
            String numero,
            String complemento,
            String bairro,
            String cidade,
            String estado
    ) {
    }
}
