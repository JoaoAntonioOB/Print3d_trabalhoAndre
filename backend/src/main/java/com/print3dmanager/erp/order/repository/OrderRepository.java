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

    // ---- indicadores adicionais do dashboard ----

    /** [quantidade, soma dos valores, soma dos pesos em gramas] dos pedidos que não têm o status ignorado. */
    @Query("""
            SELECT COUNT(o), COALESCE(SUM(o.valor), 0), COALESCE(SUM(o.pesoGramas), 0) FROM Order o
            WHERE o.status <> :ignorado
            """)
    List<Object[]> totais(@Param("ignorado") OrderStatus ignorado);

    @Query("SELECT COALESCE(SUM(o.valor), 0) FROM Order o WHERE o.status IN :status")
    BigDecimal somarValorPorStatus(@Param("status") Collection<OrderStatus> status);

    /** [data de criação, valor] dos pedidos criados desde o início do período (agrupado em Java, por mês). */
    @Query("""
            SELECT o.criadoEm, o.valor FROM Order o
            WHERE o.status <> :ignorado AND o.criadoEm >= :inicio
            """)
    List<Object[]> vendasDesde(@Param("ignorado") OrderStatus ignorado, @Param("inicio") Instant inicio);

    /** [id do cliente, nome, pedidos, valor total], do maior para o menor valor. */
    @Query("""
            SELECT c.id, c.nome, COUNT(o), SUM(o.valor) FROM Order o JOIN o.cliente c
            WHERE o.status <> :ignorado
            GROUP BY c.id, c.nome
            ORDER BY SUM(o.valor) DESC
            """)
    List<Object[]> maioresClientes(@Param("ignorado") OrderStatus ignorado, Pageable pageable);

    /** [material, pedidos, peso em gramas, valor], do mais pedido para o menos pedido. */
    @Query("""
            SELECT o.material, COUNT(o), SUM(o.pesoGramas), SUM(o.valor) FROM Order o
            WHERE o.status <> :ignorado
            GROUP BY o.material
            ORDER BY COUNT(o) DESC, SUM(o.valor) DESC
            """)
    List<Object[]> usoPorMaterial(@Param("ignorado") OrderStatus ignorado);

    @EntityGraph(attributePaths = "cliente")
    List<Order> findByStatusInAndPrazoBetweenOrderByPrazoAsc(
            Collection<OrderStatus> status, LocalDate de, LocalDate ate, Pageable pageable);
}
