import React, { useEffect, useState } from 'react';
import { Box, Alert, Typography, CircularProgress } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

interface DatePickerSectionProps {
  deadlineDate: dayjs.Dayjs | null;
  submissionDate: dayjs.Dayjs | null;
  handleDeadlineDateChange: (newDate: dayjs.Dayjs | null) => void;
  handleSubmissionDateChange: (newDate: dayjs.Dayjs | null) => void;
  saving?: boolean; // Indicateur de sauvegarde en cours (optionnel)
}

const DatePickerSection: React.FC<DatePickerSectionProps> = ({
  deadlineDate,
  submissionDate,
  handleDeadlineDateChange,
  handleSubmissionDateChange,
  saving = false, // Valeur par défaut à false si non fournie
}) => {
  // État local pour suivre si les dates ont été modifiées depuis le dernier rendu
  const [datesChanged, setDatesChanged] = useState(false);

  // Wrapper pour le changement de deadline qui marque les dates comme modifiées
  const onDeadlineChange = (newDate: dayjs.Dayjs | null) => {
    setDatesChanged(true);
    handleDeadlineDateChange(newDate);
  };

  // Wrapper pour le changement de date de rendu qui marque les dates comme modifiées
  const onSubmissionChange = (newDate: dayjs.Dayjs | null) => {
    setDatesChanged(true);
    handleSubmissionDateChange(newDate);
  };

  // Calculer le nombre de jours de retard (pour l'affichage uniquement)
  const daysLate = React.useMemo(() => {
    if (deadlineDate && submissionDate) {
      return submissionDate.diff(deadlineDate, 'day');
    }
    return 0;
  }, [deadlineDate, submissionDate]);

  return (
    <>
      <div className="flex flex-wrap justify-around gap-4 mb-2">
        <Box sx={{ position: 'relative' }}>
          <DatePicker
            label="Date limite de rendu"
            value={deadlineDate}
            onChange={onDeadlineChange}
            disabled={saving}
            slotProps={{ 
              textField: { 
                size: 'small',
                helperText: "Date d'échéance du travail",
                disabled: saving
              }
            }}
          />
          {saving && (
            <CircularProgress
              size={24}
              sx={{
                position: 'absolute',
                top: '50%',
                right: '-30px',
                marginTop: '-12px',
                marginLeft: '-12px',
              }}
            />
          )}
        </Box>
        <Box sx={{ position: 'relative' }}>
          <DatePicker
            label="Date de rendu effective"
            value={submissionDate}
            onChange={onSubmissionChange}
            disabled={saving}
            slotProps={{ 
              textField: { 
                size: 'small',
                helperText: "Date réelle de rendu par l'étudiant",
                disabled: saving
              }
            }}
          />
          {saving && (
            <CircularProgress
              size={24}
              sx={{
                position: 'absolute',
                top: '50%',
                right: '-30px',
                marginTop: '-12px',
                marginLeft: '-12px',
              }}
            />
          )}
        </Box>
      </div>
      <div className="flex justify-start items-center my-2 w-full">
        {/* Show message if submitted late */}
        {deadlineDate && submissionDate && submissionDate.isAfter(deadlineDate) && (
          <Box className="flex items-center">
            <Alert 
              severity={daysLate > 1 ? "error" : "warning"}
              sx={{ py: 0.5 }}
            >
              <div>
                {daysLate === 1 ? (
                  <Typography>
                    Rendu en retard de 1 jour (jour de grâce accordé, sans pénalité)
                  </Typography>
                ) : (
                  <>
                    Rendu en retard de {daysLate} jours
                    {daysLate > 1 && (
                      <Typography component="span" fontWeight="bold" sx={{ ml: 1 }}>
                        (Pénalité automatique de {Math.min(15, (daysLate - 1) * 2)} points)
                      </Typography>
                    )}
                  </>
                )}
              </div>
            </Alert>
          </Box>
        )}
        {saving && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
            Enregistrement des dates...
          </Typography>
        )}
      </div>
    </>
  );
};

export default DatePickerSection;
