package com.print3dmanager.erp.filament.service;

import com.print3dmanager.erp.common.dto.PageResponse;
import com.print3dmanager.erp.common.exception.BusinessException;
import com.print3dmanager.erp.common.exception.ResourceConflictException;
import com.print3dmanager.erp.common.exception.ResourceNotFoundException;
import com.print3dmanager.erp.filament.dto.EntradaEstoqueRequest;
import com.print3dmanager.erp.filament.dto.FilamentCreateRequest;
import com.print3dmanager.erp.filament.dto.FilamentResponse;
import com.print3dmanager.erp.filament.dto.FilamentUpdateRequest;
import com.print3dmanager.erp.filament.dto.MovimentacaoResponse;
import com.print3dmanager.erp.filament.mapper.FilamentMapper;
import com.print3dmanager.erp.filament.model.Filament;
import com.print3dmanager.erp.filament.model.MovimentacaoEstoque;
import com.print3dmanager.erp.filament.model.TipoMovimento;
import com.print3dmanager.erp.filament.repository.FilamentRepository;
import com.print3dmanager.erp.filament.repository.MovimentacaoEstoqueRepository;
import com.print3dmanager.erp.order.repository.OrderRepository;
import java.math.BigDecimal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Regras do estoque de filamentos: saldo nunca negativo, toda alteração de saldo gera
 * uma movimentação e a exclusão é bloqueada se algum pedido usa o filamento.
 */
@Service
@RequiredArgsConstructor
public class FilamentService {

    private final FilamentRepository filamentRepository;
    private final MovimentacaoEstoqueRepository movimentacaoRepository;
    private final OrderRepository orderRepository;
    private final FilamentMapper filamentMapper;

    @Transactional(readOnly = true)
    public PageResponse<FilamentResponse> listar(String busca, String material, Pageable pageable) {
        return PageResponse.de(filamentRepository
                .buscar(textoOuNulo(busca), textoOuNulo(material) == null ? null : material.trim().toUpperCase(),
                        pageable)
                .map(filamentMapper::toResponse));
    }

    @Transactional(readOnly = true)
    public FilamentResponse buscarPorId(Long id) {
        return filamentMapper.toResponse(obter(id));
    }

    @Transactional
    public FilamentResponse criar(FilamentCreateRequest request) {
        Filament filamento = filamentMapper.toEntity(request);
        normalizar(filamento);
        filamento = filamentRepository.save(filamento);
        if (filamento.getQuantidadeGramas().signum() > 0) {
            registrar(filamento.getId(), null, TipoMovimento.ENTRADA, filamento.getQuantidadeGramas());
        }
        return filamentMapper.toResponse(filamento);
    }

    @Transactional
    public FilamentResponse atualizar(Long id, FilamentUpdateRequest request) {
        Filament filamento = obter(id);
        filamentMapper.atualizar(filamento, request);
        normalizar(filamento);
        return filamentMapper.toResponse(filamento);
    }

    @Transactional
    public void excluir(Long id) {
        Filament filamento = obter(id);
        if (orderRepository.existsByFilamentoId(id)) {
            throw new ResourceConflictException(
                    "Não é possível excluir o filamento %s: ele é usado em pedidos.".formatted(filamento.getNome()));
        }
        movimentacaoRepository.apagarPorFilamento(id);
        filamentRepository.delete(filamento);
    }

    @Transactional
    public FilamentResponse registrarEntrada(Long id, EntradaEstoqueRequest request) {
        Filament filamento = bloquear(id);
        filamento.setQuantidadeGramas(filamento.getQuantidadeGramas().add(request.gramas()));
        registrar(id, null, TipoMovimento.ENTRADA, request.gramas());
        return filamentMapper.toResponse(filamento);
    }

    @Transactional(readOnly = true)
    public List<MovimentacaoResponse> listarMovimentacoes(Long id) {
        obter(id);
        return movimentacaoRepository.findByFilamentoIdOrderByCriadoEmDescIdDesc(id).stream()
                .map(filamentMapper::toResponse)
                .toList();
    }

    /** Desconta gramas do saldo para um pedido; falha se o saldo não for suficiente. */
    @Transactional
    public void baixar(Long filamentoId, BigDecimal gramas, Long pedidoId) {
        Filament filamento = bloquear(filamentoId);
        if (filamento.getQuantidadeGramas().compareTo(gramas) < 0) {
            throw new BusinessException("Estoque insuficiente de %s: disponível %sg, necessário %sg"
                    .formatted(filamento.getNome(), formatar(filamento.getQuantidadeGramas()), formatar(gramas)));
        }
        filamento.setQuantidadeGramas(filamento.getQuantidadeGramas().subtract(gramas));
        registrar(filamentoId, pedidoId, TipoMovimento.SAIDA, gramas);
    }

    /** Devolve ao saldo as gramas descontadas de um pedido. */
    @Transactional
    public void estornar(Long filamentoId, BigDecimal gramas, Long pedidoId) {
        Filament filamento = bloquear(filamentoId);
        filamento.setQuantidadeGramas(filamento.getQuantidadeGramas().add(gramas));
        registrar(filamentoId, pedidoId, TipoMovimento.ESTORNO, gramas);
    }

    /** Busca o filamento ou lança 404. */
    @Transactional(readOnly = true)
    public Filament obter(Long id) {
        return filamentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Filamento", id));
    }

    private Filament bloquear(Long id) {
        return filamentRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Filamento", id));
    }

    private void registrar(Long filamentoId, Long pedidoId, TipoMovimento tipo, BigDecimal gramas) {
        MovimentacaoEstoque m = new MovimentacaoEstoque();
        m.setFilamentoId(filamentoId);
        m.setPedidoId(pedidoId);
        m.setTipo(tipo);
        m.setGramas(gramas);
        movimentacaoRepository.save(m);
    }

    private static void normalizar(Filament filamento) {
        filamento.setNome(filamento.getNome().trim());
        filamento.setMaterial(filamento.getMaterial().trim().toUpperCase());
        filamento.setCor(textoOuNulo(filamento.getCor()));
        filamento.setMarca(textoOuNulo(filamento.getMarca()));
    }

    private static String textoOuNulo(String texto) {
        return (texto == null || texto.isBlank()) ? null : texto.trim();
    }

    private static String formatar(BigDecimal valor) {
        return valor.stripTrailingZeros().toPlainString();
    }
}
