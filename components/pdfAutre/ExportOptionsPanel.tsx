// ExportOptionsPanel.tsx - Panneau d'options pour l'export
import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Paper,
  Tabs,
  Tab,
  Box,
  Grid
} from '@mui/material';
import TableChartIcon from '@mui/icons-material/TableChart';
import ArrangementOptionsAutre from './ArrangementOptionsAutre';
import ExportFormatOptions from '@/components/pdfAutre/ExportFormatOptions';
import QRCodeExportOptions from '@/components/pdfAutre/QRCodeExportOptions';
import { 
  ArrangementType, 
  SubArrangementType, 
  ExportFormat, 
  ViewType
} from '@/components/pdfAutre/types';

interface Activity {
  id: number | string;
  name: string;
}

interface ExportOptionsPanelProps {
  activeTab: number;
  handleTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  filterActivity: number[] | 'all';
  setFilterActivity: (value: number[] | 'all') => void;
  uniqueActivities: Activity[];
  arrangement: ArrangementType;
  setArrangement: (value: ArrangementType) => void;
  subArrangement: SubArrangementType;
  setSubArrangement: (value: SubArrangementType) => void;
  viewType: ViewType;
  setViewType: (value: ViewType) => void;
  exportFormat: ExportFormat;
  setExportFormat: (value: ExportFormat) => void;
  includeAllStudents: boolean;
  setIncludeAllStudents: (value: boolean) => void;
  handleExport: () => Promise<void>;
  disabled: boolean;
  availableSubArrangements: SubArrangementType[];
}

const ExportOptionsPanel: React.FC<ExportOptionsPanelProps> = ({
  activeTab,
  handleTabChange,
  filterActivity,
  setFilterActivity,
  uniqueActivities,
  arrangement,
  setArrangement,
  subArrangement,
  setSubArrangement,
  viewType,
  setViewType,
  exportFormat,
  setExportFormat,
  includeAllStudents,
  setIncludeAllStudents,
  handleExport,
  disabled,
  availableSubArrangements
}) => {
  return (
    <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="QR Codes" icon={<TableChartIcon />} />
          <Tab label="Notes" icon={<TableChartIcon />} />
        </Tabs>
      </Box>
      
      <Box sx={{ mt: 3 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Activité(s)</InputLabel>
          <Select
            multiple
            value={filterActivity === 'all' ? [] : filterActivity}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length === 0) {
                setFilterActivity('all');
              } else {
                setFilterActivity(value as number[]);
              }
            }}
            label="Activité(s)"
            renderValue={(selected) => {
              if (filterActivity === 'all' || (Array.isArray(selected) && selected.length === 0)) {
                return 'Toutes les activités';
              }
              return uniqueActivities
                .filter((a) => (selected as (number | string)[]).includes(a.id))
                .map((a) => a.name)
                .join(', ');
            }}
          >
            <MenuItem value="all" onClick={() => setFilterActivity('all')}>Toutes les activités</MenuItem>
            {uniqueActivities.map((activity: Activity) => (
              <MenuItem key={activity.id} value={activity.id}>
                <Checkbox checked={filterActivity === 'all' ? false : (filterActivity as number[]).includes(activity.id as number)} />
                {activity.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Checkbox
              checked={includeAllStudents}
              onChange={(e) => setIncludeAllStudents(e.target.checked)}
            />
          }
          label="Inclure tous les étudiants"
        />

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {/* Arrangement Options - Visible pour les deux onglets */}
          <Grid size={{ xs: 12, }}>
            <ArrangementOptionsAutre
              arrangement={arrangement}
              setArrangement={setArrangement}
              subArrangement={subArrangement}
              setSubArrangement={setSubArrangement}
              viewType={viewType}
              setViewType={setViewType}
              availableSubArrangements={availableSubArrangements}
            />
          </Grid>
          
          <Grid size={{ xs: 12, }}>
            {activeTab === 0 ? (
              <QRCodeExportOptions
                onExport={handleExport}
                disabled={disabled}
              />
            ) : (
              <ExportFormatOptions
                exportFormat={exportFormat}
                setExportFormat={setExportFormat}
                onExport={handleExport}
                disabled={disabled}
              />
            )}
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default ExportOptionsPanel;