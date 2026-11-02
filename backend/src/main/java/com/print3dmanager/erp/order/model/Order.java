package com.print3dmanager.erp.order.model;

import com.print3dmanager.erp.client.model.Client;
import com.print3dmanager.erp.common.model.BaseEntity;
import com.print3dmanager.erp.filament.model.Filament;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Pedido de impressão 3D (tabela pedidos). */
@Entity
@Table(name = "pedidos")
@Getter
@Setter
@NoArgsConstructor
public class Order extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Client cliente;

    @Column(nullable = false, length = 500)
    private String descricao;

    @Column(nullable = false, length = 30)
    private String material;

    @Column(name = "peso_gramas", nullable = false, precision = 10, scale = 2)
    private BigDecimal pesoGramas;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal valor;

    @Column(nullable = false)
    private LocalDate prazo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "filamento_id")
    private Filament filamento;

    /** Gramas já descontadas do estoque por este pedido (nulo = nada descontado). */
    @Column(name = "gramas_descontadas", precision = 12, scale = 2)
    private BigDecimal gramasDescontadas;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderStatus status = OrderStatus.PENDENTE;
}
