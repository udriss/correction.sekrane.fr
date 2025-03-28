'use client';

import React, { useState, useEffect } from 'react';
import { Container, Alert } from '@mui/material';
import LoadingSpinner from '@/components/LoadingSpinner';
import StudentsHeader from '@/components/students/StudentsHeader';
import StudentsTutorial from '@/components/students/StudentsTutorial';
import AllStudentsManager from '@/components/students/AllStudentsManager';

export interface Class {
  id: number;
  name: string;
  year: string;
}

export interface Student {
  id?: number;
  first_name: string;
  last_name: string;
  email: string;
  gender?: 'M' | 'F' | 'N';
  classId?: number | null;
  group?: string;
  // Added properties from enhancement
  className?: string;
  corrections_count?: number;
  additionalClasses?: {id: number, name: string}[];
}

// Additional types for student statistics
export interface StudentStats {
  total_corrections: number;
  average_grade: number | null;
  highest_grade: number | null;
  lowest_grade: number | null;
  total_experimental_points: number;
  total_theoretical_points: number;
  average_experimental_points: number;
  average_theoretical_points: number;
  recent_corrections: {
    id: number;
    activity_name: string;
    grade: number;
    submission_date: string;
  }[];
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // Fonction pour charger les données
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Récupérer les étudiants
      const studentsResponse = await fetch('/api/students');
      if (!studentsResponse.ok) {
        throw new Error('Erreur lors du chargement des étudiants');
      }
      const studentsData = await studentsResponse.json();
      
      // Récupérer toutes les classes en un seul appel
      const classesResponse = await fetch('/api/classes');
      if (!classesResponse.ok) {
        throw new Error('Erreur lors du chargement des classes');
      }
      const classesData = await classesResponse.json();
      setClasses(classesData);
      
      // Récupérer toutes les affectations étudiant-classe en un seul appel
      const studentClassesResponse = await fetch('/api/students/classes');
      if (!studentClassesResponse.ok) {
        throw new Error('Erreur lors du chargement des affectations des classes');
      }
      const studentClassesData = await studentClassesResponse.json();
      
      // Récupérer toutes les statistiques des étudiants en un seul appel
      const statsResponse = await fetch('/api/students/stats');
      if (!statsResponse.ok) {
        throw new Error('Erreur lors du chargement des statistiques');
      }
      const statsData = await statsResponse.json();
      
      // Organiser les données de classe par étudiant pour un accès plus facile
      const studentClassesMap: Record<number, { id: number, name: string }[]> = {};
      studentClassesData.forEach((item: { student_id: number, class_id: number, class_name: string }) => {
        if (!studentClassesMap[item.student_id]) {
          studentClassesMap[item.student_id] = [];
        }
        studentClassesMap[item.student_id].push({ 
          id: item.class_id, 
          name: item.class_name 
        });
      });
      
      // Organiser les statistiques par étudiant
      const statsMap: Record<number, { total_corrections: number, average_score: number }> = {};
      statsData.forEach((item: { student_id: number, total_corrections: number, average_score: number }) => {
        statsMap[item.student_id] = {
          total_corrections: item.total_corrections,
          average_score: item.average_score
        };
      });
      
      // Construire les enhanced students avec toutes les données
      const enhancedStudents = studentsData.map((student: Student) => {
        const studentClasses = studentClassesMap[student.id!] || [];
        const stats = statsMap[student.id!] || { total_corrections: 0, average_score: 0 };
        
        // Trouver la classe principale (celle qui correspond à classId)
        const primaryClass = student.classId ? 
          classesData.find((c: Class) => c.id === student.classId) : 
          null;
        
        // Filtrer les classes additionnelles (exclure la classe principale)
        const additionalClasses = studentClasses
          .filter(cls => cls.id !== student.classId)
          .map(cls => ({ id: cls.id, name: cls.name }));
        
        return {
          ...student,
          className: primaryClass ? primaryClass.name : 'Non assigné',
          corrections_count: stats.total_corrections,
          additionalClasses: additionalClasses
        };
      });
      
      // Dédupliquer les étudiants par ID au cas où
      const uniqueStudentsMap = new Map<number, Student>();
      enhancedStudents.forEach((student: Student) => {
        if (student.id) {
          uniqueStudentsMap.set(student.id, student);
        }
      });
      
      setStudents(Array.from(uniqueStudentsMap.values()));
      
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour forcer le rafraîchissement des données
  const handleDataUpdate = () => {
    setLastUpdate(Date.now());
  };

  // Chargement initial et rafraichissement après modification
  useEffect(() => {
    fetchData();
    
    // Vérifier si c'est la première visite pour montrer le tutoriel
    const hasSeenTutorial = localStorage.getItem('hasSeenStudentTutorial');
    // if (!hasSeenTutorial) {
    //   setShowTutorial(true);
    //   localStorage.setItem('hasSeenStudentTutorial', 'true');
   // }
   setShowTutorial(true);
  }, [lastUpdate]); // Utiliser lastUpdate pour déclencher le rechargement

  // Stats pour l'en-tête
  const totalStudents = students.length;
  const totalWithCorrections = students.filter(s => s.corrections_count && s.corrections_count > 0).length;
  const uniqueClasses = new Set(students.map(s => s.classId).filter(Boolean)).size;

  if (loading && students.length === 0) {
    return (
      <div className="container max-w-[400px] mx-auto px-4 py-8 flex justify-center">
        <LoadingSpinner size="lg" text="Chargement des étudiants" />
      </div>
    );
  }

  return (
    <Container maxWidth="lg" className="py-8">
      {/* En-tête */}
      <StudentsHeader
        totalStudents={totalStudents}
        uniqueClasses={uniqueClasses}
        totalWithCorrections={totalWithCorrections}
        onShowTutorial={() => setShowTutorial(!showTutorial)}
      />

      {error && (
        <Alert severity="error" className="mb-6" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Tutoriel */}
      <StudentsTutorial 
        show={showTutorial} 
        onClose={() => setShowTutorial(false)} 
      />

      {/* Gestionnaire des étudiants */}
      <AllStudentsManager
        students={students}
        classes={classes}
        loading={loading}
        onStudentUpdate={handleDataUpdate}
        onError={setError}
      />
    </Container>
  );
}
