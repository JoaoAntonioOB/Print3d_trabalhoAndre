package com.print3dmanager.erp.filament.mapper;

import com.print3dmanager.erp.filament.dto.FilamentCreateRequest;
import com.print3dmanager.erp.filament.dto.FilamentResponse;
import com.print3dmanager.erp.filament.dto.FilamentUpdateRequest;
import com.print3dmanager.erp.filament.dto.MovimentacaoResponse;
import com.print3dmanager.erp.filament.model.Filament;
import com.print3dmanager.erp.filament.model.MovimentacaoEstoque;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper
public interface FilamentMapper {

    @Mapping(target = "abaixoDoMinimo", expression = "java(filament.isAbaixoDoMinimo())")
    FilamentResponse toResponse(Filament filament);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "criadoEm", ignore = true)
    @Mapping(target = "atualizadoEm", ignore = true)
    Filament toEntity(FilamentCreateRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "criadoEm", ignore = true)
    @Mapping(target = "atualizadoEm", ignore = true)
    @Mapping(target = "quantidadeGramas", ignore = true)
    void atualizar(@MappingTarget Filament filament, FilamentUpdateRequest request);

    MovimentacaoResponse toResponse(MovimentacaoEstoque movimentacao);
}
