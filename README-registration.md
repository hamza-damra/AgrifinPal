# Registration Functionality for AgrifinPalestine

This document describes the registration functionality implemented for the AgrifinPalestine application.

## API Endpoints

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
- **Error Response**:
  - **Code**: 400 Bad Request
  - **Content**:
    ```json
    {
      "message": "Username already exists",
      "success": false
    }
    ```
  - OR
    ```json
    {
      "message": "Email already exists",
      "success": false
    }
    ```

## Implementation Details

The registration functionality is implemented using the following components:

1. **LoginController**: Handles HTTP requests for registration
2. **UserService**: Service layer that processes registration requests
3. **UserServiceImpl**: Implementation of the UserService interface
4. **RegistrationRequest**: DTO for registration request data
5. **RegistrationResponse**: DTO for registration response data
6. **User Entity**: Database entity for storing user information

## Current Implementation

The current implementation:
- Validates that the username and email are unique
- Stores user information in the database
- Returns appropriate success or error responses

## Future Enhancements

In a production environment, you would want to enhance this implementation with:

1. **Password Encryption**: Store hashed passwords instead of plain text
2. **Email Verification**: Send verification emails to confirm user email addresses
3. **Input Validation**: Add more robust validation for input fields
4. **CAPTCHA**: Implement CAPTCHA to prevent automated registrations
5. **Rate Limiting**: Prevent abuse by limiting registration attempts

## How to Test

You can test the registration functionality using:

1. **Postman or similar API testing tool**:
   - Send a POST request to `/api/auth/register` with the required fields in the request body

2. **Unit Tests**:
   - Run the provided `RegistrationControllerTest` class to verify the controller behavior

3. **Curl**:
   ```bash
   curl -X POST http://localhost:8080/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "username": "testuser",
       "email": "test@example.com",
       "password": "password",
       "fullName": "Test User",
       "phone": "1234567890",
       "region": "Test Region",
       "agricultureType": "Fruits",
       "bio": "Test bio"
     }'
   ```
