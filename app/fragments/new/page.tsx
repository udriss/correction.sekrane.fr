'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Alert,
  IconButton,
  Button
} from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockIcon from '@mui/icons-material/Lock';
import LoadingSpinner from '@/components/LoadingSpinner';
import useAuth from '@/hooks/useAuth';
import FragmentEditModal, { Fragment } from '@/components/FragmentEditModal';

interface Activity {
  id: number;
  name: string;
}

// Component with session access
export default function NewFragmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activityIdParam = searchParams ? searchParams.get('activityId') : null;
  const { user, status } = useAuth();
  
  // Modify the redirect to stop forcing signin
  useEffect(() => {
    // Only set an error state, don't redirect
    if (status === 'unauthenticated') {
      
      // Remove the redirect to signin
      // router.push('/api/auth/signin');
    }
  }, [status, router]);
  
  // Convert activityIdParam to a number if it exists
  const [activityId, setActivityId] = useState<number | null>(
    activityIdParam ? parseInt(activityIdParam) : null
  );
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(true);

  // Handle back button behavior
  const handleBackClick = () => {
    if (activityIdParam) {
      router.push(`/activities/${activityIdParam}/fragments`);
    } else {
      router.push('/fragments');
    }
  };
  
  // Load existing categories and activities
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch activities
        const activitiesResponse = await fetch('/api/activities');
        if (activitiesResponse.ok) {
          const activitiesData = await activitiesResponse.json();
          setActivities(activitiesData);
        }
        
        // Fetch fragments to extract unique categories
        const fragmentsResponse = await fetch('/api/fragments');
        if (fragmentsResponse.ok) {
          const fragmentsData = await fragmentsResponse.json();
          const uniqueCategories = Array.from(
            new Set(fragmentsData.map((f: any) => f.category))
          ).filter(Boolean);
          setCategories(uniqueCategories as string[]);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    }
    
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);
  
  // Handle saving the fragment through the modal
  const handleSaveFragment = async (fragment: Fragment): Promise<void> => {
    setLoading(true);
    setError('');
    
    try {
      // Ensure activityId from URL parameter is used if available
      const submissionData = {
        ...fragment,
        // Make sure we're using the activityId from the URL parameter if available
        activity_id: activityIdParam ? parseInt(activityIdParam) : fragment.activity_id
      };
      
      // Log the request payload for debugging
      
      
      const response = await fetch('/api/fragments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        // Enhanced error handling with SQL error detail
        let errorMessage = responseData.error || 'Erreur lors de la création du fragment';
        
        // Add SQL error message if available
        if (responseData.sqlMessage) {
          errorMessage += ` (SQL: ${responseData.sqlMessage})`;
          console.error('SQL Error:', responseData.sqlMessage);
        }
        
        throw new Error(errorMessage);
      }
      
      setSuccess('Fragment créé avec succès');
      
      // Reset form or redirect
      setTimeout(() => {
        // Redirect to the correct page based on context
        if (activityIdParam) {
          router.push(`/activities/${activityIdParam}/fragments`);
        } else {
          router.push('/fragments');
        }
      }, 1500);
      
    } catch (err) {
      console.error('Error creating fragment:', err);
      setError((err as Error).message || 'Erreur lors de la création du fragment');
      throw err; // Re-throw to let the modal handle it
    } finally {
      setLoading(false);
    }
  };
  
  // Handle modal close
  const handleModalClose = () => {
    setModalOpen(false);
    handleBackClick();
  };
  
  if (status === 'loading') {
    return (
      <Container maxWidth={false} sx={{ maxWidth: '400px' }} className="py-8">
        <LoadingSpinner text="Chargement" />
      </Container>
    );
  }
  
  // Replace the authentication check with a more permissive approach
  if (status === 'unauthenticated') {
    return (
      <Container maxWidth="md" className="py-8">
        <Alert severity="warning">
          Vous devez être connecté pour créer un fragment.
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

  return (
    <Container maxWidth="md" className="py-8">
      <Paper elevation={2} className="p-6">
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handleBackClick} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h1">
            Nouveau fragment
            {activityIdParam && activities.find(a => a.id === parseInt(activityIdParam)) && 
              ` pour ${activities.find(a => a.id === parseInt(activityIdParam))?.name}`
            }
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" className="mb-4">
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" className="mb-4">
            {success}
          </Alert>
        )}
        
        {/* Use FragmentEditModal instead of the form */}
        <FragmentEditModal
          open={modalOpen}
          onClose={handleModalClose}
          fragment={null}
          activityId={activityIdParam ? parseInt(activityIdParam) : null}
          onSave={handleSaveFragment}
          categories={categories}
          activities={activities}
        />
      </Paper>
    </Container>
  );
}
