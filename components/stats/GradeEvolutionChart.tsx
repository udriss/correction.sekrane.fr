'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar, BarChart, Label } from 'recharts';

interface GradeData {
  month: string;
  correction_count: number;
  average_grade: number;
}

interface GradeEvolutionChartProps {
  data: GradeData[];
}

export default function GradeEvolutionChart({ data }: GradeEvolutionChartProps) {
  // Formater les données pour afficher correctement les mois et gérer les valeurs nulles
  const displayData = data.map(item => {
    // Formater le mois pour un affichage plus lisible
    const [year, month] = item.month.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1);
    const monthName = new Intl.DateTimeFormat('fr', { month: 'short' }).format(dateObj);
    
    return {
      ...item,
      name: `${monthName} ${year}`,
      // Assurer que average_grade est correctement traitée
      average_grade: 
        (item.average_grade === null || item.average_grade === undefined || item.average_grade === 0) 
          ? null 
          : (typeof item.average_grade === 'string' 
              ? parseFloat(item.average_grade) 
              : item.average_grade),
    };
  });

  // Combiner les graphiques de tendance de notes et de nombre de corrections
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={displayData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 30,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="name" 
          angle={-45} 
          textAnchor="end" 
          height={70}
          tick={{ fontSize: 10 }}
        />
        <YAxis yAxisId="left" 
          domain={[0, 20]} 
          tickCount={5}
          label={{ value: 'Note moyenne (/20)', angle: -90, position: 'insideLeft' }}
        />
        <YAxis 
          yAxisId="right" 
          orientation="right"
          label={{ value: 'Nombre de corrections', angle: 90, position: 'insideRight' }}
        />
        <Tooltip 
          formatter={(value, name) => {
            if (value === undefined || value === null) {
              return ['- -', name];
            }
            if (name === 'Nombre de corrections') return [`${value}`, name];
            return [`${Number(value).toFixed(2)}/20`, name];
          }}
        />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="average_grade"
          name="Note moyenne"
          stroke="#8884d8"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
          connectNulls={true}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="correction_count"
          name="Nombre de corrections"
          stroke="#82ca9d"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
