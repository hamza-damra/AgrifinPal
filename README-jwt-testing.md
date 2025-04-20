# Testing JWT Authentication in AgrifinPalestine

This document provides instructions on how to test the JWT authentication functionality in the AgrifinPalestine application.

## Prerequisites

- The application is running
- You have access to a tool like Postman or curl to make HTTP requests

## Step 1: Register a User

First, register a new user by sending a POST request to the registration endpoint:

```
POST http://localhost:8080/api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "fullName": "Test User",
  "phone": "1234567890",
  "region": "Test Region",
  "agricultureType": "Fruits",
  "bio": "Test bio"
}
```

You should receive a response like:

```json
{
  "userId": 1,
  "username": "testuser",
  "email": "test@example.com",
  "message": "Registration successful",
  "success": true
}
```

## Step 2: Login

Next, login with the registered user by sending a POST request to the login endpoint:

```
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

You should receive a response containing a JWT token:

```json
{
  "userId": 1,
  "username": "testuser",
  "email": "test@example.com",
  "fullName": "Test User",
  "roles": ["ROLE_USER"],
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "tokenType": "Bearer",
  "message": "Login successful",
  "success": true
}
```

**Important**: Copy the token value from the response as you'll need it for the next steps.

## Step 3: Access Public Endpoint

Try accessing a public endpoint that doesn't require authentication:

```
GET http://localhost:8080/api/auth-test/public
```

You should receive a response like:

```json
{
  "message": "This is a public endpoint",
  "timestamp": "1618123456789"
}
```

## Step 4: Access Protected Endpoint Without Token

Try accessing a protected endpoint without providing a token:

```
GET http://localhost:8080/api/auth-test/protected
```

You should receive a 401 Unauthorized response.

## Step 5: Access Protected Endpoint With Token

Now, try accessing the protected endpoint with the JWT token:

```
GET http://localhost:8080/api/auth-test/protected
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9...
```

Replace `eyJhbGciOiJIUzUxMiJ9...` with the actual token you received from the login response.

You should receive a successful response:

```json
{
  "message": "This is a protected endpoint",
  "timestamp": "1618123456789"
}
```

## Step 6: Get Current User Information

You can also get information about the currently authenticated user:

```
GET http://localhost:8080/api/auth/me
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9...
```

You should receive a response containing the user's information:

```json
{
  "userId": 1,
  "username": "testuser",
  "email": "test@example.com",
  "fullName": "Test User",
  "phone": "1234567890",
  "region": "Test Region",
  "agricultureType": "Fruits",
  "bio": "Test bio",
  "profileImage": null,
  "createdAt": "2023-04-14T12:34:56.789"
}
```

## Troubleshooting

If you encounter any issues:

1. **401 Unauthorized**: Make sure you're including the token correctly in the Authorization header with the "Bearer " prefix.
2. **Token Expired**: JWT tokens expire after 24 hours by default. If your token has expired, you'll need to login again to get a new token.
3. **Invalid Token**: If you've modified the token or it's corrupted, you'll receive an error. Try logging in again to get a new token.

## Using Postman

If you're using Postman:

1. After logging in, copy the token from the response
2. For protected endpoints, go to the "Authorization" tab
3. Select "Bearer Token" from the Type dropdown
4. Paste your token in the "Token" field
5. Send your request
