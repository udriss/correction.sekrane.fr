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
- **share_codes** : codes uniques pour le partage sécurisé des corrections
- **logs** : enregistrement détaillé de toutes les actions utilisateurs et consultations d'étudiants

## Fonctionnalités principales

### Pour les enseignants

- création et gestion des classes et des étudiants
- création d'activités (TP, exercices) avec contenus et barèmes
- constitution d'une bibliothèque de fragments de correction réutilisables
- génération de corrections personnalisées pour les étudiants
- organisation des corrections en groupes pour distribution simplifiée
- suivi des notes et statistiques
- export PDF avec QR codes pour partage facilité des corrections
- envoi direct de corrections par email aux étudiants avec messages personnalisables
- importation d'étudiants depuis des fichiers CSV avec détection intelligente des formats
- système de logs complet pour le suivi des actions utilisateurs et des consultations d'étudiants
- statistiques avancées avec filtrage par classe, sous-classe, activité et étudiant
- gestion des fichiers attachés aux corrections (images, documents, etc.)
- historique complet des modifications apportées aux corrections
- suivi détaillé des consultations de feedback par les étudiants (appareil, navigateur, durée)
- analyse d'engagement des étudiants à travers les logs de consultation
- export de statistiques au format CSV/Excel pour analyse externe

### Pour les étudiants

- réception de corrections personnalisées avec feedback détaillé
- visualisation des points obtenus par compétence (théorique/expérimental)
- accès à l'historique des corrections reçues
- accès simplifié via QR codes ou liens sécurisés
- téléchargement des fichiers attachés aux corrections
- visualisation claire des pénalités et commentaires spécifiques

## Architecture technique

L'application est développée avec:

- **Frontend** : Next.js, React, TailwindCSS
- **Backend** : API REST avec Next.js API routes
- **Base de données** : SQL (avec Prisma comme ORM)
- **Authentification** : Système sécurisé avec gestion des sessions
- **Logging** : Système complet de journalisation des actions utilisateurs
- **Statistiques** : Analyses avancées et visualisations des données
- **Emails** : Service d'envoi d'emails pour le partage des corrections
- **QR Codes** : Génération automatique pour accès simplifié aux corrections

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
- tags: Tags pour faciliter la recherche
- position_order: Position pour l'ordre d'affichage
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
- penalty: Pénalités appliquées (retard, etc.)
- status: État de la correction
- submission_date: Date de soumission
- deadline: Date limite de rendu
- content_data: Données structurées (fragments, annotations, etc.)
```

### ShareCode (Code de partage)
```
- code: Code unique pour accéder à la correction
- correction_id: Correction associée
- is_active: État d'activation du lien
- expires_at: Date d'expiration (optionnelle)
- created_at: Date de création
```

### Logs (Journal d'activité)
```
- id: Identifiant unique
- action_type: Type d'action (CREATE_CORRECTION, UPDATE_GRADE, VIEW_FEEDBACK, etc.)
- description: Description de l'action
- entity_type: Type d'entité concernée (correction, student, etc.)
- entity_id: ID de l'entité concernée
- user_id: Utilisateur ayant effectué l'action
- username: Nom d'utilisateur
- ip_address: Adresse IP
- metadata: Données supplémentaires (format JSON)
- created_at: Date et heure de l'action
```

## Fonctionnalités avancées

### Système de partage et de feedback
- Génération automatique de codes de partage uniques
- Création de QR codes pour accès rapide aux corrections
- Export PDF des corrections avec QR codes intégrés
- Envoi d'emails personnalisés avec lien vers la correction
- Suivi des consultations de feedback via le système de logs
- Récupération en lot des codes de partage pour plusieurs corrections
- Personnalisation des messages d'email et du format HTML
- Suivi détaillé des consultations (appareil, navigateur, heure, durée)
- Statistiques d'engagement des étudiants avec les corrections

### Analyse statistique
- Statistiques globales (moyennes, notes min/max)
- Distribution des notes par tranches (0-5, 5-10, etc.)
- Analyse par activité, classe, et période
- Filtrage avancé (par classe, sous-classe, étudiant, activité)
- Évolution des notes au fil du temps
- Top des activités par performance
- Statistiques par étudiant avec détail des compétences maîtrisées
- Visualisation des récentes corrections pour chaque étudiant

### Communication et engagement
- Envoi d'emails personnalisés aux étudiants
- Modèles d'emails prédéfinis et personnalisables
- Envois groupés pour les corrections d'une même classe ou groupe
- Notification lorsqu'un étudiant consulte sa correction
- Historique complet des emails envoyés
- Analyse du taux d'ouverture des corrections partagées
- Statistiques sur l'engagement des étudiants avec les corrections
- Export des données d'engagement pour analyse externe

### Gestion des fichiers
- Upload et stockage organisé des fichiers
- Association de fichiers aux corrections
- Structure de dossiers par activité
- Nommage intelligent avec identifiants d'activité et de correction
- Horodatage des fichiers pour versions multiples

### Import/Export de données
- Import d'étudiants depuis CSV
- Détection intelligente du format des noms (majuscules, ordre prénom/nom)
- Support de différents délimiteurs (virgule, point-virgule, tabulation)
- Identification automatique des entêtes dans les fichiers
- Export des statistiques et données de correction

### Journalisation et suivi
- Système complet de logs pour toutes les actions
- Enregistrement des consultations de feedback par les étudiants
- Détails sur le navigateur et l'appareil utilisés pour les consultations
- Horodatage précis de chaque action
- Filtrage des logs par type d'action, période et entité concernée
- Export des logs pour analyse externe
- Tableau de bord de l'activité récente et des consultations
- Notifications pour les événements importants (première consultation d'un étudiant)

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
- historique des actions (logs)
- outils de communication avec les étudiants
- suivi des consultations de feedback

## Sécurité et confidentialité

L'application implémente :
- authentification sécurisée des enseignants
- protection des données personnelles
- partage sécurisé des corrections via codes uniques
- journalisation complète des activités (logs)
- possibilité de changer son mot de passe
- politique de confidentialité disponible
- durées d'expiration configurables pour les liens de partage
- enregistrement des adresses IP pour la traçabilité

## Droits d'auteur et propriété intellectuelle

© 2025 correction.sekrane.fr - Tous droits réservés

Cette application et son contenu sont protégés par les lois sur la propriété intellectuelle et les droits d'auteur. Aucune partie de cette application, y compris mais sans s'y limiter, le code source, les interfaces, les algorithmes, les fragments de correction, et les contenus générés ne peut être reproduite, distribuée, modifiée, ou utilisée sous quelque forme que ce soit sans l'autorisation écrite préalable du propriétaire.

Il est strictement interdit de :
- copier ou partager les fragments de correction
- reproduire le système de correction
- utiliser le code source à des fins commerciales ou non-commerciales
- créer des œuvres dérivées basées sur cette application

Toute utilisation non autorisée constitue une violation des droits d'auteur et peut entraîner des poursuites judiciaires.