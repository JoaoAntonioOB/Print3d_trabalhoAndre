package com.print3dmanager.erp.dashboard.dto;

import java.math.BigDecimal;

public record MaterialUso(String material, long pedidos, BigDecimal pesoGramas, BigDecimal total) {
}
