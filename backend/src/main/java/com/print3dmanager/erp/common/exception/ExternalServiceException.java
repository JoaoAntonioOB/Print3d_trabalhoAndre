package com.print3dmanager.erp.common.exception;

/** Falha de uma API externa (fora do ar, timeout). Vira HTTP 503. */
public class ExternalServiceException extends RuntimeException {

    public ExternalServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}
