# Login Functionality for AgrifinPalestine

This document describes the login functionality implemented for the AgrifinPalestine application.

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
      "token": "jwt-token-here",
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

## Implementation Details

The login functionality is implemented using the following components:

1. **LoginController**: Handles HTTP requests for authentication
2. **UserService**: Service layer that processes authentication requests
3. **UserServiceImpl**: Implementation of the UserService interface
4. **LoginRequest**: DTO for login request data
5. **LoginResponse**: DTO for login response data

## Current Implementation

The current implementation is a simple demonstration that:
- Accepts username and password
- Validates that both fields are not empty
- Returns a success response with a dummy token if validation passes
- Returns an error response if validation fails

## Future Enhancements

In a production environment, you would want to enhance this implementation with:

1. **Database Integration**: Validate credentials against user records in the database
2. **Password Encryption**: Store and validate hashed passwords
3. **JWT Token Generation**: Generate proper JWT tokens with claims
4. **Token Expiration**: Implement token expiration and refresh mechanisms
5. **Role-Based Authorization**: Add user roles and permissions
6. **Security Headers**: Implement proper security headers
7. **Rate Limiting**: Prevent brute force attacks

## How to Test

You can test the login functionality using:

1. **Postman or similar API testing tool**:
   - Send a POST request to `/api/auth/login` with username and password in the request body

2. **Unit Tests**:
   - Run the provided `LoginControllerTest` class to verify the controller behavior

3. **Curl**:
   ```bash
   curl -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","password":"password"}'
   ```
