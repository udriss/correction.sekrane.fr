import React, { useState } from 'react';
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
  Chip
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CloseIcon from '@mui/icons-material/Close';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';

interface ExportOptions {
  includeId: boolean;
  includeClasses: boolean;
  includeSubClasses: boolean;
  includeCreatedAt: boolean;
  includeEmail: boolean;
}

interface StudentsCsvExportProps {
  onClose: () => void;
  onError: (message: string) => void;
  studentCount: number;
}

const StudentsCsvExport: React.FC<StudentsCsvExportProps> = ({
  onClose,
  onError,
  studentCount
}) => {
  const [exportLoading, setExportLoading] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeId: true,
    includeClasses: true,
    includeSubClasses: true,
    includeCreatedAt: false,
    includeEmail: true,
  });

  // Handle export options change
  const handleExportOptionChange = (option: keyof ExportOptions) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  // Export all students to CSV
  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      // Fetch all student data including class information
      const response = await fetch(`/api/students?includeClasses=true`);
      if (!response.ok) {
        throw new Error('Failed to fetch students data');
      }
      
      const allStudents = await response.json();
      
      // Prepare headers based on selected options
      const headers = ['first_name', 'last_name', 'gender', 'email'];
      
      if (exportOptions.includeId) {
        headers.unshift('id');
      }
      
      if (exportOptions.includeCreatedAt) {
        headers.push('created_at', 'updated_at');
      }
      
      if (exportOptions.includeClasses) {
        headers.push('classes');
        
        if (exportOptions.includeSubClasses) {
          headers.push('sub_classes');
        }
      }
      
      // Transform data for CSV
      const csvData = allStudents.map((student: any) => {
        const studentData: Record<string, any> = {
          first_name: student.first_name,
          last_name: student.last_name,
          gender: student.gender,
          email: student.email || '',
        };
        
        if (exportOptions.includeId) {
          studentData.id = student.id;
        }
        
        if (exportOptions.includeCreatedAt) {
          studentData.created_at = student.created_at || '';
          studentData.updated_at = student.updated_at || '';
        }
        
        if (exportOptions.includeClasses && student.allClasses) {
          // Join all class IDs with comma
          studentData.classes = student.allClasses.map((cls: any) => cls.classId).join(',');
          
          if (exportOptions.includeSubClasses) {
            // Format as classId:subClass,classId:subClass
            // Use underscore as separator for better compatibility
            studentData.sub_classes = student.allClasses
              .map((cls: any) => `${cls.classId}_${cls.sub_class || ''}`)
              .join(',');
          }
        } else if (exportOptions.includeClasses) {
          studentData.classes = student.classId || '';
          
          if (exportOptions.includeSubClasses) {
            // Use underscore as separator for better compatibility
            studentData.sub_classes = student.classId ? `${student.classId}_${student.sub_class || ''}` : '';
          }
        }
        
        return studentData;
      });
      
      // Generate CSV
      const csv = Papa.unparse({
        fields: headers,
        data: csvData
      });
      
      // Add UTF-8 BOM to ensure Excel and other applications recognize accented characters
      const BOM = "\uFEFF";
      const csvWithBOM = BOM + csv;
      
      // Save file with proper content type and charset
      const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, `students_export_${new Date().toISOString().slice(0, 10)}.csv`);
      
    } catch (error) {
      console.error('Export error:', error);
      onError('Failed to export students data');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom fontWeight="bold">
        Exporter les données étudiants
      </Typography>
      <Typography variant="body2" paragraph sx={{ color: 'text.secondary' }}>
        Téléchargez toutes les données étudiants au format CSV pour les utiliser dans un tableur ou pour l'import.
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Options d'exportation
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={exportOptions.includeId}
                      onChange={() => handleExportOptionChange('includeId')}
                      color="primary"
                    />
                  }
                  label="Inclure l'ID (pour import/update)"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={exportOptions.includeEmail}
                      onChange={() => handleExportOptionChange('includeEmail')}
                      color="primary"
                    />
                  }
                  label="Inclure les emails"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={exportOptions.includeClasses}
                      onChange={() => handleExportOptionChange('includeClasses')}
                      color="primary"
                    />
                  }
                  label="Inclure les classes"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={exportOptions.includeSubClasses}
                      onChange={() => handleExportOptionChange('includeSubClasses')}
                      disabled={!exportOptions.includeClasses}
                      color="primary"
                    />
                  }
                  label="Inclure les sous-classes"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={exportOptions.includeCreatedAt}
                      onChange={() => handleExportOptionChange('includeCreatedAt')}
                      color="primary"
                    />
                  }
                  label="Inclure les dates (création/modification)"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Format du fichier
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Le fichier CSV contiendra les colonnes suivantes :
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
                {exportOptions.includeId && <Chip size="small" label="id" sx={{ m: 0.5 }} />}
                <Chip size="small" label="first_name" sx={{ m: 0.5 }} />
                <Chip size="small" label="last_name" sx={{ m: 0.5 }} />
                <Chip size="small" label="gender" sx={{ m: 0.5 }} />
                {exportOptions.includeEmail && <Chip size="small" label="email" sx={{ m: 0.5 }} />}
                {exportOptions.includeClasses && <Chip size="small" label="classes" sx={{ m: 0.5 }} />}
                {exportOptions.includeClasses && exportOptions.includeSubClasses && 
                  <Chip size="small" label="sub_classes" sx={{ m: 0.5 }} />
                }
                {exportOptions.includeCreatedAt && <>
                  <Chip size="small" label="created_at" sx={{ m: 0.5 }} />
                  <Chip size="small" label="updated_at" sx={{ m: 0.5 }} />
                </>}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
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
          onClick={handleExportCSV}
          startIcon={exportLoading ? <CircularProgress size={20} /> : <FileDownloadIcon />}
          disabled={exportLoading}
          color="primary"
        >
          {exportLoading ? 'Exportation...' : `Exporter ${studentCount} étudiants`}
        </Button>
      </Box>
    </Box>
  );
};

export default StudentsCsvExport;