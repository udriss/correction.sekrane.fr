'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { FormControl, InputLabel, Select, MenuItem, Box, Chip, SelectChangeEvent, Typography, OutlinedInput } from '@mui/material';

interface ClassData {
  class_id: number;
  class_name: string;
  correction_count: number;
  student_count: number;
  average_grade: number;
}

interface ClassComparisonChartProps {
  data: ClassData[];
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export default function ClassComparisonChart({ data }: ClassComparisonChartProps) {
  // État pour gérer les classes sélectionnées
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Effet pour initialiser toutes les classes comme sélectionnées au chargement initial
  useEffect(() => {
    if (data && data.length > 0) {
      // Par défaut, on sélectionne toutes les classes, jusqu'à un maximum de 10
      const initialSelection = data.slice(0, 10).map(item => item.class_id.toString());
      setSelectedClasses(initialSelection);
    }
  }, [data]);

  // Mise à jour des données du graphique lorsque les classes sélectionnées changent
  useEffect(() => {
    if (data && selectedClasses.length > 0) {
      const filteredData = data
        .filter(item => selectedClasses.includes(item.class_id.toString()))
        .map(item => ({
          ...item,
          name: item.class_name.length > 20 ? item.class_name.substring(0, 20) + '...' : item.class_name,
          // S'assurer que average_grade est traité correctement
          average_grade: 
            (item.average_grade === null || item.average_grade === undefined || item.average_grade === 0) 
              ? null
              : (typeof item.average_grade === 'string' 
                  ? parseFloat(item.average_grade) 
                  : item.average_grade),
        }));
      
      setChartData(filteredData);
    } else {
      setChartData([]);
    }
  }, [data, selectedClasses]);

  // Gestion du changement des classes sélectionnées
  const handleClassChange = (event: SelectChangeEvent<typeof selectedClasses>) => {
    const { target: { value } } = event;
    // On cast en tableau de string (MenuItem peut retourner une string ou un tableau)
    setSelectedClasses(typeof value === 'string' ? value.split(',') : value);
  };

  return (
    <>
      {/* Sélecteur de classes */}
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel id="class-select-label">Classes à afficher</InputLabel>
          <Select
            labelId="class-select-label"
            id="class-select"
            multiple
            value={selectedClasses}
            onChange={handleClassChange}
            input={<OutlinedInput label="Classes à afficher" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((classId) => {
                  const classItem = data.find(c => c.class_id.toString() === classId);
                  return (
                    <Chip 
                      key={classId} 
                      label={classItem?.class_name || classId}
                      size="small"
                    />
                  );
                })}
              </Box>
            )}
            MenuProps={MenuProps}
          >
            {data.map((classItem) => (
              <MenuItem 
                key={classItem.class_id} 
                value={classItem.class_id.toString()}
              >
                <Typography noWrap>
                  {classItem.class_name} ({classItem.student_count} étudiant{classItem.student_count > 1 ? 's' : ''})
                </Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Message si aucune classe n'est sélectionnée */}
      {selectedClasses.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Typography variant="subtitle1" color="text.secondary">
            Veuillez sélectionner au moins une classe pour afficher le graphique
          </Typography>
        </Box>
      )}

      {/* Graphique */}
      {selectedClasses.length > 0 && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 70,
            }}
            barGap={0}
            barSize={25}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              tick={{ fontSize: 10 }}
              height={70}
            />
            <YAxis yAxisId="left" orientation="left" label={{ value: 'Note (/20)', angle: -90, position: 'insideLeft' }} domain={[0, 20]} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'Nombre', angle: 90, position: 'insideRight' }} />
            <Tooltip 
              formatter={(value, name) => {
                if (value === undefined || value === null) {
                  return ['- -', name];
                }
                if (name === 'Étudiants' || name === 'Corrections') return [`${value}`, name];
                return [`${Number(value).toFixed(2)}/20`, name];
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="average_grade" name="Note moyenne" fill="#8884d8">
              <LabelList 
                dataKey="average_grade" 
                position="top" 
                formatter={(value: any) => value === null ? "- -" : Number(value).toFixed(1)}
              />
            </Bar>
            <Bar yAxisId="right" dataKey="student_count" name="Étudiants" fill="#4CAF50" />
            <Bar yAxisId="right" dataKey="correction_count" name="Corrections" fill="#2196F3">
              <LabelList dataKey="correction_count" position="top" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </>
  );
}
