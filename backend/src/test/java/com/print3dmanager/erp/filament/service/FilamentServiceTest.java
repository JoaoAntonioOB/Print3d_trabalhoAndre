package com.print3dmanager.erp.filament.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.print3dmanager.erp.common.exception.BusinessException;
import com.print3dmanager.erp.common.exception.ResourceConflictException;
import com.print3dmanager.erp.filament.dto.EntradaEstoqueRequest;
import com.print3dmanager.erp.filament.mapper.FilamentMapper;
import com.print3dmanager.erp.filament.model.Filament;
import com.print3dmanager.erp.filament.model.MovimentacaoEstoque;
import com.print3dmanager.erp.filament.model.TipoMovimento;
import com.print3dmanager.erp.filament.repository.FilamentRepository;
import com.print3dmanager.erp.filament.repository.MovimentacaoEstoqueRepository;
import com.print3dmanager.erp.order.repository.OrderRepository;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class FilamentServiceTest {

    private final FilamentRepository filamentRepository = mock(FilamentRepository.class);
    private final MovimentacaoEstoqueRepository movimentacaoRepository =
            mock(MovimentacaoEstoqueRepository.class);
    private final OrderRepository orderRepository = mock(OrderRepository.class);
    private final FilamentMapper mapper = mock(FilamentMapper.class);
    private final FilamentService service =
            new FilamentService(filamentRepository, movimentacaoRepository, orderRepository, mapper);

    private Filament filamentoComSaldo(String saldo) {
        Filament f = new Filament();
        f.setId(1L);
        f.setNome("PLA Branco");
        f.setQuantidadeGramas(new BigDecimal(saldo));
        when(filamentRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(f));
        when(filamentRepository.findById(1L)).thenReturn(Optional.of(f));
        return f;
    }

    private MovimentacaoEstoque movimentoGravado() {
        ArgumentCaptor<MovimentacaoEstoque> captor = ArgumentCaptor.forClass(MovimentacaoEstoque.class);
        verify(movimentacaoRepository).save(captor.capture());
        return captor.getValue();
    }

    @Test
    @DisplayName("baixar desconta o saldo e registra SAIDA ligada ao pedido")
    void baixarDescontaERegistra() {
        Filament f = filamentoComSaldo("500");
        service.baixar(1L, new BigDecimal("120"), 7L);
        assertThat(f.getQuantidadeGramas()).isEqualByComparingTo("380");
        MovimentacaoEstoque m = movimentoGravado();
        assertThat(m.getTipo()).isEqualTo(TipoMovimento.SAIDA);
        assertThat(m.getPedidoId()).isEqualTo(7L);
        assertThat(m.getGramas()).isEqualByComparingTo("120");
    }

    @Test
    @DisplayName("baixar o saldo exato é permitido (fica zerado)")
    void baixarSaldoExato() {
        Filament f = filamentoComSaldo("100");
        service.baixar(1L, new BigDecimal("100"), 7L);
        assertThat(f.getQuantidadeGramas()).isEqualByComparingTo("0");
    }

    @Test
    @DisplayName("saldo insuficiente lança BusinessException com a mensagem esperada e não altera nada")
    void saldoInsuficiente() {
        Filament f = filamentoComSaldo("500.00");
        assertThatThrownBy(() -> service.baixar(1L, new BigDecimal("600.00"), 7L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Estoque insuficiente de PLA Branco: disponível 500g, necessário 600g");
        assertThat(f.getQuantidadeGramas()).isEqualByComparingTo("500");
        verify(movimentacaoRepository, never()).save(any());
    }

    @Test
    @DisplayName("estornar devolve o saldo e registra ESTORNO")
    void estornarDevolve() {
        Filament f = filamentoComSaldo("380");
        service.estornar(1L, new BigDecimal("120"), 7L);
        assertThat(f.getQuantidadeGramas()).isEqualByComparingTo("500");
        assertThat(movimentoGravado().getTipo()).isEqualTo(TipoMovimento.ESTORNO);
    }

    @Test
    @DisplayName("entrada soma ao saldo e registra ENTRADA sem pedido")
    void entradaSoma() {
        Filament f = filamentoComSaldo("100");
        service.registrarEntrada(1L, new EntradaEstoqueRequest(new BigDecimal("1000")));
        assertThat(f.getQuantidadeGramas()).isEqualByComparingTo("1100");
        MovimentacaoEstoque m = movimentoGravado();
        assertThat(m.getTipo()).isEqualTo(TipoMovimento.ENTRADA);
        assertThat(m.getPedidoId()).isNull();
    }

    @Test
    @DisplayName("filamento usado em pedido não pode ser excluído (409)")
    void naoExcluiEmUso() {
        filamentoComSaldo("100");
        when(orderRepository.existsByFilamentoId(1L)).thenReturn(true);
        assertThatThrownBy(() -> service.excluir(1L)).isInstanceOf(ResourceConflictException.class);
        verify(filamentRepository, never()).delete(any());
    }

    @Test
    @DisplayName("abaixoDoMinimo: saldo menor ou igual ao mínimo")
    void abaixoDoMinimo() {
        Filament f = new Filament();
        f.setQuantidadeGramas(new BigDecimal("200"));
        f.setEstoqueMinimoGramas(new BigDecimal("200"));
        assertThat(f.isAbaixoDoMinimo()).isTrue();
        f.setQuantidadeGramas(new BigDecimal("201"));
        assertThat(f.isAbaixoDoMinimo()).isFalse();
    }
}
