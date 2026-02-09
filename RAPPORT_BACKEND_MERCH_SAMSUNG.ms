## RAPPORT TECHNIQUE BACK‑END – PLATEFORME MERCHANDISING SAMSUNG

**Destinataire** : CEO  
**Périmètre** : Back‑end (API & services) – Application Merchandising & Sellout  
**Technologie principale** : Spring Boot (Java) + PostgreSQL  
**Date** : Février 2026

---

## 1. OBJECTIF DU SYSTÈME

La plateforme back‑end Merchandising Samsung a pour objectifs principaux :

- Centraliser les données de terrain : visites magasins, sellout, photos, GPS, interactions.
- Fournir des API sécurisées pour :
  - L’application web Superviseur (pilotage & reporting).
  - L’application mobile (Promoteurs & SFOS).
- Servir de socle pour les fonctionnalités avancées : IA (Google Vision), géofencing, temps réel, mode offline.

L’architecture actuelle permet déjà de gérer les entités clés (utilisateurs, produits, magasins, visites) et d’alimenter un premier niveau de reporting.

---

## 2. ARCHITECTURE TECHNIQUE

- **Cadre applicatif** : Spring Boot (Java).
- **Base de données** : PostgreSQL.
- **Style d’API** : REST (JSON).
- **Sécurité** :
  - Mots de passe stockés de façon sécurisée (BCrypt).
  - CORS configuré pour les frontends web et mobile.
  - Mise en place de l’authentification par **JWT** planifiée comme priorité critique.

Cette architecture est conçue pour être extensible, multi‑canal (web + mobile) et compatible avec un déploiement cloud.

---

## 3. MODÈLE MÉTIER PRINCIPAL

### 3.1 Utilisateurs (`User`)

- **Rôles gérés** :
  - PROMOTER (Promoteur terrain)
  - SFOS (Superviseur de forces de vente)
  - SUPERVISOR (Superviseur / siège)
- **Fonctionnalités clés** :
  - Hiérarchie intégrée (Promoteur → SFOS).
  - Champs : nom, email, mot de passe (haché), rôle, région, statut.
  - Relations : manager / subordonnés.

### 3.2 Produits (`Product`)

- **Types** :
  - WHITE_GOODS (Gros électroménager, « White Goods »)
  - BROWN_GOODS (TV, audio, etc., « Brown Goods »)
- **Champs principaux** :
  - Nom, SKU (unique), type, sous‑catégorie, prix, image, stock.

### 3.3 Magasins (`Store`)

- **Types** :
  - OR (Organized Retail)
  - IR (Independent Retail)
- **Champs principaux** :
  - Nom, ville, adresse, latitude, longitude.
- Préparation pour les fonctionnalités **GPS & géofencing** (validation de présence sur site).

### 3.4 Visites (`Visit`)

- **Statuts** :
  - PLANNED, COMPLETED, VALIDATED, REJECTED.
- **Champs actuels** :
  - Date de visite, montant de vente global (**salesAmount**), **shelfShare** (part de linéaire), **interactionCount** (nombre d’interactions clients).
- **Extensions prévues** :
  - Coordonnées GPS de check‑in.
  - Références photos.
  - Sellout détaillé par produit.
  - Interactions par produit.

---

## 4. APIs EXISTANTES – SYNTHÈSE

### 4.1 Gestion des utilisateurs

- **Objectifs** :
  - Gérer les 200 Promoteurs, 14 SFOS et les Superviseurs.
  - Structurer la hiérarchie terrain.

Principales APIs :

- `GET /api/users/stats`  
  - Retourne les statistiques par rôle (nombre de Promoteurs, SFOS, Superviseurs).  
  - Utilisée pour les KPIs de pilotage.

- `GET /api/users`  
  - Liste paginée des utilisateurs, filtrable par rôle.

- `GET /api/users/{id}`  
  - Détails d’un utilisateur.

- `POST /api/users`  
  - Création d’un nouvel utilisateur (Promoteur / SFOS / Superviseur).

- `POST /api/users/bulk`  
  - Import en masse (CSV) des utilisateurs pour accélérer le déploiement.

- `PUT /api/users/{promoterId}/assign/{sfosId}`  
  - Affectation d’un promoteur à un SFOS (hiérarchie managériale).

### 4.2 Gestion du catalogue produits

- **Objectifs** :
  - Structurer le catalogue pour les saisies de sellout et l’analyse merchandising.

Principales APIs :

