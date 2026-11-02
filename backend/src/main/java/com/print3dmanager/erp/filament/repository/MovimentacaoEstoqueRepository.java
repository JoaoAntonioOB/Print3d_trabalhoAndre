package com.print3dmanager.erp.filament.repository;

import com.print3dmanager.erp.filament.model.MovimentacaoEstoque;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MovimentacaoEstoqueRepository extends JpaRepository<MovimentacaoEstoque, Long> {

    List<MovimentacaoEstoque> findByFilamentoIdOrderByCriadoEmDescIdDesc(Long filamentoId);

    @Modifying
    @Query("DELETE FROM MovimentacaoEstoque m WHERE m.filamentoId = :filamentoId")
    void apagarPorFilamento(@Param("filamentoId") Long filamentoId);
}
