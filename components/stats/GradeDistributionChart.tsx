'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface GradeDistributionData {
  grade_range: string;
  count: number;
}

interface GradeDistributionChartProps {
  data: GradeDistributionData[];
}

const COLORS = [
  '#FF6B6B', // Rouge pour les notes basses
  '#FFD166', // Jaune pour les notes moyennes-basses
  '#F8CB2E', // Jaune-orangé
  '#06D6A0', // Vert clair
  '#1B9AAA', // Bleu-vert
  '#118AB2', // Bleu
  '#073B4C', // Bleu foncé pour les meilleures notes
];

export default function GradeDistributionChart({ data }: GradeDistributionChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="grade_range" />
        <YAxis />
        <Tooltip
          formatter={(value, name) => [`${value} corrections`, 'Nombre']}
          labelFormatter={(label) => `Notes entre ${label}`}
        />
        <Bar dataKey="count" name="Nombre d'étudiants">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
