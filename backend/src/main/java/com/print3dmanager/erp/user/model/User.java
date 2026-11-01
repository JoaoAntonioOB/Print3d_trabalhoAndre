package com.print3dmanager.erp.user.model;

import com.print3dmanager.erp.common.model.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Usuário que acessa o app (tabela usuarios). */
@Entity
@Table(name = "usuarios")
@Getter
@Setter
@NoArgsConstructor
public class User extends BaseEntity {

    @Column(nullable = false, length = 120)
    private String nome;

    /** Único por LOWER(email). */
    @Column(nullable = false, length = 160)
    private String email;

    /** Hash BCrypt. */
    @Column(nullable = false, length = 100)
    private String senha;
}
