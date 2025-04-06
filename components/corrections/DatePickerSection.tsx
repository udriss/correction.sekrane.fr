import React from 'react';
import { Box, Alert } from '@mui/material';
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
            slotProps={{ textField: { size: 'small' } }}
          />
        </Box>
        <Box>
          <DatePicker
            label="Date de rendu effective"
            value={submissionDate}
            onChange={handleSubmissionDateChange}
            slotProps={{ textField: { size: 'small' } }}
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
              {submissionDate.diff(deadlineDate, 'day') <= 1 ? (
                `Rendu en retard de ${submissionDate.diff(deadlineDate, 'day')} jour(s)`
              ) : (
                <>
                  Rendu en retard de {submissionDate.diff(deadlineDate, 'day')} jour(s)
                  <strong className="ml-2">
                    (Pénalité automatique de {Math.min(15, submissionDate.diff(deadlineDate, 'day') * 2)} points)
                  </strong>
                </>
              )}
            </Alert>
          </Box>
        )}
      </div>
    </>
  );
};

export default DatePickerSection;
