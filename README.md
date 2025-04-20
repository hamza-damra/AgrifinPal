# AgriFinPalestine

AgriFinPalestine is a platform connecting farmers and buyers directly, supporting local agriculture and promoting sustainable practices.

## Features

- Marketplace for agricultural products
- Secure payment processing with Stripe
- User authentication and authorization
- Order management system
- Cart functionality

## Technology Stack

- Java 17
- Spring Boot
- MySQL Database
- Thymeleaf Templates
- Tailwind CSS
- Docker

## Deployment on Render.com

### Prerequisites

- GitHub account
- Render.com account
- MySQL database (can be hosted on Render.com or another provider)
- Stripe account for payment processing

### Environment Variables

The following environment variables need to be set in Render.com:

| Variable Name | Description |
|---------------|-------------|
| DATABASE_URL | JDBC URL for your MySQL database |
| DATABASE_USERNAME | Database username |
| DATABASE_PASSWORD | Database password |
| JWT_SECRET | Secret key for JWT token generation |
| JWT_EXPIRATION_MS | JWT token expiration time in milliseconds |
| STRIPE_SECRET_KEY | Stripe API secret key |
| STRIPE_PUBLIC_KEY | Stripe API publishable key |

### Deployment Steps

1. Fork or clone this repository to your GitHub account
2. Create a new Web Service on Render.com
3. Connect your GitHub repository
4. Select "Docker" as the environment
5. Configure the environment variables listed above
6. Deploy the service

## Local Development

### Prerequisites

- Java 17 JDK
- Maven
- Docker (optional)

### Running Locally

1. Clone the repository
```bash
git clone https://github.com/hamza-damra/AgrifinPal.git
cd AgriFinPalestine
```

2. Set up environment variables:
   - Copy `.env.example` to `.env` and fill in your values
   - OR create an `application-dev.properties` file based on `application.properties.example`

```bash
# Option 1: Using .env file (recommended)
cp .env.example .env
# Edit .env with your values

# Option 2: Using application-dev.properties
cp src/main/resources/application.properties src/main/resources/application-dev.properties
# Edit application-dev.properties with your values
```

3. Run the application
```bash
# If using .env file
export $(cat .env | xargs) && mvn spring-boot:run

# If using application-dev.properties
mvn spring-boot:run -Dspring.profiles.active=dev
```

> **IMPORTANT**: Never commit sensitive information like API keys, passwords, or secrets to version control. Always use environment variables or excluded properties files.

### Running with Docker

```bash
docker build -t agrifinpalestine .
docker run -p 8080:8080 agrifinpalestine
```

## License

[MIT License](LICENSE)