- `GET /api/products` – Liste et filtres produits.  
- `GET /api/products/{id}` – Détails produit.  
- `POST /api/products` – Création de produit.  
- `POST /api/products/bulk` – Import CSV du catalogue.

### 4.3 Gestion des magasins

- **Objectifs** :
  - Référencer tous les points de vente avec leur géolocalisation.

Principales APIs :

- `GET /api/stores` – Liste des magasins avec ville, type, coordonnées GPS.  
- `GET /api/stores/{id}` – Détails magasin.

### 4.4 Gestion des visites & KPIs de terrain

- **Objectifs** :
  - Suivre l’exécution terrain : visites, validation, KPIs.

Principales APIs :

- `GET /api/visits`  
  - Liste des visites, base pour le reporting et les futurs filtres avancés.

- `GET /api/visits/stats`  
  - Statistiques agrégées sur les visites (par statut, période, etc.).

- `GET /api/visits/user/{userId}`  
  - Historique des visites par utilisateur (Promoteur ou SFOS).

- `PATCH /api/visits/{id}/status`  
  - Mise à jour du statut de la visite (COMPLETED, VALIDATED, REJECTED).

---

## 5. SÉCURITÉ & AUTHENTIFICATION

### 5.1 Situation actuelle

- Mots de passe sécurisés via **BCrypt**.  
- CORS configuré pour autoriser les appels front web.  
- **Absence actuelle de couche complète JWT** (tokens, refresh, contrôle d’accès).

### 5.2 Évolutions planifiées (priorité critique)

- Mise en place d’une authentification **JWT** :
  - `POST /api/auth/login` : génération de token JWT.
  - Endpoint de **refresh token**.
  - Stockage sécurisé côté client (web & mobile).
- **Spring Security** :
  - Filtre JWT pour valider chaque requête.
  - Contrôle d’accès par rôle (PROMOTER, SFOS, SUPERVISOR).
- Préparation à l’authentification biométrique sur mobile (Face ID / empreinte) via le JWT.

**Impact business** : condition nécessaire pour ouvrir la plateforme aux 200 Promoteurs et 14 SFOS en mode sécurisé.

---

## 6. PRINCIPAUX MANQUES & ÉVOLUTIONS PRÉVUES

### 6.1 Photo & IA (Shelf Share)

- **Non démarré** :
  - Endpoint d’upload photo (`POST /api/photos/upload` – multipart/form-data).
  - Service de stockage fichiers (local ou cloud).
  - Métadonnées : timestamp, GPS, lien avec visite, magasin, utilisateur.
  - Intégration **Google Cloud Vision** :
    - Détection produits.
    - Calcul automatique de shelf share.
  - Workflow de validation photo (SFOS : validation / rejet).

### 6.2 GPS, géofencing & tracking

- **Partiellement en place** :
  - Coordonnées GPS des magasins stockées en base.

- **À implémenter** :
  - Service de calcul de distance & rayon magasin.
  - Vérification de check‑in dans une zone autorisée (géofencing).
  - Endpoint de check‑in :
    - `POST /api/visits/checkin` – validation de la position.  
  - Suivi de localisation temps quasi‑réel (endpoint de position, WebSocket en option).

### 6.3 Sellout & interactions détaillés

- **Actuel** :
  - Champ `salesAmount` global sur la visite.
  - Champ `interactionCount` global sur la visite.

- **Évolutions prévues** :
  - Entité `Sellout` liée à `Visit`, `Product`, `Store` :
    - Quantité, montant, date par produit.
  - Entité `Interaction` liée à `Visit`, `Product` :
    - Comptage des interactions par produit.
  - APIs :
    - `POST /api/visits/{visitId}/sellout` – saisie sellout produit par produit.
    - `GET /api/sellout/stats` – statistiques sellout.
    - `POST /api/visits/{visitId}/interactions` – enregistrement interactions.
    - `GET /api/interactions/stats` – statistiques interactions.

### 6.4 Reporting avancé & exports

- **Actuel** :
  - Endpoints de statistiques de base (utilisateurs, visites).
  - Dashboard web initial (KPI et graphiques simples).

- **À venir** :
  - Tendances sellout & shelf share dans le temps.
  - Comparaisons par région, magasin, produit.
  - Export **PDF/Excel** et rapports planifiés.
  - Tableau de bord avancé pour superviseurs.

---

## 7. FEUILLE DE ROUTE BACK‑END (SYNTHÈSE)

1. **Phase 2 – Authentification & Sécurité (2–3 semaines)**  
   - Mise en place complète de JWT, sécurisation des endpoints, contrôle par rôle.

