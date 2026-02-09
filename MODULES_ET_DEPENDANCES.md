# 📦 Analyse Complète du Projet - Modules et Dépendances

## 🎯 Vue d'ensemble du projet

Ce projet est une **application de merchandising Samsung** composée de :
- **Backend** : API REST Spring Boot (Java 17)
- **Frontend** : Application React avec Vite
- **Base de données** : PostgreSQL

---

## 🔧 PRÉREQUIS SYSTÈME

### Logiciels requis :
1. **Java JDK 17** (ou supérieur)
   - Télécharger depuis : https://adoptium.net/ ou Oracle JDK
   - Vérifier : `java -version`

2. **Maven 3.6+**
   - Le projet inclut Maven Wrapper (`mvnw` et `mvnw.cmd`)
   - Ou installer Maven séparément : https://maven.apache.org/

3. **Node.js 18+** et **npm**
   - Pour le frontend React
   - Télécharger depuis : https://nodejs.org/
   - Vérifier : `node -v` et `npm -v`

4. **PostgreSQL 12+**
   - Base de données requise
   - Télécharger depuis : https://www.postgresql.org/download/
   - Configuration dans `application.properties` :
     - Base de données : `samsung_merch_db`
     - Utilisateur : `postgres`
     - Mot de passe : `kakakiki`
     - Port : `5432`

---

## 📋 MODULES MAVEN (Backend Spring Boot)

### Parent POM
- **Spring Boot Parent** : `3.5.10`
  - Groupe : `org.springframework.boot`
  - Artifact : `spring-boot-starter-parent`

### Dépendances principales :

#### 1. **Spring Boot Starter Data JPA**
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
```
- **Description** : Persistance des données avec JPA/Hibernate
- **Inclut** : Hibernate, Spring Data JPA, Transaction support

#### 2. **Spring Boot Starter Web**
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```
- **Description** : Création d'API REST
- **Inclut** : Spring MVC, Tomcat embarqué, Jackson (JSON)

#### 3. **PostgreSQL Driver**
```xml
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
</dependency>
```
- **Description** : Pilote JDBC pour PostgreSQL
- **Scope** : Runtime uniquement

#### 4. **Lombok**
```xml
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
</dependency>
```
- **Description** : Génération automatique de code (getters, setters, constructeurs)
- **Usage** : Annotations `@Data`, `@Entity`, etc.

#### 5. **Spring Boot Starter Test**
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
```
- **Description** : Framework de tests
- **Inclut** : JUnit, Mockito, AssertJ, Spring Test

### Plugins Maven :

#### 1. **Maven Compiler Plugin**
- Configuration pour Java 17
- Support des annotations Lombok

#### 2. **Spring Boot Maven Plugin**
- Packaging de l'application
- Exécution avec `mvn spring-boot:run`

---

## 📦 MODULES NPM (Frontend React)

### Dépendances de production :

1. **@emotion/react** : `^11.14.0`
   - Bibliothèque CSS-in-JS pour React

2. **@emotion/styled** : `^11.14.1`
   - Composants stylisés avec Emotion

3. **@mui/icons-material** : `^7.3.7`
   - Icônes Material-UI

4. **@mui/material** : `^7.3.7`
   - Framework UI Material Design

5. **axios** : `^1.13.4`
   - Client HTTP pour les appels API

6. **leaflet** : `^1.9.4`
   - Bibliothèque de cartes interactives

7. **react** : `^19.2.0`
   - Bibliothèque React principale

8. **react-dom** : `^19.2.0`
   - Rendu React pour le DOM

9. **react-leaflet** : `^5.0.0`
   - Composants React pour Leaflet

10. **react-router-dom** : `^7.13.0`
    - Routage pour applications React

11. **recharts** : `^3.7.0`
    - Bibliothèque de graphiques/charts

### Dépendances de développement :

1. **@eslint/js** : `^9.39.1`
   - Configuration ESLint

2. **@types/react** : `^19.2.5`
   - Types TypeScript pour React

3. **@types/react-dom** : `^19.2.3`
   - Types TypeScript pour React DOM

4. **@vitejs/plugin-react** : `^5.1.1`
   - Plugin Vite pour React

5. **eslint** : `^9.39.1`
   - Linter JavaScript

6. **eslint-plugin-react-hooks** : `^7.0.1`
   - Règles ESLint pour React Hooks

7. **eslint-plugin-react-refresh** : `^0.4.24`
   - Support React Fast Refresh

8. **globals** : `^16.5.0`
   - Variables globales pour ESLint

9. **vite** : `^7.2.4`
   - Build tool et serveur de développement

---

## 🚀 COMMANDES D'INSTALLATION

### Backend (Maven) :

```bash
# Option 1 : Utiliser Maven Wrapper (recommandé)
./mvnw clean install

