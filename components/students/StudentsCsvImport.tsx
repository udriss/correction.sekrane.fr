import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Pagination,
  IconButton,
  Tooltip
} from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Papa from 'papaparse';

interface ImportOptions {
  updateExisting: boolean;
  createMissing: boolean;
  updateClasses: boolean;
}

interface ImportStatus {
  success: number;
  error: number;
  messages: string[];
  detailedMessages: {[studentId: string]: string[]};
}

// Interface pour représenter une ligne CSV d'étudiant
interface StudentCsvRow {
  id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  gender?: string;
  classes?: string;
  sub_classes?: string;
  [key: string]: any; // Pour les autres champs potentiels
}

// Interface pour les informations de classe
interface ClassInfo {
  classId: number;
  subClass?: string | null;
}

interface StudentsCsvImportProps {
  onClose: () => void;
  onError: (message: string) => void;
  onSuccess: () => void; // Callback to refresh student list
}

const StudentsCsvImport: React.FC<StudentsCsvImportProps> = ({
  onClose,
  onError,
  onSuccess
}) => {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [fullData, setFullData] = useState<any[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importStatus, setImportStatus] = useState<ImportStatus>({ 
    success: 0, 
    error: 0, 
    messages: [],
    detailedMessages: {}
  });
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    updateExisting: true,
    createMissing: false,
    updateClasses: true,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [showAllMessages, setShowAllMessages] = useState(false);
  const [showDetailedResults, setShowDetailedResults] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFileBeingDragged, setIsFileBeingDragged] = useState(false);
  const [isFileOverDropZone, setIsFileOverDropZone] = useState(false);
  
  // Calculer le nombre de pages pour la pagination de l'aperçu
  const totalPages = Math.ceil(fullData.length / rowsPerPage);
  
  // Données paginées pour l'aperçu
  const paginatedData = fullData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  
  // Effet pour détecter le glisser-déposer global au niveau de la fenêtre
  useEffect(() => {
    const handleWindowDragEnter = (e: DragEvent) => {
      e.preventDefault();
      
      // Vérifier si le drag contient des fichiers
      if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
        setIsFileBeingDragged(true);
      }
    };
    
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    
    const handleWindowDragLeave = (e: DragEvent) => {
      e.preventDefault();
      
      // Si on quitte la fenêtre, on désactive le drag
      if (e.clientX <= 0 || e.clientY <= 0 || 
          e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        setIsFileBeingDragged(false);
      }
    };
    
    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsFileBeingDragged(false);
    };
    
    // Ajouter les événements au niveau de la fenêtre
    window.addEventListener('dragenter', handleWindowDragEnter);
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('drop', handleWindowDrop);
    
    return () => {
      // Nettoyer les événements lors du démontage du composant
      window.removeEventListener('dragenter', handleWindowDragEnter);
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);

  // Handle import options change
  const handleImportOptionChange = (option: keyof ImportOptions) => {
    setImportOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  // Handle file selection for import
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      previewCSV(file);
    }
  };

  // Parse and preview CSV file
  const previewCSV = (file: File) => {
    setImportLoading(true);
    setImportPreview([]);
    setFullData([]);
    setImportStatus({ success: 0, error: 0, messages: [], detailedMessages: {} });
    setCurrentPage(1);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Check if we have valid data
        if (results.data && results.data.length > 0) {
          // Store all data for pagination
          setFullData(results.data);
          // Take first 5 rows for initial preview
          setImportPreview(results.data.slice(0, 5));
        }
        setImportLoading(false);
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        onError('Failed to parse CSV file');
        setImportLoading(false);
      }
    });
  };

  // Handle click on file upload button
  const handleClickUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Process and import CSV data
  const handleImportCSV = async () => {
    if (!importFile) return;
    
    setImportLoading(true);
    setImportStatus({ success: 0, error: 0, messages: [], detailedMessages: {} });
    const messages: string[] = [];
    const detailedMessages: {[studentId: string]: string[]} = {};
    let successCount = 0;
    let errorCount = 0;
    
    try {
      // Parse the entire file
      Papa.parse(importFile, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const { data, errors } = results;
          
          if (errors.length > 0) {
            setImportStatus({
              success: 0,
              error: 0,
              messages: ['CSV parsing errors detected. Please check your file format.'],
              detailedMessages: {}
            });
            setImportLoading(false);
            return;
          }
          
          // Process each row
          for (const row of data as StudentCsvRow[]) {
            try {
              const studentKey = row.id ? `ID:${row.id}` : `${row.first_name}_${row.last_name}`;
              detailedMessages[studentKey] = [];
              
              // Validate required fields
              if (!row.first_name || !row.last_name) {
                const errorMsg = `Error: Missing required fields for ${row.first_name || ''} ${row.last_name || ''}`;
                messages.push(errorMsg);
                detailedMessages[studentKey].push(errorMsg);
                errorCount++;
                continue;
              }
              
              // Extract student data
              const studentData = {
                first_name: row.first_name,
                last_name: row.last_name,
                email: row.email || '',
                gender: row.gender && ['M', 'F', 'N'].includes(row.gender) ? row.gender : 'N',
              };
              
              detailedMessages[studentKey].push(`Données de base: ${JSON.stringify(studentData)}`);
              
              // Extract class and sub-class information using the new format classID_subClassID
              let classesInfo: ClassInfo[] = [];
              
              if (row.classes) {
                const classIds = row.classes.split(',').map((id: string) => id.trim());
                
                // Build class info array incorporating the new sub_class format
                for (const classId of classIds) {
                  let actualClassId = parseInt(classId, 10);
                  let subClass: string | null = null;
                  
                  // Check if this class has a corresponding sub_class in the format classID_subClassID
                  if (row.sub_classes) {
                    const subClassEntries = row.sub_classes.split(',').map((entry: string) => entry.trim());
                    
                    for (const entry of subClassEntries) {
                      // Parse entries in the format classID_subClassID
                      if (entry.includes('_')) {
                        const [subClassClassId, subClassValue] = entry.split('_');
                        if (parseInt(subClassClassId, 10) === actualClassId) {
                          subClass = subClassValue;
                          detailedMessages[studentKey].push(`Format subclasse trouvé: classe ${subClassClassId}, groupe ${subClassValue}`);
                          break;
                        }
                      } else {
                        // Support legacy format classId:subClass as well
                        const [subClassClassId, subClassValue] = entry.split(':');
                        if (parseInt(subClassClassId, 10) === actualClassId) {
                          subClass = subClassValue;
                          detailedMessages[studentKey].push(`Format ancien trouvé: classe ${subClassClassId}, groupe ${subClassValue}`);
                          break;
                        }
                      }
                    }
                  }
                  
                  classesInfo.push({
                    classId: actualClassId,
                    subClass: subClass
                  });
                  
                  detailedMessages[studentKey].push(`Association classe: ClassID ${actualClassId}, SubClass ${subClass || 'non défini'}`);
                }
              }
              
              // Determine if this is an update or add
              const isUpdate = row.id && importOptions.updateExisting;
              const mode = isUpdate ? 'update' : 'add';
              
              if (isUpdate && !importOptions.updateExisting) {
                const skipMsg = `Skipped: Student ID ${row.id} (${row.first_name} ${row.last_name}) - update not enabled`;
                messages.push(skipMsg);
                detailedMessages[studentKey].push(skipMsg);
                continue;
              }
              
              if (!isUpdate && !importOptions.createMissing) {
                const skipMsg = `Skipped: New student ${row.first_name} ${row.last_name} - create not enabled`;
                messages.push(skipMsg);
                detailedMessages[studentKey].push(skipMsg);
                continue;
              }
              
              // Make API call based on mode
              let response;
              
              if (mode === 'update') {
                response = await fetch(`/api/students/${row.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(studentData)
                });
              } else {
                response = await fetch('/api/students', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(studentData)
                });
              }
              
              if (!response.ok) {
                throw new Error(`API error: ${response.statusText}`);
              }
              
              const savedStudent = await response.json();
              const studentId = savedStudent.id;
              
              detailedMessages[studentKey].push(`Étudiant ${mode === 'update' ? 'mis à jour' : 'créé'} avec ID: ${studentId}`);
              
              // Update class associations if enabled
              if (importOptions.updateClasses && classesInfo.length > 0) {
                // First, get current class associations
                const classesResponse = await fetch(`/api/students/${studentId}/classes`);
                if (!classesResponse.ok) {
                  throw new Error('Failed to fetch student classes');
                }
                
                const currentClasses = await classesResponse.json();
                const currentClassIds = currentClasses.map((c: { id: number }) => c.id);
                
                detailedMessages[studentKey].push(`Classes actuelles: ${currentClassIds.join(', ') || 'aucune'}`);
                
                // Process each class association
                for (const classInfo of classesInfo) {
                  const { classId, subClass } = classInfo;
                  
                  // Skip invalid class IDs
                  if (!classId || isNaN(classId)) {
                    detailedMessages[studentKey].push(`Ignoré: ID de classe invalide ${classId}`);
                    continue;
                  }
                  
                  // Check if this is a new association or update
                  if (currentClassIds.includes(classId)) {
                    // Update sub-class if needed
                    if (subClass !== undefined) {
                      await fetch(`/api/classes/${classId}/students/${studentId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sub_class: subClass }),
                      });
                      detailedMessages[studentKey].push(`Mis à jour: Groupe ${subClass} pour la classe ${classId}`);
                    }
                  } else {
                    // Add new class association
                    await fetch(`/api/classes/${classId}/students`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        student_id: studentId,
                        first_name: studentData.first_name,
                        last_name: studentData.last_name,
                        email: studentData.email,
                        gender: studentData.gender,
                        sub_class: subClass
                      }),
                    });
                    detailedMessages[studentKey].push(`Ajouté: Association à la classe ${classId}${subClass ? `, groupe ${subClass}` : ''}`);
                  }
                }
                
                // Remove associations that are no longer present
                const newClassIds = classesInfo.map(ci => ci.classId);
                for (const cls of currentClasses) {
                  if (!newClassIds.includes(cls.id)) {
                    await fetch(`/api/classes/${cls.id}/students/${studentId}`, {
                      method: 'DELETE',
                    });
                    detailedMessages[studentKey].push(`Supprimé: Association à la classe ${cls.id}`);
                  }
                }
              }
              
              const successMsg = `${mode === 'update' ? 'Updated' : 'Added'}: ${studentData.first_name} ${studentData.last_name}`;
              messages.push(successMsg);
              detailedMessages[studentKey].push(successMsg);
              successCount++;
              
            } catch (error: any) {
              const studentKey = row.id ? `ID:${row.id}` : `${row.first_name}_${row.last_name}`;
              console.error('Import row error:', error);
              const errorMsg = `Error: ${row.first_name || ''} ${row.last_name || ''} - ${error.message || 'Unknown error'}`;
              messages.push(errorMsg);
              
              if (!detailedMessages[studentKey]) {
                detailedMessages[studentKey] = [];
              }
              detailedMessages[studentKey].push(errorMsg);
              errorCount++;
            }
          }
          
          setImportStatus({
            success: successCount,
            error: errorCount,
            messages: messages,
            detailedMessages
          });
          
          // Refresh the student list if any were successfully imported
          if (successCount > 0) {
            onSuccess();
          }
          
          setImportLoading(false);
        },
        error: (error) => {
          console.error('CSV parsing error:', error);
          setImportStatus({
            success: 0,
            error: 1,
            messages: ['Failed to parse CSV file'],
            detailedMessages: {}
          });
          setImportLoading(false);
        }
      });
    } catch (error: any) {
      console.error('Import error:', error);
      setImportStatus({
        success: 0,
        error: 1,
        messages: [`Import error: ${error.message || 'Unknown error'}`],
        detailedMessages: {}
      });
      setImportLoading(false);
    }
  };

  // Handlers for drag and drop
  const handleDragEnter = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsFileOverDropZone(true);
    },
    []
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsFileOverDropZone(false);
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsFileBeingDragged(false);
      setIsFileOverDropZone(false);
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type === 'text/csv' || file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
          setImportFile(file);
          previewCSV(file);
        } else {
          onError('Le fichier doit être au format CSV ou TXT');
        }
      }
    },
    [previewCSV, onError]
  );

  // Pagination handlers
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  const handleToggleAllMessages = () => {
    setShowAllMessages(!showAllMessages);
  };

  const handleToggleDetailedResults = () => {
    setShowDetailedResults(!showDetailedResults);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom fontWeight="bold">
        Importer des étudiants depuis CSV
      </Typography>
      <Typography variant="body2" paragraph sx={{ color: 'text.secondary' }}>
        Chargez un fichier CSV contenant des données étudiants pour ajouter ou mettre à jour des étudiants en masse.
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Options d'importation
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={importOptions.updateExisting}
                      onChange={() => handleImportOptionChange('updateExisting')}
                      color="primary"
                    />
                  }
                  label="Mettre à jour les étudiants existants (par ID)"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={importOptions.createMissing}
                      onChange={() => handleImportOptionChange('createMissing')}
                      color="primary"
                    />
                  }
                  label="Ajouter de nouveaux étudiants"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={importOptions.updateClasses}
                      onChange={() => handleImportOptionChange('updateClasses')}
                      color="primary"
                    />
                  }
                  label="Mettre à jour les classes et sous-classes"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Format attendu
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Le fichier CSV doit contenir les colonnes suivantes :
              </Typography>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'background.default',
                borderRadius: 1,
                border: '1px dashed',
                borderColor: 'divider',
                fontSize: '0.85rem',
                fontFamily: 'monospace'
              }}>
                <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                  Colonnes requises:
                </Typography>
                <Chip size="small" label="first_name" sx={{ m: 0.5 }} />
                <Chip size="small" label="last_name" sx={{ m: 0.5 }} />
                
                <Typography variant="caption" display="block" sx={{ mt: 2, mb: 1 }}>
                  Colonnes optionnelles:
                </Typography>
                <Chip size="small" label="id" sx={{ m: 0.5 }} />
                <Chip size="small" label="gender" sx={{ m: 0.5 }} />
                <Chip size="small" label="email" sx={{ m: 0.5 }} />
                <Chip size="small" label="classes" sx={{ m: 0.5 }} />
                <Chip size="small" label="sub_classes" sx={{ m: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* File Upload Area */}
      <input
        type="file"
        accept=".csv,.txt"
        ref={fileInputRef}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      <Box
        sx={{
          p: 3,
          mb: 3,
          border: '2px dashed',
          borderColor: isFileOverDropZone ? 'primary.main' : (isFileBeingDragged ? 'primary.light' : 'divider'),
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          bgcolor: isFileOverDropZone ? 'action.hover' : (isFileBeingDragged ? 'action.selected' : 'transparent'),
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover',
          },
        }}
        onClick={handleClickUpload}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <UploadFileIcon sx={{ 
          fontSize: 48, 
          color: isFileOverDropZone ? 'primary.main' : (isFileBeingDragged ? 'primary.light' : 'text.secondary'), 
          mb: 2,
          transition: 'color 0.2s ease-in-out'
        }} />
        <Typography variant="body1" sx={{ mb: 1 }}>
          {importFile ? `Fichier sélectionné: ${importFile.name}` : isFileOverDropZone ? 
            'Déposez le fichier ici' : 
            'Cliquez ou glissez-déposez un fichier CSV'
          }
        </Typography>
        <Typography variant="body2" color={isFileOverDropZone ? "primary" : (isFileBeingDragged ? "primary.light" : "text.secondary")}>
          Le fichier doit être au format CSV avec des en-têtes
        </Typography>
      </Box>
      
      {/* Preview section */}
      {fullData.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold" sx={{ mb: 0 }}>
              Aperçu des données
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {fullData.length} lignes au total
            </Typography>
          </Box>
          
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {Object.keys(fullData[0]).map(header => (
                    <TableCell key={header}>{header}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((row, index) => (
                  <TableRow key={index}>
                    {Object.values(row).map((value, i) => (
                      <TableCell key={i}>{String(value)}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {fullData.length > rowsPerPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination 
                count={totalPages} 
                page={currentPage} 
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </Box>
      )}
      
      {/* Import status */}
      {importStatus.messages.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Alert 
            severity={importStatus.error > 0 ? "warning" : "success"}
            sx={{ mb: 2 }}
          >
            <Typography variant="subtitle2">
              Résultat de l'importation: {importStatus.success} réussis, {importStatus.error} erreurs
            </Typography>
          </Alert>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Résumé de l'importation
            </Typography>
            <Button
              size="small"
              onClick={handleToggleAllMessages}
              endIcon={showAllMessages ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            >
              {showAllMessages ? "Résumé" : "Voir tous les messages"}
            </Button>
          </Box>
          
          <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              {(showAllMessages ? importStatus.messages : importStatus.messages.slice(0, 10)).map((message, index) => (
                <Typography 
                  key={index} 
                  component="li" 
                  variant="body2" 
                  color={message.includes('Error') ? 'error.main' : message.includes('Skipped') ? 'text.secondary' : 'success.main'}
                >
                  {message}
                </Typography>
              ))}
              {!showAllMessages && importStatus.messages.length > 10 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                  ... et {importStatus.messages.length - 10} autres messages
                </Typography>
              )}
            </Box>
          </Paper>
          
          {/* Detailed results by student */}
          {Object.keys(importStatus.detailedMessages).length > 0 && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Détails par étudiant
                </Typography>
                <Button
                  size="small"
                  onClick={handleToggleDetailedResults}
                  endIcon={showDetailedResults ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                >
                  {showDetailedResults ? "Masquer les détails" : "Voir les détails"}
                </Button>
              </Box>
              
              {showDetailedResults && (
                <Box sx={{ mt: 1 }}>
                  {Object.entries(importStatus.detailedMessages).map(([studentKey, messages]) => (
                    <Paper 
                      key={studentKey} 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        mb: 2,
                        borderLeft: '4px solid',
                        borderColor: messages.some(m => m.includes('Error')) 
                          ? 'error.main' 
                          : messages.some(m => m.includes('Skipped'))
                            ? 'warning.main'
                            : 'success.main'
                      }}
                    >
                      <Typography variant="subtitle2" gutterBottom>
                        {studentKey.startsWith('ID:') 
                          ? `Étudiant ID: ${studentKey.substring(3)}` 
                          : `Étudiant: ${studentKey.replace('_', ' ')}`
                        }
                      </Typography>
                      <Box component="ul" sx={{ pl: 2, m: 0 }}>
                        {messages.map((message, index) => (
                          <Typography 
                            key={index} 
                            component="li" 
                            variant="body2" 
                            color={
                              message.includes('Error') 
                                ? 'error.main' 
                                : message.includes('Ignoré') || message.includes('Skipped')
                                  ? 'text.secondary'
                                  : message.includes('Mis à jour') || message.includes('Ajouté') || message.includes('Updated') || message.includes('Added')
                                    ? 'success.main'
                                    : 'text.primary'
                            }
                            sx={{ mb: 0.5 }}
                          >
                            {message}
                          </Typography>
                        ))}
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </>
          )}
        </Box>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          startIcon={<CloseIcon />}
        >
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={handleImportCSV}
          startIcon={importLoading ? <CircularProgress size={20} /> : <FileUploadIcon />}
          disabled={importLoading || !importFile}
          color="primary"
        >
          {importLoading ? 'Importation en cours...' : 'Importer les données'}
        </Button>
      </Box>
    </Box>
  );
};

export default StudentsCsvImport;