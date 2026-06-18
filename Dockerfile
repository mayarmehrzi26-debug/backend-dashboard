FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copier les fichiers de configuration
COPY pom.xml .
COPY mvnw .
COPY .mvn .mvn

# Copier le code source du backend
COPY src ./src

# Copier le frontend
COPY sav-balances-frontend ./sav-balances-frontend

# Builder l'application
RUN mvn clean package -DskipTests

# Étape 2 : Exécution
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copier le JAR depuis l'étape de build
COPY --from=build /app/target/sav-balances-0.0.1-SNAPSHOT.jar app.jar

# Exposer le port
EXPOSE 8080

# Lancer l'application
ENTRYPOINT ["java", "-jar", "app.jar"]