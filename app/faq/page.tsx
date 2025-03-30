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
  Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import SchoolIcon from '@mui/icons-material/School';
import SettingsIcon from '@mui/icons-material/Settings';
import GroupIcon from '@mui/icons-material/Group';
import SecurityIcon from '@mui/icons-material/Security';

// FAQ data
const faqData = [
  {
    category: 'Général',
    icon: <QuestionAnswerIcon color="primary" />,
    items: [
      {
        question: "Qu'est-ce que le Système de corrections d'activités ?",
        answer: "C'est une plateforme en ligne conçue pour aider les enseignants à créer, gérer et partager des corrections d'activités pédagogiques. Elle permet de structurer les évaluations, d'analyser les performances et de suivre la progression des élèves."
      },
      {
        question: "Est-ce que l'utilisation de la plateforme est gratuite ?",
        answer: "Oui, la plateforme est entièrement gratuite pour les enseignants et les établissements éducatifs. Elle est distribuée sous licence Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International."
      },
      {
        question: "Comment puis-je commencer à utiliser la plateforme ?",
        answer: "Vous pouvez commencer immédiatement en créant une nouvelle activité depuis la page d'accueil. Vous pouvez également explorer la version de démonstration pour vous familiariser avec les fonctionnalités avant d'ajouter votre propre contenu."
      },
      {
        question: "Existe-t-il des tutoriels ou des guides pour apprendre à utiliser la plateforme ?",
        answer: "Oui, nous proposons des tutoriels vidéo et des guides détaillés dans la section 'Aide'. Vous y trouverez des explications pas à pas sur toutes les fonctionnalités principales."
      }
    ]
  },
  {
    category: 'Activités et Corrections',
    icon: <SchoolIcon color="primary" />,
    items: [
      {
        question: "Comment créer une nouvelle activité ?",
        answer: "Cliquez sur 'Nouvelle activité' sur la page d'accueil ou dans le menu principal. Vous pourrez ensuite définir les détails de l'activité, comme le nom, la description, le barème (points expérimentaux et théoriques), etc."
      },
      {
        question: "Comment fonctionne l'évaluation avec des points expérimentaux et théoriques ?",
        answer: "Notre système vous permet de diviser votre notation en deux parties : expérimentale (pratique) et théorique. Vous définissez le nombre de points pour chaque partie lors de la création de l'activité, puis vous attribuez des notes pour chaque partie lors de la correction."
      },
      {
        question: "Puis-je réutiliser mes corrections pour d'autres élèves ?",
        answer: "Oui, vous pouvez utiliser la bibliothèque de fragments pour stocker des commentaires fréquemment utilisés et les réutiliser dans différentes corrections. Vous pouvez également dupliquer une correction existante comme point de départ."
      },
      {
        question: "Comment appliquer une pénalité de retard ?",
        answer: "Dans l'interface de correction, vous pouvez définir une date limite de rendu et une date de rendu effective. Si le rendu est en retard, vous pouvez activer la case 'Pénalité de retard' et spécifier le nombre de points à déduire."
      }
    ]
  },
  {
    category: 'Groupes et Statistiques',
    icon: <GroupIcon color="primary" />,
    items: [
      {
        question: "Comment créer un groupe de corrections ?",
        answer: "Dans la page de détails d'une activité, cliquez sur 'Groupes' puis sur 'Nouveau groupe'. Vous pourrez ensuite ajouter des corrections existantes à ce groupe ou créer de nouvelles corrections directement dans le groupe."
      },
      {
        question: "Quelles statistiques sont disponibles pour les groupes ?",
        answer: "Pour chaque groupe, vous pouvez voir la distribution des notes, la moyenne, la médiane, l'écart type, ainsi que des analyses détaillées sur les performances expérimentales vs théoriques. Ces statistiques sont présentées sous forme de graphiques interactifs."
      },
      {
        question: "Comment comparer les performances entre différents groupes ?",
        answer: "Dans la vue 'Groupes' d'une activité, vous pouvez sélectionner plusieurs groupes pour afficher une comparaison côte à côte de leurs statistiques. Cela permet d'identifier les différences de performance entre les classes ou les périodes."
      },
      {
        question: "Est-il possible d'exporter les statistiques d'un groupe ?",
        answer: "Oui, vous pouvez exporter les statistiques au format CSV ou Excel pour une analyse plus approfondie dans d'autres outils. Vous pouvez également générer des rapports PDF qui incluent les graphiques et les principales métriques."
      }
    ]
  },
  {
    category: 'Fonctionnalités avancées',
    icon: <SettingsIcon color="primary" />,
    items: [
      {
        question: "Comment utiliser la bibliothèque de fragments ?",
        answer: "La bibliothèque de fragments vous permet de stocker et d'organiser des commentaires réutilisables. Vous pouvez créer des fragments par catégorie, les rechercher, et les glisser-déposer directement dans vos corrections."
      },
      {
        question: "Est-il possible d'analyser la progression d'un élève sur plusieurs activités ?",
        answer: "Oui, si vous utilisez le même nom pour un élève dans différentes corrections, le système peut générer des graphiques de progression montrant l'évolution des performances au fil du temps."
      },
      {
        question: "La plateforme peut-elle s'adapter à différentes matières ou types d'évaluation ?",
        answer: "Absolument. Bien que conçue initialement pour les sciences, la plateforme est suffisamment flexible pour s'adapter à toute discipline. Vous pouvez personnaliser les critères d'évaluation et les fragments selon vos besoins spécifiques."
      }
    ]
  },
  {
    category: 'Partage et confidentialité',
    icon: <SecurityIcon color="primary" />,
    items: [
      {
        question: "Comment partager une correction avec un élève ?",
        answer: "Pour chaque correction, vous pouvez générer un lien de partage sécurisé. L'élève pourra accéder à sa correction sans avoir besoin d'un compte, simplement en utilisant ce lien unique."
      },
      {
        question: "Les données des élèves sont-elles protégées ?",
        answer: "Oui, nous prenons la protection des données très au sérieux. Les noms des élèves sont stockés uniquement à des fins d'organisation et ne sont jamais partagés. Tous les liens de partage sont protégés par des codes aléatoires et peuvent être désactivés à tout moment."
      },
      {
        question: "Puis-je partager mes corrections avec d'autres enseignants ?",
        answer: "Oui, vous pouvez partager vos activités, corrections et fragments avec d'autres enseignants. Vous pouvez contrôler précisément ce qui est partagé et avec qui."
      }
    ]
  }
];

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Général');
  
  // Filter FAQs based on search term
  const filteredFAQs = faqData.map(category => {
    const filteredItems = category.items.filter(item => {
      const questionMatch = item.question.toLowerCase().includes(searchTerm.toLowerCase());
      const answerMatch = item.answer.toLowerCase().includes(searchTerm.toLowerCase());
      return questionMatch || answerMatch;
    });
    return {
      ...category,
      items: filteredItems
    };
  }).filter(category => category.items.length > 0);
  
  // Count total questions after filtering
  const totalQuestions = filteredFAQs.reduce((acc, category) => acc + category.items.length, 0);
  
  return (
    <Container maxWidth="lg" className="py-8">
      <Box className="mb-6">
        <Typography variant="h4" component="h1" gutterBottom>
          Foire aux questions
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Trouvez des réponses aux questions les plus fréquentes sur notre plateforme
        </Typography>
      </Box>
      
      <Paper elevation={2} className="p-4 mb-6">
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
        />
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
          {faqData.map((category) => (
            <Chip
              key={category.category}
              label={category.category}
              icon={category.icon}
              onClick={() => setExpandedCategory(category.category)}
              color={expandedCategory === category.category ? "primary" : "default"}
              variant={expandedCategory === category.category ? "filled" : "outlined"}
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
      
      {filteredFAQs.length === 0 ? (
        <Alert severity="info" sx={{ mb: 4 }}>
          Aucune question ne correspond à votre recherche. Essayez avec d'autres termes ou consultez toutes les catégories.
        </Alert>
      ) : (
        filteredFAQs.map((category, index) => (
          <Box key={category.category} sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {category.icon}
              <Typography variant="h5" component="h2" sx={{ ml: 1 }}>
                {category.category}
              </Typography>
            </Box>
            
            {category.items.map((item, i) => (
              <Accordion 
                key={i}
                expanded={searchTerm !== '' || expandedCategory === category.category}
                onChange={() => setExpandedCategory(expandedCategory === category.category ? null : category.category)}
                sx={{ mb: 1 }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls={`panel${index}${i}-content`}
                  id={`panel${index}${i}-header`}
                  sx={{ fontWeight: 'medium' }}
                >
                  <QuestionAnswerIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body1" fontWeight="medium">
                    {item.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body1" color="text.secondary">
                    {item.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        ))
      )}
      
      <Divider sx={{ my: 4 }} />
      
      <Box sx={{ textAlign: 'center', mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Vous ne trouvez pas de réponse à votre question ?
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Contactez-nous directement et nous vous répondrons dans les plus brefs délais.
        </Typography>
        <Chip 
          label="Contacter le support" 
          component="a" 
          href="mailto:admin@sekrane.fr" 
          clickable 
          color="primary"
        />
      </Box>
    </Container>
  );
}
