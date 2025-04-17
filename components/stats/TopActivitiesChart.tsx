'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

interface TopActivityData {
  activity_id: number;
  activity_name: string;
  correction_count: number;
  average_grade?: number;
  average_percentage?: number;
  points?: number[];
  parts_names?: string[];
}

interface TopActivitiesChartProps {
  data: TopActivityData[];
}

const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57', '#ffc658'];

export default function TopActivitiesChart({ data }: TopActivitiesChartProps) {
  // Adapter les données pour compatibilité avec le nouveau format d'API
  const adaptedData = data.map(item => {
    // Si average_grade est déjà présent, l'utiliser
    if (item.average_grade !== undefined && item.average_grade !== null) {
      return item;
    }
    
    // Sinon, calculer average_grade à partir de average_percentage
    const avgGrade = item.average_percentage !== undefined 
      ? (item.average_percentage / 100) * 20 
      : 0;
      
    return {
      ...item,
      average_grade: avgGrade
    };
  });

  // Limiter aux 10 premières activités pour la lisibilité et formatter les données
  const displayData = adaptedData.slice(0, 10).map(item => ({
    ...item,
    name: item.activity_name.length > 20 ? item.activity_name.substring(0, 20) + '...' : item.activity_name,
    // S'assurer que average_grade est traité correctement
    average_grade: 
      (item.average_grade === null || item.average_grade === undefined || item.average_grade === 0) 
        ? null
        : (typeof item.average_grade === 'string' 
            ? parseFloat(item.average_grade) 
            : item.average_grade),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={displayData}
        layout="vertical"
        margin={{
          top: 20,
          right: 30,
          left: 120,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
        <XAxis type="number" domain={[0, 20]} />
        <YAxis 
          dataKey="name" 
          type="category" 
          width={120}
          tick={{ fontSize: 11 }}
        />
        <Tooltip 
          formatter={(value, name) => {
            if (value === undefined || value === null) {
              return ['- -', name];
            }
            if (name === 'Corrections') return [`${value}`, name];
            return [`${Number(value).toFixed(2)}/20`, name];
          }}
        />
        <Legend />
        <Bar dataKey="average_grade" name="Note moyenne" fill="#8884d8">
          <LabelList 
            dataKey="average_grade" 
            position="right" 
            formatter={(value: any) => value === null ? "- -" : `${Number(value).toFixed(1)}/20`}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
