# Store and Category Management for AgrifinPalestine

This document describes the store and category management functionality implemented for the AgrifinPalestine application.

## Store Management

### API Endpoints

#### Create a Store

- **URL**: `/api/stores`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "userId": 1,
    "name": "Organic Farm",
    "description": "We grow organic fruits and vegetables",
    "logo": "logo.jpg",
    "banner": "banner.jpg",
    "location": "Ramallah, Palestine",
    "contactInfo": "+970 59 123 4567"
  }
  ```
- **Success Response**:
  - **Code**: 201 Created
  - **Content**:
    ```json
    {
      "id": 1,
      "userId": 1,
      "name": "Organic Farm",
      "description": "We grow organic fruits and vegetables",
      "logo": "logo.jpg",
      "banner": "banner.jpg",
      "location": "Ramallah, Palestine",
      "contactInfo": "+970 59 123 4567",
      "createdAt": "2023-04-15T10:30:00",
      "updatedAt": "2023-04-15T10:30:00"
    }
    ```

#### Get a Store by ID

- **URL**: `/api/stores/{storeId}`
- **Method**: `GET`
- **Authentication**: Not required
- **Success Response**:
  - **Code**: 200 OK
  - **Content**: Same as above

#### Get a Store by User ID

- **URL**: `/api/stores/user/{userId}`
- **Method**: `GET`
- **Authentication**: Not required
- **Success Response**:
  - **Code**: 200 OK
  - **Content**: Same as above

#### Update a Store

- **URL**: `/api/stores/{storeId}`
- **Method**: `PUT`
- **Authentication**: Required
- **Request Body**: Same as create (fields can be partial)
- **Success Response**:
  - **Code**: 200 OK
  - **Content**: Updated store details

#### Delete a Store

- **URL**: `/api/stores/{storeId}`
- **Method**: `DELETE`
- **Authentication**: Required
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    ```json
    {
      "deleted": true
    }
    ```

#### Get All Stores

- **URL**: `/api/stores`
- **Method**: `GET`
- **Authentication**: Not required
- **Success Response**:
  - **Code**: 200 OK
  - **Content**: Array of stores

## Category Management

### API Endpoints

#### Create a Category

- **URL**: `/api/categories`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "nameEn": "Fruits",
    "nameAr": "فواكه",
    "description": "Fresh fruits from local farms",
    "image": "fruits.jpg"
  }
  ```
- **Success Response**:
  - **Code**: 201 Created
  - **Content**:
    ```json
    {
      "id": 1,
      "nameEn": "Fruits",
      "nameAr": "فواكه",
      "description": "Fresh fruits from local farms",
      "image": "fruits.jpg"
    }
    ```

#### Get a Category by ID

- **URL**: `/api/categories/{categoryId}`
- **Method**: `GET`
- **Authentication**: Not required
- **Success Response**:
  - **Code**: 200 OK
  - **Content**: Same as above

#### Update a Category

- **URL**: `/api/categories/{categoryId}`
- **Method**: `PUT`
- **Authentication**: Required
- **Request Body**: Same as create (fields can be partial)
- **Success Response**:
  - **Code**: 200 OK
  - **Content**: Updated category details

#### Delete a Category

- **URL**: `/api/categories/{categoryId}`
- **Method**: `DELETE`
- **Authentication**: Required
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    ```json
    {
      "deleted": true
    }
    ```

#### Get All Categories

- **URL**: `/api/categories`
- **Method**: `GET`
- **Authentication**: Not required
- **Success Response**:
  - **Code**: 200 OK
  - **Content**: Array of categories

## Implementation Details

The store and category management functionality is implemented using the following components:

1. **Entities**: Database entities for storing store and category information
2. **Repositories**: JPA repositories for database operations
3. **Services**: Service interfaces and implementations defining business logic
4. **Controllers**: REST controllers for handling HTTP requests
5. **DTOs**: Data Transfer Objects for request and response data

## Features

1. **CRUD Operations**: Create, Read, Update, and Delete stores and categories
2. **User Association**: Stores are associated with users
3. **Validation**: Validation for required fields and unique constraints
4. **Authentication**: Secure endpoints that modify data

## Usage Examples

### Creating a Store

```bash
curl -X POST http://localhost:8080/api/stores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "userId": 1,
    "name": "Organic Farm",
    "description": "We grow organic fruits and vegetables",
    "logo": "logo.jpg",
    "banner": "banner.jpg",
    "location": "Ramallah, Palestine",
    "contactInfo": "+970 59 123 4567"
  }'
```

### Getting All Categories

```bash
curl -X GET http://localhost:8080/api/categories
```
