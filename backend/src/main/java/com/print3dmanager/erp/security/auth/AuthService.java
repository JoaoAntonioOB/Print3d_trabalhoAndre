package com.print3dmanager.erp.security.auth;

import com.print3dmanager.erp.security.SecurityUser;
import com.print3dmanager.erp.security.auth.dto.AuthResponse;
import com.print3dmanager.erp.security.auth.dto.LoginRequest;
import com.print3dmanager.erp.security.jwt.JwtService;
import com.print3dmanager.erp.user.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

/** Login por e-mail e senha; emite um JWT de acesso. */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.senha()));
        User usuario = ((SecurityUser) authentication.getPrincipal()).getUser();
        return new AuthResponse(
                jwtService.gerarAccessToken(usuario),
                "Bearer",
                jwtService.accessTokenValidadeSegundos(),
                AuthResponse.UsuarioResumo.de(usuario));
    }
}
