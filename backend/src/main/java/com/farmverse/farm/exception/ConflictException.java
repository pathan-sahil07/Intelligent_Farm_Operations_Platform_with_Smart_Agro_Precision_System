package com.farmverse.farm.exception;

/** Business-rule conflict, mapped to HTTP 409. */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
