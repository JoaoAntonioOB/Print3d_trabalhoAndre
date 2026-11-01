package com.print3dmanager.erp.security;

import com.print3dmanager.erp.user.model.User;
import java.util.Collection;
import java.util.List;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

/** Adaptador de User para o Spring Security (sem papéis: todo usuário logado tem o mesmo acesso). */
@RequiredArgsConstructor
public class SecurityUser implements UserDetails {

    @Getter
    private final User user;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of();
    }

    @Override
    public String getPassword() {
        return user.getSenha();
    }

    @Override
    public String getUsername() {
        return user.getEmail();
    }
}
