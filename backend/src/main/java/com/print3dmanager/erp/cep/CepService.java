package com.print3dmanager.erp.cep;

import com.print3dmanager.erp.cep.ViaCepClient.ViaCepPayload;
import com.print3dmanager.erp.cep.dto.CepResponse;
import com.print3dmanager.erp.common.exception.BusinessException;
import com.print3dmanager.erp.common.exception.ExternalServiceException;
import com.print3dmanager.erp.common.exception.ResourceNotFoundException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

/** Valida o CEP, consulta a ViaCEP e devolve um DTO enxuto. Cache simples em memória. */
@Service
public class CepService {

    private static final Pattern OITO_DIGITOS = Pattern.compile("\\d{8}");

    private final ViaCepClient viaCepClient;
    private final ConcurrentHashMap<String, CepResponse> cache = new ConcurrentHashMap<>();

    public CepService(ViaCepClient viaCepClient) {
        this.viaCepClient = viaCepClient;
    }

    public CepResponse buscar(String cepInformado) {
        String cep = cepInformado == null ? "" : cepInformado.replaceAll("[\\s-]", "");
        if (!OITO_DIGITOS.matcher(cep).matches()) {
            throw new BusinessException("CEP inválido: informe 8 dígitos (ex.: 01001-000).");
        }
        CepResponse emCache = cache.get(cep);
        if (emCache != null) {
            return emCache;
        }
        ViaCepPayload payload = viaCepClient.consultar(cep);
        if (payload == null) {
            throw new ExternalServiceException(
                    "Serviço de CEP indisponível, preencha manualmente.", null);
        }
        if (Boolean.TRUE.equals(payload.erro())) {
            throw new ResourceNotFoundException("CEP não encontrado, preencha manualmente.");
        }
        CepResponse resposta = new CepResponse(
                payload.cep(), payload.logradouro(), payload.bairro(), payload.localidade(), payload.uf());
        cache.put(cep, resposta);
        return resposta;
    }
}
