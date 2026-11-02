package com.print3dmanager.erp.filament.repository;

import com.print3dmanager.erp.filament.model.Filament;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FilamentRepository extends JpaRepository<Filament, Long> {

    /** Leitura com lock de escrita, para evitar corrida entre pedidos simultâneos. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT f FROM Filament f WHERE f.id = :id")
    Optional<Filament> findByIdForUpdate(@Param("id") Long id);

    @Query("""
            SELECT f FROM Filament f
            WHERE (:busca IS NULL
                   OR LOWER(f.nome) LIKE LOWER(CONCAT('%', CAST(:busca AS string), '%'))
                   OR LOWER(f.cor) LIKE LOWER(CONCAT('%', CAST(:busca AS string), '%'))
                   OR LOWER(f.marca) LIKE LOWER(CONCAT('%', CAST(:busca AS string), '%')))
              AND (:material IS NULL OR f.material = CAST(:material AS string))
            """)
    Page<Filament> buscar(@Param("busca") String busca, @Param("material") String material,
                          Pageable pageable);

    /** Filamentos com saldo menor ou igual ao mínimo, os mais críticos primeiro. */
    @Query("""
            SELECT f FROM Filament f
            WHERE f.quantidadeGramas <= f.estoqueMinimoGramas
            ORDER BY (f.quantidadeGramas - f.estoqueMinimoGramas) ASC, f.nome ASC
            """)
    List<Filament> abaixoDoMinimo(Pageable pageable);
}
