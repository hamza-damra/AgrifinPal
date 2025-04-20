# Product Management for AgrifinPalestine

This document describes the product management functionality implemented for the AgrifinPalestine application.

## Overview

The product management system allows users to create, read, update, and delete agricultural products. It also provides search and filtering capabilities to help users find products based on various criteria.

## API Endpoints

### Create a Product

- **URL**: `/api/products`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "storeId": 1,
    "categoryId": 1,
    "productName": "Organic Apples",
    "productDescription": "Fresh organic apples from local farms",
    "price": 5.99,
    "quantity": 100,
    "unit": "kg",
    "productImage": "apple.jpg",
    "isOrganic": true,
    "isAvailable": true
  }
  ```
- **Success Response**:
  - **Code**: 201 Created
  - **Content**:
    ```json
    {
      "productId": 1,
      "storeId": 1,
      "storeName": "Farm Store",
      "categoryId": 1,
      "categoryName": "Fruits",
      "productName": "Organic Apples",
      "productDescription": "Fresh organic apples from local farms",
      "price": 5.99,
      "quantity": 100,
      "unit": "kg",
      "productImage": "apple.jpg",
      "isOrganic": true,
      "isAvailable": true,
      "createdAt": "2023-04-15T10:30:00",
      "updatedAt": "2023-04-15T10:30:00"
    }
    ```

### Get a Product by ID

- **URL**: `/api/products/{productId}`
- **Method**: `GET`
- **Authentication**: Not required
- **Success Response**:
  - **Code**: 200 OK
  - **Content**: Same as above

### Update a Product

- **URL**: `/api/products/{productId}`
- **Method**: `PUT`
- **Authentication**: Required
- **Request Body**: Same as create (fields can be partial)
- **Success Response**:
  - **Code**: 200 OK
  - **Content**: Updated product details

### Delete a Product

- **URL**: `/api/products/{productId}`
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

### Get All Products

- **URL**: `/api/products`
- **Method**: `GET`
- **Authentication**: Not required
- **Success Response**:
  - **Code**: 200 OK
  - **Content**: Array of products

### Get Products by Store

- **URL**: `/api/products/store/{storeId}`
- **Method**: `GET`
- **Authentication**: Not required
- **Success Response**:
  - **Code**: 200 OK
  - **Content**: Array of products from the specified store

### Get Products by Category

- **URL**: `/api/products/category/{categoryId}`
- **Method**: `GET`
- **Authentication**: Not required
- **Success Response**:
  - **Code**: 200 OK
  - **Content**: Array of products in the specified category

### Search Products

- **URL**: `/api/products/search`
- **Method**: `POST`
- **Authentication**: Not required
- **Request Body**:
  ```json
  {
    "storeId": null,
    "categoryId": 1,
    "keyword": "organic",
    "minPrice": 1.00,
    "maxPrice": 10.00,
    "isOrganic": true,
    "isAvailable": true,
    "page": 0,
    "size": 10,
    "sortBy": "price",
    "sortDirection": "asc"
  }
  ```
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    ```json
    {
      "products": [
        {
          "productId": 1,
          "storeId": 1,
          "storeName": "Farm Store",
          "categoryId": 1,
          "categoryName": "Fruits",
          "productName": "Organic Apples",
          "productDescription": "Fresh organic apples from local farms",
          "price": 5.99,
          "quantity": 100,
          "unit": "kg",
          "productImage": "apple.jpg",
          "isOrganic": true,
          "isAvailable": true,
          "createdAt": "2023-04-15T10:30:00",
          "updatedAt": "2023-04-15T10:30:00"
        }
      ],
      "currentPage": 0,
      "totalItems": 1,
      "totalPages": 1
    }
    ```

## Implementation Details

The product management functionality is implemented using the following components:

1. **Product Entity**: Database entity for storing product information
2. **ProductRepository**: JPA repository for database operations
3. **ProductService**: Service interface defining product operations
4. **ProductServiceImpl**: Implementation of the service interface
5. **ProductController**: REST controller for handling HTTP requests
6. **DTOs**: Data Transfer Objects for request and response data

## Features

1. **CRUD Operations**: Create, Read, Update, and Delete products
2. **Search and Filtering**: Search products by various criteria
3. **Pagination**: Paginated results for large datasets
4. **Sorting**: Sort results by different fields
5. **Authentication**: Secure endpoints that modify data

## Testing

The product functionality includes unit tests for the service layer to ensure correct behavior.

## Usage Examples

### Creating a Product

```bash
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "storeId": 1,
    "categoryId": 1,
    "productName": "Organic Apples",
    "productDescription": "Fresh organic apples from local farms",
    "price": 5.99,
    "quantity": 100,
    "unit": "kg",
    "productImage": "apple.jpg",
    "isOrganic": true,
    "isAvailable": true
  }'
```

### Searching for Products

```bash
curl -X POST http://localhost:8080/api/products/search \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": 1,
    "keyword": "organic",
    "minPrice": 1.00,
    "maxPrice": 10.00,
    "isOrganic": true,
    "page": 0,
    "size": 10,
    "sortBy": "price",
    "sortDirection": "asc"
  }'
```
