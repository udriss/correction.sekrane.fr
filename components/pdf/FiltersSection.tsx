import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Typography } from '@mui/material';
import { ExportPDFComponentProps } from './types';

type FiltersSectionProps = {
  filterActivity: number | 'all';
  setFilterActivity: (value: number | 'all') => void;
  filterSubClass: string | 'all';
  setFilterSubClass: (value: string | 'all') => void;
  uniqueSubClasses: { id: number | string; name: string }[];
  uniqueActivities: { id: number | string; name: string }[];
  classData: any;
  students?: ExportPDFComponentProps['students'];
  activities?: ExportPDFComponentProps['activities'];
};

const FiltersSection: React.FC<FiltersSectionProps> = ({
  filterActivity,
  setFilterActivity,
  filterSubClass,
  setFilterSubClass,
  uniqueSubClasses,
  uniqueActivities,
  classData
}) => {
  return (
    <>
      {classData?.nbre_subclasses && classData.nbre_subclasses > 0 && (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Groupe</InputLabel>
          <Select
            value={filterSubClass}
            onChange={(e) => setFilterSubClass(e.target.value as string)}
            label="Groupe"
          >
            <MenuItem value="all">Tous les groupes</MenuItem>
            {uniqueSubClasses.map(group => (
              <MenuItem key={group.id} value={group.id.toString()}>
                {group.name}
              </MenuItem>
            ))}
          </Select>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            Sélectionnez un groupe spécifique ou exportez pour tous les groupes
          </Typography>
        </FormControl>
      )}

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Activité</InputLabel>
        <Select
          value={filterActivity}
          onChange={(e) => setFilterActivity(e.target.value as number | 'all')}
          label="Activité"
        >
          <MenuItem value="all">Toutes les activités</MenuItem>
          {uniqueActivities.map(activity => (
            <MenuItem key={activity.id} value={activity.id}>
              {activity.name}
            </MenuItem>
          ))}
        </Select>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
          Sélectionnez une activité spécifique ou exportez pour toutes les activités
        </Typography>
      </FormControl>
    </>
  );
};

export default FiltersSection;