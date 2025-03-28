import React from 'react';
import Link from 'next/link';
import { Paper, Typography, Button } from '@mui/material';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface LoadingErrorStatesProps {
  loading: boolean;
  error: string;
  successMessage: string;
}

const LoadingErrorStates: React.FC<LoadingErrorStatesProps> = ({
  loading,
  error,
  successMessage
}) => {
  // The problem is here: this component always returns some JSX or null
  // But the parent component is checking "if (loadingErrorElement)" which will always be truthy
  // since it's a React element (even if it returns null internally)
  
  if (loading) {
    return (
      <div className="container max-w-[400px] mx-auto px-4 py-8 flex justify-center">
        <LoadingSpinner size="lg" text="Chargement de la correction " />
      </div>
    );
  }

  if (error && !successMessage) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="w-full max-w-lg animate-slide-in">
          <Paper className="p-6 overflow-hidden relative" elevation={3}>
            <div className="flex items-start gap-4">
              <div className="text-red-500 animate-once">
                <ErrorOutlineIcon fontSize="large" />
              </div>
              <div className="flex-1">
                <Typography variant="h6" className="text-red-600 font-semibold mb-2">
                  {error}
                </Typography>
                <div className="flex justify-around items-center mt-4">
                  <Button 
                    variant="outlined" 
                    color="success" 
                    size="small" 
                    className="mt-4"
                    startIcon={<RefreshIcon />}
                    onClick={() => window.location.reload()}
                  >
                    Recharger
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="small"
                    color="primary"
                    className="mt-4"
                    component={Link}
                    href="/"
                    startIcon={<ArrowBackIcon />}
                  >
                    Retour à l'accueil
                  </Button>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-1 left-0 w-full h-1">
              <div className="bg-red-500 h-full w-full animate-shrink"></div>
            </div>
          </Paper>
        </div>
      </div>
    );
  }
  
  // Return null when there's no loading state or error
  return null;
}

export default LoadingErrorStates;