2. **Phase 3 – Système de visite enrichi (3–4 semaines)**  
   - Ajout GPS sur les visites, sellout & interactions détaillés, APIs de saisie & reporting.

3. **Phase 4 – Photos & IA (3–4 semaines)**  
   - Infrastructure d’upload photo, stockage, intégration Google Vision, workflow de validation.

4. **Phase 5 – GPS & géofencing (2–3 semaines)**  
   - Géocodage, validation de rayon magasin, check‑in sécurisé, premières vues de tracking.

5. **Phase 6 – Support complet pour l’app mobile (6–8 semaines, en parallèle du mobile)**  
   - Stabilisation de toutes les APIs nécessaires au parcours Promoteur/SFOS (assignments, visites, historique, validations).

---

## 8. MESSAGE CLÉ POUR LA DIRECTION

- Le **socle back‑end est déjà en place** (modèle de données, gestion utilisateurs/produits/magasins, visites, premières statistiques).  
- Les **briques critiques restantes** sont : la sécurité (JWT), le GPS/géofencing, le sellout détaillé, les photos + IA, et le support complet de l’app mobile.  
- Avec un effort concentré sur les **3 prochains mois**, le back‑end peut être **entièrement prêt pour un déploiement pilote** (200 Promoteurs, 14 SFOS) avec les fonctionnalités métiers essentielles.

---

## ANNEXE – CATALOGUE DES PRINCIPALES APIs (EXTRAIT)

### A.1 Utilisateurs

| Méthode | Endpoint                                      | Description                                      | Rôle principal          |
|---------|-----------------------------------------------|--------------------------------------------------|-------------------------|
| GET     | `/api/users/stats`                           | Statistiques par rôle (Promoteur, SFOS, Sup.)    | SUPERVISOR              |
| GET     | `/api/users`                                 | Liste paginée des utilisateurs                   | SUPERVISOR, SFOS (vue)  |
| GET     | `/api/users/{id}`                            | Détail utilisateur                               | SUPERVISOR, SFOS        |
| POST    | `/api/users`                                 | Création d’un utilisateur                        | SUPERVISOR              |
| POST    | `/api/users/bulk`                            | Import CSV d’utilisateurs                        | SUPERVISOR              |
| PUT     | `/api/users/{promoterId}/assign/{sfosId}`    | Affectation d’un promoteur à un SFOS            | SUPERVISOR              |

### A.2 Produits

| Méthode | Endpoint                 | Description                          | Rôle principal |
|---------|--------------------------|--------------------------------------|---------------|
| GET     | `/api/products`         | Liste des produits avec filtres      | SUPERVISOR    |
| GET     | `/api/products/{id}`    | Détail d’un produit                  | SUPERVISOR    |
| POST    | `/api/products`         | Création d’un produit                | SUPERVISOR    |
| POST    | `/api/products/bulk`    | Import CSV du catalogue produits     | SUPERVISOR    |

### A.3 Magasins

| Méthode | Endpoint              | Description                               | Rôle principal          |
|---------|-----------------------|-------------------------------------------|-------------------------|
| GET     | `/api/stores`        | Liste des magasins + coordonnées GPS      | SUPERVISOR, SFOS (vue)  |
| GET     | `/api/stores/{id}`   | Détail d’un magasin                       | SUPERVISOR, SFOS (vue)  |

### A.4 Visites

| Méthode | Endpoint                       | Description                                    | Rôle principal           |
|---------|--------------------------------|------------------------------------------------|--------------------------|
| GET     | `/api/visits`                 | Liste de toutes les visites                    | SUPERVISOR, SFOS         |
| GET     | `/api/visits/stats`           | Statistiques agrégées sur les visites          | SUPERVISOR               |
| GET     | `/api/visits/user/{userId}`   | Historique des visites d’un utilisateur        | PROMOTER, SFOS           |
| PATCH   | `/api/visits/{id}/status`     | Mise à jour du statut d’une visite             | SFOS, SUPERVISOR         |

### A.5 Authentification (planifié)

| Méthode | Endpoint              | Description                                      | Rôle principal        |
|---------|-----------------------|--------------------------------------------------|-----------------------|
| POST    | `/api/auth/login`    | Authentification, génération du token JWT       | Tous (via front)      |
| POST    | `/api/auth/refresh`  | Rafraîchissement du token JWT                   | Tous (via front)      |

Ce catalogue pourra être complété au fur et à mesure de l’implémentation des nouvelles briques (Photos, Sellout détaillé, GPS avancé, temps réel).

