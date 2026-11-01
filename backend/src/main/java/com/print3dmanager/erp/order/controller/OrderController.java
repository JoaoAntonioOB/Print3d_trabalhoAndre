package com.print3dmanager.erp.order.controller;

import com.print3dmanager.erp.common.dto.PageResponse;
import com.print3dmanager.erp.order.dto.OrderCreateRequest;
import com.print3dmanager.erp.order.dto.OrderResponse;
import com.print3dmanager.erp.order.dto.OrderStatusRequest;
import com.print3dmanager.erp.order.dto.OrderUpdateRequest;
import com.print3dmanager.erp.order.model.OrderStatus;
import com.print3dmanager.erp.order.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
@Tag(name = "Pedidos")
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    @Operation(summary = "Lista pedidos com paginação e filtros opcionais")
    public PageResponse<OrderResponse> listar(
            @Parameter(description = "Busca por descrição ou nome do cliente")
            @RequestParam(required = false) String busca,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) Long clienteId,
            @ParameterObject @PageableDefault(sort = "criadoEm", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return orderService.listar(busca, status, clienteId, pageable);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Busca um pedido pelo id")
    public OrderResponse buscarPorId(@PathVariable Long id) {
        return orderService.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Cria um pedido (status inicial PENDENTE)")
    public OrderResponse criar(@Valid @RequestBody OrderCreateRequest request) {
        return orderService.criar(request);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualiza um pedido PENDENTE ou EM_PRODUCAO")
    public OrderResponse atualizar(@PathVariable Long id,
                                   @Valid @RequestBody OrderUpdateRequest request) {
        return orderService.atualizar(id, request);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Altera o status seguindo o ciclo de vida",
            description = "PENDENTE→EM_PRODUCAO|CANCELADO, EM_PRODUCAO→CONCLUIDO|CANCELADO, "
                    + "CONCLUIDO→ENTREGUE. Demais transições: 400.")
    public OrderResponse alterarStatus(@PathVariable Long id,
                                       @Valid @RequestBody OrderStatusRequest request) {
        return orderService.alterarStatus(id, request.status());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Exclui um pedido PENDENTE ou CANCELADO")
    public void excluir(@PathVariable Long id) {
        orderService.excluir(id);
    }
}
