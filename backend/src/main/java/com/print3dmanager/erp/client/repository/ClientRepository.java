package com.print3dmanager.erp.client.repository;

import com.print3dmanager.erp.client.model.Client;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ClientRepository extends JpaRepository<Client, Long> {

    boolean existsByCpfCnpj(String cpfCnpj);

    boolean existsByCpfCnpjAndIdNot(String cpfCnpj, Long id);

    @Query("""
            SELECT c FROM Client c
            WHERE :busca IS NULL
               OR LOWER(c.nome) LIKE LOWER(CONCAT('%', CAST(:busca AS string), '%'))
               OR LOWER(c.email) LIKE LOWER(CONCAT('%', CAST(:busca AS string), '%'))
               OR c.cpfCnpj LIKE CONCAT('%', CAST(:busca AS string), '%')
            """)
    Page<Client> buscar(@Param("busca") String busca, Pageable pageable);
}
