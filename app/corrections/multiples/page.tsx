'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Button, 
  IconButton, 
  TextField, 
  Paper, 
  Typography, 
  Box, 
  Alert, 
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Slider,
  Tooltip,
  Chip
} from '@mui/material';
import Grid from '@mui/material/Grid2';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import GroupsIcon from '@mui/icons-material/Groups';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BarChartIcon from '@mui/icons-material/BarChart';
import DeleteIcon from '@mui/icons-material/Delete';
import ShareIcon from '@mui/icons-material/Share';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ArticleIcon from '@mui/icons-material/Article';
import CheckIcon from '@mui/icons-material/Check';
import { Activity } from '@/lib/activity';
import { Correction } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import * as shareService from '@/lib/services/shareService';
// Importations pour QR code et PDF
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';


type Student = {
  name: string;
  experimentalGrade: string;
  theoreticalGrade: string;
  correctionId?: string;
  shareCode?: string;
};

export default function MultipleCorrections() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activityId = searchParams.get('activityId');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Références pour les QR codes
  const qrCodeRefs = useRef<{[key: string]: SVGSVGElement | null}>({});
  
  // Activity and points states
  const [activity, setActivity] = useState<Activity | null>(null);
  const [experimentalPoints, setExperimentalPoints] = useState<number>(5);
  const [theoreticalPoints, setTheoreticalPoints] = useState<number>(15);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  
  // UI states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<number>(0);

  // Student data states
  const [manualStudentCount, setManualStudentCount] = useState<number>(1);
  const [students, setStudents] = useState<Student[]>([]);
  const [csvContent, setCsvContent] = useState<string>('');
  
  // Sharing and PDF states
  const [sharingCorrections, setSharingCorrections] = useState<boolean>(false);
  const [generatingPdf, setGeneratingPdf] = useState<boolean>(false);


  // Gestion de l'historique des corrections de groupes
const [groupName, setGroupName] = useState<string>('');
const [groupDescription, setGroupDescription] = useState<string>('');
const [groupId, setGroupId] = useState<number | null>(null);

