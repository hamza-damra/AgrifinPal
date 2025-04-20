# Custom Exceptions for AgrifinPalestine

This document describes the custom exception handling implemented for the AgrifinPalestine application.

## Overview

The application uses a hierarchical exception system to provide meaningful error messages and appropriate HTTP status codes for different types of errors. This helps in:

1. Providing clear error messages to clients
2. Maintaining consistent error response formats
3. Proper logging of errors
4. Appropriate HTTP status codes for different error types

## Exception Hierarchy

```
BaseException
├── AuthenticationException
│   ├── InvalidCredentialsException
│   ├── TokenExpiredException
│   └── InvalidTokenException
├── ProductException
│   ├── ProductNotFoundException
│   ├── ProductCreationException
│   ├── ProductUpdateException
│   ├── ProductDeletionException
│   └── CategoryNotFoundException
└── StoreException
    ├── StoreNotFoundException
    ├── StoreCreationException
    ├── StoreUpdateException
    ├── StoreDeletionException
    ├── UserAlreadyHasStoreException
    └── UnauthorizedStoreAccessException
```

## Error Response Format

All exceptions are handled by the `GlobalExceptionHandler` which returns a consistent error response format:

```json
{
  "errorCode": "ERROR_CODE",
  "message": "Human-readable error message",
  "status": 400,
  "timestamp": "2023-04-15T12:34:56",
  "path": "/api/endpoint/that/failed"
}
```

## Authentication Exceptions

### InvalidCredentialsException
- **Error Code**: `AUTH_INVALID_CREDENTIALS`
- **Status Code**: 401 (Unauthorized)
- **Description**: Thrown when a user provides invalid login credentials

### TokenExpiredException
- **Error Code**: `AUTH_TOKEN_EXPIRED`
- **Status Code**: 401 (Unauthorized)
- **Description**: Thrown when a JWT token has expired

### InvalidTokenException
- **Error Code**: `AUTH_INVALID_TOKEN`
- **Status Code**: 401 (Unauthorized)
- **Description**: Thrown when a JWT token is invalid (malformed, wrong signature, etc.)

### UserAlreadyExistsException
- **Error Code**: `AUTH_USER_ALREADY_EXISTS`
- **Status Code**: 409 (Conflict)
- **Description**: Thrown when trying to register a user with a username or email that already exists

## Product Exceptions

### ProductNotFoundException
- **Error Code**: `PRODUCT_NOT_FOUND`
- **Status Code**: 404 (Not Found)
- **Description**: Thrown when a product with the specified ID does not exist

### ProductCreationException
- **Error Code**: `PRODUCT_CREATION_FAILED`
- **Status Code**: 400 (Bad Request)
- **Description**: Thrown when there's an error creating a product

### ProductUpdateException
- **Error Code**: `PRODUCT_UPDATE_FAILED`
- **Status Code**: 400 (Bad Request)
- **Description**: Thrown when there's an error updating a product

### ProductDeletionException
- **Error Code**: `PRODUCT_DELETION_FAILED`
- **Status Code**: 400 (Bad Request)
- **Description**: Thrown when there's an error deleting a product

### CategoryNotFoundException
- **Error Code**: `PRODUCT_CATEGORY_NOT_FOUND`
- **Status Code**: 404 (Not Found)
- **Description**: Thrown when a category with the specified ID does not exist

## Store Exceptions

### StoreNotFoundException
- **Error Code**: `STORE_NOT_FOUND`
- **Status Code**: 404 (Not Found)
- **Description**: Thrown when a store with the specified ID does not exist

### StoreCreationException
- **Error Code**: `STORE_CREATION_FAILED`
- **Status Code**: 400 (Bad Request)
- **Description**: Thrown when there's an error creating a store

### StoreUpdateException
- **Error Code**: `STORE_UPDATE_FAILED`
- **Status Code**: 400 (Bad Request)
- **Description**: Thrown when there's an error updating a store

### StoreDeletionException
- **Error Code**: `STORE_DELETION_FAILED`
- **Status Code**: 400 (Bad Request)
- **Description**: Thrown when there's an error deleting a store

### UserAlreadyHasStoreException
- **Error Code**: `STORE_USER_ALREADY_HAS_STORE`
- **Status Code**: 409 (Conflict)
- **Description**: Thrown when a user tries to create a store but already has one

### UnauthorizedStoreAccessException
- **Error Code**: `STORE_UNAUTHORIZED_ACCESS`
- **Status Code**: 403 (Forbidden)
- **Description**: Thrown when a user tries to access or modify a store they don't own

## Using Custom Exceptions

### In Controllers

```java
@GetMapping("/{productId}")
public ResponseEntity<ProductResponse> getProductById(@PathVariable Integer productId) {
    try {
        ProductResponse product = productService.getProductById(productId);
        return ResponseEntity.ok(product);
    } catch (ProductNotFoundException ex) {
        // No need to handle here, GlobalExceptionHandler will take care of it
        throw ex;
    }
}
```

### In Services

```java
public ProductResponse getProductById(Integer productId) {
    Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ProductNotFoundException(productId));
    
    return mapToProductResponse(product);
}
```

## Benefits

1. **Consistent Error Handling**: All errors are handled in a consistent way
2. **Clear Error Messages**: Clients receive clear, specific error messages
3. **Appropriate Status Codes**: Each type of error returns the appropriate HTTP status code
4. **Detailed Logging**: Errors are logged with appropriate severity levels
5. **Maintainability**: Easy to add new exception types as needed
