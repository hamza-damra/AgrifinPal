# AgrifinPal Platform Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Features](#features)
5. [API Reference](#api-reference)
6. [Authentication](#authentication)
7. [Database Schema](#database-schema)
8. [Deployment](#deployment)
9. [Development Setup](#development-setup)
10. [Testing](#testing)
11. [Security Considerations](#security-considerations)
12. [Payment Integration](#payment-integration)
13. [Future Enhancements](#future-enhancements)

## Introduction

AgrifinPal is a comprehensive platform designed to connect farmers and buyers directly, supporting local agriculture and promoting sustainable practices in Palestine. The platform serves as a marketplace for agricultural products, enabling farmers to sell their produce directly to consumers, eliminating intermediaries, and ensuring fair prices for both parties.

### Mission

To empower Palestinian farmers by providing a digital marketplace that increases their market reach, improves their income, and promotes sustainable agricultural practices.

### Vision

To create a thriving agricultural ecosystem in Palestine where farmers have direct access to markets, consumers have access to fresh, local produce, and sustainable farming practices are encouraged and rewarded.

## System Architecture

AgrifinPal follows a modern, layered architecture pattern:

1. **Presentation Layer**: Web interface built with Thymeleaf templates and Tailwind CSS
2. **API Layer**: RESTful API endpoints for client-server communication
3. **Service Layer**: Business logic implementation
4. **Data Access Layer**: Database interaction through repositories
5. **Database Layer**: MySQL database for persistent storage

### Component Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Web Interface  │────▶│  REST API       │────▶│  Service Layer  │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
                                               ┌─────────────────┐
                                               │  Data Access    │
                                               └────────┬────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │  Database       │
                                               └─────────────────┘
```

## Technology Stack

### Backend
- **Java 17**: Core programming language
- **Spring Boot**: Application framework
- **Spring Security**: Authentication and authorization
- **Spring Data JPA**: Data access layer
- **Hibernate**: ORM for database operations
- **MySQL**: Relational database

### Frontend
- **Thymeleaf**: Server-side Java template engine
- **Tailwind CSS**: Utility-first CSS framework
- **JavaScript**: Client-side scripting

### DevOps & Infrastructure
- **Docker**: Containerization
- **Render.com**: Cloud deployment platform
- **Maven**: Build and dependency management
- **Git**: Version control

### Payment Processing
- **Stripe**: Secure payment processing

## Features

### User Management
- **Registration and Authentication**: Secure user registration and login
- **Role-based Access Control**: Different permissions for buyers, sellers, and administrators
- **Profile Management**: User profile creation and management

### Marketplace
- **Product Listings**: Farmers can list their agricultural products
- **Search and Filtering**: Users can search and filter products by various criteria
- **Product Categories**: Products organized by categories

### Store Management
- **Store Creation**: Sellers can create and manage their stores
- **Product Management**: Add, edit, and remove products
- **Inventory Management**: Track product quantities and availability

### Shopping Experience
- **Shopping Cart**: Add products to cart and manage quantities
- **Checkout Process**: Streamlined checkout experience
- **Order Management**: Track and manage orders

### Payment Processing
- **Secure Payments**: Integration with Stripe for secure payment processing
- **Payment Status Tracking**: Monitor payment status for orders

### Reviews and Ratings
- **Product Reviews**: Users can leave reviews for products
- **Seller Ratings**: Rate and review sellers

### Admin Dashboard
- **User Management**: Administrators can manage users
- **Content Moderation**: Review and moderate product listings
- **Analytics**: View platform statistics and reports

## API Reference

### Authentication Endpoints

| Endpoint | Method | Description | Authentication Required |
|----------|--------|-------------|------------------------|
| `/api/auth/register` | POST | Register a new user | No |
| `/api/auth/login` | POST | Authenticate a user | No |
| `/api/auth/user-info` | GET | Get current user information | Yes |
| `/api/auth/check-auth` | GET | Check authentication status | No |

### Product Endpoints

| Endpoint | Method | Description | Authentication Required |
|----------|--------|-------------|------------------------|
| `/api/products` | GET | Get all products | No |
| `/api/products/{id}` | GET | Get product by ID | No |
| `/api/products/search` | GET | Search products | No |
| `/api/products/category/{categoryId}` | GET | Get products by category | No |
| `/api/products/manage` | POST | Create a new product | Yes (SELLER, ADMIN) |
| `/api/products/manage/{id}` | PUT | Update a product | Yes (SELLER, ADMIN) |
| `/api/products/manage/{id}` | DELETE | Delete a product | Yes (SELLER, ADMIN) |
| `/api/products/user` | GET | Get products for current user | Yes |

### Store Endpoints

| Endpoint | Method | Description | Authentication Required |
|----------|--------|-------------|------------------------|
| `/api/stores/public` | GET | Get all stores | No |
| `/api/stores/public/{id}` | GET | Get store by ID | No |
| `/api/stores/manage` | POST | Create a new store | Yes (SELLER, ADMIN) |
| `/api/stores/manage/{id}` | PUT | Update a store | Yes (SELLER, ADMIN) |
| `/api/stores/manage/{id}` | DELETE | Delete a store | Yes (SELLER, ADMIN) |

### Cart Endpoints

| Endpoint | Method | Description | Authentication Required |
|----------|--------|-------------|------------------------|
| `/api/cart` | GET | Get user's cart | Yes (USER) |
| `/api/cart/add` | POST | Add item to cart | Yes (USER) |
| `/api/cart/update` | PUT | Update cart item | Yes (USER) |
| `/api/cart/remove/{cartItemId}` | DELETE | Remove item from cart | Yes (USER) |
| `/api/cart/clear` | DELETE | Clear cart | Yes (USER) |

### Order Endpoints

| Endpoint | Method | Description | Authentication Required |
|----------|--------|-------------|------------------------|
| `/api/orders` | GET | Get user's orders | Yes |
| `/api/orders/{id}` | GET | Get order by ID | Yes |
| `/api/orders/create` | POST | Create a new order | Yes (USER) |

### Category Endpoints

| Endpoint | Method | Description | Authentication Required |
|----------|--------|-------------|------------------------|
| `/api/categories` | GET | Get all categories | No |
| `/api/categories/{id}` | GET | Get category by ID | No |
| `/api/categories/manage` | POST | Create a new category | Yes (ADMIN) |
| `/api/categories/manage/{id}` | PUT | Update a category | Yes (ADMIN) |
| `/api/categories/manage/{id}` | DELETE | Delete a category | Yes (ADMIN) |

### Admin Endpoints

| Endpoint | Method | Description | Authentication Required |
|----------|--------|-------------|------------------------|
| `/api/admin/users` | GET | Get all users | Yes (ADMIN) |
| `/api/admin/users/{id}` | GET | Get user by ID | Yes (ADMIN) |
| `/api/admin/users/{id}/status` | PUT | Update user status | Yes (ADMIN) |
| `/api/admin/create-admin` | POST | Create an admin user | No (Initial setup only) |

## Authentication

AgrifinPal uses JSON Web Tokens (JWT) for authentication. When a user logs in with valid credentials, the server generates a JWT token that the client can use for subsequent authenticated requests.

### Authentication Flow

1. **User Registration**: User registers with username, email, password, and other required information
2. **User Login**: User provides credentials and receives a JWT token
3. **Token Usage**: Client includes the JWT token in the Authorization header for authenticated requests
4. **Token Validation**: Server validates the token for each protected request
5. **Token Expiration**: Tokens expire after 24 hours by default

### Using the JWT Token

After successful login, include the JWT token in the Authorization header for subsequent requests:

```
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9...
```

### Security Implementation

The JWT authentication is implemented using:

1. **Spring Security**: For authentication and authorization
2. **JJWT Library**: For JWT token generation and validation
3. **BCrypt**: For password hashing

### Role-Based Access Control

The platform implements role-based access control with the following roles:

1. **USER**: Regular users who can browse products and make purchases
2. **SELLER**: Users who can create stores and manage products
3. **ADMIN**: Administrators with full access to the platform

## Database Schema

### Core Entities

#### Users
- `user_id`: Primary key
- `username`: Unique username
- `email`: Unique email address
- `password_hash`: Hashed password
- `full_name`: User's full name
- `phone`: Contact phone number
- `region`: User's region
- `agriculture_type`: Type of agriculture (for farmers)
- `profile_image`: URL to profile image
- `bio`: User biography
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp
- `status`: User status (ACTIVE, INACTIVE, SUSPENDED)
- `is_active`: Boolean indicating if the user is active

#### Roles
- `role_id`: Primary key
- `name`: Role name (ROLE_USER, ROLE_SELLER, ROLE_ADMIN)

#### User_Roles (Junction Table)
- `user_id`: Foreign key to users
- `role_id`: Foreign key to roles

#### Stores
- `store_id`: Primary key
- `user_id`: Foreign key to users
- `store_name`: Store name
- `store_description`: Store description
- `store_logo`: URL to store logo
- `store_banner`: URL to store banner
- `location`: Store location
- `contact_info`: Contact information
- `created_at`: Store creation timestamp
- `updated_at`: Last update timestamp

#### Products
- `product_id`: Primary key
- `store_id`: Foreign key to stores
- `category_id`: Foreign key to product categories
- `product_name`: Product name
- `product_description`: Product description
- `price`: Product price
- `quantity`: Available quantity
- `unit`: Unit of measurement
- `product_image`: URL to product image
- `is_organic`: Boolean indicating if the product is organic
- `is_available`: Boolean indicating if the product is available
- `created_at`: Product creation timestamp
- `updated_at`: Last update timestamp

#### Product Categories
- `category_id`: Primary key
- `category_name`: Category name
- `category_description`: Category description
- `category_image`: URL to category image
- `created_at`: Category creation timestamp
- `updated_at`: Last update timestamp

#### Carts
- `cart_id`: Primary key
- `user_id`: Foreign key to users
- `total_price`: Total cart price
- `total_quantity`: Total quantity of items
- `status`: Cart status (ACTIVE, CHECKOUT, COMPLETED)
- `created_at`: Cart creation timestamp
- `updated_at`: Last update timestamp

#### Cart Items
- `cart_item_id`: Primary key
- `cart_id`: Foreign key to carts
- `product_id`: Foreign key to products
- `quantity`: Quantity of the product
- `price`: Price at the time of adding to cart
- `created_at`: Item addition timestamp
- `updated_at`: Last update timestamp

#### Orders
- `order_id`: Primary key
- `user_id`: Foreign key to users
- `total_amount`: Total order amount
- `status`: Order status
- `payment_status`: Payment status
- `shipping_address`: Shipping address
- `created_at`: Order creation timestamp
- `updated_at`: Last update timestamp

#### Order Items
- `order_item_id`: Primary key
- `order_id`: Foreign key to orders
- `product_id`: Foreign key to products
- `quantity`: Quantity ordered
- `price`: Price at the time of order
- `created_at`: Item addition timestamp
- `updated_at`: Last update timestamp

#### Reviews
- `review_id`: Primary key
- `user_id`: Foreign key to users
- `product_id`: Foreign key to products
- `rating`: Numerical rating
- `comment`: Review comment
- `created_at`: Review creation timestamp
- `updated_at`: Last update timestamp

## Deployment

AgrifinPal is designed to be deployed on Render.com, a cloud platform that simplifies the deployment process.

### Prerequisites

- GitHub account
- Render.com account
- MySQL database (can be hosted on Render.com or another provider)
- Stripe account for payment processing

### Environment Variables

The following environment variables need to be set in Render.com:

- `DATABASE_URL`: JDBC URL for the MySQL database
- `DATABASE_USERNAME`: Database username
- `DATABASE_PASSWORD`: Database password
- `JWT_SECRET`: Secret key for JWT token signing
- `JWT_EXPIRATION_MS`: Token expiration time in milliseconds
- `STRIPE_SECRET_KEY`: Stripe API secret key
- `STRIPE_PUBLIC_KEY`: Stripe API public key

### Deployment Steps

1. **Create a Web Service on Render.com**:
   - Connect your GitHub repository
   - Select the branch to deploy
   - Configure the build command: `mvn clean package -DskipTests`
   - Configure the start command: `java -jar target/AgrifinPalestine-0.0.1-SNAPSHOT.jar`
   - Set the environment variables

2. **Set Up the Database**:
   - Create a MySQL database on Render.com or another provider
   - Configure the database connection in the environment variables

3. **Deploy the Application**:
   - Trigger a manual deploy or push changes to the connected branch
   - Monitor the build and deployment logs

## Development Setup

### Prerequisites

- Java 17 JDK
- Maven
- MySQL Database
- IDE (IntelliJ IDEA, Eclipse, or VS Code)
- Git

### Local Development

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/hamza-damra/AgrifinPal.git
   cd AgriFinPalestine
   ```

2. **Configure the Database**:
   - Create a MySQL database
   - Update `application-local.properties` with your database credentials

3. **Run the Application**:
   ```bash
   # Run with local profile
   mvn spring-boot:run -Dspring.profiles.active=local
   ```

4. **Access the Application**:
   - Open a web browser and navigate to `http://localhost:8080`

### Docker Development

1. **Build the Docker Image**:
   ```bash
   docker build -t agrifinpalestine .
   ```

2. **Run the Docker Container**:
   ```bash
   docker run -p 8080:8080 agrifinpalestine
   ```

## Testing

AgrifinPal includes comprehensive testing to ensure the reliability and correctness of the application.

### Unit Testing

Unit tests focus on testing individual components in isolation:

- **Service Layer Tests**: Test business logic
- **Repository Layer Tests**: Test data access
- **Controller Layer Tests**: Test API endpoints

### Integration Testing

Integration tests focus on testing the interaction between components:

- **API Integration Tests**: Test API endpoints with real database interactions
- **Security Integration Tests**: Test authentication and authorization

### Running Tests

```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=UserServiceTest

# Run with coverage report
mvn test jacoco:report
```

## Security Considerations

### Password Security

- Passwords are hashed using BCrypt before storage
- Password complexity requirements are enforced

### JWT Security

- Tokens are signed with a secure algorithm (HS512)
- Tokens have a limited lifetime (24 hours by default)
- Token validation is performed for each protected request

### HTTPS

- In production, all communication should be over HTTPS
- Sensitive information should never be transmitted over HTTP

### Input Validation

- All user input is validated before processing
- Protection against common web vulnerabilities (XSS, CSRF, SQL Injection)

### Error Handling

- Custom exception handling to prevent information leakage
- Appropriate HTTP status codes for different error types

## Payment Integration

AgrifinPal integrates with Stripe for secure payment processing.

### Stripe Integration

- **Payment Intents API**: Used for processing payments
- **Webhook Integration**: For handling payment events
- **Client-Side Elements**: For secure card collection

### Payment Flow

1. **Cart Checkout**: User proceeds to checkout with items in cart
2. **Payment Intent Creation**: Server creates a payment intent with Stripe
3. **Card Information Collection**: Client collects card information securely
4. **Payment Processing**: Stripe processes the payment
5. **Order Confirmation**: Order is confirmed upon successful payment

### Payment Security

- Card information is never stored on the server
- PCI compliance is handled by Stripe
- Webhook signatures are verified to prevent tampering

## Future Enhancements

### Short-term Enhancements

1. **Mobile Application**: Develop native mobile applications for iOS and Android
2. **Multi-language Support**: Add support for Arabic and English
3. **Advanced Search**: Implement more sophisticated search and filtering options
4. **Recommendation System**: Suggest products based on user preferences and history

### Long-term Vision

1. **Logistics Integration**: Partner with local logistics providers for delivery
2. **Agricultural Education**: Add educational resources for sustainable farming
3. **Community Features**: Build community features for farmers to share knowledge
4. **Marketplace Analytics**: Provide market insights and analytics for farmers
5. **Blockchain Integration**: Implement blockchain for supply chain transparency

---

© 2023 AgrifinPal. All rights reserved.