# Option 2 : Utiliser Maven installé
mvn clean install

# Lancer l'application
./mvnw spring-boot:run
# ou
mvn spring-boot:run
```

### Frontend (npm) :

```bash
# Aller dans le dossier frontend
cd samsung-merch-app

# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Build pour production
npm run build

# Prévisualiser le build
npm run preview
```

### Base de données PostgreSQL :

```sql
-- Créer la base de données
CREATE DATABASE samsung_merch_db;

-- Le schéma sera créé automatiquement via schema.sql
-- Les données initiales seront chargées via data.sql
```

---

## 📊 STRUCTURE DU PROJET

```
Merchandising-main/
├── pom.xml                          # Configuration Maven
├── mvnw / mvnw.cmd                  # Maven Wrapper
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/samsung/merchandising_api/
│   │   │       ├── controller/      # Contrôleurs REST
│   │   │       ├── dto/             # Data Transfer Objects
│   │   │       ├── model/           # Entités JPA
│   │   │       └── repository/      # Repositories Spring Data
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── schema.sql           # Schéma de base de données
│   │       └── data.sql             # Données initiales
│   └── test/                        # Tests unitaires
└── samsung-merch-app/               # Frontend React
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── components/
        ├── pages/
        └── services/
```

---

## 🔍 MODÈLES DE DONNÉES

### Entités JPA :
1. **User** : Utilisateurs (PROMOTER, SFOS, SUPERVISOR)
2. **Store** : Magasins avec coordonnées GPS
3. **Visit** : Visites des magasins
4. **Role** : Enum (PROMOTER, SFOS, SUPERVISOR)
5. **UserStatus** : Enum (ACTIVE, INACTIVE)
6. **VisitStatus** : Enum (PLANNED, COMPLETED, VALIDATED, REJECTED)

---

## ⚙️ CONFIGURATION

### Backend (`application.properties`) :
- Port par défaut : `8080` (Spring Boot)
- Base de données : PostgreSQL sur `localhost:5432`
- Hibernate : Mode validation uniquement
- SQL init : Mode `always` (exécute schema.sql et data.sql)

### Frontend :
- Port par défaut : `5173` (Vite)
- API backend : Configuré dans `src/services/api.js`

---

## ✅ CHECKLIST D'INSTALLATION

- [ ] Installer Java JDK 17
- [ ] Installer Maven (ou utiliser Maven Wrapper)
- [ ] Installer Node.js 18+ et npm
- [ ] Installer PostgreSQL 12+
- [ ] Créer la base de données `samsung_merch_db`
- [ ] Configurer les identifiants PostgreSQL dans `application.properties`
- [ ] Exécuter `mvn clean install` pour installer les dépendances Maven
- [ ] Exécuter `npm install` dans `samsung-merch-app/` pour installer les dépendances npm
- [ ] Lancer le backend : `mvn spring-boot:run`
- [ ] Lancer le frontend : `cd samsung-merch-app && npm run dev`

---

## 📝 NOTES IMPORTANTES

1. **Maven Wrapper** : Le projet inclut `mvnw` (Linux/Mac) et `mvnw.cmd` (Windows), donc Maven n'est pas obligatoire si vous utilisez le wrapper.

2. **Base de données** : Modifiez les identifiants dans `application.properties` selon votre configuration PostgreSQL.

3. **Ports** : 
   - Backend : `http://localhost:8080`
   - Frontend : `http://localhost:5173`

4. **CORS** : Assurez-vous que le backend autorise les requêtes depuis le frontend si nécessaire.

---

## 🐛 DÉPANNAGE

### Problèmes Maven :
```bash
# Nettoyer et recompiler
mvn clean install -U

# Ignorer les tests
mvn clean install -DskipTests
```

### Problèmes npm :
```bash
# Supprimer node_modules et réinstaller
rm -rf node_modules package-lock.json
npm install
```

### Problèmes PostgreSQL :
- Vérifier que PostgreSQL est démarré
- Vérifier les identifiants dans `application.properties`
- Vérifier que la base de données existe
