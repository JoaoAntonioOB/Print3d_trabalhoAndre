package com.print3dmanager.erp.security.auth.dto;

import com.print3dmanager.erp.user.model.User;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Token de acesso e dados do usuário autenticado")
public record AuthResponse(
        String accessToken,
        String tokenType,
        @Schema(description = "Validade do token em segundos")
        long expiresIn,
        UsuarioResumo usuario
) {
    public record UsuarioResumo(Long id, String nome, String email) {
        public static UsuarioResumo de(User usuario) {
            return new UsuarioResumo(usuario.getId(), usuario.getNome(), usuario.getEmail());
        }
    }
}
