package com.intelligentfarm.auth;

import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class AuthExceptionHandler {

    @ExceptionHandler(AuthService.ValidationException.class)
    public ResponseEntity<AuthDtos.ErrorResponse> validation(AuthService.ValidationException exception) {
        return ResponseEntity.badRequest()
                .body(new AuthDtos.ErrorResponse("validation_error", exception.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<AuthDtos.ErrorResponse> invalidRequest(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getDefaultMessage() == null ? "Invalid request." : error.getDefaultMessage())
                .distinct()
                .collect(Collectors.joining(" "));
        return ResponseEntity.badRequest()
                .body(new AuthDtos.ErrorResponse("validation_error", message));
    }

    @ExceptionHandler(AuthService.ConflictException.class)
    public ResponseEntity<AuthDtos.ErrorResponse> conflict(AuthService.ConflictException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new AuthDtos.ErrorResponse("account_conflict", exception.getMessage()));
    }

    @ExceptionHandler(AuthService.UnauthorizedException.class)
    public ResponseEntity<AuthDtos.ErrorResponse> unauthorized(AuthService.UnauthorizedException exception) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new AuthDtos.ErrorResponse("invalid_credentials", exception.getMessage()));
    }

    @ExceptionHandler(AuthService.UnverifiedAccountException.class)
    public ResponseEntity<AuthDtos.ErrorResponse> unverified(
            AuthService.UnverifiedAccountException exception) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new AuthDtos.ErrorResponse("email_not_verified", exception.getMessage()));
    }

    @ExceptionHandler(InvitationService.InvitationException.class)
    public ResponseEntity<AuthDtos.ErrorResponse> invitation(
            InvitationService.InvitationException exception) {
        return ResponseEntity.status(exception.getStatus())
                .body(new AuthDtos.ErrorResponse(exception.getCode(), exception.getMessage()));
    }
}
