'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Typography, 
  Paper,
  Button,
  Alert,
  Container,
  Box,
  Divider,
  Chip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SchoolIcon from '@mui/icons-material/School';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import GroupsIcon from '@mui/icons-material/Groups';
import Link from 'next/link';
import ClassForm from '@/components/classes/ClassForm';
import GradientBackground from '@/components/ui/GradientBackground';
import H1Title from '@/components/ui/H1Title';

export default function NewClassPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  
  const handleSuccess = (classId: number) => {
    router.push(`/classes/${classId}`);
  };

  return (
    <Container maxWidth="md" className="py-8">
      {/* Header avec gradient amélioré */}
      <Paper 
        elevation={4}
        className="mb-8 rounded-xl overflow-hidden transform hover:scale-[1.01] transition-transform"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        {/* Utilisation du nouveau composant GradientBackground */}
        <GradientBackground variant="primary" sx={{ py: 4, px: 3 }}>
          {/* Content */}
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            gap: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.15)', 
                  p: 1.5, 
                  borderRadius: '50%',
                  display: 'flex',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}
              >
                <SchoolIcon 
                  sx={{ 
                    fontSize: 40, 
                    color: 'white',
                    filter: 'drop-shadow(0 2px 4px rgb(209, 209, 209))'
                  }} 
                />
              </Box>
              
              <Box>
                {/* Utilisation du composant H1Title standardisé */}
                <H1Title>
                  Nouvelle classe
                </H1Title>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    maxWidth: '500px'
                  }}
                >
                  Ajoutez une nouvelle classe et organisez vos activités pédagogiques pour vos étudiants
                </Typography>
              </Box>
            </Box>
            
            <Button 
              variant="contained" 
              color="secondary" 
              startIcon={<ArrowBackIcon />} 
              component={Link} 
              href="/classes"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white', 
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.3)',
                },
                fontWeight: 600,
                py: 1,
                px: 2,
                borderRadius: 2,
                boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
              }}
            >
              Retour aux classes
            </Button>
          </Box>
        </GradientBackground>
        
        {/* Info cards */}
        <Box 
          sx={{ 
            bgcolor: 'background.paper',
            p: 2,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            justifyContent: 'space-around'
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            px: 2,
            py: 1,
            borderRadius: 2,
            bgcolor: 'background.default'
          }}>
            <GroupsIcon color="primary" />
            <Typography variant="body2">
              Organisation simplifiée des groupes d'étudiants
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            px: 2,
            py: 1,
            borderRadius: 2,
            bgcolor: 'background.default'
          }}>
            <AddCircleIcon color="secondary" />
            <Typography variant="body2">
              Ajoutez facilement des activités adaptées à chaque classe
            </Typography>
          </Box>
        </Box>
      </Paper>

      {error && (
        <Alert 
          severity="error" 
          className="mb-6"
          sx={{
            borderRadius: 2,
            '& .MuiAlert-icon': {
              fontSize: '1.5rem'
            }
          }}
        >
          {error}
        </Alert>
      )}
      <Divider flexItem sx={{ flexGrow: 1 }} />

      <Paper 
        elevation={2} 
        sx={{ 
          borderRadius: 3, 
          overflow: 'hidden',
          transition: 'box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: 4
          }
        }}
      >
        <ClassForm onSuccess={handleSuccess} onError={setError} />
      </Paper>
    </Container>
  );
}
