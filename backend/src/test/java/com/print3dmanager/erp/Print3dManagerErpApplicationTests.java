package com.print3dmanager.erp;

import static org.assertj.core.api.Assertions.assertThat;

import com.print3dmanager.erp.testsupport.AbstractIntegrationTest;
import com.print3dmanager.erp.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Sobe o contexto contra PostgreSQL real (Testcontainers): com {@code ddl-auto: validate},
 * o boot garante que as entidades JPA casam com o schema do Flyway.
 */
class Print3dManagerErpApplicationTests extends AbstractIntegrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("migrations aplicadas sem falhas")
    void migracoesAplicadas() {
        Integer falhas = jdbcTemplate.queryForObject(
                "select count(*) from flyway_schema_history where success = false", Integer.class);
        assertThat(falhas).isZero();
    }

    @Test
    @DisplayName("usuário demo está semeado")
    void usuarioDemoSemeado() {
        assertThat(userRepository.findByEmailIgnoreCase("demo@print3d.com")).isPresent();
    }
}
