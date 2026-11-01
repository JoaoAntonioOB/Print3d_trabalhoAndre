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

    @Test
    @DisplayName("seed de demonstração: clientes e pedidos em todos os status, com atrasados")
    void seedDeDemonstracao() throws Exception {
        // Independe da ordem dos testes: recarrega o script da migration V3 numa base limpa.
        jdbcTemplate.execute("TRUNCATE pedidos, clientes RESTART IDENTITY CASCADE");
        try (var conn = java.util.Objects.requireNonNull(jdbcTemplate.getDataSource()).getConnection()) {
            org.springframework.jdbc.datasource.init.ScriptUtils.executeSqlScript(conn,
                    new org.springframework.core.io.ClassPathResource("db/migration/V3__seed_dados_demo.sql"));
        }
        Integer clientes = jdbcTemplate.queryForObject("select count(*) from clientes", Integer.class);
        Integer pedidos = jdbcTemplate.queryForObject("select count(*) from pedidos", Integer.class);
        Integer status = jdbcTemplate.queryForObject("select count(distinct status) from pedidos", Integer.class);
        Integer atrasados = jdbcTemplate.queryForObject(
                "select count(*) from pedidos where status in ('PENDENTE','EM_PRODUCAO') and prazo < current_date",
                Integer.class);
        assertThat(clientes).isGreaterThanOrEqualTo(5);
        assertThat(pedidos).isGreaterThanOrEqualTo(10);
        assertThat(status).isEqualTo(5);
        assertThat(atrasados).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("histórico de demonstração (V4) cobre os 5 meses anteriores")
    void seedHistorico() throws Exception {
        jdbcTemplate.execute("TRUNCATE pedidos, clientes RESTART IDENTITY CASCADE");
        try (var conn = java.util.Objects.requireNonNull(jdbcTemplate.getDataSource()).getConnection()) {
            for (String script : new String[] {"V3__seed_dados_demo.sql", "V4__seed_historico_demo.sql"}) {
                org.springframework.jdbc.datasource.init.ScriptUtils.executeSqlScript(conn,
                        new org.springframework.core.io.ClassPathResource("db/migration/" + script));
            }
        }
        Integer meses = jdbcTemplate.queryForObject(
                "select count(distinct date_trunc('month', criado_em)) from pedidos "
                        + "where criado_em < date_trunc('month', now())", Integer.class);
        Integer semCliente = jdbcTemplate.queryForObject(
                "select count(*) from pedidos where cliente_id is null", Integer.class);
        assertThat(meses).isEqualTo(5);
        assertThat(semCliente).isZero();
    }
}
