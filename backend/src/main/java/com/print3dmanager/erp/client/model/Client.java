package com.print3dmanager.erp.client.model;

import com.print3dmanager.erp.common.model.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Cliente (tabela clientes).
 */
@Entity
@Table(name = "clientes")
@Getter
@Setter
@NoArgsConstructor
public class Client extends BaseEntity {

    @Column(nullable = false, length = 160)
    private String nome;

    @Column(length = 160)
    private String email;

    @Column(length = 20)
    private String telefone;

    @Column(name = "cpf_cnpj", length = 18, unique = true)
    private String cpfCnpj;

    @Embedded
    private Address endereco;
}
