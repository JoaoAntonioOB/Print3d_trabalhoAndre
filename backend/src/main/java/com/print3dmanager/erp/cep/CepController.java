package com.print3dmanager.erp.cep;

import com.print3dmanager.erp.cep.dto.CepResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/cep")
@RequiredArgsConstructor
@Tag(name = "CEP")
public class CepController {

    private final CepService cepService;

    @GetMapping("/{cep}")
    @Operation(summary = "Consulta o endereço de um CEP (via ViaCEP)",
            description = "400 CEP malformado · 404 CEP inexistente · 503 ViaCEP indisponível.")
    public CepResponse buscar(@PathVariable String cep) {
        return cepService.buscar(cep);
    }
}
