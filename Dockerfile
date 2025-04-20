# Use a Maven image with JDK 17
FROM maven:3.8.6-eclipse-temurin-17 AS build

# Set the working directory
WORKDIR /app

# Copy the pom.xml file first to leverage Docker cache
COPY pom.xml .

# Download all dependencies (this layer will be cached if pom.xml doesn't change)
RUN mvn dependency:go-offline -B

# Copy the project files to the Docker image
COPY src/ ./src/

# Run Maven to build the project, skipping tests
RUN mvn clean package -DskipTests

# Use a lighter base image for the runtime environment
FROM eclipse-temurin:17-jre-alpine

# Set the working directory in the runtime image
WORKDIR /app

# Copy the built JAR file from the build stage
COPY --from=build /app/target/agrifinpalestine-0.0.1-SNAPSHOT.jar app.jar

# Expose the port the app runs on
EXPOSE 8080

# Run the application with environment variable support
CMD ["java", "-jar", "app.jar"]
