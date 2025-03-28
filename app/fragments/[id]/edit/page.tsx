'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Alert,
  IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockIcon from '@mui/icons-material/Lock';
import useAuth from '@/hooks/useAuth';
import LoadingSpinner from '@/components/LoadingSpinner';
import FragmentEditModal, { Fragment } from '@/components/FragmentEditModal';

interface Activity {
  id: number;
  name: string;
}

export default function EditFragmentPage() {
  const router = useRouter();
  const params = useParams();
  const fragmentId = params?.id as string;
  
  const { user, status } = useAuth();
  
  const [fragment, setFragment] = useState<Fragment | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal is always open in this page-as-a-modal pattern
  const [modalOpen, setModalOpen] = useState(true);
  
  // Load fragment data and options
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch fragment details
        const fragmentResponse = await fetch(`/api/fragments/${fragmentId}`);
        
        if (!fragmentResponse.ok) {
          throw new Error('Erreur lors du chargement du fragment');
        }
        
        const fragmentData = await fragmentResponse.json();
        setFragment(fragmentData);
        
        // Check ownership
        if (!fragmentData.isOwner) {
          router.push('/fragments');
          return;
        }
        
        // Fetch activities
        const activitiesResponse = await fetch('/api/activities');
        if (activitiesResponse.ok) {
          const activitiesData = await activitiesResponse.json();
          setActivities(activitiesData);
        }
        
        // Fetch categories
        const categoriesResponse = await fetch('/api/categories');
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError((err as Error).message || 'Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    }
    
    if (status === 'authenticated' && fragmentId) {
      fetchData();
    }
  }, [status, fragmentId, router]);
  
  // Handle fragment update
  const handleSaveFragment = async (updatedFragment: Fragment) => {
    try {
      const response = await fetch(`/api/fragments/${fragmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedFragment),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour du fragment');
      }
      
      // Redirect to fragments list on successful update
      setTimeout(() => {
        // If we have an activity ID, go back to that activity's fragments page
        if (fragment?.activity_id) {
          router.push(`/activities/${fragment.activity_id}/fragments`);
        } else {
          router.push('/fragments');
        }
      }, 1500);
    } catch (err) {
      console.error('Error updating fragment:', err);
      throw err;
    }
  };
  
  // Handle modal close
  const handleClose = () => {
    // Always navigate back when closing from the edit page
    if (fragment?.activity_id) {
      router.push(`/activities/${fragment.activity_id}/fragments`);
    } else {
      router.push('/fragments');
    }
  };
  
  if (status === 'loading' || loading) {
    return (
      <Container maxWidth={false} sx={{ maxWidth: '400px' }} className="py-8">
        <div className="py-10 flex justify-center max-w-[400px] mx-auto">
        <LoadingSpinner text="Chargement" />
        </div>
      </Container>
    );
  }
  
  if (status === 'unauthenticated') {
    return (
      <Container maxWidth="md" className="py-8">
        <Alert severity="warning">
          Vous devez être connecté pour modifier ce fragment.
        </Alert>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Button 
            variant="contained" 
            href="/api/auth/signin"
            startIcon={<LockIcon />}
          >
            Se connecter
          </Button>
        </Box>
      </Container>
    );
  }
  
  if (fragment && !fragment.isOwner) {
    return (
      <Container maxWidth="md" className="py-8">
        <Alert severity="error">
          Vous n'êtes pas autorisé à modifier ce fragment. Redirection en cours...
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" className="py-8">
      <Paper elevation={2} className="p-6">
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton 
            color='primary' 
            onClick={handleClose} 
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h1">
            Modifier le fragment
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" className="mb-4">
            {error}
          </Alert>
        )}
        
        {/* Use the modal but in "embedded mode" */}
        <FragmentEditModal
          open={modalOpen}
          onClose={handleClose}
          fragment={fragment}
          onSave={handleSaveFragment}
          categories={categories}
          activities={activities}
        />
      </Paper>
    </Container>
  );
}
