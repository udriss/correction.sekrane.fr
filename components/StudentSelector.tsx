import React from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Student } from '@/lib/types';

interface StudentSelectorProps {
  students: Student[];
  value: number | null;
  onChange: (studentId: number | null) => void;
  disabled?: boolean;
  label?: string;
}

const StudentSelector: React.FC<StudentSelectorProps> = ({ 
  students, 
  value, 
  onChange, 
  disabled = false,
  label = "Étudiant" 
}) => {
  return (
    <FormControl fullWidth size="small" disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value || ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        label={label}
      >
        <MenuItem value="">
          <em>Aucun</em>
        </MenuItem>
        {students.map((student) => (
          <MenuItem key={student.id} value={student.id}>
            {student.first_name} {student.last_name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default StudentSelector;
