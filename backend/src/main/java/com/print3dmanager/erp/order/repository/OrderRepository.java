package com.print3dmanager.erp.order.repository;

import com.print3dmanager.erp.order.model.Order;
import com.print3dmanager.erp.order.model.OrderStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository
        extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {

    @Override
    @EntityGraph(attributePaths = "cliente")
    Page<Order> findAll(Specification<Order> spec, Pageable pageable);

    boolean existsByClienteId(Long clienteId);

    // ---- consultas do dashboard ----

    @Query("SELECT o.status, COUNT(o) FROM Order o GROUP BY o.status")
    List<Object[]> contarPorStatus();

    @Query("""
            SELECT COALESCE(SUM(o.valor), 0) FROM Order o
            WHERE o.status <> :ignorado AND o.criadoEm >= :inicio AND o.criadoEm < :fim
            """)
    BigDecimal somarValorNoPeriodo(@Param("ignorado") OrderStatus ignorado,
                                   @Param("inicio") Instant inicio, @Param("fim") Instant fim);

    long countByStatusInAndPrazoBefore(Collection<OrderStatus> status, LocalDate data);

    @EntityGraph(attributePaths = "cliente")
    List<Order> findByStatusInAndPrazoBeforeOrderByPrazoAsc(
            Collection<OrderStatus> status, LocalDate data, Pageable pageable);

    @EntityGraph(attributePaths = "cliente")
    List<Order> findAllByOrderByCriadoEmDesc(Pageable pageable);
}
