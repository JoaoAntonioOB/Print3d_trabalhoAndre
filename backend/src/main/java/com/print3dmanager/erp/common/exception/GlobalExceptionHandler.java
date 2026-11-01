package com.print3dmanager.erp.common.exception;

import com.print3dmanager.erp.common.dto.ApiErrorResponse;
import com.print3dmanager.erp.common.dto.ApiErrorResponse.FieldError;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.mapping.PropertyReferenceException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/** Converte exceções em respostas {@code { code, message, fieldErrors[] }}. */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidacao(MethodArgumentNotValidException ex) {
        List<FieldError> erros = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> new FieldError(e.getField(), e.getDefaultMessage()))
                .toList();
        return ResponseEntity.badRequest().body(
                ApiErrorResponse.validation("Verifique os campos informados.", erros));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleCorpoIlegivel() {
        return erro(HttpStatus.BAD_REQUEST, "BAD_REQUEST",
                "Corpo da requisição ausente ou JSON malformado.");
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiErrorResponse> handleCredenciaisInvalidas() {
        return erro(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "E-mail ou senha inválidos.");
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiErrorResponse> handleAutenticacao() {
        return erro(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Falha na autenticação.");
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNaoEncontrado(ResourceNotFoundException ex) {
        return erro(HttpStatus.NOT_FOUND, "NOT_FOUND", ex.getMessage());
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleRotaInexistente() {
        return erro(HttpStatus.NOT_FOUND, "NOT_FOUND", "Recurso não encontrado.");
    }

    @ExceptionHandler(ResourceConflictException.class)
    public ResponseEntity<ApiErrorResponse> handleConflito(ResourceConflictException ex) {
        return erro(HttpStatus.CONFLICT, "CONFLICT", ex.getMessage());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleIntegridade(DataIntegrityViolationException ex,
                                                              HttpServletRequest request) {
        log.warn("Violação de integridade em {} {}", request.getMethod(), request.getRequestURI());
        return erro(HttpStatus.CONFLICT, "CONFLICT",
                "Operação não permitida: o registro está vinculado a outros dados.");
    }

    @ExceptionHandler(PropertyReferenceException.class)
    public ResponseEntity<ApiErrorResponse> handleOrdenacaoInvalida(PropertyReferenceException ex) {
        return erro(HttpStatus.BAD_REQUEST, "BAD_REQUEST",
                "Parâmetro de ordenação inválido: " + ex.getPropertyName());
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiErrorResponse> handleParametroInvalido(
            MethodArgumentTypeMismatchException ex) {
        Class<?> tipo = ex.getRequiredType();
        String valores = tipo != null && tipo.isEnum()
                ? " Valores aceitos: " + Arrays.toString(tipo.getEnumConstants())
                : "";
        return erro(HttpStatus.BAD_REQUEST, "BAD_REQUEST",
                "Valor inválido para o parâmetro '%s'.%s".formatted(ex.getName(), valores));
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiErrorResponse> handleRegraDeNegocio(BusinessException ex) {
        return erro(HttpStatus.BAD_REQUEST, "BUSINESS_RULE", ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleErroInterno(Exception ex,
                                                              HttpServletRequest request) {
        log.error("Erro interno em {} {}", request.getMethod(), request.getRequestURI(), ex);
        return erro(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR",
                "Erro interno inesperado. Tente novamente mais tarde.");
    }

    private ResponseEntity<ApiErrorResponse> erro(HttpStatus status, String code, String message) {
        return ResponseEntity.status(status).body(ApiErrorResponse.of(code, message));
    }
}
