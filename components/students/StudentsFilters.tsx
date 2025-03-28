import React from 'react';
import Link from 'next/link';
import {
  Paper,
  Box,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Tabs,
  Tab,
  SelectChangeEvent
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { Class } from '@/app/students/page';

interface StudentsFiltersProps {
  searchTerm: string;
  filterTab: number;
  filterClass: number | 'all';
  classes: Class[];
  onSearchChange: (value: string) => void;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  onClassFilterChange: (event: SelectChangeEvent<number | 'all'>) => void;
}

const StudentsFilters: React.FC<StudentsFiltersProps> = ({
  searchTerm,
  filterTab,
  filterClass,
  classes,
  onSearchChange,
  onTabChange,
  onClassFilterChange
}) => {
  return (
    <Paper className="mb-6 p-4" elevation={1}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 2, mb: 2 }}>
        <TextField
          placeholder="Rechercher un étudiant..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ flexGrow: 1, maxWidth: 500 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Classe</InputLabel>
          <Select
            value={filterClass}
            onChange={onClassFilterChange}
            label="Classe"
          >
            <MenuItem value="all">Toutes les classes</MenuItem>
            {classes.map((cls) => (
              <MenuItem key={cls.id} value={cls.id}>{cls.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Button
          variant="outlined"
          color="primary"
          startIcon={<PersonAddIcon />}
          component={Link}
          href="/students/new"
        >
          Plus d'étudiants
        </Button>
      </Box>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={filterTab} onChange={onTabChange}>
          <Tab label="Tous" />
          <Tab label="Avec corrections" />
          <Tab label="Sans correction" />
        </Tabs>
      </Box>
    </Paper>
  );
};

export default StudentsFilters;
