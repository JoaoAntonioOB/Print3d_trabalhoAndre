package com.print3dmanager.erp.dashboard.controller;

import com.print3dmanager.erp.dashboard.dto.DashboardResumoResponse;
import com.print3dmanager.erp.dashboard.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    @Operation(summary = "Indicadores agregados para a tela inicial do app")
    public DashboardResumoResponse resumo() {
        return dashboardService.resumo();
    }
}
