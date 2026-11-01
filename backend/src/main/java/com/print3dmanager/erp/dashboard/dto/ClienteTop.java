package com.print3dmanager.erp.dashboard.dto;

import java.math.BigDecimal;

public record ClienteTop(Long clienteId, String nome, long pedidos, BigDecimal total) {
}
