package com.print3dmanager.erp.order.mapper;

import com.print3dmanager.erp.order.dto.OrderResponse;
import com.print3dmanager.erp.order.model.Order;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper
public interface OrderMapper {

    @Mapping(target = "clienteId", source = "cliente.id")
    @Mapping(target = "clienteNome", source = "cliente.nome")
    @Mapping(target = "filamentoId", source = "filamento.id")
    @Mapping(target = "filamentoNome", source = "filamento.nome")
    OrderResponse toResponse(Order order);
}
