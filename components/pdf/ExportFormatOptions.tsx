import React from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  FormControl, 
  RadioGroup, 
  FormControlLabel, 
  Radio, 
  Button
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { ExportFormat } from './types';

interface ExportFormatOptionsProps {
  exportFormat: ExportFormat;
  setExportFormat: (value: ExportFormat) => void;
  onExport: () => void;
  disabled: boolean;
}

const ExportFormatOptions: React.FC<ExportFormatOptionsProps> = ({
  exportFormat,
  setExportFormat,
  onExport,
  disabled
}) => {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        Format d'export
      </Typography>
      
      <FormControl component="fieldset" sx={{ mb: 3 }}>
        <RadioGroup
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
        >
          <FormControlLabel 
            value="pdf" 
            control={<Radio />} 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SaveIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                PDF (document portable)
              </Box>
            } 
          />
          <FormControlLabel 
            value="xlsx" 
            control={<Radio />} 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FileDownloadIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                Excel (XLSX)
              </Box>
            } 
          />
          <FormControlLabel 
            value="csv" 
            control={<Radio />} 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FileDownloadIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                CSV (compatible Excel)
              </Box>
            } 
          />
        </RadioGroup>
      </FormControl>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Button
          variant="contained"
          startIcon={exportFormat === 'pdf' ? <SaveIcon /> : <FileDownloadIcon />}
          disabled={disabled}
          onClick={onExport}
          size="large"
          color="primary"
          sx={{ px: 4 }}
        >
          {exportFormat === 'pdf' 
            ? 'Générer PDF' 
            : exportFormat === 'xlsx'
              ? 'Exporter en Excel'
              : 'Exporter en CSV'
          }
        </Button>
      </Box>
    </Paper>
  );
};

export default ExportFormatOptions;