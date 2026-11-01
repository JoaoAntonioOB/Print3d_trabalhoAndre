package com.print3dmanager.erp.common.dto;

import java.util.List;

/** Formato padrão de erro da API: {@code { code, message, fieldErrors[] }}. */
public record ApiErrorResponse(
        String code,
        String message,
        List<FieldError> fieldErrors
) {

    public record FieldError(String field, String message) {
    }

    public static ApiErrorResponse of(String code, String message) {
        return new ApiErrorResponse(code, message, List.of());
    }

    public static ApiErrorResponse validation(String message, List<FieldError> fieldErrors) {
        return new ApiErrorResponse("VALIDATION_ERROR", message, fieldErrors);
    }
}
