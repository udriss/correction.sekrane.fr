import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CorrectionAutreEnriched, ActivityAutre, Student } from '@/lib/types';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  section: {
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    fontSize: 14,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
    fontSize: 12,
  },
  label: {
    width: 120,
    fontWeight: 'bold',
  },
  value: {
    flex: 1,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginVertical: 10,
  },
  correctionHeader: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginBottom: 10,
  },
  pointsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 5,
  },
  pointChip: {
    backgroundColor: '#e0e0e0',
    padding: '3 6',
    borderRadius: 3,
    fontSize: 10,
  },
});

interface CorrectionAutrePDFDocumentProps {
  corrections: CorrectionAutreEnriched[];
  getActivityById: (id: number) => ActivityAutre | undefined;
  getStudentById: (id: number | null) => Student | undefined;
}

export default function CorrectionAutrePDFDocument({
  corrections,
  getActivityById,
  getStudentById,
}: CorrectionAutrePDFDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>
          Récapitulatif des corrections
        </Text>

        {corrections.map((correction, index) => {
          const activity = getActivityById(correction.activity_id);
          const student = getStudentById(correction.student_id);

          return (
            <View key={correction.id} wrap={false}>
              <View style={styles.correctionHeader}>
                <Text style={styles.header}>
                  Correction #{correction.id} - Note: {correction.grade?.toFixed(2)}/20
                </Text>
              </View>

              <View style={styles.section}>
                <View style={styles.row}>
                  <Text style={styles.label}>Activité:</Text>
                  <Text style={styles.value}>{activity?.name || 'Inconnue'}</Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>Étudiant:</Text>
                  <Text style={styles.value}>
                    {student ? `${student.last_name} ${student.first_name}` : 'Inconnu'}
                  </Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>Date:</Text>
                  <Text style={styles.value}>
                    {correction.submission_date
                      ? format(new Date(correction.submission_date), 'PP', { locale: fr })
                      : 'Non spécifiée'}
                  </Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>Points par partie:</Text>
                  <View style={styles.pointsContainer}>
                    {correction.points_earned.map((points, i) => (
                      <Text key={i} style={styles.pointChip}>
                        P{i + 1}: {points}
                      </Text>
                    ))}
                  </View>
                </View>

                {correction.content && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Commentaire:</Text>
                    <Text style={styles.value}>{correction.content}</Text>
                  </View>
                )}
              </View>

              {index < corrections.length - 1 && <View style={styles.divider} />}
            </View>
          );
        })}
      </Page>
    </Document>
  );
}