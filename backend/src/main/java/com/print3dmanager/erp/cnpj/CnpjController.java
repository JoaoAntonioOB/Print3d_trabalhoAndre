package com.print3dmanager.erp.cnpj;

import com.print3dmanager.erp.cnpj.dto.CnpjResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/cnpj")
@RequiredArgsConstructor
@Tag(name = "CNPJ")
public class CnpjController {

    private final CnpjService cnpjService;

    @GetMapping("/{cnpj}")
    @Operation(summary = "Consulta os dados públicos de uma empresa pelo CNPJ (via BrasilAPI)",
            description = "400 CNPJ inválido · 404 CNPJ não encontrado · 503 BrasilAPI indisponível.")
    public CnpjResponse buscar(@PathVariable String cnpj) {
        return cnpjService.buscar(cnpj);
    }
}
