# Correction.sekrane.fr

Plateforme de gestion des corrections et de feedback pour les enseignants en sciences.

## Présentation

Cette application web permet aux enseignants de créer, gérer et distribuer des corrections personnalisées pour des travaux pratiques et des exercices. Elle offre un système complet de gestion des étudiants, des classes, des activités pédagogiques et des fragments de correction réutilisables.

## Structure de la base de données

### Utilisateurs et Étudiants

- **utilisateurs (Users)** : enseignants et administrateurs qui peuvent créer et gérer des corrections
- **étudiants (Students)** : apprenants organisés par classes et sous-classes, qui reçoivent les corrections

### Organisation pédagogique

- **classes** : regroupements principaux d'étudiants (ex: BUT MP1, Tle STI2D)
  - possibilité de sous-classes (groupes TD/TP)
- **activités (Activities)** : travaux pratiques ou exercices à corriger
  - points expérimentaux et théoriques attribuables
- **fragments** : éléments de correction réutilisables, associés à des activités et classés par catégories

### Système de correction

- **corrections** : documents personnalisés créés pour un étudiant ou une classe
  - peuvent contenir plusieurs fragments
  - permettent l'attribution de notes (grade) et de points (experimental/theoretical)
- **groupes de correction** : regroupements de corrections pour distribution facilitée
- **catégories** : classification des fragments (ex: Théorique, Expérimentale, Positifs, Négatifs)

## Fonctionnalités principales

### Pour les enseignants

- création et gestion des classes et des étudiants
- création d'activités (TP, exercices) avec contenus et barèmes
- constitution d'une bibliothèque de fragments de correction réutilisables
- génération de corrections personnalisées pour les étudiants
- organisation des corrections en groupes pour distribution simplifiée
- suivi des notes et statistiques

### Pour les étudiants

- réception de corrections personnalisées avec feedback détaillé
- visualisation des points obtenus par compétence (théorique/expérimental)
- accès à l'historique des corrections reçues

## Architecture technique

L'application est développée avec:

- **Frontend** : Next.js, React, TailwindCSS
- **Backend** : API REST avec Next.js API routes
- **Base de données** : SQL (avec Prisma comme ORM)
- **Authentification** : Système sécurisé avec gestion des sessions

## Modèles de données principaux

### User (Enseignant)
```
- id: Identifiant unique
- username: Nom d'utilisateur
- password: Mot de passe (haché)
- name: Nom complet
- last_login: Dernière connexion
```

### Student (Étudiant)
```
- id: Identifiant unique
- email: Email de contact
- first_name: Prénom
- last_name: Nom de famille
- gender: Genre
```

### Class (Classe)
```
- id: Identifiant unique
- name: Nom de la classe
- description: Description
- academic_year: Année académique
- nbre_subclasses: Nombre de sous-classes/groupes
```

### Activity (Activité)
```
- id: Identifiant unique
- name: Nom de l'activité
- content: Description du contenu
- experimental_points: Points pour la partie expérimentale
- theoretical_points: Points pour la partie théorique
- user_id: Créateur de l'activité
```

### Fragment (Fragment de correction)
```
- id: Identifiant unique
- content: Contenu du fragment
- order: Ordre d'affichage
- activity_id: Activité associée
- categories: Catégories associées (relation many-to-many)
```

### Correction
```
- id: Identifiant unique
- content: Contenu de la correction
- student_id: Étudiant concerné
- class_id: Classe concernée
- activity_id: Activité corrigée
- teacher_id: Enseignant correcteur
- grade: Note attribuée
- experimental_points_earned: Points expérimentaux obtenus
- theoretical_points_earned: Points théoriques obtenus
- status: État de la correction
- submission_date: Date de soumission
```

## Installation et déploiement

1. Cloner le dépôt
2. Installer les dépendances avec `npm install`
3. Configurer les variables d'environnement
4. Initialiser la base de données avec Prisma
5. Lancer l'application en développement avec `npm run dev` ou en production avec `npm start`

## Outils d'administration

Des scripts utilitaires sont disponibles :
- `add-user.sh` : ajouter un nouvel utilisateur (enseignant)
- `find-routes.sh` : lister toutes les routes de l'API

## Interface de l'application

L'application comprend diverses interfaces :
- page d'accueil et tableau de bord
- gestion des classes et des étudiants
- création et édition d'activités
- bibliothèque de fragments
- formulaires de correction (simple et multiple)
- visualisation des statistiques

## Sécurité et confidentialité

L'application implémente :
- authentification sécurisée des enseignants
- protection des données personnelles
- partage sécurisé des corrections via codes uniques
- politique de confidentialité disponible

## Droits d'auteur et propriété intellectuelle

© 2025 correction.sekrane.fr - Tous droits réservés

Cette application et son contenu sont protégés par les lois sur la propriété intellectuelle et les droits d'auteur. Aucune partie de cette application, y compris mais sans s'y limiter, le code source, les interfaces, les algorithmes, les fragments de correction, et les contenus générés ne peut être reproduite, distribuée, modifiée, ou utilisée sous quelque forme que ce soit sans l'autorisation écrite préalable du propriétaire.

Il est strictement interdit de :
- copier ou partager les fragments de correction
- reproduire le système de correction
- utiliser le code source à des fins commerciales ou non-commerciales
- créer des œuvres dérivées basées sur cette application

Toute utilisation non autorisée constitue une violation des droits d'auteur et peut entraîner des poursuites judiciaires.