// Fonction pour créer le groupe et y ajouter les corrections
const handleCreateCorrectionsGroup = async () => {
  if (!activityId || students.length === 0 || !groupName.trim()) {
    setError('Veuillez saisir un nom de groupe et ajouter des étudiants');
    return;
  }
  
  setSaving(true);
  setError('');
  
  try {
    // 1. Créer d'abord le groupe
    const groupResponse = await fetch('/api/correction-groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        activity_id: activityId,
        name: groupName,
        description: groupDescription
      }),
    });
    
    if (!groupResponse.ok) {
      const errorData = await groupResponse.json();
      throw new Error(errorData.error || 'Erreur lors de la création du groupe');
    }
    
    const groupData = await groupResponse.json();
    setGroupId(groupData.id);
    console.log("Groupe créé avec l'ID:", groupData.id);
    
    // 2. Ensuite créer les corrections et récupérer leurs IDs
    const createdCorrectionIds = await handleCreateCorrections();
    
    console.log("IDs des corrections créées:", createdCorrectionIds);
    
    if (!createdCorrectionIds || createdCorrectionIds.length === 0) {
      throw new Error('Aucune correction n\'a été créée');
    }
    
    // 3. Pause brève pour assurer que les corrections sont bien enregistrées en DB
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 4. Associer les corrections au groupe
    const linkResponse = await fetch(`/api/correction-groups/${groupData.id}/corrections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        correction_ids: createdCorrectionIds
      }),
    });
    
    if (!linkResponse.ok) {
      // Afficher les détails de l'erreur pour le débogage
      console.error('Réponse d\'association non-OK:', await linkResponse.text());
      throw new Error(`Erreur lors de l'association des corrections au groupe (${linkResponse.status})`);
    }
    
    const linkResult = await linkResponse.json();
    console.log("Résultat de l'association:", linkResult);
    
    setSuccessMessage(`Groupe "${groupName}" créé avec ${createdCorrectionIds.length} corrections`);
    
    // 5. Redirection vers la page du groupe après création réussie
    setTimeout(() => {
      router.push(`/activities/${activityId}/groups/${groupData.id}`);
    }, 2000);
  } catch (err) {
    console.error('Erreur:', err);
    setError(err instanceof Error ? err.message : 'Erreur lors de la création du groupe');
  } finally {
    setSaving(false);
  }
};


  // Fonction pour supprimer un étudiant
  const handleDeleteStudent = (index: number) => {
    setStudents(prev => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  // Fonction pour revenir en arrière / annuler
  const handleCancel = () => {
    router.back();
  };

  useEffect(() => {
    if (!activityId) {
      setError("L'ID de l'activité est requis. Veuillez sélectionner une activité.");
      setLoading(false);
      return;
    }

    fetchActivity();
  }, [activityId]);

  const fetchActivity = async () => {
    if (!activityId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/activities/${activityId}`);
      if (!response.ok) throw new Error("Erreur lors du chargement de l'activité");
      
      const activityData: Activity = await response.json();
      setActivity(activityData);
      setExperimentalPoints(activityData.experimental_points !== undefined ? activityData.experimental_points : 5);
      setTheoreticalPoints(activityData.theoretical_points !== undefined ? activityData.theoretical_points : 15);
    } catch (err) {
      console.error('Erreur:', err);
      setError("Erreur lors du chargement de l'activité");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    if (activity) {
      setExperimentalPoints(activity.experimental_points !== undefined ? activity.experimental_points : 5);
      setTheoreticalPoints(activity.theoretical_points !== undefined ? activity.theoretical_points : 15);
    }
  };

  const handleSubmitGradingScale = async () => {
    if (!activityId || !activity) return;

    // Validate that the points sum to 20
    const totalPoints = Number(experimentalPoints) + Number(theoreticalPoints);
    if (totalPoints !== 20) {
      setError('Le total des points doit être égal à 20');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/activities/${activityId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: activity.name, 
          content: activity.content, 
          experimental_points: experimentalPoints,
          theoretical_points: theoreticalPoints 
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du barème');
      }

      const updatedActivity = await response.json();
      
      // Assurons-nous que les valeurs sont correctement mises à jour
      if (updatedActivity) {
        // Mettre à jour l'état de l'activité avec les nouvelles valeurs
        setActivity(updatedActivity);
        
        // Synchroniser également les états locaux avec les valeurs de l'activité mise à jour
        setExperimentalPoints(updatedActivity.experimental_points || experimentalPoints);
        setTheoreticalPoints(updatedActivity.theoretical_points || theoreticalPoints);
        
        setIsEditing(false);
        setSuccessMessage('Barème mis à jour avec succès');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error('La réponse de l\'API ne contient pas les données attendues');
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour du barème:', err);
      setError('Erreur lors de la mise à jour du barème');
    } finally {
      setSaving(false);
    }
  };

  const handlePointsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    setter: React.Dispatch<React.SetStateAction<number>>,
    isExperimental: boolean
  ) => {
    const value = Number(e.target.value);
    setter(value);
    
    // Auto-adjust the other field to maintain a sum of 20
    if (isExperimental) {
      setTheoreticalPoints(20 - value);
    } else {
      setExperimentalPoints(20 - value);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleManualStudentCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = Math.max(1, parseInt(e.target.value) || 0);
    setManualStudentCount(count);
  };

  const handleCreateManualStudents = () => {
    const newStudents = Array.from({ length: manualStudentCount }, (_, i) => ({
      name: `Étudiant ${i + 1}`,
      experimentalGrade: '',
      theoreticalGrade: '',
    }));
    
    setStudents(newStudents);
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');
    
    try {
      // Use FormData to send the file to our API
      const formData = new FormData();
      formData.append('csvFile', file);
      
      const response = await fetch('/api/utils/parse-csv', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors du traitement du fichier CSV");
      }
      
      const data = await response.json();
      setCsvContent(file.name); // Store the file name instead of content
      
      if (data.students && data.students.length > 0) {
        const parsedStudents = data.students.map((student: any) => ({
          name: student.name || 'Sans nom',
          experimentalGrade: '',
          theoreticalGrade: '',
        }));
        
        setStudents(parsedStudents);
      } else {
        setError("Aucun étudiant trouvé dans le fichier CSV");
      }
    } catch (err) {
      console.error("Erreur lors de l'importation du CSV:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de l'importation du fichier");
    } finally {
      setLoading(false);
    }
  };

  const handleClickUploadButton = () => {
    fileInputRef.current?.click();
  };


  // Modification des fonctions de changement de note pour les sliders
  const handleExperimentalGradeChange = (index: number, value: number | number[]) => {
    const newValue = typeof value === 'number' ? value : value[0];
    setStudents(prev => {
      const updated = [...prev];
      updated[index].experimentalGrade = newValue.toFixed(2);
      return updated;
    });
  };

  const handleTheoreticalGradeChange = (index: number, value: number | number[]) => {
    const newValue = typeof value === 'number' ? value : value[0];
    setStudents(prev => {
      const updated = [...prev];
      updated[index].theoreticalGrade = newValue.toFixed(2);
      return updated;
    });
  };

  const handleStudentNameChange = (index: number, value: string) => {
    setStudents(prev => {
      const updated = [...prev];
      updated[index].name = value;
      return updated;
    });
  };

  const calculateTotalGrade = (experimentalGrade: string, theoreticalGrade: string) => {
    const expGrade = parseFloat(experimentalGrade) || 0;
    const theoGrade = parseFloat(theoreticalGrade) || 0;
    return (expGrade + theoGrade).toFixed(1);
  };


  // Amélioration de la fonction handleCreateCorrections pour s'assurer que les notes sont correctement transmises
const handleCreateCorrections = async () => {
  if (!activityId || students.length === 0) return [];
  
  setSaving(true);
  setError('');
  
  try {
    const updatedStudents = [...students];
    const createdCorrectionIds = [];
    const defaultDeadline = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD pour le champ date
    const submissionDate = new Date().toISOString().split('T')[0];  // Date du jour

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      // S'assurer que les notes sont des nombres valides
      const expGrade = parseFloat(student.experimentalGrade) || 0;
      const theoGrade = parseFloat(student.theoreticalGrade) || 0;
      
      console.log(`Création correction pour ${student.name}:`, {
        experimental_points_earned: expGrade,
        theoretical_points_earned: theoGrade,
        deadline: defaultDeadline,
        submission_date: submissionDate
      });
      
      // Création de la correction pour chaque étudiant avec les champs qui existent dans la base de données
      const createResponse = await fetch('/api/corrections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activity_id: activityId,
          student_name: student.name,
          experimental_points_earned: expGrade,
          theoretical_points_earned: theoGrade,
          experimental_points: experimentalPoints,
          theoretical_points: theoreticalPoints,
          content: "", // Contenu vide pour les corrections multiples
          deadline: defaultDeadline,
          submission_date: submissionDate
        }),
      });
      
      // Vérifier la réponse
      if (!createResponse.ok) {
        // Tenter de récupérer les détails de l'erreur
        let errorMessage;
        try {
          const errorData = await createResponse.json();
          errorMessage = errorData.error || errorData.details || `Erreur lors de la création de la correction pour ${student.name}`;
          console.error(`Erreur API pour ${student.name}:`, errorData);
        } catch (e) {
          errorMessage = `Erreur lors de la création de la correction pour ${student.name}`;
          console.error(`Impossible de parser l'erreur API pour ${student.name}:`, e);
        }
        throw new Error(errorMessage);
      }
      
      const correction = await createResponse.json();
      console.log(`Correction créée pour ${student.name}, ID: ${correction.id}, expGrade: ${correction.experimental_points_earned}, theoGrade: ${correction.theoretical_points_earned}`);
      
      updatedStudents[i].correctionId = correction.id;
      createdCorrectionIds.push(correction.id);
    }
    
    setStudents(updatedStudents);
    setSuccessMessage(`${students.length} corrections créées avec succès`);
    
    return createdCorrectionIds;
  } catch (err) {
    console.error('Erreur lors de la création des corrections:', err);
    setError(err instanceof Error ? err.message : 'Erreur lors de la création des corrections');
    return [];
  } finally {
    setSaving(false);
  }
};


  // Améliorer le rendu après mise à jour du barème
  useEffect(() => {
    if (activity) {
      // Synchroniser les états locaux avec les valeurs de l'activité chaque fois qu'elle change
      setExperimentalPoints(activity.experimental_points !== undefined ? activity.experimental_points : 5);
      setTheoreticalPoints(activity.theoretical_points !== undefined ? activity.theoretical_points : 15);
    }
  }, [activity]);

  // Fonction pour partager toutes les corrections
  const handleShareAllCorrections = async () => {
    if (students.length === 0 || !students.some(s => s.correctionId)) {
      setError('Aucune correction disponible à partager');
      return;
    }
    
    setSharingCorrections(true);
    setError('');
    
    try {
      const updatedStudents = [...students];
      let sharedCount = 0;
      
      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        
        if (student.correctionId) {
          // Vérifier d'abord si un code de partage existe déjà
          const existingShareCheck = await shareService.getExistingShareCode(student.correctionId);
          
          if (existingShareCheck.exists && existingShareCheck.code) {
            updatedStudents[i].shareCode = existingShareCheck.code;
            sharedCount++;
          } else {
            // Sinon, générer un nouveau code
            const shareResult = await shareService.generateShareCode(student.correctionId);
            if (shareResult.code) {
              updatedStudents[i].shareCode = shareResult.code;
              sharedCount++;
            }
          }
        }
      }
      
      setStudents(updatedStudents);
      setSuccessMessage(`${sharedCount} correction(s) partagée(s) avec succès`);
      
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Erreur lors du partage des corrections:', err);
      setError('Erreur lors du partage des corrections');
    } finally {
      setSharingCorrections(false);
    }
  };

  // Nouvelle fonction pour partager une correction individuelle
  const handleShareCorrection = async (correctionId: string, index: number) => {
    setSharingCorrections(true);
    setError('');
    try {
      // Vérifier si un code de partage existe déjà
      const existingShareCheck = await shareService.getExistingShareCode(correctionId);
      let newCode = '';
      if (existingShareCheck.exists && existingShareCheck.code) {
        newCode = existingShareCheck.code;
      } else {
        // Générer un nouveau code
        const shareResult = await shareService.generateShareCode(correctionId);
        newCode = shareResult.code;
      }
      setStudents(prev => {
        const updated = [...prev];
        updated[index].shareCode = newCode;
        return updated;
      });
      setSuccessMessage('Correction partagée avec succès');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Erreur lors du partage de la correction:', err);
      setError('Erreur lors du partage de la correction');
    } finally {
      setSharingCorrections(false);
    }
  };

  // Fonction pour générer un fichier PDF avec QR codes
  const generatePdfWithQRCodes = async () => {
    if (students.length === 0 || !students.some(s => s.shareCode)) {
      setError('Aucune correction partagée disponible pour générer le PDF');
      return;
    }
    
    setGeneratingPdf(true);
    setError('');
    
    try {
      // Création d'un nouveau document PDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Titre du document
      const title = activity ? `QR Codes - ${activity.name}` : 'QR Codes des corrections';
      doc.setFontSize(16);
      doc.text(title, 105, 15, { align: 'center' });
      
      // Date de génération
      const date = new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      doc.setFontSize(10);
      doc.text(`Généré le ${date}`, 105, 22, { align: 'center' });
      
      // Contenu du PDF
      doc.setFontSize(12);
      
      let y = 35;
      const pageHeight = doc.internal.pageSize.height;
      
      // Traiter chaque étudiant qui a un code de partage
      for (const student of students) {
        if (student.shareCode) {
          // Vérifier s'il faut ajouter une nouvelle page
          if (y > pageHeight - 60) {
            doc.addPage();
            y = 20;
          }
          
          // URL pour la correction
          const shareUrl = `${window.location.origin}/feedback/${student.shareCode}`;
          
          try {
            // Générer le QR code directement sous forme de DataURL
            const qrCodeDataUrl = await QRCode.toDataURL(shareUrl, {
              errorCorrectionLevel: 'M',
              margin: 1,
              width: 200,
              color: {
                dark: '#000',
                light: '#fff'
              }
            });
            
            // Ajouter le nom de l'étudiant
            doc.setFont('helvetica', 'bold');
            doc.text(student.name, 105, y, { align: 'center' });
            y += 8;
            
            // Ajouter le QR code à la position actuelle
            const qrSize = 40;
            doc.addImage(qrCodeDataUrl, 'PNG', (doc.internal.pageSize.width - qrSize) / 2, y, qrSize, qrSize);
            y += qrSize + 5;
            
            // Ajouter l'URL sous le QR code
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.text(shareUrl, 105, y, { align: 'center' });
            y += 20;
          } catch (err) {
            console.error(`Erreur de génération de QR code pour ${student.name}:`, err);
            // Continuer avec le prochain étudiant
          }
        }
      }
      
      // Enregistrer le PDF
      doc.save(`qrcodes-${date.replace(/\s/g, '_')}.pdf`);
      
      setSuccessMessage('PDF généré avec succès');
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Erreur lors de la génération du PDF:', err);
      setError('Erreur lors de la génération du PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Ajouter cette fonction auxiliaire
const debugResponse = async (response: Response, label: string) => {
  try {
    const clonedResponse = response.clone();
    const text = await clonedResponse.text();
    console.log(`${label} - Status: ${response.status}`, { 
      headers: Object.fromEntries(response.headers),
      body: text.length < 500 ? text : text.substring(0, 500) + '...'
    });
  } catch (e) {
    console.error(`Impossible de déboguer la réponse ${label}`, e);
  }
};

  if (loading) {
    return (
      <div className="container max-w-[400px] mx-auto px-4 py-8 flex justify-center">
        <LoadingSpinner size="lg" text="Chargement des données " />
      </div>
    );
  }

  if (error && !activityId) {
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
                    size="small"
                    color="primary"
                    className="mt-4"
                    component={Link}
                    href="/activities"
                    startIcon={<ArrowBackIcon />}
                  >
                    Sélectionner une activité
                  </Button>
                </div>
              </div>
            </div>
          </Paper>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* En-tête avec design moderne et dégradé */}
      <Paper 
        elevation={3}
        className="mb-8 rounded-lg overflow-hidden bg-gradient-to-r from-blue-700 to-indigo-800"
      >
        <div className="p-6 text-white relative">
          {/* Motif de fond décoratif */}
          <div className="absolute inset-0 opacity-10" 
               style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}}
          ></div>
          
          {/* Contenu de l'en-tête */}
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <Typography variant="h4" component="h1" className="font-bold text-black mb-1">
                Corrections multiples
              </Typography>
              {activity && (
                <Typography variant="subtitle1" className="text-blue-600">
                  Activité : {activity.name}
                </Typography>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button 
                component={Link} 
                href={activityId ? `/activities/${activityId}` : '/activities'}
                variant="outlined"
                color='secondary'
                startIcon={<ArrowBackIcon />}
              >
                Retour
              </Button>
              
              {activityId && (
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<GroupsIcon />}
                  component={Link}
                  href={`/activities/${activityId}/groups`}
                >
                  Groupes
                </Button>
              )}
            </div>
          </div>
        </div>
      </Paper>

      {/* Affichage des messages */}
      {successMessage && (
        <Alert severity="success" className="mb-6 animate-fadeIn">
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert severity="error" className="mb-6 animate-fadeIn">
          {error}
        </Alert>
      )}

      {/* Section Barème avec design amélioré */}
      <Paper className="p-6 rounded-lg mb-6 shadow-md border-t-4 border-blue-600">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChartIcon className="text-blue-600" fontSize="large" />
            <Typography variant="h5" className="font-bold">
              Barème de notation
            </Typography>
          </div>
          {!isEditing && (
            <IconButton 
              onClick={handleEditClick}
              size="small"
              color="primary"
              className="bg-blue-50"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
        </div>

        {isEditing ? (
          <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <TextField
                label="Points partie expérimentale"
                type="number"
                InputProps={{ inputProps: { min: 0, max: 20 } }}
                value={experimentalPoints}
                onChange={(e) => handlePointsChange(e, setExperimentalPoints, true)}
                variant="outlined"
                fullWidth
                className="bg-white"
              />
              <TextField
                label="Points partie théorique"
                type="number"
                InputProps={{ inputProps: { min: 0, max: 20 } }}
                value={theoreticalPoints}
                onChange={(e) => handlePointsChange(e, setTheoreticalPoints, false)}
                variant="outlined"
                fullWidth
                className="bg-white"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Typography variant="caption" className="text-gray-600">
                Le total des points doit être égal à 20
              </Typography>
              <div>
                <Typography variant="subtitle1" className="font-medium">
                  Total: <span className={`font-bold ${experimentalPoints + theoreticalPoints !== 20 ? 'text-red-600' : 'text-blue-700'}`}>
                    {experimentalPoints + theoreticalPoints}/20
                  </span>
                </Typography>
                {experimentalPoints + theoreticalPoints !== 20 && (
                  <Typography variant="caption" color="error">
                    Ajustez les valeurs pour un total de 20 points
                  </Typography>
                )}
              </div>
            </div>

            <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
              <Button
                onClick={handleCancelClick}
                variant="outlined"
                color="inherit"
                startIcon={<CloseIcon />}
                size="small"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmitGradingScale}
                variant="contained"
                color="primary"
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                size="small"
                disabled={saving || experimentalPoints + theoreticalPoints !== 20}
              >
                {saving ? 'Sauvegarde...' : 'Enregistrer'}
              </Button>
            </Box>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Paper className="p-4 border shadow-sm transition-all hover:shadow-md flex flex-col items-center text-center">
              <Typography variant="overline" color="textSecondary" className="mb-1">
                PARTIE EXPÉRIMENTALE
              </Typography>
              <Typography variant="h3" className="font-bold text-blue-600 mb-1">
                {activity?.experimental_points || 5}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                points
              </Typography>
            </Paper>
            
            <Paper className="p-4 border shadow-sm transition-all hover:shadow-md flex flex-col items-center text-center">
              <Typography variant="overline" color="textSecondary" className="mb-1">
                PARTIE THÉORIQUE
              </Typography>
              <Typography variant="h3" className="font-bold text-blue-600 mb-1">
                {activity?.theoretical_points || 15}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                points
              </Typography>
            </Paper>
            
            <Paper className="p-4 border-2 border-blue-600 bg-blue-50 shadow-sm transition-all hover:shadow-md flex flex-col items-center text-center">
              <Typography variant="overline" color="primary" className="mb-1 font-medium">
                TOTAL
              </Typography>
              <Typography variant="h3" className="font-bold text-blue-700 mb-1">
                {(activity?.experimental_points || 5) + (activity?.theoretical_points || 15)}
              </Typography>
              <Typography variant="body2" color="primary">
                points sur 20
              </Typography>
            </Paper>
          </div>
        )}
      </Paper>

      {/* Section Informations du groupe avec design amélioré */}
      <Paper className="p-6 rounded-lg mb-6 shadow-md border-t-4 border-purple-600">
        <div className="flex items-center gap-2 mb-4">
          <GroupsIcon className="text-purple-600" fontSize="large" />
          <Typography variant="h5" className="font-bold">
            Informations du groupe
          </Typography>
        </div>
        
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Nom du groupe"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            variant="outlined"
            fullWidth
            className="mb-4"
            placeholder="Ex: TP1 - Groupe B - Session Automne 2024"
            required
            slotProps={{
              input: {
                startAdornment: (
                  <Box sx={{ color: 'action.active', mr: 1 }}>
                    <PeopleAltIcon />
                  </Box>
                ),
              }
            }}
          />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Description (optionnelle)"
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
            variant="outlined"
            fullWidth
            multiline
            rows={3}
            placeholder="Informations additionnelles sur ce groupe de corrections"
            slotProps={{
              input: {
                startAdornment: (
                  <Box sx={{ color: 'action.active', mr: 1, alignSelf: 'flex-start', mt: 1.5 }}>
                    <ArticleIcon />
                  </Box>
                ),
              }
            }}
          />
          </Grid>
        </Grid>
      </Paper>

      {/* Section d'ajout d'étudiants avec design amélioré */}
      {!students.length && (
        <Paper className="p-6 rounded-lg mb-6 shadow-md border-t-4 border-green-600">
          <div className="flex items-center gap-2 mb-4">
            <PersonAddIcon className="text-green-600" fontSize="large" />
            <Typography variant="h5" className="font-bold">
              Ajouter des étudiants
            </Typography>
          </div>
          
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            variant="fullWidth"
            className="mb-4 border-b border-gray-200"
          >
            <Tab 
              label="Saisie manuelle" 
              icon={<EditIcon />} 
              iconPosition="start" 
            />
            <Tab 
              label="Importer CSV" 
              icon={<UploadFileIcon />} 
              iconPosition="start" 
            />
          </Tabs>
          
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            {activeTab === 0 && (
              <div className="flex flex-col md:flex-row items-center gap-4">
                <TextField
                  label="Nombre d'étudiants"
                  type="number"
                  value={manualStudentCount}
                  onChange={handleManualStudentCountChange}
                  InputProps={{ inputProps: { min: 1 } }}
                  variant="outlined"
                  className="md:w-1/3"
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCreateManualStudents}
                  className="md:ml-auto"
                  fullWidth={window.innerWidth < 640}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <PersonAddIcon />
                    <span>{manualStudentCount} étudiant{manualStudentCount > 1 ? 's' : ''}</span>
                  </Box>
                </Button>
              </div>
            )}
            
            {activeTab === 1 && (
              <div className="space-y-4">
                <Paper variant="outlined" className="p-4 bg-blue-50 border-blue-200">
                  <Typography variant="subtitle2" component="div" sx={{ mb: 2, fontWeight: 'bold', color: '#1E40AF' }}>
                    Format de fichier accepté :
                  </Typography>
                  <div className="space-y-3">
                    <div className="flex justify-start align-center gap-2">
                        <CheckIcon fontSize="small" className="text-blue-700" />
                      <Typography variant="body2">
                        CSV ou TXT contenant des noms d'étudiants dans la première colonne
                      </Typography>
                    </div>
                    <div className="flex items-start gap-2">

                        <CheckIcon fontSize="small" className="text-blue-700" />

                      <Typography variant="body2">
                        Compatible avec formats séparés par virgules, points-virgules ou tabulations
                      </Typography>
                    </div>
                    <div className="flex items-start gap-2">

                        <CheckIcon fontSize="small" className="text-blue-700" />
                      
                      <Typography variant="body2">
                        Reconnaît "NOM Prénom", "Prénom NOM", etc.
                      </Typography>
                    </div>
                  </div>
                  
                  <Box mt={2} p={2} bgcolor="white" borderRadius={1} border="1px solid" borderColor="divider">
                    <Typography variant="caption" component="div" fontFamily="monospace" whiteSpace="pre-line">
                      DUPONT Jean<br />
                      Marie MARTIN<br />
                      LEGRAND Amélie;Groupe B<br />
                      "PETIT, Sophie";Groupe C
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
                
                <Box textAlign="center">
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleClickUploadButton}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> :''}
                    disabled={loading}
                    size="large"
                  >
                    {loading ? 'Traitement...' : <UploadFileIcon />}
                  </Button>
                </Box>
                
                {csvContent && !error && (
                  <Alert 
                    severity="success" 
                    icon={<CheckCircleIcon />}
                    variant="filled"
                    className="mt-4 animate-fadeIn"
                  >
                    Fichier <strong>{csvContent}</strong> chargé avec succès ! {students.length} étudiant(s) détecté(s).
                  </Alert>
                )}
              </div>
            )}
          </div>
        </Paper>
      )}

      {/* Liste des étudiants avec design amélioré */}
      {students.length > 0 && (
        <Paper className="p-6 rounded-lg mb-6 shadow-md border-t-4 border-amber-600">
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <div className="flex items-center gap-2">
              <PeopleAltIcon className="text-amber-600" fontSize="large" />
              <Typography variant="h5" className="font-bold">
                Liste des étudiants ({students.length})
              </Typography>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Tooltip title={!groupName.trim() ? "Veuillez remplir le nom du groupe" : ""}>
                <span>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleCreateCorrectionsGroup}
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : ''}
                    disabled={saving || !groupName.trim()}
                    fullWidth
                  >
                    {saving ? 'En cours ...' : <SaveIcon />}
                  </Button>
                </span>
              </Tooltip>
              
              <Button
                variant="contained"
                color="primary"
                onClick={handleShareAllCorrections}
                startIcon={sharingCorrections ? <CircularProgress size={20} color="inherit" /> : <ShareIcon />}
                disabled={sharingCorrections || !students.some(s => s.correctionId)}
                fullWidth
              >
                {sharingCorrections ? 'Partage...' : 'Partager tout'}
              </Button>
              
              <Button
                variant="outlined"
                color="secondary"
                onClick={generatePdfWithQRCodes}
                startIcon={generatingPdf ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdfIcon />}
                disabled={generatingPdf || !students.some(s => s.shareCode)}
                fullWidth
              >
                {generatingPdf ? 'Génération...' : 'PDF QR Code'}
              </Button>
            </div>
          </Box>

          {/* Tableau avec design amélioré */}
          <TableContainer className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <Table size="small">
              <TableHead className="bg-gradient-to-r from-gray-100 to-blue-50">
                <TableRow>
                  <TableCell width="40px"></TableCell>
                  <TableCell>Prénom / Nom</TableCell>
                  <TableCell align="center">Note exp. /{experimentalPoints}</TableCell>
                  <TableCell align="center">Note théo. /{theoreticalPoints}</TableCell>
                  <TableCell align="center">Total /20</TableCell>
                  <TableCell>Code correction</TableCell>
                  <TableCell>Lien de partage</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student, index) => (
                  <TableRow 
                    key={index}
                    className="hover:bg-blue-50/50 transition-colors"
                  >
                    <TableCell>
                      <IconButton
                        onClick={() => handleDeleteStudent(index)}
                        color="error"
                        size="small"
                        title="Supprimer cet étudiant"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={student.name}
                        onChange={(e) => handleStudentNameChange(index, e.target.value)}
                        variant="standard"
                        size="small"
                        fullWidth
                      />
                    </TableCell>
                    <TableCell align="center" className="px-2">
                      <Tooltip title={student.experimentalGrade || '0'} placement="top" arrow>
                        <div>
                          <Slider
                            value={parseFloat(student.experimentalGrade) || 0}
                            onChange={(_, newValue) => handleExperimentalGradeChange(index, newValue)}
                            step={0.5}
                            min={0}
                            max={experimentalPoints}
                            valueLabelDisplay="auto"
                            size="small"
                            className="mx-1"
                          />
                        </div>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center" className="px-2">
                      <Tooltip title={student.theoreticalGrade || '0'} placement="top" arrow>
                        <div>
                          <Slider
                            value={parseFloat(student.theoreticalGrade) || 0}
                            onChange={(_, newValue) => handleTheoreticalGradeChange(index, newValue)}
                            step={0.5}
                            min={0}
                            max={theoreticalPoints}
                            valueLabelDisplay="auto"
                            size="small"
                            className="mx-1"
                          />
                        </div>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center" className="font-medium">
                      <Chip 
                        label={calculateTotalGrade(student.experimentalGrade, student.theoreticalGrade)} 
                        color="primary" 
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {student.correctionId ? (
                        <Link 
                          href={`/corrections/${student.correctionId}`}
                          className="text-blue-600 hover:underline flex items-center"
                        >
                          <span className="truncate max-w-[80px] inline-block">{student.correctionId}</span>
                          <EditIcon fontSize="small" className="ml-1" />
                        </Link>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      {student.shareCode ? (
                        <Box display="flex" alignItems="center" gap={1}>
                          <Link 
                            href={`/feedback/${student.shareCode}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center"
                          >
                            <Typography variant="body2" className="truncate max-w-[50px] inline-block" title={student.shareCode}>
                              {student.shareCode}
                            </Typography>
                          </Link>
                          <IconButton 
                            size="small"
                            href={`/feedback/${student.shareCode}`}
                            target="_blank"
                            component={Link}
                            className="text-blue-600"
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                          </Box>
                      ) : student.correctionId ? (
                        <Button 
                          size="small" 
                          startIcon={<ShareIcon />} 
                          variant="outlined"
                          className="py-1"
                          onClick={() => handleShareCorrection(student.correctionId!, index)}
                        >
                          Partager
                        </Button>
                      ) : 'Ajoutez d\'abord une correction'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box mt={4} display="flex" gap={2} justifyContent="space-between">
            <div>
              <Button
                onClick={() => setStudents([])}
                color="error"
                variant="outlined"
                startIcon={<CloseIcon />}
                size="small"
              >
                Recommencer
              </Button>
            </div>
            <div>
              <Button
                onClick={handleCancel}
                color="inherit"
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                size="small"
              >
                Annuler
              </Button>
            </div>
          </Box>
        </Paper>
      )}
    </div>
  );
}
