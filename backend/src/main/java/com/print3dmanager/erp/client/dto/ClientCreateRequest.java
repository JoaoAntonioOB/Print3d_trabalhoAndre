package com.print3dmanager.erp.client.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Schema(description = "Dados para criação de cliente")
public record ClientCreateRequest(

        @NotBlank(message = "O nome é obrigatório")
        @Size(max = 160, message = "O nome deve ter no máximo 160 caracteres")
        String nome,

        @Email(message = "E-mail inválido")
        @Size(max = 160, message = "O e-mail deve ter no máximo 160 caracteres")
        String email,

        @Pattern(regexp = "\\(?\\d{2}\\)?\\s?\\d{4,5}-?\\d{4}", message = "Telefone inválido (ex.: (11) 91234-5678)")
        String telefone,


        @Schema(description = "CPF ou CNPJ, com ou sem máscara", example = "123.456.789-09")
        @Size(max = 18, message = "O CPF/CNPJ deve ter no máximo 18 caracteres")
        String cpfCnpj,

        @Valid
        AddressDto endereco,

        String observacoes
) {
}
