'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Inter } from 'next/font/google';
import { DndProvider, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';


import { 
    List, ListItem, ListItemText,
  Paper, 
  Typography, 
  Box, 
  Alert,
  Button, 
  IconButton,
  TextField,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Chip,
  CircularProgress
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import Link from 'next/link';

// Icons
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import UndoIcon from '@mui/icons-material/Undo';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RuleIcon from '@mui/icons-material/Rule';
import GradeIcon from '@mui/icons-material/Grade';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { Share as ShareIcon } from '@mui/icons-material';

// Mock components
import DraggableItemMock from './DraggableItemMock';
import FragmentItemMock from './FragmentItemMock';

const inter = Inter({ subsets: ['latin'] });

// Mock data
const mockFragments = [
  { id: 1, content: "Le spectre UV montre un pic d'absorption à 257 nm qui correspond au groupement carbonyle." },
  { id: 2, content: "La constante de couplage J = 7.2 Hz indique des protons vicinaux sur un cycle aromatique." },
  { id: 3, content: "Le déplacement chimique à δ 4.2 ppm est caractéristique d'un proton en position alpha d'un groupement ester." },
  { id: 4, content: "L'analyse IR révèle une bande d'absorption intense à 1720 cm⁻¹, typique d'une fonction cétone." },
];

export default function DemoPage() {
  // Mock state variables
  const [deadlineDate, setDeadlineDate] = useState<dayjs.Dayjs | null>(dayjs('2023-12-15'));
  const [submissionDate, setSubmissionDate] = useState<dayjs.Dayjs | null>(dayjs('2023-12-18'));
  const [experimentalGrade, setExperimentalGrade] = useState('3.5');
  const [theoreticalGrade, setTheoreticalGrade] = useState('12.5');
  const [isPenaltyEnabled, setIsPenaltyEnabled] = useState(true);
  const [penalty, setPenalty] = useState('6.0');
  
  const experimentalPoints = 5;
  const theoreticalPoints = 15;
  
  const calculateTotalGrade = () => {
    const expGrade = parseFloat(experimentalGrade || '0');
    const theoGrade = parseFloat(theoreticalGrade || '0');
    return expGrade + theoGrade;
  };
  
  const calculateFinalGrade = () => {
    const totalGrade = calculateTotalGrade();
    const penaltyValue = isPenaltyEnabled ? parseFloat(penalty || '0') : 0;
    return Math.max(0, totalGrade - penaltyValue).toFixed(1);
  };

  // Mock functions that do nothing
  const noOp = () => {};

  // State for content items - replacing mockContentItems with state
  const [contentItems, setContentItems] = useState([
    { id: 'item-1', type: 'text', content: "Le spectre RMN proton présente un multiplet à 7.2 ppm intégrant pour 5 protons, caractéristique d'un groupement phényle.", isFromFragment: false },
    { id: 'item-2', type: 'text', content: "Le singulet à 3.7 ppm correspond aux protons du groupement méthoxy (-OCH₃).", isFromFragment: true, originalFragmentId: 1 },
    { id: 'item-3', type: 'text', content: "La disparition de la bande d'élongation N-H vers 3300 cm⁻¹ confirme que la réaction est complète.", isFromFragment: false },
  ]);

  // Calculate days late for display
  const daysLate = submissionDate && deadlineDate ? 
    Math.max(0, submissionDate.diff(deadlineDate, 'day')) : 0;

  // Function to move items (for drag-and-drop reordering)
  const moveItem = useCallback((dragIndex: number, hoverIndex: number) => {
    setContentItems(prevItems => {
      const newItems = [...prevItems];
      const dragItem = newItems[dragIndex];
      newItems.splice(dragIndex, 1);
      newItems.splice(hoverIndex, 0, dragItem);
      return newItems;
    });
  }, []);

  // Function to add a fragment to the correction content
  const addFragmentToCorrection = useCallback((fragment: any) => {
    const newItem = {
      id: `item-${Date.now()}`,
      type: 'text',
      content: fragment.content,
      isFromFragment: true,
      originalFragmentId: fragment.id
    };
    
    setContentItems(prevItems => [...prevItems, newItem]);
  }, []);

  // Function to delete an item from the correction content
  const deleteItem = useCallback((id: string) => {
    setContentItems(prevItems => prevItems.filter(item => item.id !== id));
  }, []);

  // Function to handle fragment drops from the fragment list to the content area
  const handleFragmentDrop = useCallback((fragment: any) => {
    addFragmentToCorrection(fragment);
  }, [addFragmentToCorrection]);

  return (
    <div className={`${inter.className}`}>
      {/* Header explaining the demo */}
      <Box sx={{ bgcolor: '#f0f7ff', p: 3, mb: 4, borderBottom: '1px solid #ccc' }}>
        <Typography variant="h4" component="h1" gutterBottom textAlign="center">
          Page de démonstration
        </Typography>
        <Typography variant="body1" textAlign="center">
          Cette page présente deux vues différentes du système de correction
        </Typography>
      </Box>
      
      {/* SECTION 1: CORRECTIONS INTERFACE */}
      <div className="container mx-auto px-4 py-8 mb-12">
        <Typography variant="h5" component="h2" gutterBottom sx={{ borderLeft: '4px solid #1976d2', pl: 2 }}>
          Vue du professeur: interface de correction
        </Typography>
        
        <DndProvider backend={HTML5Backend}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className="container mx-auto px-4 py-4 min-h-[600px]">
              {/* Header with student name */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-bold flex items-center">
                    Jean Dupont
                    <IconButton 
                      color="primary"
                      title="Modifier le nom"
                      size="small"
                      className="ml-2"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </h1>
                  <p className="text-gray-600">
                    Activité : <span className="text-blue-600 hover:underline">TP-5 Synthèse d'esters</span>
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Créée le 12 décembre 2023, 14:30
                  </p>
                </div>
              </div>

              {/* Date pickers */}
              <div className="flex flex-wrap gap-4 mb-2">
                <Box>
                  <DatePicker
                    label="Date limite de rendu"
                    value={deadlineDate}
                    onChange={(newDate) => setDeadlineDate(newDate)}
                    slotProps={{ textField: { size: 'small' } }}
                  />
                </Box>
                <Box>
                  <DatePicker
                    label="Date de rendu effective"
                    value={submissionDate}
                    onChange={(newDate) => setSubmissionDate(newDate)}
                    slotProps={{ textField: { size: 'small' } }}
                  />
                </Box>
              </div>
              
              {/* Late submission alert */}
              {daysLate > 0 && (
                <div className="flex justify-start items-center my-2 w-full">
                  <Box className="flex items-center">
                    <Alert severity="error" sx={{ py: 0.5 }}>
                      Rendu en retard de {daysLate} jour(s)
                      <strong className="ml-2">
                        {isPenaltyEnabled && `(Pénalité automatique de ${penalty} points)`}
                      </strong>
                    </Alert>
                  </Box>
                </div>
              )}

              {/* Two-column layout */}
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left column: correction editor */}
                <div className="w-full md:w-2/3">
                  {/* Content editor */}
                  <Paper className="p-4 shadow mb-6">
                    <Typography variant="h6" className="mb-3">Contenu de la correction</Typography>
                    <DropTarget onDrop={handleFragmentDrop}>
                      <div className="border rounded-md p-4 bg-gray-50 mb-4 min-h-[200px]">
                        {contentItems.map((item, index) => (
                          <DraggableItemMock
                            key={item.id}
                            item={item}
                            index={index}
                            moveItem={moveItem}
                            onDelete={deleteItem}
                          />
                        ))}
                      </div>
                    </DropTarget>
                  </Paper>

                  {/* Action buttons */}
                  <Paper className="p-4 shadow mb-6 flex justify-between items-center">
                    <div className="flex space-x-2">
                      <IconButton
                        color="primary"
                        size="medium"
                        title="Ajouter un paragraphe"
                      >
                        <AddIcon />
                      </IconButton>
                    </div>
                    <div className="space-x-2 flex justify-end items-center">
                      <IconButton
                        color="inherit"
                        size="medium"
                        title="Annuler la dernière modification"
                      >
                        <UndoIcon />
                      </IconButton>
                      <IconButton
                        color="primary"
                        size="medium"
                        title="Sauvegarder la correction"
                      >
                        <SaveIcon />
                      </IconButton>
                      <IconButton
                        color="primary"
                        size="medium"
                        title="Partager la correction"
                      >
                        <ShareIcon />
                      </IconButton>
                      <IconButton
                        color="success"
                        size="medium"
                        title="Copier dans le presse-papier"
                      >
                        <ContentCopyIcon />
                      </IconButton>
                    </div>
                  </Paper>

                  {/* Grading section */}
                  <Paper className="p-4 shadow mb-6">
                    <div className="mb-3">
                      <Typography variant="h6">
                        Notation sur {experimentalPoints + theoreticalPoints} points
                      </Typography>
                    </div>
                    <div className="flex flex-col space-y-3">
                      <div className="flex flex-row justify-around mx-2">
                        <div className="flex flex-col items-center">
                          <TextField
                            label={`Expérimentale /${experimentalPoints}`}
                            value={experimentalGrade}
                            onChange={(e) => setExperimentalGrade(e.target.value)}
                            variant="outlined"
                            size="small"
                            type="text"
                            inputProps={{ 
                              inputMode: 'decimal', 
                              style: { textAlign: 'center' }
                            }}
                            sx={{ width: 120 }}
                          />
                          <div className="mb-4"></div>
                          <TextField
                            label={`Théorique /${theoreticalPoints}`}
                            value={theoreticalGrade}
                            onChange={(e) => setTheoreticalGrade(e.target.value)}
                            variant="outlined"
                            size="small"
                            type="text"
                            inputProps={{ 
                              inputMode: 'decimal', 
                              style: { textAlign: 'center' }
                            }}
                            sx={{ width: 120 }}
                          />
                        </div>
                        
                        <div className="flex items-center">
                          <Box className="flex items-center ml-3">
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={isPenaltyEnabled}
                                  onChange={(e) => setIsPenaltyEnabled(e.target.checked)}
                                  size="small"
                                />
                              }
                              label="Pénalité de retard"
                            />
                          </Box>
                        </div>
                        
                        {isPenaltyEnabled && (
                          <div className="flex items-center">
                            <TextField
                              label="Points pénalité"
                              value={penalty}
                              onChange={(e) => setPenalty(e.target.value)}
                              variant="outlined"
                              size="small"
                              type="text"
                              inputProps={{ 
                                inputMode: 'decimal', 
                                style: { textAlign: 'center' }
                              }}
                              sx={{ width: 120 }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex justify-center items-center border-t mt-2 pt-2">
                        <Typography variant="body1" className="text-right">
                          Total : {calculateTotalGrade().toFixed(1)} / {experimentalPoints + theoreticalPoints}
                          {isPenaltyEnabled && penalty && (
                            <>
                              <span className="text-red-500 ml-2">- {penalty}</span>
                              <span className="font-bold ml-2">= {calculateFinalGrade()} / {experimentalPoints + theoreticalPoints}</span>
                            </>
                          )}
                        </Typography>
                      </div>
                    </div>
                  </Paper>
                </div>
                
                {/* Right column: fragments */}
                <div className="w-full md:w-1/3">
                  <Paper className="p-4 shadow">
                    <div className="flex flex-col space-y-2 mb-4">
                      <Typography variant="h6" className="mb-0">Fragments disponibles</Typography>
                      
                      {/* Activity selector dropdown */}
                      <FormControl fullWidth size="small" margin="normal">
                        <InputLabel id="activity-select-label">Activité</InputLabel>
                        <Select
                          labelId="activity-select-label"
                          value={5}
                          label="Activité"
                        >
                          <MenuItem value={5}>TP-5 Synthèse d'esters (courante)</MenuItem>
                          <MenuItem value={4}>TP-4 Chromatographie</MenuItem>
                          <MenuItem value={3}>TP-3 Spectroscopie IR</MenuItem>
                        </Select>
                      </FormControl>
                    </div>

                    {/* Fragments list */}
                    <div className="space-y-3 max-h-[500px] overflow-y-auto p-1">
                      {mockFragments.map((fragment, index) => (
                        <div key={fragment.id} className="relative">
                          <FragmentItemMock
                            fragment={fragment}
                            index={index}
                            onAddToCorrection={addFragmentToCorrection}
                          />
                        </div>
                      ))}
                    </div>
                    
                    {/* Add fragment section */}
                    <Box className="flex flex-col space-y-4 my-4">
                      <Box className="flex items-center justify-between">
                        <Button
                          color="primary"
                          variant="text"
                          size="small"
                        >
                          Nouveau
                        </Button>
                        <Button
                          color="primary"
                          variant="text"
                          size="small"
                        >
                          Gérer les fragments
                        </Button>
                      </Box>
                    </Box>
                  </Paper>
                </div>
              </div>
            </div>
          </LocalizationProvider>
        </DndProvider>
      </div>
      
      {/* Divider between sections */}
      <Divider sx={{ my: 5, borderWidth: 2, borderColor: '#ccc' }} />
      
      {/* SECTION 2: FEEDBACK INTERFACE */}
      <div className="container mx-auto px-4 py-8">
        <Typography variant="h5" component="h2" gutterBottom sx={{ borderLeft: '4px solid #1976d2', pl: 2 }}>
          Vue de l'élève: interface de retour
        </Typography>
        
        <div className={`${inter.className} min-h-screen flex justify-center px-4 py-8`}>
          <div className="max-w-4xl w-full">
            <Paper 
              elevation={3} 
              className="overflow-hidden rounded-lg shadow-lg"
            >
              {/* En-tête avec un arrière-plan gradient */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <RuleIcon sx={{ fontSize: 32 }} />
                  <Typography variant="h4" className="font-bold">
                    Correction de Jean Dupont
                  </Typography>
                </div>
                
                <Typography 
                  variant="h6" 
                  className="text-center text-blue-100 mt-2 font-medium"
                >
                  TP-5 Synthèse d'esters
                </Typography>
              </div>

              <div className="p-6">
                {/* Dates importantes */}
                <Paper 
                  elevation={0} 
                  variant="outlined" 
                  sx={{ borderRadius: 2 }}
                  className="p-4 mb-6 border-l-4 border-blue-500 bg-blue-50"
                >
                  <Box className="flex items-center gap-2 mb-3">
                    <CalendarTodayIcon color="primary" />
                    <Typography variant="h6" className="font-bold">
                      Dates importantes
                    </Typography>
                  </Box>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2">
                    <div className="flex items-center gap-2">
                      <EventAvailableIcon fontSize="small" className="text-blue-700" />
                      <div>
                        <Typography variant="subtitle2" className="text-gray-600">Date limite</Typography>
                        <Typography variant="body1" className="font-medium">
                          {deadlineDate?.format('DD/MM/YYYY')}
                        </Typography>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <HourglassEmptyIcon fontSize="small" className="text-blue-700" />
                      <div>
                        <Typography variant="subtitle2" className="text-gray-600">Date de rendu</Typography>
                        <div className="flex items-center gap-2">
                          <Typography variant="body1" className="font-medium">
                            {submissionDate?.format('DD/MM/YYYY')}
                          </Typography>
                          {daysLate > 0 && <Chip label="En retard" size="small" color="error" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Message de statut */}
                  {daysLate > 0 && (
                    <Alert 
                      severity="error" 
                      icon={<ScheduleIcon />}
                      className="mt-4"
                      variant="outlined"
                    >
                      Rendu en retard de {daysLate} jour(s) - Une pénalité s'applique à la note finale.
                    </Alert>
                  )}
                </Paper>

                {/* Affichage de la note */}
                <Paper 
                  elevation={0}
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                  className="p-4 mb-6 border-l-4 border-green-600 bg-green-50"
                >
                  <Box className="flex items-center gap-2 mb-3">
                    <GradeIcon className="text-green-700" />
                    <Typography variant="h6" className="font-bold">
                      Résultat
                    </Typography>
                  </Box>
                  
                  {/* Notes par partie */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Paper className="p-3 border shadow-sm">
                      <Typography variant="subtitle2" className="text-gray-600">Partie expérimentale</Typography>
                      <Typography variant="h5" className="font-bold text-blue-700">
                        {experimentalGrade} <span className="text-gray-600 text-lg">/ {experimentalPoints}</span>
                      </Typography>
                    </Paper>
                    
                    <Paper className="p-3 border shadow-sm">
                      <Typography variant="subtitle2" className="text-gray-600">Partie théorique</Typography>
                      <Typography variant="h5" className="font-bold text-blue-700">
                        {theoreticalGrade} <span className="text-gray-600 text-lg">/ {theoreticalPoints}</span>
                      </Typography>
                    </Paper>
                  </div>
                  
                  {/* Note totale */}
                  <div className="flex justify-center mb-2">
                    <div className="flex flex-col items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-800 rounded-full text-white inline-block">
                      <Typography variant="subtitle2">Totale</Typography>
                      <Typography variant="h4" className="text-center font-bold">
                        {calculateTotalGrade().toFixed(1)} / {experimentalPoints + theoreticalPoints}
                      </Typography>
                    </div>
                  </div>
                  
                  {/* Pénalités */}
                  {isPenaltyEnabled && parseFloat(penalty) > 0 && (
                    <div className="mt-4">
                      <Alert 
                        severity="error" 
                        variant="outlined"
                        sx={{ mb: 1 }}
                      >
                        <div className="font-bold">Pénalité de retard : - {penalty} points</div>
                        <Typography variant="caption">
                          (pour {daysLate} jours de retard)
                        </Typography>
                      </Alert>
                      
                      <div className="mt-3 p-2 bg-gray-100 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center">
                          <Typography variant="subtitle2">
                            Note finale après pénalité :
                          </Typography>
                          <Typography variant="h5" className="font-bold text-red-600">
                            {calculateFinalGrade()} / {experimentalPoints + theoreticalPoints}
                          </Typography>
                        </div>
                      </div>
                    </div>
                  )}
                </Paper>

                <Divider className="my-6" />

                {/* Contenu de la correction */}
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-4 bg-gray-100 p-2 rounded-t-lg border-b-2 border-blue-500">
                    <Typography variant="h6" className="font-bold text-gray-800">
                      Contenu de la correction
                    </Typography>
                  </div>
                  
                  <Paper 
                    variant="outlined" 
                    className="p-5 mb-6 rounded bg-white shadow-inner"
                  >
                    <div className="correction-content prose prose-sm md:prose-base max-w-none prose-headings:text-blue-800 prose-a:text-blue-600">
                      <h2>Partie expérimentale</h2>
                      <p>Le protocole a été globalement bien suivi. Points positifs :</p>
                      <List component="ul" sx={{ listStyleType: 'disc', pl: 4, '& .MuiListItem-root': {     pl: 0    } }}>
                        <ListItem component="li" sx={{ display: 'list-item' }}>
                            <ListItemText primary="bonne manipulation des solutions" />
                        </ListItem>
                        <ListItem component="li" sx={{ display: 'list-item' }}>
                            <ListItemText primary="respect des consignes de sécurité" />
                        </ListItem>
                        </List> 
                      <p>Points à améliorer :</p>
                      <List component="ul" sx={{ listStyleType: 'disc', pl: 4, '& .MuiListItem-root': {     pl: 0    } }}>
                        <ListItem component="li" sx={{ display: 'list-item' }}>
                            <ListItemText primary="attention à la propreté de la verrerie" />
                        </ListItem>
                        <ListItem component="li" sx={{ display: 'list-item' }}>
                            <ListItemText primary="le rendement de 68% est correct mais pourrait être optimisé" />
                        </ListItem>
                        </List>                       
                      <h2>Partie théorique</h2>
                      {contentItems.map((item) => (
                        <p key={item.id}>{item.content}</p>
                      ))}
                    </div>
                  </Paper>
                </div>
              </div>
              
              <div className="bg-gray-100 p-4 text-right border-t">
                <Typography variant="caption" className="text-gray-500">
                  Correction créée le 19/12/2023
                </Typography>
              </div>
            </Paper>
          </div>
        </div>
      </div>
    </div>
  );
}

// Create a new DropTarget component for the content area
type DropTargetProps = {
  children: React.ReactNode;
  onDrop: (fragment: any) => void;
};

const DropTarget: React.FC<DropTargetProps> = ({ children, onDrop }) => {
  // Add a ref to solve the TypeScript error
  const dropRef = useRef<HTMLDivElement>(null);
  
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'fragment',
    drop: (item: { fragment: any }) => {
      onDrop(item.fragment);
      return { dropped: true };
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  // Apply the drop to the ref
  drop(dropRef);

  return (
    <div 
      ref={dropRef} 
      style={{ 
        position: 'relative',
        backgroundColor: isOver ? 'rgba(144, 202, 249, 0.2)' : 'transparent',
        transition: 'background-color 0.2s ease'
      }}
    >
      {children}
      {isOver && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            border: '2px dashed #1976d2',
            borderRadius: '4px',
            pointerEvents: 'none',
            zIndex: 10
          }}
        />
      )}
    </div>
  );
};
