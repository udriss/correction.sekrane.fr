'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

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

export default function ClassComparisonChart({ data }: ClassComparisonChartProps) {
  // Limiter aux 10 premières classes pour la lisibilité et gérer les valeurs null/undefined
  const displayData = data.slice(0, 10).map(item => ({
    ...item,
    name: item.class_name.length > 20 ? item.class_name.substring(0, 20) + '...' : item.class_name,
    // S'assurer que average_grade est un nombre valide
    average_grade: typeof item.average_grade === 'number' ? item.average_grade : 0
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={displayData}
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
              return ['Non évalué', name];
            }
            if (name === 'Étudiants' || name === 'Corrections') return [`${value}`, name];
            return [`${Number(value).toFixed(2)}/20`, name];
          }}
        />
        <Legend />
        <Bar yAxisId="left" dataKey="average_grade" name="Note moyenne" fill="#8884d8" />
        <Bar yAxisId="right" dataKey="student_count" name="Étudiants" fill="#4CAF50" />
        <Bar yAxisId="right" dataKey="correction_count" name="Corrections" fill="#2196F3">
          <LabelList dataKey="correction_count" position="top" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
