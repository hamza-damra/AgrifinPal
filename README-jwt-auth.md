# JWT Authentication for AgrifinPalestine

This document describes the JWT authentication implementation for the AgrifinPalestine application.

## Overview

The application uses JSON Web Tokens (JWT) for authentication. When a user logs in with valid credentials, the server generates a JWT token that the client can use for subsequent authenticated requests.

## Authentication Flow

1. **Registration**: User registers with username, email, password, and other details
2. **Login**: User provides username and password
3. **Token Generation**: Server validates credentials and generates a JWT token
4. **Authenticated Requests**: Client includes the JWT token in the Authorization header for subsequent requests
5. **Token Validation**: Server validates the token for each protected endpoint

## API Endpoints

### Login

- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "username": "your_username",
    "password": "your_password"
  }
  ```
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    ```json
    {
      "userId": 1,
      "username": "your_username",
      "email": "your_email@example.com",
      "fullName": "Your Full Name",
      "roles": ["ROLE_USER"],
      "token": "eyJhbGciOiJIUzUxMiJ9...",
      "tokenType": "Bearer",
      "message": "Login successful",
      "success": true
    }
    ```
- **Error Response**:
  - **Code**: 400 Bad Request
  - **Content**:
    ```json
    {
      "message": "Invalid username or password",
      "success": false
    }
    ```

### Registration

- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "username": "your_username",
    "email": "your_email@example.com",
    "password": "your_password",
    "fullName": "Your Full Name",
    "phone": "1234567890",
    "region": "Your Region",
    "agricultureType": "Fruits",
    "bio": "Your bio information"
  }
  ```
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    ```json
    {
      "userId": 1,
      "username": "your_username",
      "email": "your_email@example.com",
      "message": "Registration successful",
      "success": true
    }
    ```

## Using the JWT Token

After successful login, include the JWT token in the Authorization header for subsequent requests:

```
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9...
```

## Test Endpoints

The application includes test endpoints to verify authentication:

- **Public Endpoint**: `/api/test/all` - Accessible without authentication
- **Protected Endpoint**: `/api/test/user` - Requires authentication with ROLE_USER

## Security Implementation

The JWT authentication is implemented using:

1. **Spring Security**: For authentication and authorization
2. **JJWT Library**: For JWT token generation and validation
3. **BCrypt**: For password hashing

## Configuration

JWT configuration is defined in `application.properties`:

```properties
jwt.secret=agrifinPalestineSecretKeyForJwtAuthenticationVeryLongAndSecure
jwt.expirationMs=86400000  # 24 hours
```

## Security Considerations

1. **Token Expiration**: Tokens expire after 24 hours by default
2. **Secure Secret Key**: A long, random secret key is used for token signing
3. **Password Hashing**: Passwords are hashed using BCrypt before storage
4. **HTTPS**: In production, always use HTTPS to protect token transmission

## Testing with Postman

1. **Register a User**:
   - Send a POST request to `/api/auth/register` with user details

2. **Login**:
   - Send a POST request to `/api/auth/login` with username and password
   - Save the token from the response

3. **Access Protected Endpoint**:
   - Send a GET request to `/api/test/user`
   - Add header: `Authorization: Bearer your_token_here`
