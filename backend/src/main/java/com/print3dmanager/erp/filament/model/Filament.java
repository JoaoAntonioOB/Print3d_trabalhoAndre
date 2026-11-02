package com.print3dmanager.erp.filament.model;

import com.print3dmanager.erp.common.model.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Filamento em estoque (tabela filamentos), com saldo em gramas. */
@Entity
@Table(name = "filamentos")
@Getter
@Setter
@NoArgsConstructor
public class Filament extends BaseEntity {

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(nullable = false, length = 30)
    private String material;

    @Column(length = 40)
    private String cor;

    @Column(length = 60)
    private String marca;

    @Column(name = "quantidade_gramas", nullable = false, precision = 12, scale = 2)
    private BigDecimal quantidadeGramas = BigDecimal.ZERO;

    @Column(name = "estoque_minimo_gramas", nullable = false, precision = 12, scale = 2)
    private BigDecimal estoqueMinimoGramas = BigDecimal.ZERO;

    public boolean isAbaixoDoMinimo() {
        return quantidadeGramas.compareTo(estoqueMinimoGramas) <= 0;
    }
}
