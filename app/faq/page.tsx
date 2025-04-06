'use client';

import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Box,
  Paper,
  Divider,
  TextField,
  InputAdornment,
  Chip,
  Alert,
  Button,
  Badge
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import SchoolIcon from '@mui/icons-material/School';
import SettingsIcon from '@mui/icons-material/Settings';
import GroupIcon from '@mui/icons-material/Group';
import SecurityIcon from '@mui/icons-material/Security';
import CategoryIcon from '@mui/icons-material/Category';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import ConstructionIcon from '@mui/icons-material/Construction';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ViewListIcon from '@mui/icons-material/ViewList';
import ClassIcon from '@mui/icons-material/Class';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';

// FAQ data with expanded and updated content based on system capabilities
const faqData = [
  {
    category: 'Général',
    icon: <QuestionAnswerIcon color="primary" />,
    items: [
      {
        question: "Qu'est-ce que le Système de corrections d'activités ?",
        answer: "C'est une plateforme en ligne conçue pour les enseignants qui permet de ajouter, gérer et partager des corrections d'activités pédagogiques. Le système utilise une approche unique avec des points expérimentaux et théoriques pour une évaluation précise, et offre des outils d'analyse statistique avancés pour suivre la progression des élèves."
      },
      {
        question: "Est-ce que l'utilisation de la plateforme est gratuite ?",
        answer: "Oui, la plateforme est entièrement gratuite pour les enseignants et les établissements éducatifs. Elle est distribuée sous licence Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International."
      },
      {
        question: "Comment puis-je commencer à utiliser la plateforme ?",
        answer: "Vous pouvez commencer immédiatement en créant une nouvelle activité depuis la page d'accueil. Définissez les détails de l'activité (titre, points théoriques et expérimentaux), puis ajoutez des corrections pour chaque étudiant. Vous pouvez également explorer la version de démonstration pour vous familiariser avec les fonctionnalités avant d'ajouter votre propre contenu."
      },
      {
        question: "Existe-t-il des tutoriels ou des guides pour apprendre à utiliser la plateforme ?",
        answer: "Oui, nous proposons des tutoriels vidéo et des guides détaillés dans la section 'Aide'. Vous y trouverez des explications pas à pas sur toutes les fonctionnalités principales, notamment l'ajout d'activités, l'organisation des groupes, et l'utilisation de la bibliothèque de fragments.",
        underConstruction: true
      },
      {
        question: "Quels sont les prérequis techniques pour utiliser la plateforme ?",
        answer: "La plateforme fonctionne entièrement dans votre navigateur web et ne nécessite aucune installation. Elle est compatible avec tous les navigateurs modernes (Chrome, Firefox, Safari, Edge) et s'adapte aux ordinateurs, tablettes et smartphones. Une connexion internet stable est recommandée pour une expérience optimale."
      },
      {
        question: "Est-il possible d'utiliser la plateforme hors connexion ?",
        answer: "La plateforme est principalement conçue pour fonctionner en ligne, mais certaines fonctionnalités comme la génération de rapports PDF avec QR codes peuvent être utilisées hors connexion une fois que les données sont chargées. Les corrections peuvent être générées et partagées même lorsque les étudiants n'ont pas accès à Internet, via les PDF générés."
      }
    ]
  },
  {
    category: 'Activités et Corrections',
    icon: <SchoolIcon color="primary" />,
    items: [
      {
        question: "Comment ajouter une nouvelle activité ?",
        answer: "Cliquez sur 'Nouvelle activité' sur la page d'accueil ou dans le menu principal. Vous pourrez ensuite définir les détails de l'activité, comme le nom, la description, le barème (points expérimentaux et théoriques). Une fois l'activité ajoutée, vous pourrez y ajouter des corrections individuelles ou ajouter des groupes d'étudiants."
      },
      {
        question: "Comment fonctionne l'évaluation avec des points expérimentaux et théoriques ?",
        answer: "Notre système vous permet de diviser votre notation en deux parties : expérimentale (pratique, manipulation, savoir-faire) et théorique (connaissances, compréhension conceptuelle). Cette approche duale offre une évaluation plus précise et permet d'identifier où les étudiants excellent ou ont des difficultés. Vous définissez le nombre de points pour chaque partie lors de l'ajout de l'activité, puis vous attribuez des notes pour chaque partie lors de la correction."
      },
      {
        question: "Puis-je réutiliser mes corrections pour d'autres élèves ?",
        answer: "Oui, vous pouvez utiliser la bibliothèque de fragments pour stocker des commentaires fréquemment utilisés et les réutiliser dans différentes corrections. Les fragments peuvent être classés par catégories et associés à des types d'activités spécifiques. Vous pouvez également dupliquer une correction existante comme point de départ, puis la personnaliser pour chaque étudiant."
      },
      {
        question: "Comment ajouter des corrections pour plusieurs étudiants en même temps ?",
        answer: "Utilisez la fonction 'Corrections multiples' accessible depuis la page d'une activité. Vous pourrez sélectionner plusieurs étudiants à la fois, soit en choisissant une classe entière, soit en sélectionnant les étudiants individuellement. Il est possible de ajouter automatiquement un groupe pour ces corrections, ce qui facilitera leur gestion et l'analyse statistique collective."
      },
      {
        question: "Comment appliquer une pénalité de retard ?",
        answer: "Dans l'interface de correction, vous pouvez définir une date limite de rendu et une date de rendu effective. Si le rendu est en retard, vous pouvez activer la case 'Pénalité de retard' et spécifier le nombre de points à déduire. La pénalité peut être appliquée globalement ou séparément pour les points expérimentaux et théoriques. Le système calcule automatiquement le nombre de jours de retard et affiche un badge correspondant sur la correction partagée avec l'étudiant."
      },
      {
        question: "Puis-je modifier une correction après l'avoir enregistrée ?",
        answer: "Oui, vous pouvez modifier une correction à tout moment. Si vous avez déjà partagé la correction avec l'étudiant, les modifications seront automatiquement visibles via le lien de partage. Le système conserve également un historique des modifications principales pour votre référence."
      },
      {
        question: "Comment ajouter des fichiers ou des images à une correction ?",
        answer: "Lors de l'ajout ou de l'édition d'une correction, vous pouvez utiliser le bouton 'Ajouter un fichier' pour télécharger des documents, images, ou autres fichiers pertinents. Ces fichiers seront accessibles à l'étudiant si vous partagez la correction. Vous pouvez également insérer des images directement dans les commentaires pour illustrer vos explications. Les fichiers sont organisés par activité pour faciliter leur gestion."
      },
      {
        question: "Comment ajouter et gérer des activités génériques ?",
        answer: "Si vous avez besoin de ajouter rapidement des corrections sans définir une activité spécifique, vous pouvez utiliser les activités génériques. Le système peut générer automatiquement des 'Activité générique N° X' avec un barème standard (5 points expérimentaux, 15 points théoriques). Cela est particulièrement utile pour des évaluations ponctuelles ou des retours rapides aux étudiants."
      }
    ]
  },
  {
    category: 'Bibliothèque de Fragments',
    icon: <CategoryIcon color="primary" />,
    items: [
      {
        question: "Qu'est-ce que la bibliothèque de fragments ?",
        answer: "La bibliothèque de fragments est un système qui vous permet de ajouter, organiser et réutiliser des commentaires standard pour vos corrections. Chaque fragment peut contenir du texte formaté, des équations, et même des images. Les fragments sont organisés par catégories et peuvent être associés à des types d'activités spécifiques pour un accès rapide lors de la correction."
      },
      {
        question: "Comment organiser mes fragments efficacement ?",
        answer: "Nous recommandons d'organiser vos fragments par thèmes ou types d'erreurs. Par exemple, vous pourriez avoir des catégories comme 'Erreurs de calcul', 'Problèmes de méthode', 'Bonnes pratiques', etc. Vous pouvez également utiliser des tags pour faciliter la recherche et associer certains fragments à des activités spécifiques. Une bonne organisation vous permettra de trouver rapidement les fragments pertinents lors de la correction."
      },
      {
        question: "Comment gérer les catégories de fragments ?",
        answer: "Dans la section Fragments, vous pouvez ajouter, modifier et organiser vos catégories en cliquant sur 'Gérer les catégories' dans le sélecteur de catégories. Vous pouvez associer plusieurs catégories à un même fragment, ce qui facilite son organisation et sa recherche. Les catégories peuvent être utilisées comme filtres pour retrouver rapidement un ensemble de fragments pertinents."
      },
      {
        question: "Puis-je importer ou exporter ma bibliothèque de fragments ?",
        answer: "Oui, vous pouvez exporter votre bibliothèque de fragments au format JSON pour la sauvegarder ou la partager avec d'autres enseignants. Vous pouvez également importer une bibliothèque de fragments à partir d'un fichier JSON. Cette fonctionnalité est particulièrement utile pour la collaboration entre collègues d'une même discipline."
      },
      {
        question: "Comment utiliser les fragments lors de la correction ?",
        answer: "Pendant la correction d'une activité, vous verrez votre bibliothèque de fragments accessible via un panneau latéral. Vous pouvez rechercher des fragments par mot-clé ou parcourir vos catégories. Pour ajouter un fragment à votre correction, il suffit de cliquer dessus ou de le faire glisser vers la zone de commentaire. Vous pouvez ensuite personnaliser le fragment si nécessaire."
      },
      {
        question: "Comment réorganiser mes fragments ?",
        answer: "Vous pouvez réorganiser vos fragments par glisser-déposer dans l'interface de la bibliothèque. L'ordre est automatiquement sauvegardé et vous permettra de garder vos fragments les plus utilisés en haut de la liste. Vous pouvez également utiliser la fonction de tri pour organiser vos fragments par date de création, usage, ou ordre alphabétique."
      },
      {
        question: "Est-il possible de ajouter des fragments avec du formatage avancé ?",
        answer: "Oui, l'éditeur de fragments prend en charge le formatage riche : gras, italique, puces, tableaux, etc. Vous pouvez également insérer des équations mathématiques en utilisant la syntaxe LaTeX, et ajouter des images ou des diagrammes. Ces fonctionnalités permettent de ajouter des commentaires clairs et pédagogiques."
      },
      {
        question: "Puis-je voir combien de fois un fragment a été utilisé ?",
        answer: "Oui, chaque fragment affiche un compteur d'utilisation qui vous indique combien de fois il a été incorporé dans des corrections. Cela vous permet d'identifier vos fragments les plus utiles et ceux qui pourraient nécessiter des ajustements. Cette statistique vous aide également à comprendre les erreurs les plus fréquentes chez vos étudiants."
      }
    ]
  },
  {
    category: 'Étudiants et Classes',
    icon: <ClassIcon color="primary" />,
    items: [
      {
        question: "Comment gérer les informations des étudiants ?",
        answer: "La plateforme vous permet de ajouter et gérer des profils d'étudiants avec leurs noms, prénoms et coordonnées. Vous pouvez associer des étudiants à des classes, des sous-groupes, et suivre leur progression à travers les différentes activités. Les profils d'étudiants sont accessibles depuis la section 'Étudiants' du menu principal."
      },
      {
        question: "Comment organiser mes étudiants en classes ?",
        answer: "Dans la section 'Classes', vous pouvez ajouter des classes et y ajouter des étudiants. Chaque classe peut avoir plusieurs sous-groupes (par exemple, groupe A, B, etc.) pour une organisation plus fine. Vous pouvez aussi importer des listes d'étudiants via CSV ou les ajouter manuellement. Une fois les classes ajoutées, vous pouvez filtrer vos corrections par classe et sous-groupe."
      },
      {
        question: "Comment associer une classe à une activité ?",
        answer: "Lors de l'ajout de corrections multiples, vous pouvez associer des classes à une activité. Cela facilite la gestion des corrections et permet d'analyser les performances par classe. La plateforme garde en mémoire cette association, ce qui vous permet de ajouter rapidement des corrections pour toute la classe lors de nouvelles activités."
      },
      {
        question: "Comment suivre la progression d'un étudiant ?",
        answer: "Chaque étudiant dispose d'une page de profil qui montre toutes ses corrections, ses notes moyennes, et ses statistiques de performance. Vous pouvez voir l'évolution de ses résultats au fil du temps, identifier ses forces et faiblesses entre les compétences expérimentales et théoriques, et accéder à toutes ses corrections depuis un seul endroit."
      },
      {
        question: "Comment gérer les sous-groupes dans une classe ?",
        answer: "Lors de l'ajout d'un étudiant à une classe, vous pouvez spécifier un sous-groupe (par exemple, 'Groupe A', 'Groupe Avancé', etc.). Ces sous-groupes peuvent ensuite être utilisés comme filtres dans les corrections et les analyses statistiques. Vous pouvez également modifier l'affectation des sous-groupes à tout moment depuis la page de gestion de la classe."
      },
      {
        question: "Comment transférer des étudiants entre classes ?",
        answer: "Dans l'interface de gestion des classes, vous pouvez sélectionner un ou plusieurs étudiants et les déplacer vers une autre classe. Vous pouvez également copier des étudiants vers une autre classe tout en les conservant dans leur classe d'origine. Les historiques de corrections sont conservés et restent accessibles même après un transfert."
      }
    ]
  },
  {
    category: 'Groupes et Statistiques',
    icon: <GroupIcon color="primary" />,
    items: [
      {
        question: "Comment ajouter un groupe de corrections ?",
        answer: "Il existe plusieurs méthodes pour ajouter un groupe : 1) Dans la page de détails d'une activité, cliquez sur 'Groupes' puis 'Nouveau groupe'. 2) Lors de l'ajout de corrections multiples, cochez l'option 'Ajouter un groupe' et donnez-lui un nom. 3) Depuis la page des corrections, vous pouvez sélectionner plusieurs corrections et les ajouter à un nouveau groupe. Les groupes facilitent l'organisation et l'analyse statistique des corrections."
      },
      {
        question: "Quelles statistiques sont disponibles pour les groupes ?",
        answer: "Pour chaque groupe, vous pouvez accéder à une analyse statistique complète : distribution des notes (histogramme et courbe de Gauss), moyenne, médiane, écart type, quartiles, et notes minimale/maximale. Ces statistiques sont disponibles pour la note globale ainsi que séparément pour les points expérimentaux et théoriques. Des graphiques interactifs vous permettent d'analyser visuellement les performances du groupe."
      },
      {
        question: "Comment comparer les performances entre différents groupes ?",
        answer: "Dans la vue 'Groupes' d'une activité, vous pouvez sélectionner plusieurs groupes pour afficher une comparaison côte à côte de leurs statistiques. Vous pouvez comparer les distributions de notes, les moyennes, et autres métriques clés. Cette fonctionnalité est particulièrement utile pour comparer différentes classes, différentes années, ou différentes approches pédagogiques."
      },
      {
        question: "Comment générer un rapport PDF avec QR codes pour un groupe ?",
        answer: "Dans la page de détails d'un groupe, cliquez sur 'Générer un rapport PDF' pour ajouter un document contenant toutes les corrections du groupe, chacune avec son QR code unique. Ces QR codes permettent aux étudiants d'accéder à leur correction personnelle en les scannant avec leur smartphone. C'est une solution pratique pour distribuer les corrections en classe sans avoir à communiquer des liens individuellement."
      },
      {
        question: "Comment suivre la progression d'un étudiant sur plusieurs activités ?",
        answer: "Si vous utilisez le même nom pour un étudiant dans différentes corrections, le système peut générer un profil de progression montrant l'évolution des performances au fil du temps. Vous pouvez visualiser cette progression sous forme de graphique linéaire, en distinguant les performances expérimentales et théoriques. Cette vue longitudinale aide à identifier les tendances et les améliorations."
      },
      {
        question: "Est-il possible d'exporter les statistiques d'un groupe ?",
        answer: "Oui, vous pouvez exporter les statistiques au format CSV ou Excel pour une analyse plus approfondie dans d'autres outils. Vous pouvez également générer des rapports PDF qui incluent les graphiques et les principales métriques. Ces exports peuvent être configurés pour inclure seulement certaines métriques ou pour anonymiser les données des étudiants si nécessaire."
      },
      {
        question: "Comment identifier les points forts et faibles d'un groupe ?",
        answer: "Le système propose une analyse par compétences qui regroupe les performances sur différents aspects de l'activité. Vous pouvez voir où le groupe excelle et où des améliorations sont nécessaires. Cette analyse est particulièrement utile pour ajuster votre enseignement et cibler des révisions sur des points spécifiques."
      },
      {
        question: "Comment modifier les corrections d'un groupe en lot ?",
        answer: "Dans la page de détails d'un groupe, vous pouvez activer le mode d'édition en lot qui vous permet de modifier les notes et les associations d'étudiants pour plusieurs corrections simultanément. Cette fonctionnalité est particulièrement utile pour appliquer des ajustements à l'ensemble du groupe ou pour réaffecter des corrections."
      }
    ]
  },
  {
    category: 'Analyses Avancées',
    icon: <AnalyticsIcon color="primary" />,
    items: [
      {
        question: "Quels types d'analyses statistiques avancées sont disponibles ?",
        answer: "Au-delà des statistiques standard, la plateforme propose des analyses avancées comme : la détection automatique des points difficiles (questions ou critères avec les scores les plus bas), l'analyse de corrélation entre les performances expérimentales et théoriques, et des cartes thermiques montrant les forces/faiblesses par critère d'évaluation pour l'ensemble du groupe."
      },
      {
        question: "Comment utiliser les rapports de synthèse ?",
        answer: "Les rapports de synthèse regroupent les principales informations et statistiques pour une activité ou un groupe. Vous pouvez générer des rapports personnalisables qui incluent les distributions de notes, les statistiques clés, et même des commentaires généraux sur les performances. Ces rapports peuvent être partagés avec d'autres enseignants ou utilisés pour des réunions pédagogiques."
      },
      {
        question: "Comment identifier les tendances sur plusieurs activités ?",
        answer: "La vue d'analyse longitudinale permet de suivre les performances d'un groupe ou d'une classe sur plusieurs activités au fil du temps. Vous pouvez visualiser l'évolution des moyennes, voir si certaines compétences s'améliorent, et identifier des patterns récurrents. Cette fonctionnalité est particulièrement utile pour évaluer l'efficacité de vos méthodes pédagogiques sur le long terme."
      },
      {
        question: "Comment filtrer et trier mes données pour une analyse précise ?",
        answer: "La plateforme offre des outils de filtrage et de tri avancés qui vous permettent d'affiner votre analyse. Vous pouvez filtrer par classe, sous-groupe, étudiant, période, niveau de performance, et combiner plusieurs critères. Les résultats peuvent être triés selon différents paramètres comme les notes, les dates ou les noms, ce qui facilite l'identification de tendances spécifiques."
      },
      {
        question: "Est-il possible d'ajouter des tableaux de bord personnalisés ?",
        answer: "Oui, vous pouvez ajouter des tableaux de bord personnalisés qui regroupent les statistiques et graphiques les plus pertinents pour vous. Ces tableaux de bord peuvent être configurés pour afficher automatiquement les données de vos groupes actuels et peuvent être enregistrés pour un accès rapide depuis la page d'accueil.",
        underConstruction: true
      },
      {
        question: "Comment analyser les résultats par type de compétence ?",
        answer: "La plateforme vous permet de distinguer les performances entre compétences expérimentales et théoriques, ce qui vous aide à identifier si les difficultés des étudiants sont plutôt liées à la compréhension des concepts ou à leur application pratique. Ces informations peuvent guider vos interventions pédagogiques pour cibler les types de compétences à renforcer."
      }
    ]
  },
  {
    category: 'Fonctionnalités avancées',
    icon: <SettingsIcon color="primary" />,
    items: [
      {
        question: "Comment utiliser la fonctionnalité de note automatique ?",
        answer: "La fonctionnalité de note automatique vous permet de définir des règles de notation basées sur les points accumulés. Par exemple, vous pouvez spécifier que certains fragments déduisent automatiquement un nombre précis de points, ou définir des seuils pour l'attribution de notes finales (A, B, C, etc.). Cette fonctionnalité peut accélérer considérablement le processus de correction."
      },
      {
        question: "Peut-on ajouter des modèles personnalisés pour les activités ?",
        answer: "Oui, vous pouvez ajouter des modèles (templates) qui définissent la structure d'une activité : barème, critères d'évaluation, fragments recommandés, etc. Ces modèles peuvent être réutilisés pour ajouter rapidement de nouvelles activités similaires sans avoir à redéfinir tous les paramètres."
      },
      {
        question: "Comment gérer les téléchargements de fichiers ?",
        answer: "La plateforme permet de télécharger des fichiers (images, documents, etc.) et de les associer à des corrections spécifiques. Les fichiers sont organisés par activité pour faciliter leur gestion. Vous pouvez également inclure ces fichiers dans les corrections partagées avec les étudiants, ce qui est utile pour fournir des explications visuelles ou des documents complémentaires."
      },
      {
        question: "La plateforme peut-elle s'adapter à différentes matières ou types d'évaluation ?",
        answer: "Absolument. Bien que conçue initialement pour les sciences, la plateforme est suffisamment flexible pour s'adapter à toute discipline. Vous pouvez personnaliser les critères d'évaluation, le système de notation, et les fragments selon vos besoins spécifiques. Nous avons des enseignants qui utilisent le système pour des matières aussi diverses que les mathématiques, les langues, l'histoire, et même l'éducation physique."
      },
      {
        question: "Comment configurer des rubriques d'évaluation ?",
        answer: "La fonctionnalité de rubriques vous permet de définir une grille d'évaluation structurée avec des critères spécifiques et des niveaux de performance. Pour chaque critère, vous pouvez spécifier des descripteurs pour différents niveaux et associer des points. Lors de la correction, il suffit de sélectionner le niveau atteint pour chaque critère, et les points sont attribués automatiquement."
      },
      {
        question: "Comment rechercher efficacement dans l'ensemble de mes corrections et données ?",
        answer: "La plateforme offre une fonction de recherche globale qui vous permet de trouver rapidement des corrections, des étudiants, des activités ou des fragments en saisissant des mots-clés. Vous pouvez affiner votre recherche en utilisant des filtres avancés comme la date, le type de contenu, ou la plage de notes. La recherche sémantique permet également de trouver des contenus similaires même s'ils ne contiennent pas exactement les termes recherchés."
      }
    ]
  },
  {
    category: 'Intégration et API',
    icon: <IntegrationInstructionsIcon color="primary" />,
    items: [
      {
        question: "La plateforme peut-elle s'intégrer avec d'autres systèmes éducatifs ?",
        answer: "Oui, nous proposons une API REST qui permet d'intégrer la plateforme avec d'autres systèmes comme les ENT (Environnements Numériques de Travail), les LMS (Learning Management Systems) comme Moodle, ou d'autres outils pédagogiques. Cette API permet l'échange de données comme les informations sur les étudiants, les activités, et les résultats.",
        underConstruction: true
      },
      {
        question: "Est-il possible d'importer des listes d'étudiants ?",
        answer: "Oui, vous pouvez importer des listes d'étudiants à partir de fichiers CSV ou Excel. Cela facilite l'ajout de groupes et évite d'avoir à saisir manuellement les noms des étudiants. Le système peut également synchroniser les listes d'étudiants avec des services externes via l'API."
      },
      {
        question: "Comment exporter les données vers d'autres systèmes ?",
        answer: "La plateforme offre plusieurs options d'export : CSV, Excel, PDF, et JSON. Vous pouvez exporter les notes, les commentaires, les statistiques, et d'autres données. Ces exports peuvent être configurés pour s'adapter au format attendu par d'autres systèmes comme les registres de notes électroniques.",
        underConstruction: true
      },
      {
        question: "Existe-t-il une API pour automatiser certaines tâches ?",
        answer: "Oui, notre API RESTful vous permet d'automatiser des tâches comme l'importation d'étudiants, l'ajout d'activités, ou la récupération de statistiques. Cette API est documentée et sécurisée, permettant l'intégration avec d'autres outils ou le développement de scripts personnalisés pour des besoins spécifiques.",
        underConstruction: true
      }
    ]
  },
  {
    category: 'Organisation et recherche',
    icon: <FormatListBulletedIcon color="primary" />,
    items: [
      {
        question: "Comment organiser efficacement mes activités et corrections ?",
        answer: "La plateforme offre plusieurs niveaux d'organisation : activités, classes, groupes, et catégories. Vous pouvez ajouter des activités génériques ou spécifiques, les associer à des classes particulières, regrouper les corrections en groupes d'analyse, et utiliser des tags pour faciliter la recherche. Cette structure hiérarchique vous permet de naviguer facilement même avec un grand nombre de corrections."
      },
      {
        question: "Comment retrouver rapidement une correction spécifique ?",
        answer: "Utilisez la fonction de recherche et les filtres avancés disponibles dans la section 'Corrections'. Vous pouvez chercher par nom d'étudiant, classe, activité, date, ou plage de notes. La recherche examine non seulement les métadonnées mais aussi le contenu des corrections, ce qui vous permet de retrouver des corrections contenant des commentaires spécifiques."
      },
      {
        question: "Comment filtrer mes corrections par performance ?",
        answer: "Dans la section 'Corrections', vous pouvez utiliser les filtres de performance pour afficher uniquement les corrections dans certaines plages de notes (par exemple, moins de 10, entre 10 et 14, plus de 14). Cela vous permet d'identifier rapidement les étudiants en difficulté ou ceux qui excellent, afin d'adapter votre accompagnement."
      },
      {
        question: "Comment trier et organiser mes fragments pour un accès rapide ?",
        answer: "Vous pouvez réorganiser vos fragments par glisser-déposer pour placer les plus utilisés en haut. L'utilisation de catégories et de tags facilite également le filtrage. De plus, le système mémorise les fragments récemment utilisés pour un accès encore plus rapide. Les fragments peuvent aussi être associés à des activités spécifiques pour qu'ils apparaissent automatiquement lors de la correction de ces activités."
      },
      {
        question: "Existe-t-il un système de favoris ou de marque-pages ?",
        answer: "Oui, vous pouvez marquer des éléments comme favoris (activités, fragments, groupes) pour y accéder rapidement depuis votre tableau de bord. Le système garde également une trace de vos éléments récemment consultés, ce qui facilite l'accès aux corrections ou activités sur lesquelles vous travaillez fréquemment.",
        underConstruction: true
      }
    ]
  },
  {
    category: 'Partage et confidentialité',
    icon: <SecurityIcon color="primary" />,
    items: [
      {
        question: "Comment partager une correction avec un élève ?",
        answer: "Pour chaque correction, vous pouvez générer un lien de partage sécurisé en cliquant sur le bouton 'Partager'. Ce lien peut être envoyé directement à l'élève par email ou copié-collé dans votre système de communication habituel. L'élève pourra accéder à sa correction sans avoir besoin d'un compte, simplement en utilisant ce lien unique. Vous pouvez également générer un PDF contenant un QR code que l'étudiant peut scanner pour accéder à sa correction."
      },
      {
        question: "Les données des élèves sont-elles protégées ?",
        answer: "Oui, nous prenons la protection des données très au sérieux. Les noms des élèves sont stockés uniquement à des fins d'organisation et ne sont jamais partagés. Tous les liens de partage sont protégés par des codes aléatoires et peuvent être désactivés à tout moment. Les données sont stockées de manière sécurisée et conformément aux réglementations sur la protection des données."
      },
      {
        question: "Comment partager des corrections avec QR codes ?",
        answer: "Pour les groupes de corrections, vous pouvez générer un document PDF contenant toutes les corrections avec leurs QR codes respectifs. Cela vous permet de distribuer facilement les corrections en classe - les étudiants n'ont qu'à scanner le QR code correspondant à leur nom pour accéder à leur correction personnelle. C'est une solution efficace qui évite d'avoir à envoyer des liens individuellement."
      },
      {
        question: "Puis-je partager mes corrections avec d'autres enseignants ?",
        answer: "Oui, vous pouvez partager vos activités, corrections et fragments avec d'autres enseignants. Pour les activités et les corrections, vous pouvez générer des liens de partage spécifiques avec différents niveaux d'accès (lecture seule ou modification). Pour les fragments, vous pouvez exporter votre bibliothèque et la partager avec vos collègues."
      },
      {
        question: "Comment contrôler qui peut voir ou modifier mes corrections ?",
        answer: "Le système offre des contrôles d'accès granulaires. Pour chaque élément partagé (activité, correction, groupe), vous pouvez définir si l'accès est en lecture seule ou avec droits de modification. Vous pouvez également définir une date d'expiration pour les liens de partage, après laquelle ils ne seront plus accessibles."
      },
      {
        question: "Est-il possible de rendre anonymes les corrections pour une évaluation par les pairs ?",
        answer: "Oui, la plateforme propose une fonctionnalité d'anonymisation qui masque les noms des étudiants lors du partage de corrections. Cela est particulièrement utile pour les évaluations par les pairs ou lors de discussions pédagogiques où l'identité des étudiants n'est pas pertinente."
      },
      {
        question: "Comment fonctionnent les liens de partage ?",
        answer: "Chaque correction peut être partagée via un lien unique sécurisé. Ces liens contiennent un code aléatoire et peuvent avoir une date d'expiration. L'accès est en lecture seule par défaut, ce qui permet aux étudiants de voir leur correction mais pas de la modifier. La page de correction partagée présente une interface simplifiée et intuitive avec les notes, commentaires et éventuels fichiers associés."
      }
    ]
  },
  {
    category: 'Gestion de fichiers',
    icon: <CloudUploadIcon color="primary" />,
    items: [
      {
        question: "Comment télécharger et organiser des fichiers dans la plateforme ?",
        answer: "La plateforme permet de télécharger des fichiers (images, documents PDF, etc.) et de les associer à des corrections spécifiques. Les fichiers sont automatiquement organisés par activité dans le système de stockage. Vous pouvez télécharger des fichiers lors de l'ajout d'une correction ou ajouter des fichiers à une correction existante."
      },
      {
        question: "Quels types de fichiers sont supportés ?",
        answer: "La plateforme supporte une large variété de formats de fichiers, notamment les images (JPG, PNG, GIF), les documents (PDF, DOCX, TXT), les fichiers de données (CSV, XLSX), et les présentations (PPTX). Cela vous permet de partager différents types de ressources avec vos étudiants selon vos besoins pédagogiques."
      },
      {
        question: "Comment inclure des images dans mes corrections ?",
        answer: "Vous pouvez inclure des images directement dans le contenu de vos corrections à l'aide de l'éditeur de texte riche. Cliquez sur le bouton 'Insérer une image' dans la barre d'outils, puis téléchargez l'image ou insérez une URL. Vous pouvez également inclure des images dans vos fragments pour les réutiliser facilement dans plusieurs corrections."
      },
      {
        question: "Est-ce que les étudiants peuvent voir les fichiers partagés ?",
        answer: "Oui, tous les fichiers associés à une correction sont visibles pour l'étudiant lorsqu'il accède à sa correction via le lien de partage ou le QR code. Les fichiers sont présentés de manière organisée et peuvent être téléchargés par l'étudiant pour une consultation hors ligne."
      },
      {
        question: "Comment gérer l'espace de stockage des fichiers ?",
        answer: "Les fichiers sont stockés de manière efficace sur nos serveurs, organisés par activité pour faciliter leur gestion. Vous pouvez consulter et gérer vos fichiers téléchargés depuis l'interface d'administration. Si vous n'avez plus besoin de certains fichiers, vous pouvez les supprimer pour libérer de l'espace."
      }
    ]
  }
];

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Général');
  const [showAllCategories, setShowAllCategories] = useState(true);
  
  // Filter FAQs based on search term
  const filteredFAQs = faqData
    .map(category => {
      const filteredItems = category.items.filter(item => {
        const questionMatch = item.question.toLowerCase().includes(searchTerm.toLowerCase());
        const answerMatch = item.answer.toLowerCase().includes(searchTerm.toLowerCase());
        return questionMatch || answerMatch;
      });
      return {
        ...category,
        items: filteredItems
      };
    })
    .filter(category => {
      // Only keep categories with matching items AND either showing all categories or matching the expanded category
      return category.items.length > 0 && (showAllCategories || category.category === expandedCategory);
    });
  
  // Count total questions after filtering
  const totalQuestions = filteredFAQs.reduce((acc, category) => acc + category.items.length, 0);

  // Handle category filter click
  const handleCategoryClick = (categoryName: string) => {
    if (expandedCategory === categoryName && !showAllCategories) {
      // If clicking the already selected category when filtering, reset to show all
      setExpandedCategory(categoryName);
      setShowAllCategories(true);
    } else {
      // Otherwise set the category and filter
      setExpandedCategory(categoryName);
      setShowAllCategories(false);
    }
  };

  // Reset category filter to show all categories
  const handleResetFilter = () => {
    setShowAllCategories(true);
    setExpandedCategory(null); // Réinitialiser la catégorie sélectionnée
  };
  
  return (
    <Container maxWidth="lg" className="py-8">
      <Box className="mb-8 text-center">
        <Typography variant="h4" component="h1" gutterBottom className="font-bold">
          Foire aux questions
        </Typography>
        <Typography variant="body1" color="text.secondary" className="w-full mx-auto">
          Trouvez des réponses aux questions les plus fréquentes sur notre plateforme d'évaluation pédagogique
        </Typography>
      </Box>
      
      <Paper elevation={3} className="p-6 mb-8 bg-white">
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Rechercher une question ou un mot-clé..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 3, alignItems: 'center' }}>
          {!showAllCategories && (
            <Button 
              variant="outlined" 
              startIcon={<FilterListIcon />} 
              size="small" 
              onClick={handleResetFilter}
              sx={{ mr: 1 }}
            >
              Afficher toutes les catégories
            </Button>
          )}
          
          {faqData.map((category) => (
            <Chip
              key={category.category}
              label={category.category}
              icon={category.icon}
              onClick={() => handleCategoryClick(category.category)}
              color={expandedCategory === category.category ? "primary" : "default"}
              variant={expandedCategory === category.category ? "filled" : "outlined"}
              sx={{ 
                pl: 0.5, 
                '& .MuiChip-icon': { 
                  ml: 0.5 
                },
                fontWeight: expandedCategory === category.category ? 'medium' : 'normal',
                transition: 'all 0.2s ease',
                display: showAllCategories || category.category === expandedCategory ? 'flex' : 'none'
              }}
            />
          ))}
        </Box>
      </Paper>

      {searchTerm && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {totalQuestions} {totalQuestions === 1 ? 'résultat trouvé' : 'résultats trouvés'} pour "{searchTerm}"
          </Typography>
        </Box>
      )}
      
      {!showAllCategories && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Catégorie filtrée : {expandedCategory}
          </Typography>
        </Box>
      )}
      
      {filteredFAQs.length === 0 ? (
        <Alert severity="info" sx={{ mb: 4 }}>
          Aucune question ne correspond à votre recherche. Essayez avec d'autres termes ou consultez toutes les catégories.
        </Alert>
      ) : (
        filteredFAQs.map((category, index) => (
          <Box key={category.category} sx={{ mb: 6 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 3,
              pb: 1,
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}>
              {category.icon}
              <Typography variant="h5" component="h2" sx={{ ml: 1, fontWeight: 'bold' }}>
                {category.category}
              </Typography>
            </Box>
            
            <Box className="space-y-3">
              {category.items.map((item, i) => (
                <Accordion 
                  key={i}
                  expanded={true} // Always expanded when visible (we control visibility by filtering categories)
                  sx={{ 
                    mb: 1.5,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    '&:before': {
                      display: 'none',
                    }
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls={`panel${index}${i}-content`}
                    id={`panel${index}${i}-header`}
                    sx={{ fontWeight: 'medium' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <QuestionAnswerIcon sx={{ mr: 1.5, color: 'primary.main' }} fontSize="small" />
                      <Typography variant="body1" fontWeight="medium" sx={{ flex: 1 }}>
                        {item.question}
                      </Typography>
                      {item.underConstruction && (
                        <Badge 
                          badgeContent={
                            <ConstructionIcon 
                              fontSize="small" 
                              sx={{ color: 'warning.main' }} 
                            />
                          }
                          sx={{ 
                            '& .MuiBadge-badge': { 
                              backgroundColor: 'warning.light',
                              padding: '4px',
                              borderRadius: '50%'
                            } 
                          }}
                        >
                          <Chip 
                            label="En chantier" 
                            size="small" 
                            color="warning" 
                            variant="outlined"
                            sx={{ mr: 1 }}
                          />
                        </Badge>
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0, pl: 4 }}>
                    <Typography variant="body1" color="text.secondary" style={{ lineHeight: 1.6 }}>
                      {item.answer}
                    </Typography>
                    {item.underConstruction && (
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mt: 2, 
                          p: 1.5, 
                          bgcolor: 'warning.lighter', 
                          borderRadius: 1,
                          border: '1px dashed',
                          borderColor: 'warning.main'
                        }}
                      >
                        <ConstructionIcon sx={{ color: 'warning.main', mr: 1 }} />
                        <Typography variant="body2" color="warning.dark">
                          Cette fonctionnalité est actuellement en développement et sera disponible prochainement.
                        </Typography>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </Box>
        ))
      )}
      
      <Divider sx={{ my: 6 }} />
      
      <Box sx={{ 
        textAlign: 'center', 
        mt: 4, 
        p: 5, 
        bgcolor: 'background.paper', 
        borderRadius: 2,
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
      }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Vous ne trouvez pas de réponse à votre question ?
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: '650px', mx: 'auto' }}>
          Notre équipe d'assistance est prête à vous aider. Contactez-nous directement et nous vous répondrons dans les plus brefs délais.
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          component="a" 
          href="mailto:admin@sekrane.fr" 
          size="large"
        >
          Contacter le support
        </Button>
      </Box>
    </Container>
  );
}
