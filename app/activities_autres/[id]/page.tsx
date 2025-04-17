'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ActivityAutre, CorrectionAutre, CorrectionAutreEnriched, Student } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  Button, 
  IconButton, 
  Paper, 
  Typography, 
  TextField, 
  CircularProgress, 
  Container, 
  Tabs, 
  Tab,
  Box, 
  FormHelperText, 
  Chip,
  alpha
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import { useSnackbar } from 'notistack';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import QrCodeIcon from '@mui/icons-material/QrCode';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import GradientBackground from '@/components/ui/GradientBackground';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import ActivityStatsGraphs from '@/components/ActivityStatsGraphs';
import ExportPDFComponentAutre from '@/components/pdfAutre/ExportPDFComponentAutre';
// Import FragmentsList et le type Fragment
import FragmentsList from '@/components/FragmentsList';
import { Fragment } from '@/lib/types';
import { getBatchShareCodes } from '@/lib/services/shareService';

export default function ActivityAutreDetail({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params Promise using React.use()
  const unwrappedParams = React.use(params);
  const { id } = unwrappedParams;
  const activityId = id;
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activity, setActivity] = useState<ActivityAutre | null>(null);
  const [corrections, setCorrections] = useState<CorrectionAutreEnriched[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any | null>(null);
  
  // États pour la gestion des fragments
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [loadingFragments, setLoadingFragments] = useState(false);
  const [fragmentsError, setFragmentsError] = useState('');
  
  const { enqueueSnackbar } = useSnackbar();
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [parts, setParts] = useState<{ name: string; points: number }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // États pour la fonction ExportPDFComponentAutre
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedSubGroup, setSelectedSubGroup] = useState<string>('');
  const [filteredCorrections, setFilteredCorrections] = useState<CorrectionAutre[]>([]);
  
  // Calculated values for subclasses
  const uniqueSubClasses = useMemo(() => {
    if (!students.length) return [];
    
    // Extract all sub_class values from students
    const subClasses = students
      .filter(student => student.sub_class !== undefined && student.sub_class !== null)
      .map(student => student.sub_class?.toString());
    
    // Remove duplicates
    return Array.from(new Set(subClasses)).sort((a, b) => Number(a) - Number(b));
  }, [students]);

  // Récupérer le tab initial depuis l'URL ou utiliser 0 par défaut
  const initialTabValue = useMemo(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam !== null) {
      const tabIndex = parseInt(tabParam, 10);
      if (!isNaN(tabIndex) && tabIndex >= 0 && tabIndex <= 4) {
        return tabIndex;
      }
    }
    return 0;
  }, [searchParams]);
  
  const [tabValue, setTabValue] = useState(initialTabValue);
  
  // Calculer le total des points
  const totalPoints = parts.reduce((sum, part) => sum + part.points, 0);

  useEffect(() => {
    const fetchActivityAndCorrections = async () => {
      try {
        // Fetch activity details
        const activityResponse = await fetch(`/api/activities_autres/${activityId}`);
        if (!activityResponse.ok) {
          const errorData = await activityResponse.json();
          
          // Créer une instance d'Error et y attacher les détails
          const error = new Error('Erreur lors du chargement de l\'activité : ' + (errorData.error || 'Erreur lors du chargement de l\'activité'));
          (error as any).details = errorData.details || {};
          setError(error);
          setErrorDetails(errorData.details || {});
          throw error;
        } 
        const activityData = await activityResponse.json();
        setActivity(activityData);
        setName(activityData.name);
        setContent(activityData.content || '');
        
        // Préparer les parties
        const partsData = activityData.parts_names.map((name: string, index: number) => ({
          name,
          points: activityData.points[index] || 0
        }));
        setParts(partsData);
        
        // Fetch corrections for this activity
        const correctionsResponse = await fetch(`/api/activities_autres/${activityId}/corrections`);
        if (!correctionsResponse.ok) {
          const errorData = await correctionsResponse.json();
          // Créer une instance d'Error et y attacher les détails
          const error = new Error('Erreur lors du chargement des corrections : ' + (errorData.error || 'Erreur lors du chargement des corrections'));
          (error as any).details = errorData.details || {};
          setError(error);
          setErrorDetails(errorData.details || {});
          throw error;
        }
        const correctionsData = await correctionsResponse.json();
        setCorrections(correctionsData);
      } catch (err) {
        console.error('Erreur:', err);
        // Si nous n'avons pas déjà défini l'erreur (avec des détails) ci-dessus
        if (!error) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        setLoading(false);
        
      }
    };
    
    fetchActivityAndCorrections();
  }, [activityId]);

  useEffect(() => {
    const fetchStudentsAndClasses = async () => {
      try {
        // Récupérer les étudiants
        const studentsResponse = await fetch('/api/students');
        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json();
          setStudents(studentsData);
        }
        
        // Récupérer les classes associées à cette activité
        const classesResponse = await fetch(`/api/activities_autres/${activityId}/classes`);
        if (classesResponse.ok) {
          const classesData = await classesResponse.json();
          setFilteredCorrections(corrections);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des étudiants et des classes:', err);
      }
    };
    
    if ((tabValue === 4 || tabValue === 2) && corrections.length > 0) {
      fetchStudentsAndClasses();
    }
  }, [tabValue, corrections, activityId, error]);

  // Définir une variable activities à partir de l'activité courante
  const activities = useMemo(() => {
    return activity ? [activity] : [];
  }, [activity]);

  // Fonction pour gérer l'ajout d'une nouvelle partie
  const handleAddPart = () => {
    setParts([...parts, { name: `Partie ${parts.length + 1}`, points: 0 }]);
  };

  // Fonction pour gérer la suppression d'une partie
  const handleRemovePart = (index: number) => {
    if (parts.length <= 1) {
      enqueueSnackbar('Vous devez avoir au moins une partie', { variant: 'warning' });
      return;
    }
    const newParts = [...parts];
    newParts.splice(index, 1);
    setParts(newParts);
  };

  // Fonction pour gérer les changements de nom d'une partie
  const handlePartNameChange = (index: number, value: string) => {
    const newParts = [...parts];
    newParts[index].name = value;
    setParts(newParts);
  };

  // Fonction pour gérer les changements de points d'une partie
  const handlePartPointsChange = (index: number, value: string) => {
    // Vérifier si la valeur est un nombre valide
    const numericValue = parseFloat(value);
    const newParts = [...parts];
    
    // Si c'est un nombre valide, utiliser cette valeur
    if (!isNaN(numericValue)) {
      newParts[index].points = numericValue;
    } else {
      // Sinon, remettre à 0
      newParts[index].points = 0;
    }
    
    setParts(newParts);
  };
  
  const handleEditClick = () => {
    setIsEditing(true);
  };
  
  const handleCancelClick = () => {
    setIsEditing(false);
    
    if (activity) {
      setName(activity.name);
      setContent(activity.content || '');
      
      // Réinitialiser les parties
      if (activity.parts_names && activity.points) {
        const partsData = activity.parts_names.map((name, index) => ({
          name,
          points: activity.points[index] || 0
        }));
        setParts(partsData);
      }
    }
    
    setErrors({});
  };

  // Validation du formulaire
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Le nom de l\'activité est requis';
    }
    
    let hasEmptyPartName = false;
    parts.forEach((part, index) => {
      if (!part.name.trim()) {
        hasEmptyPartName = true;
      }
    });
    
    if (hasEmptyPartName) {
      newErrors.parts = 'Chaque partie doit avoir un nom';
    }
    
    if (totalPoints <= 0) {
      newErrors.totalPoints = 'Le total des points doit être supérieur à 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/activities_autres/${activityId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name, 
          content, 
          parts_names: parts.map(part => part.name),
          points: parts.map(part => part.points)
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour de l\'activité');
      }
      
      const updatedActivity = await response.json();
      setActivity(updatedActivity);
      setIsEditing(false);
      enqueueSnackbar('Activité mise à jour avec succès', { variant: 'success' });
    } catch (error) {
      console.error('Erreur:', error);
      enqueueSnackbar(`Erreur: ${(error as Error).message}`, { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteClick = () => {
    setConfirmingDelete(true);
  };
  
  const handleCancelDelete = () => {
    setConfirmingDelete(false);
  };
  
  const handleConfirmDelete = async () => {
    try {
      const response = await fetch(`/api/activities_autres/${activityId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression de l\'activité');
      }
      
      enqueueSnackbar('Activité supprimée avec succès', { variant: 'success' });
      router.push('/activities_autres');
    } catch (err) {
      console.error('Erreur:', err);
      setError(`Erreur lors de la suppression de l'activité: ${(err as Error).message}`);
      enqueueSnackbar(`Erreur lors de la suppression de l'activité: ${(err as Error).message}`, { 
        variant: 'error' 
      });
      setConfirmingDelete(false);
    }
  };
  
  const handleNewCorrectionClick = () => {
    router.push(`/activities_autres/${activityId}/corrections/`);
  };
  
  // Modifier la fonction handleTabChange pour mettre à jour l'URL
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Mettre à jour l'URL avec le nouveau tab
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newValue.toString());
    
    // Utiliser router.replace pour éviter d'ajouter une entrée dans l'historique
    router.replace(`/activities_autres/${activityId}?${params.toString()}`, { scroll: false });
  };

  // Fonction pour charger les fragments de l'activité, mémorisée avec useCallback
  const fetchFragmentsForActivity = useCallback(async (activityId: string | number) => {
    if (!activityId) return;
    
    setLoadingFragments(true);
    setFragmentsError('');
    try {
      const response = await fetch(`/api/activities_autres/${activityId}/fragments`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Erreur (${response.status}): ${errorData.message || response.statusText}`);
      }
      const data = await response.json();
      setFragments(data);
    } catch (err) {
      console.error('Erreur lors du chargement des fragments:', err);
      setFragmentsError((err as Error).message);
      enqueueSnackbar(`Erreur lors du chargement des fragments: ${(err as Error).message}`, { 
        variant: 'error' 
      });
    } finally {
      setLoadingFragments(false);
    }
  }, [enqueueSnackbar]); // Inclure seulement les dépendances stables

  // Charger les fragments lorsque l'onglet correspondant est sélectionné
  useEffect(() => {
    if (tabValue === 1 && activityId) { // Changer l'index selon la position du nouvel onglet
      fetchFragmentsForActivity(activityId);
    }
  }, [tabValue, activityId, fetchFragmentsForActivity]);

  // Composant pour afficher les parties de l'activité (utilisé en mode lecture)
  const renderParts = () => {
    if (!activity || !activity.parts_names || !activity.points) {
      return <Typography variant="body2">Aucune partie définie</Typography>;
    }
    
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Barème ({totalPoints} points au total)
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
          {activity.parts_names.map((name, index) => (
            <Chip
              key={index}
              label={
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        width: '100%'
                      }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        <MenuBookIcon fontSize='medium'
                          sx={{ 
                          mr:1,
                          color: theme => alpha(theme.palette.text.primary, 0.6),
                        }}
                          /> {name}
                        </Typography>
                        <Box 
                          component="span"
                          sx={{ 
                            ml: 1, 
                            bgcolor: 'rgba(25, 118, 210, 0.12)',
                            px: 1,
                            py: 0.2,
                            borderRadius: 1,
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {activity.points[index]} pts
                        </Box>
                      </Box>
                    }
              color={"primary"}
              variant="outlined"
              sx={{ maxWidth: 'fit-content' }}
            />
          ))}
        </Box>
      </Box>
    );
  };

  if (loading) {
    return (
      <div className="container max-w-[400px] mx-auto px-4 py-8 flex justify-center">
        <LoadingSpinner size="lg" text="Chargement de l'activité" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="w-full max-w-4xl animate-slide-in">
          <Paper className="p-6 overflow-hidden relative" elevation={3}>
            <ErrorDisplay 
              error={error} 
              errorDetails={errorDetails}
              onRefresh={() => {
                setError(null);
                setErrorDetails(null);
                window.location.reload();
              }}
              withRefreshButton={true}
            />
          </Paper>
        </div>
      </div>
    );
  }
  
  if (!activity) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          Activité non trouvée
        </div>
      </div>
    );
  }
  
  return (
    <Container maxWidth="md" className="py-8">
      <Paper elevation={2} className="p-6">
        <GradientBackground 
          variant="primary" 
          sx={{
            mt: 4,
            borderRadius: 2,
            py: 3,
            px: 3
          }}
        >
          {isEditing ? (
            <div className="flex items-center w-full">
              <IconButton
                color='primary'
                component={Link}
                href="/activities_autres"
                target="_blank"
                rel="noopener noreferrer"
                className="mr-2 bg-white/20 hover:bg-white/30"
                sx={{ transform: 'translateX(-10px)' }}
              >
                <ArrowBackIcon sx={{ fontSize: 30, padding: 0, color: "primary" }} />
              </IconButton>
              <TextField
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-grow mr-2"
                variant="outlined"
                size="small"
                label="Nom de l'activité"
                placeholder="Entrez le nom de l'activité"
                error={!!errors.name}
                helperText={errors.name}
                autoFocus
              />
              <div className="flex space-x-2">
                <IconButton
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  title="Sauvegarder les modifications"
                  size="medium"
                  color="success"
                >
                  {isSubmitting ? <CircularProgress size={24} /> : <SaveIcon />}
                </IconButton>
                <IconButton
                  onClick={handleCancelClick}
                  color="error"
                  title="Annuler les modifications"
                  size="medium"
                >
                  <CloseIcon />
                </IconButton>
              </div>
            </div>
          ) : (
            <div className="flex items-center w-full">
              <IconButton
                color='primary'
                component={Link}
                href="/activities_autres"
                target="_blank"
                rel="noopener noreferrer"
                className="mr-2 bg-white/20 hover:bg-white/30"
                sx={{ transform: 'translateX(-10px)' }}
              >
                <ArrowBackIcon sx={{ fontSize: 30, padding: 0, color: "primary" }} />
              </IconButton>
              <Typography variant="h5" fontWeight={700} color="text.primary" className="font-bold" sx={{ transform: 'translateX(-10px)' }}>
                {activity.name}
                <IconButton
                  onClick={handleEditClick}
                  size="large"
                  color="primary"
                  aria-label="edit"
                >
                  <EditIcon className="ml-2" sx={{color: "secondary.light" }} />
                </IconButton>
                {confirmingDelete ? (
                  <>
                    <IconButton
                      onClick={handleCancelDelete}
                      color="inherit"
                      size="large"
                      title="Annuler la suppression"
                    >
                      <CloseIcon />
                    </IconButton>
                    <IconButton
                      onClick={handleConfirmDelete}
                      color="success"
                      size="large"
                      title="Confirmer la suppression"
                    >
                      <CheckIcon />
                    </IconButton>
                  </>
                ) : (
                  <IconButton
                    onClick={handleDeleteClick}
                    color="error"
                    size="large"
                    title="Supprimer cette activité"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Typography>
            </div>
          )}
        </GradientBackground>
        
        <Box sx={{ mt: 4 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Détails" />
            <Tab label="Fragments" />
            <Tab label="Corrections" />
            <Tab label="Statistiques" />
            <Tab label="Export PDF" icon={<QrCodeIcon />} iconPosition="start" />
          </Tabs>
        </Box>
        
        {/* Tab Content */}
        <Box sx={{ mt: 3, p: 2 }}>
          {/* Premier onglet: détails de l'activité */}
          {tabValue === 0 && (
            <div>
              {isEditing ? (
                <div>
                  <Box sx={{ mb: 4 }}>
                    <TextField
                      label="Description"
                      fullWidth
                      multiline
                      rows={4}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Parties et points
                      {errors.totalPoints && (
                        <FormHelperText error sx={{ ml: 1, display: 'inline' }}>
                          {errors.totalPoints}
                        </FormHelperText>
                      )}
                    </Typography>
                    {errors.parts && (
                      <FormHelperText error>{errors.parts}</FormHelperText>
                    )}
                    
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1">
                        Total des points: <strong>{totalPoints}</strong>
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={handleAddPart}
                        sx={{ ml: 2 }}
                      >
                        Ajouter une partie
                      </Button>
                    </Box>
                    
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      {parts.map((part, index) => (
                        <Box key={index} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <DragIndicatorIcon color="disabled" sx={{ cursor: 'grab' }} />
                          
                          <Box sx={{ flexGrow: 1, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <TextField
                              label={`Nom de la partie ${index + 1}`}
                              value={part.name}
                              onChange={(e) => handlePartNameChange(index, e.target.value)}
                              sx={{ flexGrow: 1, minWidth: '200px' }}
                              required
                            />
                            
                            <TextField
                              label="Points"
                              type="number"
                              value={part.points}
                              onChange={(e) => handlePartPointsChange(index, e.target.value)}
                              slotProps={{
                                input: { 
                                  inputProps: { min: 0, step: 0.5 },
                                 }
                              }}
                              sx={{ width: '150px' }}
                            />
                          </Box>
                          
                          <IconButton
                            onClick={() => handleRemovePart(index)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      ))}
                    </Paper>
                  </Box>
                </div>
              ) : (
                <div>
                  <Typography variant="h6" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body1" >
                    {activity.content || "Aucune description disponible."}
                  </Typography>
                  
                  {renderParts()}
                </div>
              )}
            </div>
          )}
          
          {/* Deuxième onglet: fragments */}
          {tabValue === 1 && (
            <div>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Les fragments sont des morceaux de texte réutilisables pour vos corrections.
              </Typography>
              {loadingFragments ? (
                <div className="py-10 flex justify-center max-w-[400px] mx-auto">
                  <LoadingSpinner size="md" text="Chargement des fragments" />
                </div>
              ) : (
                <FragmentsList
                  fragments={fragments}
                  onUpdate={fetchFragmentsForActivity}
                  activityId={parseInt(activityId)}
                  error={fragmentsError}
                  showTitle={true}
                  showIcon={true}
                  showEmpty={true}
                />
              )}
            </div>
          )}
          
          {/* Troisième onglet: corrections */}
          {tabValue === 2 && (
            <div>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Corrections ({corrections.length})
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleNewCorrectionClick}
                >
                  Nouvelle correction
                </Button>
              </Box>
              
              {corrections.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', mb: 2 }}>
                  <Typography variant="body1" >
                    Aucune correction n'a été créée pour cette activité.
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleNewCorrectionClick}
                  >
                    Créer une correction
                  </Button>
                </Paper>
              ) : (
                <Paper variant="outlined" sx={{ mb: 2 }}>
                  {corrections.map((correction, index) => (
                    <Box key={correction.id} sx={{ 
                      p: 2, 
                      borderBottom: index < corrections.length - 1 ? '1px solid rgba(0,0,0,0.12)' : 'none',
                      backgroundColor: correction.status !== 'ACTIVE' ? 'rgba(0,0,0,0.04)' : 'transparent'
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {correction.student_id ? (students.find(s => s.id === correction.student_id) ? 
                            `Correction pour ${students.find(s => s.id === correction.student_id)?.first_name} ${students.find(s => s.id === correction.student_id)?.last_name}` 
                            : `Correction pour l&apos;étudiant #${correction.student_id}`) 
                          : 'Correction sans étudiant assigné'}
                          {correction.status && correction.status !== 'ACTIVE' && (
                            <Chip 
                              size="small" 
                              color={correction.status === 'DEACTIVATED' ? 'error' : 
                                     correction.status === 'ABSENT' ? 'warning' : 
                                     correction.status === 'NON_RENDU' ? 'info' : 'error'} 
                              label={correction.status === 'DEACTIVATED' ? 'Désactivée' : 
                                     correction.status === 'ABSENT' ? 'Absent' : 
                                     correction.status === 'NON_RENDU' ? 'Non rendu' : 'Inactive'} 
                              sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Typography>
                        <Typography variant="h6" color={correction.status === 'ACTIVE' ? "primary" : "text.disabled"}>
                          {correction.status === 'ACTIVE' 
                            ? (correction.final_grade ? `${correction.final_grade} / 20` : 'Non noté')
                            : "NaN"}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {correction.points_earned && Array.isArray(activity.parts_names) && activity.parts_names.map((name, idx) => (
                          <Box key={idx} sx={{ display: 'flex', justifyContent: 'end' }}>
                            <Typography variant="body2">
                              {name} : {correction.points_earned[idx]} / {activity.points?.[idx]} pts
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                      
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          component={Link}
                          href={`/feedback/${correction.shareCode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Feedback
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          component={Link}
                          href={`/corrections_autres/${correction.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Modifier
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </Paper>
              )}
            </div>
          )}
          
          {/* Troisième onglet: statistiques */}
          {tabValue === 3 && (
            <div>
              <Typography variant="h6" gutterBottom>
                Statistiques
              </Typography>
              
              <Box sx={{ mb: 4 }}>
                <Typography variant="body1" >
                  Nombre de corrections: <strong>{corrections.length}</strong>
                </Typography>
                
                <Typography variant="body1" >
                  Nombre de corrections actives: <strong>{corrections.filter(c => c.status === 'ACTIVE').length}</strong>
                </Typography>
                
                <Typography variant="body1" >
                  Note moyenne: <strong>
                    {corrections.filter(c => c.status === 'ACTIVE').length > 0
                      ? (corrections.filter(c => c.status === 'ACTIVE').reduce((sum, c) => {
                          // Convertir final_grade en nombre pour s'assurer que la somme fonctionne correctement
                          const grade = typeof c.final_grade === 'string' 
                            ? parseFloat(c.final_grade) 
                            : (c.final_grade || 0);
                          
                          return sum + (isNaN(grade) ? 0 : grade);
                        }, 0) / 
                         corrections.filter(c => c.status === 'ACTIVE').length).toFixed(2)
                      : 'N/A'}
                  </strong>
                </Typography>
              </Box>
              
              {/* Répartition des points par partie */}
              <Typography variant="subtitle1" gutterBottom>
                Points moyens par partie:
              </Typography>
              
              {Array.isArray(activity.parts_names) && activity.parts_names.map((name, idx) => {
                const maxPoints = activity.points?.[idx];
                const avgPoints = corrections.length > 0
                  ? corrections.reduce((sum, c) => {
                      const pts = Array.isArray(c.points_earned) && c.points_earned[idx] !== undefined
                        ? c.points_earned[idx]
                        : 0;
                      return sum + pts;
                    }, 0) / corrections.length
                  : 0;
                
                const percentage = maxPoints > 0 ? (avgPoints / maxPoints) * 100 : 0;
                
                return (
                  <Box key={idx} sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{name}</Typography>
                      <Typography variant="body2">
                        {avgPoints.toFixed(2)} / {maxPoints} pts ({percentage.toFixed(1)}%)
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: '100%',
                        height: 10,
                        bgcolor: 'grey.200',
                        borderRadius: 5,
                        overflow: 'hidden'
                      }}
                    >
                      <Box
                        sx={{
                          width: `${percentage}%`,
                          height: '100%',
                          bgcolor: idx % 2 === 0 ? 'primary.main' : 'secondary.main',
                        }}
                      />
                    </Box>
                  </Box>
                );
              })}
              
              {/* Ajout du composant ActivityStatsGraphs */}
              <Box sx={{ mt: 4 }}>
                <ActivityStatsGraphs activityId={parseInt(id)} />
              </Box>
            </div>
          )}
          
          {/* Quatrième onglet: Export PDF */}
          {tabValue === 4 && (
            <Box sx={{ py: 2 }}>
              <ExportPDFComponentAutre
                classData={{ id: activity?.id || 0, name: activity?.name || 'Activité' }}
                corrections={filteredCorrections as CorrectionAutreEnriched[]}
                activities={[{ id: activity?.id || 0, name: activity?.name || 'Activité', parts_names: activity?.parts_names || [], points: activity?.points || [] }]}
                students={students}
                filterActivity={activity?.id || 0}
                setFilterActivity={() => {}} // Non utilisable dans ce contexte
                filterSubClass={selectedSubGroup === '' ? 'all' : selectedSubGroup}
                setFilterSubClass={(value) => setSelectedSubGroup(value === 'all' ? '' : value)}
                uniqueSubClasses={uniqueSubClasses.filter(subClass => subClass !== undefined).map(subClass => ({ id: subClass || "0", name: `Groupe ${subClass}` }))}
                uniqueActivities={[{ id: activity?.id || 0, name: activity?.name || 'Activité' }]}
                getActivityById={(activityId) => activities.find((a: ActivityAutre) => a.id === activityId)}
                getStudentById={(studentId) => {
                  return students.find(s => s.id === studentId);
                }}
                getBatchShareCodes={getBatchShareCodes}
              />
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
}