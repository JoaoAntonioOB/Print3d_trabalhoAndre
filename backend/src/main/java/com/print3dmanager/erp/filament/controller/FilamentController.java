package com.print3dmanager.erp.filament.controller;

import com.print3dmanager.erp.common.dto.PageResponse;
import com.print3dmanager.erp.filament.dto.EntradaEstoqueRequest;
import com.print3dmanager.erp.filament.dto.FilamentCreateRequest;
import com.print3dmanager.erp.filament.dto.FilamentResponse;
import com.print3dmanager.erp.filament.dto.FilamentUpdateRequest;
import com.print3dmanager.erp.filament.dto.MovimentacaoResponse;
import com.print3dmanager.erp.filament.service.FilamentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/filaments")
@RequiredArgsConstructor
@Tag(name = "Estoque de filamentos")
public class FilamentController {

    private final FilamentService filamentService;

    @GetMapping
    @Operation(summary = "Lista filamentos com paginação, busca e filtro por material")
    public PageResponse<FilamentResponse> listar(
            @Parameter(description = "Busca por nome, cor ou marca")
            @RequestParam(required = false) String busca,
            @Parameter(description = "Filtra por material (ex.: PLA)")
            @RequestParam(required = false) String material,
            @ParameterObject @PageableDefault(sort = "nome") Pageable pageable) {
        return filamentService.listar(busca, material, pageable);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Busca um filamento pelo id")
    public FilamentResponse buscarPorId(@PathVariable Long id) {
        return filamentService.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Cadastra um filamento com saldo inicial")
    public FilamentResponse criar(@Valid @RequestBody FilamentCreateRequest request) {
        return filamentService.criar(request);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualiza os dados do filamento (não altera o saldo)")
    public FilamentResponse atualizar(@PathVariable Long id,
                                      @Valid @RequestBody FilamentUpdateRequest request) {
        return filamentService.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Exclui um filamento", description = "Retorna 409 se algum pedido o utiliza.")
    public void excluir(@PathVariable Long id) {
        filamentService.excluir(id);
    }

    @PostMapping("/{id}/entradas")
    @Operation(summary = "Registra entrada de estoque (compra/reposição)")
    public FilamentResponse registrarEntrada(@PathVariable Long id,
                                             @Valid @RequestBody EntradaEstoqueRequest request) {
        return filamentService.registrarEntrada(id, request);
    }

    @GetMapping("/{id}/movimentacoes")
    @Operation(summary = "Histórico de movimentações, mais recentes primeiro")
    public List<MovimentacaoResponse> movimentacoes(@PathVariable Long id) {
        return filamentService.listarMovimentacoes(id);
    }
}
