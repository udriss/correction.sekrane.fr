import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
  Alert,
  Divider,
  Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import UploadIcon from '@mui/icons-material/Upload';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckIcon from '@mui/icons-material/Check';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GradientBackground from '@/components/ui/GradientBackground';
import H1Title from '@/components/ui/H1Title';

interface BatchStudent {
  first_name: string;
  last_name: string;
  email?: string;
  gender: 'M' | 'F' | 'N';
  sub_class?: number | null;
}

interface BatchStudentFormProps {
  onClose: () => void;
  onAddStudents: (students: BatchStudent[]) => Promise<void>;
  classData?: {
    id: number;
    name: string;
    nbre_subclasses?: number;
  } | null;
  currentFilter?: string | null;
}

const BatchStudentForm: React.FC<BatchStudentFormProps> = ({
  onClose,
  onAddStudents,
  classData,
  currentFilter
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [manualStudentCount, setManualStudentCount] = useState(5);
  const [batchStudents, setBatchStudents] = useState<BatchStudent[]>([]);
  const [savingBatch, setSavingBatch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [csvContent, setCsvContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleManualStudentCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setManualStudentCount(value);
    }
  };

  const handleCreateManualStudents = () => {
    const newStudents: BatchStudent[] = Array.from({ length: manualStudentCount }, () => ({
      first_name: '',
      last_name: '',
      email: '',
      gender: 'N',
      sub_class: null
    }));
    
    setBatchStudents(newStudents);
  };

  const handleBatchStudentFieldChange = (index: number, field: keyof BatchStudent, value: any) => {
    const updatedStudents = [...batchStudents];
    updatedStudents[index] = { ...updatedStudents[index], [field]: value };
    setBatchStudents(updatedStudents);
  };

  const handleClickUploadButton = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setCsvContent(file.name);
    
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      
      // Fonction de détection basique du format (Prénom NOM ou NOM Prénom)
      const parseNameLine = (line: string): { firstName: string, lastName: string, email?: string } => {
        // Gérer les CSV correctement (les virgules dans les champs entre guillemets)
        const parts = line.split(/[,;](?=(?:[^"]*"[^"]*")*[^"]*$)/).map(part => part.trim().replace(/^"|"$/g, ''));
        
        let email = '';
        let namePart = parts[0];
        
        // Si nous avons un email dans la deuxième colonne
        if (parts.length > 1 && parts[1].includes('@')) {
          email = parts[1];
        }
        
        // Détection du format: Si le premier mot est tout en majuscules, on considère que c'est NOM Prénom
        const words = namePart.split(/\s+/);
        
        // Si le premier mot est en majuscules, c'est probablement NOM Prénom
        if (words[0] === words[0].toUpperCase() && words.length > 1) {
          return {
            firstName: words.slice(1).join(' '),
            lastName: words[0],
            email
          };
        } 
        // Si le dernier mot est en majuscules, c'est probablement Prénom NOM
        else if (words[words.length - 1] === words[words.length - 1].toUpperCase() && words.length > 1) {
          return {
            firstName: words.slice(0, -1).join(' '),
            lastName: words[words.length - 1],
            email
          };
        }
        // Sinon, on considère que le format est "Prénom NOM"
        else {
          const midpoint = Math.floor(words.length / 2);
          return {
            firstName: words.slice(0, midpoint).join(' '),
            lastName: words.slice(midpoint).join(' '),
            email
          };
        }
      };
      
      // Traiter chaque ligne
      const parsedStudents: BatchStudent[] = lines.map(line => {
        const { firstName, lastName, email } = parseNameLine(line);
        return {
          first_name: firstName,
          last_name: lastName,
          email: email || undefined,
          gender: 'N',
          sub_class: null
        };
      });
      
      setBatchStudents(parsedStudents);
    } catch (err: any) {
      setError(`Erreur lors du traitement du fichier: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBatchStudents = async () => {
    // Validation de base
    const incompleteStudents = batchStudents.filter(student => 
      !student.first_name.trim() || !student.last_name.trim()
    );
    
    if (incompleteStudents.length > 0) {
      setError("Veuillez compléter les noms et prénoms de tous les étudiants");
      return;
    }
    
    setSavingBatch(true);
    setError(null);
    
    try {
      await onAddStudents(batchStudents);
      // Réinitialiser le formulaire après l'ajout réussi
      setBatchStudents([]);
      setCsvContent(null);
      // Fermer le formulaire après l'ajout
      onClose();
    } catch (err: any) {
      setError(`Erreur lors de l'ajout des étudiants: ${err.message}`);
    } finally {
      setSavingBatch(false);
    }
  };

  return (
    <Paper 
      className="p-6 mb-6" 
      sx={{ 
        overflow: 'hidden',
        borderRadius: '0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}
    >
      {/* Header avec gradient */}
      <GradientBackground
        variant="primary"
        
        sx={{
          mx: -3,
          mt: -3,
          mb: 3,
          py: 3,
          px: 4,
          borderRadius: '0',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            {/* Utilisation du composant H1Title standardisé */}
            <H1Title>
              {currentFilter 
                ? `Ajouter des étudiants au groupe ${currentFilter}` 
                : 'Ajouter des étudiants'}
            </H1Title>
            <Typography variant="body2" sx={{ opacity: 0.95, maxWidth: '500px' }}>
              Ajoutez plusieurs étudiants par saisie manuelle ou importation de fichier CSV
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </GradientBackground>

      <Tabs 
        value={activeTab} 
        onChange={handleTabChange} 
        variant="fullWidth"
        sx={{
          mb: 3,
          '& .MuiTab-root': {
            fontWeight: 600,
            py: 1.5
          },
          '& .Mui-selected': {
            fontWeight: 700
          },
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: '3px 3px 0 0'
          }
        }}
      >
        <Tab 
          label="Saisie manuelle" 
          icon={<EditIcon />} 
          iconPosition="start" 
        />
        <Tab 
          label="Importer CSV" 
          icon={<UploadIcon />} 
          iconPosition="start" 
        />
      </Tabs>
      
      <Box sx={{ 
        p: 3, 
        borderRadius: 2, 
        bgcolor: 'background.default',
        border: '1px solid',
        borderColor: 'divider'
      }}>
        {activeTab === 0 && (
          <Box className="space-y-4">
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              flexDirection: { xs: 'column', sm: 'row' }, 
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: 2
            }}>
              <TextField
                label="Nombre d'étudiants"
                type="number"
                value={manualStudentCount}
                onChange={handleManualStudentCountChange}
                InputProps={{ inputProps: { min: 1 } }}
                variant="outlined"
                sx={{ width: { xs: '100%', sm: '200px' } }}
              />
                  <Button
                variant="contained"
                color="secondary"
                startIcon={<PersonAddIcon />}
                onClick={handleCreateManualStudents}
                sx={{
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  background: (theme) => theme.gradients.secondary,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 15px rgba(0,0,0,0.2)',
                    background: (theme) => theme.gradients.secondary,
                    filter: 'brightness(1.3)',
                  }
                }}
                  > Ajouter {manualStudentCount} ligne{manualStudentCount > 1 ? 's' : ''}
                  </Button>
            </Box>

            {batchStudents.length > 0 && (
              <div className="mt-6">
                <Typography variant="subtitle1" gutterBottom>
                  Entrez les informations des étudiants
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Prénom*</TableCell>
                        <TableCell>Nom</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Genre*</TableCell>
                        {classData?.nbre_subclasses && classData?.nbre_subclasses > 0 && (
                          <TableCell>Groupe</TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {batchStudents.map((student, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              value={student.first_name}
                              onChange={(e) => handleBatchStudentFieldChange(index, 'first_name', e.target.value)}
                              required
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              value={student.last_name}
                              onChange={(e) => handleBatchStudentFieldChange(index, 'last_name', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              value={student.email || ''}
                              onChange={(e) => handleBatchStudentFieldChange(index, 'email', e.target.value)}
                              placeholder="Optionnel"
                            />
                          </TableCell>
                          <TableCell>
                            <FormControl fullWidth size="small">
                              <Select
                                value={student.gender || 'N'}
                                onChange={(e) => handleBatchStudentFieldChange(index, 'gender', e.target.value as 'M' | 'F' | 'N')}
                              >
                                <MenuItem value="M">Garçon</MenuItem>
                                <MenuItem value="F">Fille</MenuItem>
                                <MenuItem value="N">Neutre</MenuItem>
                              </Select>
                            </FormControl>
                          </TableCell>
                          {classData?.nbre_subclasses && classData?.nbre_subclasses > 0 && (
                            <TableCell>
                              <FormControl fullWidth size="small">
                                <Select
                                  value={student.sub_class === null ? '' : student.sub_class}
                                  onChange={(e) => handleBatchStudentFieldChange(
                                    index, 
                                    'sub_class', 
                                    e.target.value === '' ? null : Number(e.target.value)
                                  )}
                                >
                                  <MenuItem value="">
                                    <em>Non assigné</em>
                                  </MenuItem>
                                  {Array.from({ length: classData?.nbre_subclasses }, (_, i) => i + 1).map((num) => (
                                    <MenuItem key={num} value={num}>Groupe {num}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {/* Display add students button if students are available */}
                {batchStudents.length > 0 && (
                  <Box 
                    sx={{ 
                      mt: 4, 
                      pt: 3, 
                      display: 'flex', 
                      justifyContent: 'flex-end',
                      borderTop: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <Button
                variant="contained"
                color="success"
                disabled={savingBatch}
                startIcon={savingBatch ? <CircularProgress size={20} /> : <PersonAddIcon />}
                onClick={handleCreateManualStudents}
                sx={{
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  background: (theme) => theme.gradients.success,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 15px rgba(0,0,0,0.2)',
                    background: (theme) => theme.gradients.success,
                    filter: 'brightness(1.3)',
                  }
                }}
                  > 
                      {savingBatch ? 'Enregistrement...' : `Confirmer l'ajout pour ${batchStudents.length} étudiant${batchStudents.length > 1 ? 's' : ''}`}
                  </Button>
                  </Box>
                )}
              </div>
            )}
          </Box>
        )}
        
        {activeTab === 1 && (
          <Box className="space-y-4">
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 3, 
                bgcolor: 'primary.50',
                borderColor: 'primary.200',
                borderRadius: 2
              }}
            >
              <Typography 
                variant="subtitle1" 
                component="div" 
                sx={{ 
                  mb: 2, 
                  fontWeight: 'bold', 
                  color: 'primary.dark',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <UploadIcon fontSize="small" />
                Format de fichier accepté :
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CheckIcon fontSize="small" color="primary" />
                  <Typography variant="body2">
                    CSV ou TXT avec des noms d'étudiants
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <CheckIcon fontSize="small" color="primary" />
                  <Typography variant="body2">
                    Email optionnel comme seconde colonne
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <CheckIcon fontSize="small" color="primary" />
                  <Typography variant="body2">
                    Reconnaît "NOM Prénom", "Prénom NOM", etc.
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box 
                sx={{ 
                  p: 2, 
                  bgcolor: 'background.paper', 
                  borderRadius: 1,
                  border: '1px dashed',
                  borderColor: 'primary.200'
                }}
              >
                <Typography variant="caption" component="div" fontFamily="monospace" sx={{ whiteSpace: 'pre-line' }}>
                  DUPONT Jean<br />
                  Marie MARTIN<br />
                  LEGRAND Amélie;amelie@example.com<br />
                  "PETIT, Sophie";sophie.petit@example.com
                </Typography>
              </Box>
            </Paper>
            
            <input 
              type="file" 
              accept=".csv,.txt" 
              ref={fileInputRef}
              onChange={handleCsvUpload}
              style={{ display: 'none' }}
            />
            
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleClickUploadButton}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <UploadIcon />}
                disabled={loading}
                sx={{ 
                  py: 1.5,
                  px: 4,
                  borderRadius: 6,
                  fontWeight: 600,
                  boxShadow: 2
                }}
              >
                {loading ? 'Traitement...' : 'Importer CSV'}
              </Button>
            </Box>
            
            {csvContent && !error && (
              <Alert 
                severity="success" 
                icon={<CheckCircleIcon />}
                variant="filled"
                sx={{ mt: 3, animation: 'fadeIn 0.5s ease' }}
              >
                Fichier <strong>{csvContent}</strong> chargé avec succès ! {batchStudents.length} étudiant(s) détecté(s).
              </Alert>
            )}

            {batchStudents.length > 0 && (
              <div className="mt-6">
                <Typography variant="subtitle1" gutterBottom>
                  Vérifiez et complétez les informations
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Prénom*</TableCell>
                        <TableCell>Nom</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Genre*</TableCell>
                        {classData?.nbre_subclasses && classData?.nbre_subclasses > 0 && (
                          <TableCell>Groupe</TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {batchStudents.map((student, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              value={student.first_name}
                              onChange={(e) => handleBatchStudentFieldChange(index, 'first_name', e.target.value)}
                              required
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              value={student.last_name}
                              onChange={(e) => handleBatchStudentFieldChange(index, 'last_name', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              value={student.email || ''}
                              onChange={(e) => handleBatchStudentFieldChange(index, 'email', e.target.value)}
                              placeholder="Optionnel"
                            />
                          </TableCell>
                          <TableCell>
                            <FormControl fullWidth size="small">
                              <Select
                                value={student.gender || 'N'}
                                onChange={(e) => handleBatchStudentFieldChange(index, 'gender', e.target.value as 'M' | 'F' | 'N')}
                              >
                                <MenuItem value="M">Garçon</MenuItem>
                                <MenuItem value="F">Fille</MenuItem>
                                <MenuItem value="N">Neutre</MenuItem>
                              </Select>
                            </FormControl>
                          </TableCell>
                          {classData?.nbre_subclasses && classData?.nbre_subclasses > 0 && (
                            <TableCell>
                              <FormControl fullWidth size="small">
                                <Select
                                  value={student.sub_class === null ? '' : student.sub_class}
                                  onChange={(e) => handleBatchStudentFieldChange(
                                    index, 
                                    'sub_class', 
                                    e.target.value === '' ? null : Number(e.target.value)
                                  )}
                                >
                                  <MenuItem value="">
                                    <em>Non assigné</em>
                                  </MenuItem>
                                  {Array.from({ length: classData?.nbre_subclasses }, (_, i) => i + 1).map((num) => (
                                    <MenuItem key={num} value={num}>Groupe {num}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Box mt={3} display="flex" justifyContent="flex-end">
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddBatchStudents}
                    disabled={savingBatch}
                    startIcon={savingBatch ? <CircularProgress size={20} /> : <PersonAddIcon />}
                  >
                    {savingBatch ? 'Enregistrement...' : 'Ajouter les étudiants'}
                  </Button>
                </Box>
              </div>
            )}
          </Box>
        )}

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mt: 3, 
              borderRadius: 2,
              '& .MuiAlert-icon': {
                fontSize: '1.5rem'
              }
            }}
          >
            {error}
          </Alert>
        )}

      </Box>
    </Paper>
  );
};

export default BatchStudentForm;
