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

// FAQ data with expanded and updated content based on system capabilities
const faqData = [
  {
    category: 'Général',
    icon: <QuestionAnswerIcon color="primary" />,
    items: [
      {
        question: "Qu'est-ce que le Système de corrections d'activités ?",
        answer: "C'est une plateforme en ligne conçue pour les enseignants qui permet de créer, gérer et partager des corrections d'activités pédagogiques. Le système utilise une approche unique avec des points expérimentaux et théoriques pour une évaluation précise, et offre des outils d'analyse statistique avancés pour suivre la progression des élèves."
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
        answer: "Oui, nous proposons des tutoriels vidéo et des guides détaillés dans la section 'Aide'. Vous y trouverez des explications pas à pas sur toutes les fonctionnalités principales, notamment la création d'activités, l'organisation des groupes, et l'utilisation de la bibliothèque de fragments."
      },
      {
        question: "Quels sont les prérequis techniques pour utiliser la plateforme ?",
        answer: "La plateforme fonctionne entièrement dans votre navigateur web et ne nécessite aucune installation. Elle est compatible avec tous les navigateurs modernes (Chrome, Firefox, Safari, Edge) et s'adapte aux ordinateurs, tablettes et smartphones. Une connexion internet stable est recommandée pour une expérience optimale."
      }
    ]
  },
  {
    category: 'Activités et Corrections',
    icon: <SchoolIcon color="primary" />,
    items: [
      {
        question: "Comment créer une nouvelle activité ?",
        answer: "Cliquez sur 'Nouvelle activité' sur la page d'accueil ou dans le menu principal. Vous pourrez ensuite définir les détails de l'activité, comme le nom, la description, le barème (points expérimentaux et théoriques). Une fois l'activité créée, vous pourrez y ajouter des corrections individuelles ou créer des groupes d'étudiants."
      },
      {
        question: "Comment fonctionne l'évaluation avec des points expérimentaux et théoriques ?",
        answer: "Notre système vous permet de diviser votre notation en deux parties : expérimentale (pratique, manipulation, savoir-faire) et théorique (connaissances, compréhension conceptuelle). Cette approche duale offre une évaluation plus précise et permet d'identifier où les étudiants excellent ou ont des difficultés. Vous définissez le nombre de points pour chaque partie lors de la création de l'activité, puis vous attribuez des notes pour chaque partie lors de la correction."
      },
      {
        question: "Puis-je réutiliser mes corrections pour d'autres élèves ?",
        answer: "Oui, vous pouvez utiliser la bibliothèque de fragments pour stocker des commentaires fréquemment utilisés et les réutiliser dans différentes corrections. Les fragments peuvent être classés par catégories et associés à des types d'activités spécifiques. Vous pouvez également dupliquer une correction existante comme point de départ, puis la personnaliser pour chaque étudiant."
      },
      {
        question: "Comment appliquer une pénalité de retard ?",
        answer: "Dans l'interface de correction, vous pouvez définir une date limite de rendu et une date de rendu effective. Si le rendu est en retard, vous pouvez activer la case 'Pénalité de retard' et spécifier le nombre de points à déduire. La pénalité peut être appliquée globalement ou séparément pour les points expérimentaux et théoriques."
      },
      {
        question: "Puis-je modifier une correction après l'avoir enregistrée ?",
        answer: "Oui, vous pouvez modifier une correction à tout moment. Si vous avez déjà partagé la correction avec l'étudiant, les modifications seront automatiquement visibles via le lien de partage. Le système conserve également un historique des modifications principales pour votre référence."
      },
      {
        question: "Comment ajouter des fichiers ou des images à une correction ?",
        answer: "Lors de la création ou de l'édition d'une correction, vous pouvez utiliser le bouton 'Ajouter un fichier' pour télécharger des documents, images, ou autres fichiers pertinents. Ces fichiers seront accessibles à l'étudiant si vous partagez la correction. Vous pouvez également insérer des images directement dans les commentaires pour illustrer vos explications."
      }
    ]
  },
  {
    category: 'Bibliothèque de Fragments',
    icon: <CategoryIcon color="primary" />,
    items: [
      {
        question: "Qu'est-ce que la bibliothèque de fragments ?",
        answer: "La bibliothèque de fragments est un système qui vous permet de créer, organiser et réutiliser des commentaires standard pour vos corrections. Chaque fragment peut contenir du texte formaté, des équations, et même des images. Les fragments sont organisés par catégories et peuvent être associés à des types d'activités spécifiques pour un accès rapide lors de la correction."
      },
      {
        question: "Comment organiser mes fragments efficacement ?",
        answer: "Nous recommandons d'organiser vos fragments par thèmes ou types d'erreurs. Par exemple, vous pourriez avoir des catégories comme 'Erreurs de calcul', 'Problèmes de méthode', 'Bonnes pratiques', etc. Vous pouvez également utiliser des tags pour faciliter la recherche et associer certains fragments à des activités spécifiques. Une bonne organisation vous permettra de trouver rapidement les fragments pertinents lors de la correction."
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
        question: "Est-il possible de créer des fragments avec du formatage avancé ?",
        answer: "Oui, l'éditeur de fragments prend en charge le formatage riche : gras, italique, puces, tableaux, etc. Vous pouvez également insérer des équations mathématiques en utilisant la syntaxe LaTeX, et ajouter des images ou des diagrammes. Ces fonctionnalités permettent de créer des commentaires clairs et pédagogiques."
      }
    ]
  },
  {
    category: 'Groupes et Statistiques',
    icon: <GroupIcon color="primary" />,
    items: [
      {
        question: "Comment créer un groupe de corrections ?",
        answer: "Dans la page de détails d'une activité, cliquez sur 'Groupes' puis sur 'Nouveau groupe'. Donnez un nom à votre groupe (par exemple, le nom de votre classe) et ajoutez-y des corrections. Vous pouvez ajouter des corrections existantes ou créer de nouvelles corrections directement dans le groupe. Les groupes peuvent également contenir des sous-groupes pour une organisation plus fine."
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
        question: "Est-il possible de créer des tableaux de bord personnalisés ?",
        answer: "Oui, vous pouvez créer des tableaux de bord personnalisés qui regroupent les statistiques et graphiques les plus pertinents pour vous. Ces tableaux de bord peuvent être configurés pour afficher automatiquement les données de vos groupes actuels et peuvent être enregistrés pour un accès rapide depuis la page d'accueil."
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
        question: "Peut-on créer des modèles personnalisés pour les activités ?",
        answer: "Oui, vous pouvez créer des modèles (templates) qui définissent la structure d'une activité : barème, critères d'évaluation, fragments recommandés, etc. Ces modèles peuvent être réutilisés pour créer rapidement de nouvelles activités similaires sans avoir à redéfinir tous les paramètres."
      },
      {
        question: "La plateforme peut-elle s'adapter à différentes matières ou types d'évaluation ?",
        answer: "Absolument. Bien que conçue initialement pour les sciences, la plateforme est suffisamment flexible pour s'adapter à toute discipline. Vous pouvez personnaliser les critères d'évaluation, le système de notation, et les fragments selon vos besoins spécifiques. Nous avons des enseignants qui utilisent le système pour des matières aussi diverses que les mathématiques, les langues, l'histoire, et même l'éducation physique."
      },
      {
        question: "Comment configurer des rubriques d'évaluation ?",
        answer: "La fonctionnalité de rubriques vous permet de définir une grille d'évaluation structurée avec des critères spécifiques et des niveaux de performance. Pour chaque critère, vous pouvez spécifier des descripteurs pour différents niveaux et associer des points. Lors de la correction, il suffit de sélectionner le niveau atteint pour chaque critère, et les points sont attribués automatiquement."
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
        answer: "Oui, vous pouvez importer des listes d'étudiants à partir de fichiers CSV ou Excel. Cela facilite la création de groupes et évite d'avoir à saisir manuellement les noms des étudiants. Le système peut également synchroniser les listes d'étudiants avec des services externes via l'API."
      },
      {
        question: "Comment exporter les données vers d'autres systèmes ?",
        answer: "La plateforme offre plusieurs options d'export : CSV, Excel, PDF, et JSON. Vous pouvez exporter les notes, les commentaires, les statistiques, et d'autres données. Ces exports peuvent être configurés pour s'adapter au format attendu par d'autres systèmes comme les registres de notes électroniques.",
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
        answer: "Pour chaque correction, vous pouvez générer un lien de partage sécurisé en cliquant sur le bouton 'Partager'. Ce lien peut être envoyé directement à l'élève par email ou copié-collé dans votre système de communication habituel. L'élève pourra accéder à sa correction sans avoir besoin d'un compte, simplement en utilisant ce lien unique."
      },
      {
        question: "Les données des élèves sont-elles protégées ?",
        answer: "Oui, nous prenons la protection des données très au sérieux. Les noms des élèves sont stockés uniquement à des fins d'organisation et ne sont jamais partagés. Tous les liens de partage sont protégés par des codes aléatoires et peuvent être désactivés à tout moment. Les données sont stockées de manière sécurisée et conformément aux réglementations sur la protection des données."
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
