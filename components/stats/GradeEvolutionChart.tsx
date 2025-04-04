'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart, Bar } from 'recharts';

interface GradeEvolutionData {
  month: string;
  correction_count: number;
  average_grade: number;
}

interface GradeEvolutionChartProps {
  data: GradeEvolutionData[];
}

export default function GradeEvolutionChart({ data }: GradeEvolutionChartProps) {
  // Formater les mois pour affichage et gérer les valeurs null/undefined
  const formattedData = data.map(item => {
    const [year, month] = item.month.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return {
      ...item,
      // S'assurer que average_grade est un nombre valide
      average_grade: typeof item.average_grade === 'number' ? item.average_grade : 0,
      monthDisplay: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
    };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={formattedData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 20,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="monthDisplay" />
        <YAxis 
          yAxisId="left" 
          orientation="left"
          domain={[0, 20]}
          label={{ value: 'Note moyenne', angle: -90, position: 'insideLeft' }}
        />
        <YAxis 
          yAxisId="right" 
          orientation="right" 
          label={{ value: 'Nombre de corrections', angle: 90, position: 'insideRight' }}
        />
        <Tooltip 
          formatter={(value, name) => {
            if (value === undefined || value === null) {
              return ['Non évalué', name];
            }
            if (name === 'Nombre de corrections') return [value, name];
            return [`${Number(value).toFixed(2)}/20`, name];
          }}
          labelFormatter={(label) => `Période: ${label}`}
        />
        <Legend verticalAlign="top" height={36} />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="average_grade"
          name="Note moyenne"
          stroke="#8884d8"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Bar
          yAxisId="right"
          dataKey="correction_count"
          name="Nombre de corrections"
          fill="#82ca9d"
          opacity={0.6}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
