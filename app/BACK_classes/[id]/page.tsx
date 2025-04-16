'use client';

import React from 'react';
import { ClassPage } from '@/components/classesId';


export default function Page({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params Promise using React.use()
  const unwrappedParams = React.use(params);
  const { id } = unwrappedParams;
  const classId = id;

  return <ClassPage id={classId} />;
}