import React from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Button,
  Card,
  CardContent,
  CardMedia,
  CardActionArea
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import QrCodeIcon from '@mui/icons-material/QrCode';

interface QRCodeExportOptionsProps {
  onExport: () => void;
  disabled: boolean;
}

const QRCodeExportOptions: React.FC<QRCodeExportOptionsProps> = ({
  onExport,
  disabled
}) => {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        Format d'export QR Code
      </Typography>
      
      <Card 
        variant="outlined" 
        sx={{ 
          mb: 2, 
          border: '2px solid #3f51b5',
          borderRadius: 2,
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}
      >
        <CardActionArea onClick={disabled ? undefined : onExport}>
          <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
            <CardMedia
              sx={{ 
                width: 80, 
                height: 80, 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                backgroundColor: '#f0f4ff',
                borderRadius: 2,
                mr: 2
              }}
            >
              <QrCodeIcon sx={{ fontSize: 50, color: '#3f51b5' }} />
            </CardMedia>
            <CardContent sx={{ flex: '1 0 auto', p: 1 }}>
              <Typography component="div" variant="h6">
                PDF avec QR Codes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Document contenant les QR codes pour accéder aux corrections
              </Typography>
            </CardContent>
            <PictureAsPdfIcon sx={{ fontSize: 40, color: '#f44336', mr: 2 }} />
          </Box>
        </CardActionArea>
      </Card>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Button
          variant="contained"
          startIcon={<QrCodeIcon />}
          disabled={disabled}
          onClick={onExport}
          size="large"
          color="primary"
          sx={{ 
            px: 4,
            backgroundColor: '#3f51b5',
            '&:hover': {
              backgroundColor: '#303f9f',
            },
          }}
        >
          Générer PDF avec QR Codes
        </Button>
      </Box>
      <Typography variant="caption" align="center" color="text.secondary" display="block" sx={{ mt: 1 }}>
        PDF permettant l'accès rapide aux corrections par QR code
      </Typography>
    </Paper>
  );
};

export default QRCodeExportOptions;