import React from 'react';
import { Box, Alert, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

interface DatePickerSectionProps {
  deadlineDate: dayjs.Dayjs | null;
  submissionDate: dayjs.Dayjs | null;
  handleDeadlineDateChange: (newDate: dayjs.Dayjs | null) => void;
  handleSubmissionDateChange: (newDate: dayjs.Dayjs | null) => void;
}

const DatePickerSection: React.FC<DatePickerSectionProps> = ({
  deadlineDate,
  submissionDate,
  handleDeadlineDateChange,
  handleSubmissionDateChange,
}) => {
  return (
    <>
      <div className="flex flex-wrap justify-around gap-4 mb-2">
        <Box>
          <DatePicker
            label="Date limite de rendu"
            value={deadlineDate}
            onChange={handleDeadlineDateChange}
            slotProps={{ 
              textField: { 
                size: 'small',
                helperText: "Date d'échéance du travail" 
              }
            }}
          />
        </Box>
        <Box>
          <DatePicker
            label="Date de rendu effective"
            value={submissionDate}
            onChange={handleSubmissionDateChange}
            slotProps={{ 
              textField: { 
                size: 'small',
                helperText: "Date réelle de rendu par l'étudiant" 
              }
            }}
          />
        </Box>
      </div>
      <div className="flex justify-start items-center my-2 w-full">
        {/* Show message if submitted late */}
        {deadlineDate && submissionDate && submissionDate.isAfter(deadlineDate) && (
          <Box className="flex items-center">
            <Alert 
              severity={submissionDate.diff(deadlineDate, 'day') > 1 ? "error" : "warning"}
              sx={{ py: 0.5 }}
            >
              <div>
                {submissionDate.diff(deadlineDate, 'day') === 1 ? (
                  <Typography>
                    Rendu en retard de 1 jour (jour de grâce accordé, sans pénalité)
                  </Typography>
                ) : (
                  <>
                    Rendu en retard de {submissionDate.diff(deadlineDate, 'day')} jours
                    {submissionDate.diff(deadlineDate, 'day') > 1 && (
                      <Typography component="span" fontWeight="bold" sx={{ ml: 1 }}>
                        (Pénalité automatique de {Math.min(15, (submissionDate.diff(deadlineDate, 'day') - 1) * 2)} points)
                      </Typography>
                    )}
                  </>
                )}
              </div>
            </Alert>
          </Box>
        )}
      </div>
    </>
  );
};

export default DatePickerSection;
