import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { CorrectionAutreEnriched, Class } from '@/lib/types';


import AssociateActivitiesModal, { Activity  } from "@/components/classes/AssociateActivitiesModal";

interface CorrectionListProps {
  corrections: CorrectionAutreEnriched[];
  activities: Activity[];
  classData: Class;
  viewMode: 'card' | 'table';
  groupBy: 'none' | 'activity' | 'student';
  getActivityById: (id: number) => Activity | undefined;
  getStudentFullName: (id: number | null) => string;
  onDeleteCorrection: (correction: CorrectionAutreEnriched) => Promise<void>;
  onUpdateCorrection: (correction: CorrectionAutreEnriched, updates: any) => Promise<void>;
  onToggleStatus: (correctionId: number, status: string) => Promise<void>;
}

export function CorrectionList({
  corrections,
  activities,
  classData,
  viewMode,
  groupBy,
  getActivityById,
  getStudentFullName,
  onDeleteCorrection,
  onUpdateCorrection,
  onToggleStatus
}: CorrectionListProps) {
  // Group corrections according to the groupBy setting
  const groupedCorrections = React.useMemo(() => {
    if (groupBy === 'none') return { ungrouped: corrections };
    
    if (groupBy === 'activity') {
      return corrections.reduce((acc, correction) => {
        const key = correction.activity_id;
        if (!acc[key]) acc[key] = [];
        acc[key].push(correction);
        return acc;
      }, {} as Record<string | number, CorrectionAutreEnriched[]>);
    }
    
    if (groupBy === 'student') {
      return corrections.reduce((acc, correction) => {
        const key = getStudentFullName(correction.student_id);
        if (!acc[key]) acc[key] = [];
        acc[key].push(correction);
        return acc;
      }, {} as Record<string, CorrectionAutreEnriched[]>);
    }
    
    return { ungrouped: corrections };
  }, [corrections, groupBy, getStudentFullName]);

  const renderGroup = (items: CorrectionAutreEnriched[]) => {
    return viewMode === 'card' ? (
      <></>
    ) : (
      <></>
    );
  };

  if (corrections.length === 0) {
    return (
      <Paper className="p-8 text-center">
        <Typography variant="h6" className="mb-2">Aucune correction</Typography>
        <Typography variant="body2" sx={{mb: 2, color: 'text.secondary'}}>
          {activities.length > 0 
            ? 'Ajoutez des corrections pour les activités de cette classe'
            : 'Associez d\'abord des activités à cette classe pour pouvoir ajouter des corrections'}
        </Typography>
      </Paper>
    );
  }

  return (
    <div>
      {groupBy === 'none' ? (
        renderGroup(groupedCorrections.ungrouped)
      ) : (
        Object.entries(groupedCorrections).map(([key, items]) => (
          <Box key={key} sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              {key}
              <Typography component="span" variant="body2" sx={{ ml: 2 }}>
                ({items.length} correction{items.length > 1 ? 's' : ''})
              </Typography>
            </Typography>
            {renderGroup(items)}
          </Box>
        ))
      )}
    </div>
  );
}