package com.print3dmanager.erp.client.service;

import com.print3dmanager.erp.client.dto.ClientCreateRequest;
import com.print3dmanager.erp.client.dto.ClientResponse;
import com.print3dmanager.erp.client.dto.ClientUpdateRequest;
import com.print3dmanager.erp.client.mapper.ClientMapper;
import com.print3dmanager.erp.client.model.Client;
import com.print3dmanager.erp.client.repository.ClientRepository;
import com.print3dmanager.erp.common.dto.PageResponse;
import com.print3dmanager.erp.common.exception.ResourceConflictException;
import com.print3dmanager.erp.common.exception.ResourceNotFoundException;
import com.print3dmanager.erp.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Regras de clientes: CPF/CNPJ único e exclusão bloqueada se houver pedidos. */
@Service
@RequiredArgsConstructor
public class ClientService {

    private final ClientRepository clientRepository;
    private final OrderRepository orderRepository;
    private final ClientMapper clientMapper;

    @Transactional(readOnly = true)
    public PageResponse<ClientResponse> listar(String busca, Pageable pageable) {
        String termo = (busca == null || busca.isBlank()) ? null : busca.trim();
        return PageResponse.de(clientRepository.buscar(termo, pageable).map(clientMapper::toResponse));
    }

    @Transactional(readOnly = true)
    public ClientResponse buscarPorId(Long id) {
        return clientMapper.toResponse(obterCliente(id));
    }

    @Transactional
    public ClientResponse criar(ClientCreateRequest request) {
        String cpfCnpj = normalizar(request.cpfCnpj());
        if (cpfCnpj != null && clientRepository.existsByCpfCnpj(cpfCnpj)) {
            throw new ResourceConflictException("Já existe um cliente com este CPF/CNPJ.");
        }
        Client cliente = clientMapper.toEntity(request);
        cliente.setCpfCnpj(cpfCnpj);
        return clientMapper.toResponse(clientRepository.save(cliente));
    }

    @Transactional
    public ClientResponse atualizar(Long id, ClientUpdateRequest request) {
        String cpfCnpj = normalizar(request.cpfCnpj());
        if (cpfCnpj != null && clientRepository.existsByCpfCnpjAndIdNot(cpfCnpj, id)) {
            throw new ResourceConflictException("Já existe outro cliente com este CPF/CNPJ.");
        }
        Client cliente = obterCliente(id);
        clientMapper.atualizar(cliente, request);
        cliente.setCpfCnpj(cpfCnpj);
        return clientMapper.toResponse(cliente);
    }

    @Transactional
    public void excluir(Long id) {
        Client cliente = obterCliente(id);
        if (orderRepository.existsByClienteId(id)) {
            throw new ResourceConflictException(
                    "Não é possível excluir o cliente %s: ele possui pedidos.".formatted(cliente.getNome()));
        }
        clientRepository.delete(cliente);
    }

    private Client obterCliente(Long id) {
        return clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", id));
    }

    private String normalizar(String cpfCnpj) {
        return (cpfCnpj == null || cpfCnpj.isBlank()) ? null : cpfCnpj.trim();
    }
}
