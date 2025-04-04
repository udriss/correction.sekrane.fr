'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

interface TopActivityData {
  activity_id: number;
  activity_name: string;
  correction_count: number;
  average_grade: number;
}

interface TopActivitiesChartProps {
  data: TopActivityData[];
}

const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57', '#ffc658'];

export default function TopActivitiesChart({ data }: TopActivitiesChartProps) {
  // Préparer les données pour le graphique et gérer les valeurs null/undefined
  const chartData = data.map(item => ({
    ...item,
    name: item.activity_name.length > 25 ? item.activity_name.substring(0, 25) + '...' : item.activity_name,
    // S'assurer que average_grade est un nombre valide
    average_grade: typeof item.average_grade === 'number' ? item.average_grade : 0
  }));

  const formatValue = (value: any): string => {
    // Vérifier si la valeur est un nombre valide
    if (value === undefined || value === null || isNaN(Number(value))) {
      return 'N/A';
    }
    return `${Number(value).toFixed(2)}/20`;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{
          top: 20,
          right: 90,
          left: 90,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" domain={[0, 20]} label={{ value: 'Note moyenne (/20)', position: 'insideBottom', offset: -5 }} />
        <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value, name) => {
            if (value === undefined || value === null) return ['Non évalué', 'Note moyenne'];
            return [`${Number(value).toFixed(2)}/20`, 'Note moyenne'];
          }}
          labelFormatter={(label) => `Activité: ${label}`}
        />
        <Bar dataKey="average_grade" barSize={20}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
          <LabelList 
            dataKey="average_grade" 
            position="right" 
            formatter={(value: any) => formatValue(value)} 
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
