import React from 'react';
import { Grid } from '@mui/material';
import { CorrectionAutreEnriched, ActivityAutre } from '@/lib/types';
import CorrectionCard from '@/components/allCorrections/CorrectionCard';

interface CorrectionCardViewProps {
  corrections: CorrectionAutreEnriched[];
  getActivityById: (id: number) => ActivityAutre | undefined;
  getStudentFullName: (id: number | null) => string;
  onDelete: (correction: CorrectionAutreEnriched) => Promise<void>;
  onUpdate: (correction: CorrectionAutreEnriched, updates: any) => Promise<void>;
  onToggleStatus: (correctionId: number, status: string) => Promise<void>;
}

export default function CorrectionCardView({
  corrections,
  getActivityById,
  getStudentFullName,
  onDelete,
  onUpdate,
  onToggleStatus
}: CorrectionCardViewProps) {
  return (
    <Grid container spacing={2}>
      {corrections.map((correction) => {
        const activity = getActivityById(correction.activity_id);
        // Préparer les données pour la carte de correction
        const correctionData = {
          ...correction,
          activity_name: activity?.name || 'Activité inconnue',
          student_name: getStudentFullName(correction.student_id),
          points: activity?.points || [],
          activity_points: activity?.points || [],
          activity_parts_names: activity?.parts_names || []
        };

        return (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={correction.id}>
            <></>
          </Grid>
        );
      })}
    </Grid>
  );
}