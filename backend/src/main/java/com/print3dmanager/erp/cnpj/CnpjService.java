package com.print3dmanager.erp.cnpj;

import com.print3dmanager.erp.cnpj.BrasilApiClient.CnpjPayload;
import com.print3dmanager.erp.cnpj.dto.CnpjResponse;
import com.print3dmanager.erp.common.exception.BusinessException;
import com.print3dmanager.erp.common.exception.ExternalServiceException;
import com.print3dmanager.erp.common.exception.ResourceNotFoundException;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

/** Valida o CNPJ (formato e dígitos verificadores), consulta a BrasilAPI e devolve um DTO enxuto. */
@Service
public class CnpjService {

    private static final int MAX_COMPLEMENTO = 80; // limite do cadastro de clientes

    private final BrasilApiClient client;
    private final ConcurrentHashMap<String, CnpjResponse> cache = new ConcurrentHashMap<>();

    public CnpjService(BrasilApiClient client) {
        this.client = client;
    }

    public CnpjResponse buscar(String cnpjInformado) {
        String cnpj = cnpjInformado == null ? "" : cnpjInformado.replaceAll("[^0-9]", "");
        if (!cnpjValido(cnpj)) {
            throw new BusinessException("CNPJ inválido: confira os 14 dígitos.");
        }
        CnpjResponse emCache = cache.get(cnpj);
        if (emCache != null) {
            return emCache;
        }
        CnpjPayload p = client.consultar(cnpj);
        if (p == null) {
            throw new ResourceNotFoundException("CNPJ não encontrado, preencha manualmente.");
        }
        CnpjResponse resposta = new CnpjResponse(
                cnpj, p.razaoSocial(), vazioParaNulo(p.nomeFantasia()), vazioParaNulo(p.email()),
                vazioParaNulo(p.telefone()), p.situacao(),
                new CnpjResponse.Endereco(
                        p.cep(), p.logradouro(), p.numero(), cortar(p.complemento()),
                        p.bairro(), p.municipio(), p.uf()));
        if (resposta.razaoSocial() == null) {
            throw new ExternalServiceException(
                    "Serviço de consulta de CNPJ indisponível, preencha manualmente.", null);
        }
        cache.put(cnpj, resposta);
        return resposta;
    }

    private static String vazioParaNulo(String v) {
        return v == null || v.isBlank() ? null : v.trim();
    }

    private static String cortar(String complemento) {
        String v = vazioParaNulo(complemento);
        return v != null && v.length() > MAX_COMPLEMENTO ? v.substring(0, MAX_COMPLEMENTO) : v;
    }

    /** 14 dígitos, não todos iguais, com os dois dígitos verificadores corretos. */
    static boolean cnpjValido(String cnpj) {
        if (cnpj.length() != 14 || cnpj.chars().distinct().count() == 1) {
            return false;
        }
        int[] pesos1 = {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        int[] pesos2 = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        return digito(cnpj, pesos1) == cnpj.charAt(12) - '0'
                && digito(cnpj, pesos2) == cnpj.charAt(13) - '0';
    }

    private static int digito(String cnpj, int[] pesos) {
        int soma = 0;
        for (int i = 0; i < pesos.length; i++) {
            soma += (cnpj.charAt(i) - '0') * pesos[i];
        }
        int resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }
}
