// Service de traitement des données pour ExportPDFComponentAllCorrectionsAutres
import { 
  ArrangementType, 
  SubArrangementType,
  createEmptyCorrectionAutre
} from './types';

import { Student, CorrectionAutreEnriched, ActivityAutre } from '@/lib/types';

interface OrganizeAllCorrectionsDataParams {
  corrections: CorrectionAutreEnriched[];
  includeAllStudents: boolean;
  filterActivity: number | 'all';
  arrangement: ArrangementType;
  subArrangement: SubArrangementType;
  uniqueActivities: { id: number | string; name: string }[];
  students: Student[];
  getActivityById: (activityId: number) => ActivityAutre | undefined;
  getStudentById: (studentId: number | null) => Student | undefined;
  classesMap?: Map<number | null, any>; // Map des ID de classes vers les données de classe
}

/**
 * Trie un tableau de corrections par nom d'étudiant (ordre alphabétique)
 * @param corrections Tableau de corrections à trier
 * @returns Tableau de corrections triées par nom d'étudiant
 */
const sortCorrectionsByStudentName = (corrections: CorrectionAutreEnriched[]): CorrectionAutreEnriched[] => {
  return [...corrections].sort((a, b) => {
    // Extraire le nom de l'étudiant de correction.student_name, ou utiliser l'id comme fallback
    const studentNameA = a.student_name || `${a.student_id}`;
    const studentNameB = b.student_name || `${b.student_id}`;
    
    return studentNameA.localeCompare(studentNameB, 'fr', { sensitivity: 'base' });
  });
};

/**
 * Trie un tableau d'étudiants par ordre alphabétique (nom, prénom)
 * @param students Tableau d'étudiants à trier
 * @returns Tableau d'étudiants triés par ordre alphabétique
 */
const sortStudentsByName = (students: Student[]): Student[] => {
  return [...students].sort((a, b) => {
    const fullNameA = `${a.last_name} ${a.first_name}`;
    const fullNameB = `${b.last_name} ${b.first_name}`;
    return fullNameA.localeCompare(fullNameB, 'fr', { sensitivity: 'base' });
  });
};

const organizeAllCorrectionsData = ({
  corrections,
  includeAllStudents,
  filterActivity,
  arrangement,
  subArrangement,
  uniqueActivities,
  students,
  getActivityById,
  getStudentById,
  classesMap = new Map()
}: OrganizeAllCorrectionsDataParams) => {
  const result: any = {};
  
  // Créer une table de hachage pour les corrections existantes
  // Structure: { studentId: { activityId: correction } }
  const correctionsMap: Record<string, Record<string, CorrectionAutreEnriched>> = {};
  
  // Remplir la table de hachage avec les corrections existantes
  corrections.forEach(correction => {
    // Convert null student_id or activity_id to string "null" for safe indexing
    const studentKey = correction.student_id === null ? "null" : String(correction.student_id);
    const activityKey = correction.activity_id === null ? "null" : String(correction.activity_id);

    if (!correctionsMap[studentKey]) {
      correctionsMap[studentKey] = {};
    }
    correctionsMap[studentKey][activityKey] = correction;
  });

  // Trier les étudiants par ordre alphabétique
  const sortedStudents = sortStudentsByName(students);

  // Créer une carte des étudiants par classe pour une organisation plus efficace
  // Structure: { classId: Student[] }
  const studentsByClass: Record<string, Student[]> = {};
  
  // Organiser les étudiants par classe en utilisant l'attribut allClasses
  sortedStudents.forEach(student => {
    if (student.allClasses && student.allClasses.length > 0) {
      // Si l'étudiant a des classes attribuées, l'ajouter à chacune de ses classes
      student.allClasses.forEach(classInfo => {
        const classKey = String(classInfo.classId);
        if (!studentsByClass[classKey]) {
          studentsByClass[classKey] = [];
        }
        
        // Vérifier si l'étudiant n'est pas déjà dans cette classe
        if (!studentsByClass[classKey].some(s => s.id === student.id)) {
          studentsByClass[classKey].push(student);
        }
      });
    } else {
      // Si l'étudiant n'a pas de classe attribuée, l'ajouter à une catégorie "Sans classe"
      const noClassKey = "null";
      if (!studentsByClass[noClassKey]) {
        studentsByClass[noClassKey] = [];
      }
      studentsByClass[noClassKey].push(student);
    }
  });

  // S'assurer que les étudiants dans chaque classe sont également triés par ordre alphabétique
  Object.keys(studentsByClass).forEach(classKey => {
    studentsByClass[classKey] = sortStudentsByName(studentsByClass[classKey]);
  });
  
  // Maintenant, construisons le résultat en fonction de l'arrangement souhaité
  switch (arrangement) {
    case 'class':
      
      // Pour chaque classe, ajouter une entrée dans le résultat
      Object.entries(studentsByClass).forEach(([classIdStr, studentsInClass]) => {
        const classId = classIdStr === "null" ? null : Number(classIdStr);
        const className = classId !== null 
          ? (classesMap.get(classId)?.name || `Classe ${classId}`) 
          : 'Classe non attribuée';
        const classKey = className;
        
        // Initialiser l'entrée pour cette classe si elle n'existe pas
        if (!result[classKey]) {
          result[classKey] = {
            info: { 
              className,
              classId
            },
            items: {}
          };
        }
        
        // Traiter chaque étudiant dans cette classe selon le sous-arrangement
        studentsInClass.forEach(student => {
          // Récupérer les corrections de cet étudiant
          const studentCorrections = correctionsMap[student.id] 
            ? Object.values(correctionsMap[student.id]) 
            : [];
          if (subArrangement === 'student') {
            const studentKey = `${student.last_name} ${student.first_name}`;
            
            if (!result[classKey].items[studentKey]) {
              result[classKey].items[studentKey] = {
                info: { student },
                corrections: []
              };
            }
            
            // Ajouter toutes les corrections de cet étudiant
            studentCorrections.forEach(correction => {
              // Filtrer par activité si nécessaire
              if (filterActivity === 'all' || correction.activity_id === filterActivity) {
                result[classKey].items[studentKey].corrections.push(correction);
              }
            });
          } 
          else if (subArrangement === 'activity') {
            // Pour chaque activité pertinente (filtrée ou toutes)
            const activities = filterActivity === 'all' 
              ? uniqueActivities 
              : uniqueActivities.filter(a => a.id === filterActivity);
            
            activities.forEach(activityInfo => {
              const activity = getActivityById(Number(activityInfo.id));
              const activityKey = activity?.name || `Activité ${activityInfo.id}`;
              

              if (!result[classKey].items[activityKey]) {
                result[classKey].items[activityKey] = {
                  info: { activity },
                  corrections: []
                };
              }
              
              // Chercher la correction de cet étudiant pour cette activité
              const correction = studentCorrections.find(c => c.activity_id === Number(activityInfo.id));
              if (correction) {
                result[classKey].items[activityKey].corrections.push(correction);
              } else if (includeAllStudents) {
                // Créer un placeholder pour cet étudiant s'il n'a pas de correction pour cette activité
                const activity = getActivityById(Number(activityInfo.id));
                const pointsCount = activity?.points?.length || 0;
                
                const emptyCorrection = createEmptyCorrectionAutre(
                  student.id, 
                  Number(activityInfo.id), 
                  classId,
                  `${student.last_name} ${student.first_name}`,
                  activity?.name || `Activité ${activityInfo.id}`,
                  className,
                  pointsCount
                );
                result[classKey].items[activityKey].corrections.push(emptyCorrection);
              }
            });
            
            // Trier les corrections par nom d'étudiant dans chaque activité
            Object.keys(result[classKey].items).forEach(itemKey => {
              if (result[classKey].items[itemKey].corrections) {
                result[classKey].items[itemKey].corrections = sortCorrectionsByStudentName(
                  result[classKey].items[itemKey].corrections
                );
              }
            });
          }
          else if (subArrangement === 'subclass') {
            // Récupérer d'abord tous les sous-groupes présents dans cette classe
            const subClassesInClass = new Set<number | string | null>();
            
            // Ajouter un groupe "Sans groupe" par défaut
            subClassesInClass.add(null);
            
            // Collecter tous les sous-groupes des étudiants dans cette classe
            studentsInClass.forEach(student => {
              if (student.sub_class !== undefined && student.sub_class !== null) {
                // Convertir explicitement en nombre si possible, sinon garder comme chaîne
                subClassesInClass.add(student.sub_class);
              }
            });
            
            // Pour chaque sous-groupe, traiter toutes les activités pertinentes
            subClassesInClass.forEach(subClass => {
              const subClassName = subClass ? `Groupe ${subClass}` : 'Sans groupe';
              
              // Créer l'entrée pour ce sous-groupe s'il n'existe pas
              if (!result[classKey].items[subClassName]) {
                result[classKey].items[subClassName] = {
                  info: { subClass },
                  corrections: []
                };
              }
              
              // Filtrer les étudiants qui appartiennent à ce sous-groupe
              const studentsInSubClass = studentsInClass.filter(student => 
                student.sub_class === subClass
              );
              
              // Pour chaque activité pertinente (toutes ou filtrée)
              const activities = filterActivity === 'all' 
                ? uniqueActivities 
                : uniqueActivities.filter(a => a.id === filterActivity);
                
              activities.forEach(activityInfo => {
                // Pour chaque étudiant dans ce sous-groupe
                studentsInSubClass.forEach(student => {
                  // Récupérer les corrections de cet étudiant
                  const studentCorrections = correctionsMap[student.id] 
                    ? Object.values(correctionsMap[student.id]) 
                    : [];
                  
                  // Chercher si l'étudiant a une correction pour cette activité
                  const correction = studentCorrections.find(c => 
                    c.activity_id === Number(activityInfo.id) && 
                    (filterActivity === 'all' || c.activity_id === filterActivity)
                  );
                  
                  if (correction) {
                    // Ajouter la correction existante
                    result[classKey].items[subClassName].corrections.push(correction);
                  } else if (includeAllStudents) {
                    // Créer un placeholder pour cette activité si l'étudiant n'a pas de correction
                    const activity = getActivityById(Number(activityInfo.id));
                    const pointsCount = activity?.points?.length || 0;
                    
                    const emptyCorrection = createEmptyCorrectionAutre(
                      student.id, 
                      Number(activityInfo.id), 
                      classId,
                      `${student.last_name} ${student.first_name}`,
                      activity?.name || `Activité ${activityInfo.id}`,
                      className,
                      pointsCount
                    );
                    result[classKey].items[subClassName].corrections.push(emptyCorrection);
                  }
                });
                
                // S'il n'y a aucun étudiant dans ce sous-groupe mais que nous voulons le traiter quand même
                if (studentsInSubClass.length === 0 && includeAllStudents) {
                  // Ajouter un placeholder vide pour cette activité dans ce sous-groupe
                  const activity = getActivityById(Number(activityInfo.id));
                  const pointsCount = activity?.points?.length || 0;
                  
                  const emptyCorrection = createEmptyCorrectionAutre(
                    -1, // ID étudiant fictif
                    Number(activityInfo.id),
                    classId,
                    "Aucun étudiant",
                    activity?.name || `Activité ${activityInfo.id}`,
                    className,
                    pointsCount
                  );
                  result[classKey].items[subClassName].corrections.push(emptyCorrection);
                }
              });
              
              // Trier les corrections par nom d'étudiant dans chaque sous-groupe
              result[classKey].items[subClassName].corrections = sortCorrectionsByStudentName(
                result[classKey].items[subClassName].corrections
              );
            });
          }
          else {
            // Pas de sous-arrangement
            if (!result[classKey].corrections) {
              result[classKey].corrections = [];
            }
            
            // Quand il n'y a pas de sous-arrangement, ajouter directement les corrections individuelles
            // pour tous les étudiants de cette classe
            studentCorrections.forEach(correction => {
              // Filtrer par activité si nécessaire
              if (filterActivity === 'all' || correction.activity_id === filterActivity) {
                // Enrichir la correction avec les informations d'activité et de classe
                const activity = getActivityById(correction.activity_id);
                
                // Créer une copie avec les informations nécessaires
                const enrichedCorrection = {
                  ...correction,
                  student_name: `${student.last_name} ${student.first_name}`,
                  class_name: className,
                  activity_name: activity?.name || `Activité ${correction.activity_id}`
                };
                
                result[classKey].corrections.push(enrichedCorrection);
              }
            });
            
            // Si l'étudiant n'a pas de corrections mais qu'on veut inclure tous les étudiants
            if (includeAllStudents && studentCorrections.length === 0) {
              // Si un filtre d'activité est spécifié
              if (filterActivity !== 'all') {
                const activity = getActivityById(Number(filterActivity));
                const pointsCount = activity?.points?.length || 0;
                
                const emptyCorrection = createEmptyCorrectionAutre(
                  student.id, 
                  Number(filterActivity), 
                  classId,
                  `${student.last_name} ${student.first_name}`,
                  activity?.name || `Activité ${filterActivity}`,
                  className,
                  pointsCount
                );
                result[classKey].corrections.push(emptyCorrection);
              } else {
                // Pour toutes les activités si aucune activité spécifique n'est sélectionnée
                uniqueActivities.forEach(activityInfo => {
                  const activity = getActivityById(Number(activityInfo.id));
                  const pointsCount = activity?.points?.length || 0;
                  
                  const emptyCorrection = createEmptyCorrectionAutre(
                    student.id, 
                    Number(activityInfo.id), 
                    classId,
                    `${student.last_name} ${student.first_name}`,
                    activity?.name || `Activité ${activityInfo.id}`,
                    className,
                    pointsCount
                  );
                  result[classKey].corrections.push(emptyCorrection);
                });
              }
            }
            
            // Trier les corrections par nom d'étudiant
            if (result[classKey].corrections) {
              result[classKey].corrections = sortCorrectionsByStudentName(
                result[classKey].corrections
              );
            }
          }
        });
      });
      break;

    case 'student':
      
      // Pour l'arrangement par étudiant, on parcourt tous les étudiants
      sortedStudents.forEach(student => {
        const studentKey = `${student.last_name} ${student.first_name}`;
        
        // Récupérer les corrections de cet étudiant
        const studentCorrections = correctionsMap[student.id] 
          ? Object.values(correctionsMap[student.id]) 
          : [];
        
        // Déterminer si cet étudiant doit être inclus
        // (s'il a au moins une correction ou si includeAllStudents est activé)
        if (includeAllStudents || studentCorrections.length > 0) {
          if (!result[studentKey]) {
            result[studentKey] = {
              info: { student },
              items: {}
            };
          }
          
          // Sous-arrangement selon l'option choisie
          if (subArrangement === 'activity') {
            // Pour chaque activité pertinente (filtrée ou toutes)
            const activities = filterActivity === 'all' 
              ? uniqueActivities 
              : uniqueActivities.filter(a => a.id === filterActivity);
            
            activities.forEach(activityInfo => {
              const activity = getActivityById(Number(activityInfo.id));
              const activityKey = activity?.name || `Activité ${activityInfo.id}`;
              
              if (!result[studentKey].items[activityKey]) {
                result[studentKey].items[activityKey] = {
                  info: { activity },
                  corrections: []
                };
              }
              
              // Chercher la correction de cet étudiant pour cette activité
              const correction = studentCorrections.find(c => c.activity_id === Number(activityInfo.id));
              if (correction) {
                result[studentKey].items[activityKey].corrections.push(correction);
              } else if (includeAllStudents) {
                // Pour les activités sans correction, créer un placeholder
                let classId = null;
                let className = 'Classe non attribuée';
                
                // Essayer de déterminer la classe à partir de allClasses pour ce placeholder
                if (student.allClasses && student.allClasses.length > 0) {
                  classId = student.allClasses[0].classId; // Utiliser la première classe disponible
                  className = student.allClasses[0].className || `Classe ${classId}`;
                }
                
                const pointsCount = activity?.points?.length || 0;
                
                const emptyCorrection = createEmptyCorrectionAutre(
                  student.id, 
                  Number(activityInfo.id), 
                  classId,
                  `${student.last_name} ${student.first_name}`,
                  activity?.name || `Activité ${activityInfo.id}`,
                  className,
                  pointsCount
                );
                result[studentKey].items[activityKey].corrections.push(emptyCorrection);
              }
            });
            
            // Trier les corrections par nom d'étudiant dans chaque activité
            Object.keys(result[studentKey].items).forEach(itemKey => {
              if (result[studentKey].items[itemKey].corrections) {
                result[studentKey].items[itemKey].corrections = sortCorrectionsByStudentName(
                  result[studentKey].items[itemKey].corrections
                );
              }
            });
          } 
          else if (subArrangement === 'class') {
            // Déterminer les classes auxquelles cet étudiant appartient
            const studentClassIds = new Set<number | null>();
            
            studentCorrections.forEach(correction => {
              studentClassIds.add(correction.class_id);
            });
            
            // Si l'étudiant n'a pas de corrections ou pas de classe attribuée
            if (studentClassIds.size === 0) {
              studentClassIds.add(null); // Ajouter une entrée "Sans classe"
            }
            
            // Pour chaque classe de cet étudiant
            studentClassIds.forEach(classId => {
              const className = classId !== null 
                ? (classesMap.get(classId)?.name || `Classe ${classId}`) 
                : 'Classe non attribuée';
              const classKey = className;
              
              if (!result[studentKey].items[classKey]) {
                result[studentKey].items[classKey] = {
                  info: { 
                    className,
                    classId
                  },
                  corrections: []
                };
              }
              
              // Ajouter les corrections de cette classe
              studentCorrections.forEach(correction => {
                // Vérifier si la correction appartient à cette classe et correspond au filtre d'activité
                if (correction.class_id === classId && 
                    (filterActivity === 'all' || correction.activity_id === filterActivity)) {
                  result[studentKey].items[classKey].corrections.push(correction);
                }
              });
            });
            
            // Trier les corrections par nom d'étudiant dans chaque classe
            Object.keys(result[studentKey].items).forEach(itemKey => {
              if (result[studentKey].items[itemKey].corrections) {
                result[studentKey].items[itemKey].corrections = sortCorrectionsByStudentName(
                  result[studentKey].items[itemKey].corrections
                );
              }
            });
          }
          else {
            // Pas de sous-arrangement
            if (!result[studentKey].corrections) {
              result[studentKey].corrections = [];
            }
            
            // Pour chaque activité pertinente (filtrée ou toutes)
            const activitiesToProcess = filterActivity === 'all'
              ? uniqueActivities
              : uniqueActivities.filter(a => a.id === filterActivity);
            
            activitiesToProcess.forEach(activityInfo => {
              const activityId = Number(activityInfo.id);
              const activity = getActivityById(activityId);
              
              // Chercher une correction existante pour cette activité
              const correction = studentCorrections.find(c => c.activity_id === activityId);
              
              if (correction) {
                // Enrichir la correction avec les informations d'activité et de classe
                const classId = correction.class_id;
                const className = classId !== null 
                  ? (classesMap.get(classId)?.name || `Classe ${classId}`) 
                  : 'Classe non attribuée';
                
                // Créer une copie avec les informations nécessaires
                const enrichedCorrection = {
                  ...correction,
                  student_name: `${student.last_name} ${student.first_name}`,
                  class_name: className,
                  activity_name: activity?.name || `Activité ${activityId}`
                };
                
                result[studentKey].corrections.push(enrichedCorrection);
              }
              // Si pas de correction mais includeAllStudents est activé
              else if (includeAllStudents) {
                let classId = null;
                let className = 'Classe non attribuée';
                
                // Essayer de déterminer la classe à partir de allClasses
                if (student.allClasses && student.allClasses.length > 0) {
                  classId = student.allClasses[0].classId;
                  className = student.allClasses[0].className || `Classe ${classId}`;
                }
                
                const pointsCount = activity?.points?.length || 0;
                
                // Créer un placeholder pour cette activité
                const emptyCorrection = createEmptyCorrectionAutre(
                  student.id,
                  activityId,
                  classId,
                  `${student.last_name} ${student.first_name}`,
                  activity?.name || `Activité ${activityId}`,
                  className,
                  pointsCount
                );
                
                result[studentKey].corrections.push(emptyCorrection);
              }
            });
            
            // Trier les corrections par nom d'étudiant
            if (result[studentKey].corrections) {
              result[studentKey].corrections = sortCorrectionsByStudentName(
                result[studentKey].corrections
              );
            }
          }
        }
      });
      break;

    case 'subclass':
      
      // Pour l'arrangement par groupe (subclass)
      // Étape 1: Regrouper les étudiants par sous-classe
      const studentsBySubClass: Record<string, { students: Student[], classIds: Set<number | null> }> = {};
      
      // Parcourir tous les étudiants pour les regrouper par sous-classe
      sortedStudents.forEach(student => {
        const subClass = student.sub_class !== undefined && student.sub_class !== null 
          ? student.sub_class 
          : 'null'; // Utiliser 'null' comme clé pour les étudiants sans groupe
        const subClassKey = String(subClass);
        
        if (!studentsBySubClass[subClassKey]) {
          studentsBySubClass[subClassKey] = {
            students: [],
            classIds: new Set<number | null>()
          };
        }
        
        studentsBySubClass[subClassKey].students.push(student);
        
        // Collecter les classes auxquelles cet étudiant appartient
        if (student.allClasses && student.allClasses.length > 0) {
          student.allClasses.forEach(classInfo => {
            studentsBySubClass[subClassKey].classIds.add(classInfo.classId);
          });
        } else {
          studentsBySubClass[subClassKey].classIds.add(null);
        }
      });
      
      // Étape 2: Pour chaque sous-classe, créer une entrée dans le résultat
      Object.entries(studentsBySubClass).forEach(([subClassKey, data]) => {
        const subClass = subClassKey === 'null' ? null : (isNaN(Number(subClassKey)) ? subClassKey : Number(subClassKey));
        const groupName = subClass === null ? 'Sans groupe' : `Groupe ${subClass}`;
        
        if (!result[groupName]) {
          result[groupName] = {
            info: { 
              subClass,
              name: groupName
            },
            items: {}
          };
        }
        
        // Traiter selon le sous-arrangement choisi
        if (subArrangement === 'student') {
          // Sous-arrangement par étudiant
          data.students.forEach(student => {
            const studentKey = `${student.last_name} ${student.first_name}`;
            
            if (!result[groupName].items[studentKey]) {
              result[groupName].items[studentKey] = {
                info: { student },
                corrections: []
              };
            }
            
            // Récupérer les corrections de cet étudiant
            const studentCorrections = correctionsMap[student.id] 
              ? Object.values(correctionsMap[student.id]) 
              : [];
            
            // Ajouter les corrections qui correspondent au filtre d'activité
            studentCorrections.forEach(correction => {
              if (filterActivity === 'all' || correction.activity_id === filterActivity) {
                result[groupName].items[studentKey].corrections.push(correction);
              }
            });
            
            // Si l'étudiant n'a pas de corrections et qu'on veut inclure tous les étudiants
            if (includeAllStudents && (result[groupName].items[studentKey].corrections.length === 0)) {
              // Déterminer les activités à traiter
              const activitiesToProcess = filterActivity === 'all'
                ? uniqueActivities
                : uniqueActivities.filter(a => a.id === filterActivity);
              
              activitiesToProcess.forEach(activityInfo => {
                const activityId = Number(activityInfo.id);
                const activity = getActivityById(activityId);
                const pointsCount = activity?.points?.length || 0;
                
                // Déterminer la classe pour le placeholder
                let classId = null;
                let className = 'Classe non attribuée';
                
                if (student.allClasses && student.allClasses.length > 0) {
                  classId = student.allClasses[0].classId;
                  className = student.allClasses[0].className || `Classe ${classId}`;
                }
                
                // Créer un placeholder pour cette activité
                const emptyCorrection = createEmptyCorrectionAutre(
                  student.id,
                  activityId,
                  classId,
                  `${student.last_name} ${student.first_name}`,
                  activity?.name || `Activité ${activityId}`,
                  className,
                  pointsCount
                );
                
                result[groupName].items[studentKey].corrections.push(emptyCorrection);
              });
            }
            
            // Trier les corrections par nom d'étudiant dans chaque étudiant
            result[groupName].items[studentKey].corrections = sortCorrectionsByStudentName(
              result[groupName].items[studentKey].corrections
            );
          });
        }
        else if (subArrangement === 'activity') {

          // Sous-arrangement par activité
          // Déterminer les activités à traiter
          const activitiesToProcess = filterActivity === 'all'
            ? uniqueActivities
            : uniqueActivities.filter(a => a.id === filterActivity);

          activitiesToProcess.forEach(activityInfo => {
            const activityId = Number(activityInfo.id);
            const activity = getActivityById(activityId);
            const activityKey = activity?.name || `Activité ${activityId}`;
            const pointsCount = activity?.points?.length || 0;
            
            if (!result[groupName].items[activityKey]) {
              result[groupName].items[activityKey] = {
                info: { activity },
                corrections: []
              };
            }
            
            // Pour chaque étudiant dans ce groupe
            data.students.forEach(student => {
              // Récupérer les corrections de cet étudiant
              const studentCorrections = correctionsMap[student.id] 
                ? Object.values(correctionsMap[student.id]).filter(c => c.activity_id === activityId)
                : [];
              
              if (studentCorrections.length > 0) {
                studentCorrections.forEach(correction => {
                  result[groupName].items[activityKey].corrections.push(correction);
                });
              } else if (includeAllStudents) {
                // Créer un placeholder pour cet étudiant et cette activité
                let classId = null;
                let className = 'Classe non attribuée';
                
                if (student.allClasses && student.allClasses.length > 0) {
                  classId = student.allClasses[0].classId;
                  className = student.allClasses[0].className || `Classe ${classId}`;
                }
                
                const emptyCorrection = createEmptyCorrectionAutre(
                  student.id,
                  activityId,
                  classId,
                  `${student.last_name} ${student.first_name}`,
                  activity?.name || `Activité ${activityId}`,
                  className,
                  pointsCount
                );
                
                result[groupName].items[activityKey].corrections.push(emptyCorrection);
              }
            });
            
            // Si ce sous-groupe n'a pas d'étudiants mais qu'on veut l'inclure quand même
            if (data.students.length === 0 && includeAllStudents) {
              const emptyCorrection = createEmptyCorrectionAutre(
                -1, // ID étudiant fictif
                Number(activityInfo.id),
                null,
                "Aucun étudiant",
                activity?.name || `Activité ${activityInfo.id}`,
                'Classe non attribuée',
                pointsCount
              );
              result[groupName].items[activityKey].corrections.push(emptyCorrection);
            }
            
            // Trier les corrections par nom d'étudiant dans chaque activité
            result[groupName].items[activityKey].corrections = sortCorrectionsByStudentName(
              result[groupName].items[activityKey].corrections
            );
          });
        }
        else if (subArrangement === 'class') {
          // Sous-arrangement par classe
          // Pour chaque classe associée à ce groupe
          data.classIds.forEach(classId => {
            const className = classId !== null 
              ? (classesMap.get(classId)?.name || `Classe ${classId}`) 
              : 'Classe non attribuée';
            
            if (!result[groupName].items[className]) {
              result[groupName].items[className] = {
                info: { 
                  className,
                  classId
                },
                corrections: []
              };
            }
            
            // Filtrer les étudiants de ce groupe qui sont dans cette classe
            const studentsInGroupAndClass = data.students.filter(student => {
              if (classId === null) {
                return !student.allClasses || student.allClasses.length === 0;
              }
              return student.allClasses && student.allClasses.some(c => c.classId === classId);
            });
            
            // Pour chaque étudiant dans ce groupe et cette classe
            studentsInGroupAndClass.forEach(student => {
              // Récupérer les corrections de cet étudiant
              const studentCorrections = correctionsMap[student.id] 
                ? Object.values(correctionsMap[student.id]) 
                : [];
              
              // Filtrer les corrections par activité et classe
              studentCorrections.forEach(correction => {
                if (correction.class_id === classId && 
                    (filterActivity === 'all' || correction.activity_id === filterActivity)) {
                  result[groupName].items[className].corrections.push(correction);
                }
              });
              
              // Si l'étudiant n'a pas de corrections et qu'on veut inclure tous les étudiants
              if (includeAllStudents) {
                // Déterminer les activités à traiter
                const activitiesToProcess = filterActivity === 'all'
                  ? uniqueActivities
                  : uniqueActivities.filter(a => a.id === filterActivity);
                
                activitiesToProcess.forEach(activityInfo => {
                  const activityId = Number(activityInfo.id);
                  const activity = getActivityById(activityId);
                  const pointsCount = activity?.points?.length || 0;
                  
                  // Vérifier si l'étudiant a déjà une correction pour cette activité dans cette classe
                  const hasCorrection = studentCorrections.some(c => 
                    c.activity_id === activityId && c.class_id === classId
                  );
                  
                  if (!hasCorrection) {
                    // Créer un placeholder pour cette activité
                    const emptyCorrection = createEmptyCorrectionAutre(
                      student.id,
                      activityId,
                      classId,
                      `${student.last_name} ${student.first_name}`,
                      activity?.name || `Activité ${activityId}`,
                      className,
                      pointsCount
                    );
                    
                    result[groupName].items[className].corrections.push(emptyCorrection);
                  }
                });
              }
            });
            
            // Trier les corrections par nom d'étudiant dans chaque classe
            result[groupName].items[className].corrections = sortCorrectionsByStudentName(
              result[groupName].items[className].corrections
            );
          });
        }
        else {
          // Pas de sous-arrangement
          if (!result[groupName].corrections) {
            result[groupName].corrections = [];
          }
          
          // Pour chaque étudiant dans ce groupe
          data.students.forEach(student => {
            // Récupérer les corrections de cet étudiant
            const studentCorrections = correctionsMap[student.id] 
              ? Object.values(correctionsMap[student.id]) 
              : [];
            
            // Ajouter les corrections qui correspondent au filtre d'activité
            studentCorrections.forEach(correction => {
              if (filterActivity === 'all' || correction.activity_id === filterActivity) {
                // Enrichir la correction avec les informations d'activité et de classe
                const activity = getActivityById(correction.activity_id);
                const classId = correction.class_id;
                const className = classId !== null 
                  ? (classesMap.get(classId)?.name || `Classe ${classId}`) 
                  : 'Classe non attribuée';
                
                // Créer une copie avec les informations nécessaires
                const enrichedCorrection = {
                  ...correction,
                  student_name: `${student.last_name} ${student.first_name}`,
                  class_name: className,
                  activity_name: activity?.name || `Activité ${correction.activity_id}`
                };
                
                result[groupName].corrections.push(enrichedCorrection);
              }
            });
          });
          
          // Si includeAllStudents est activé, nous devons ajouter des placeholders
          if (includeAllStudents) {
            // Déterminer toutes les activités à traiter (filtrées ou toutes)
            const activitiesToProcess = filterActivity === 'all'
              ? uniqueActivities
              : uniqueActivities.filter(a => a.id === filterActivity);
            
            // Pour chaque activité
            activitiesToProcess.forEach(activityInfo => {
              const activityId = Number(activityInfo.id);
              const activity = getActivityById(activityId);
              const pointsCount = activity?.points?.length || 0;
              
              // Pour chaque étudiant dans ce groupe
              data.students.forEach(student => {
                // Récupérer les corrections de cet étudiant pour vérifier s'il en a déjà une
                const studentCorrectionsList = correctionsMap[student.id] 
                  ? Object.values(correctionsMap[student.id]) 
                  : [];
                
                // Vérifier si cet étudiant a déjà une correction pour cette activité
                const hasCorrection = studentCorrectionsList.some(c => 
                  c.activity_id === activityId && c.student_id === student.id
                );
                
                // Si l'étudiant n'a pas de correction pour cette activité, ajouter un placeholder
                if (!hasCorrection) {
                  let classId = null;
                  let className = 'Classe non attribuée';
                  
                  if (student.allClasses && student.allClasses.length > 0) {
                    classId = student.allClasses[0].classId;
                    className = student.allClasses[0].className || `Classe ${classId}`;
                  }
                  
                  const emptyCorrection = createEmptyCorrectionAutre(
                    student.id,
                    activityId,
                    classId,
                    `${student.last_name} ${student.first_name}`,
                    activity?.name || `Activité ${activityId}`,
                    className,
                    pointsCount
                  );
                  
                  result[groupName].corrections.push(emptyCorrection);
                }
              });
              
              // Si le groupe n'a pas d'étudiants, ajouter un placeholder générique
              if (data.students.length === 0) {
                const emptyCorrection = createEmptyCorrectionAutre(
                  -1, // ID étudiant fictif
                  activityId,
                  null,
                  "Aucun étudiant",
                  activity?.name || `Activité ${activityId}`,
                  'Classe non attribuée',
                  pointsCount
                );
                
                result[groupName].corrections.push(emptyCorrection);
              }
            });
          }
          
          // Trier les corrections par nom d'étudiant
          if (result[groupName].corrections) {
            result[groupName].corrections = sortCorrectionsByStudentName(
              result[groupName].corrections
            );
          }
        }
      });
      break;

    case 'activity':
      // Pour l'arrangement par activité
      const activities = filterActivity === 'all' 
        ? uniqueActivities 
        : uniqueActivities.filter(a => a.id === filterActivity);
      
      activities.forEach(activityInfo => {
        const activity = getActivityById(Number(activityInfo.id));
        const activityKey = activity?.name || `Activité ${activityInfo.id}`;
        const pointsCount = activity?.points?.length || 0;
        
        if (!result[activityKey]) {
          result[activityKey] = {
            info: { activity },
            items: {}
          };
        }
        
        // Sous-arrangement selon l'option choisie
        if (subArrangement === 'student') {
          // Pour chaque étudiant (tous ou seulement ceux avec des corrections)
          const studentsToProcess = includeAllStudents 
            ? sortedStudents 
            : sortedStudents.filter(student => {
                return correctionsMap[student.id] && 
                       Object.values(correctionsMap[student.id]).some(
                         c => c.activity_id === Number(activityInfo.id)
                       );
              });
          
          studentsToProcess.forEach(student => {
            const studentKey = `${student.last_name} ${student.first_name}`;
            
            if (!result[activityKey].items[studentKey]) {
              result[activityKey].items[studentKey] = {
                info: { student },
                corrections: []
              };
            }
            
            // Chercher la correction de cet étudiant pour cette activité
            const studentCorrections = correctionsMap[student.id] 
              ? Object.values(correctionsMap[student.id]).filter(c => c.activity_id === Number(activityInfo.id))
              : [];
            
            if (studentCorrections.length > 0) {
              studentCorrections.forEach(correction => {
                result[activityKey].items[studentKey].corrections.push(correction);
              });
            } else if (includeAllStudents) {
              // Pour les étudiants sans correction, créer un placeholder pour cette activité
              let classId = null;
              let className = 'Classe non attribuée';
              
              // Essayer de déterminer la classe à partir de allClasses
              if (student.allClasses && student.allClasses.length > 0) {
                classId = student.allClasses[0].classId; // Utiliser la première classe disponible
                className = student.allClasses[0].className || `Classe ${classId}`;
              }
              
              const emptyCorrection = createEmptyCorrectionAutre(
                student.id, 
                Number(activityInfo.id), 
                classId,
                `${student.last_name} ${student.first_name}`,
                activity?.name || `Activité ${activityInfo.id}`,
                className,
                pointsCount
              );
              result[activityKey].items[studentKey].corrections.push(emptyCorrection);
            }
          });
          
          // Trier les corrections par nom d'étudiant dans chaque étudiant
          Object.keys(result[activityKey].items).forEach(itemKey => {
            if (result[activityKey].items[itemKey].corrections) {
              result[activityKey].items[itemKey].corrections = sortCorrectionsByStudentName(
                result[activityKey].items[itemKey].corrections
              );
            }
          });
        } 
        else if (subArrangement === 'class') {
          // Pour chaque classe qui a au moins un étudiant avec une correction pour cette activité
          // ou pour toutes les classes si includeAllStudents est activé
          const classIds = new Set<number | null>();
          
          // Collecter les IDs de classe à partir des corrections pour cette activité
          corrections.forEach(correction => {
            if (correction.activity_id === Number(activityInfo.id)) {
              classIds.add(correction.class_id);
            }
          });
          
          // Si nous incluons tous les étudiants et qu'il n'y a pas de classe définie
          if (includeAllStudents && classIds.size === 0) {
            // Ajouter toutes les classes disponibles
            classesMap.forEach((_, classId) => {
              classIds.add(classId);
            });
            // Ajouter aussi une entrée pour les étudiants sans classe
            classIds.add(null);
          }
          
          // Pour chaque classe identifiée
          classIds.forEach(classId => {
            const className = classId !== null 
              ? (classesMap.get(classId)?.name || `Classe ${classId}`) 
              : 'Classe non attribuée';
            const classKey = className;
            
            if (!result[activityKey].items[classKey]) {
              result[activityKey].items[classKey] = {
                info: { 
                  className,
                  classId
                },
                corrections: []
              };
            }
            
            // Ajouter les corrections de cette classe pour cette activité
            corrections.forEach(correction => {
              if (correction.activity_id === Number(activityInfo.id) && 
                  correction.class_id === classId) {
                result[activityKey].items[classKey].corrections.push(correction);
              }
            });
            
            // Si nous incluons tous les étudiants, nous devons également ajouter 
            // des entrées pour les étudiants de cette classe qui n'ont pas de correction
            if (includeAllStudents) {
              const studentsInClass = studentsByClass[String(classId)] || [];
              
              studentsInClass.forEach(student => {
                // Vérifier si cet étudiant a déjà une correction pour cette activité
                const hasCorrection = result[activityKey].items[classKey].corrections.some(
                  (c: CorrectionAutreEnriched) => c.student_id === student.id
                );
                
                // Si l'étudiant n'a pas de correction pour cette activité, ajouter un placeholder
                if (!hasCorrection) {
                  const emptyCorrection = createEmptyCorrectionAutre(
                    student.id, 
                    Number(activityInfo.id), 
                    classId,
                    `${student.last_name} ${student.first_name}`,
                    activity?.name || `Activité ${activityInfo.id}`,
                    className,
                    pointsCount
                  );
                  result[activityKey].items[classKey].corrections.push(emptyCorrection);
                }
              });
            }
          });
          
          // Trier les corrections par nom d'étudiant dans chaque classe
          Object.keys(result[activityKey].items).forEach(itemKey => {
            if (result[activityKey].items[itemKey].corrections) {
              result[activityKey].items[itemKey].corrections = sortCorrectionsByStudentName(
                result[activityKey].items[itemKey].corrections
              );
            }
          });
        }
        else if (subArrangement === 'subclass') {
          // Sous-arrangement par sous-classe (groupe)
          // Collecter tous les sous-groupes dans le système
          const subClasses = new Set<string | number | null>();
          
          // Par défaut, inclure un groupe "Sans groupe"
          subClasses.add(null);
          
          // Collecter les sous-classes à partir des étudiants
          sortedStudents.forEach(student => {
            if (student.sub_class !== undefined && student.sub_class !== null) {
              subClasses.add(student.sub_class);
            }
          });
          
          // Pour chaque sous-classe
          subClasses.forEach(subClass => {
            const subClassName = subClass ? `Groupe ${subClass}` : 'Sans groupe';
            
            if (!result[activityKey].items[subClassName]) {
              result[activityKey].items[subClassName] = {
                info: { subClass },
                corrections: []
              };
            }
            
            // Filtrer les étudiants qui appartiennent à ce sous-groupe
            const studentsInSubClass = sortedStudents.filter(student => student.sub_class === subClass);
            
            // Pour chaque étudiant dans ce sous-groupe
            studentsInSubClass.forEach(student => {
              // Récupérer les corrections de cet étudiant pour cette activité
              const studentCorrections = correctionsMap[student.id] 
                ? Object.values(correctionsMap[student.id]).filter(c => c.activity_id === Number(activityInfo.id))
                : [];
              
              if (studentCorrections.length > 0) {
                studentCorrections.forEach(correction => {
                  result[activityKey].items[subClassName].corrections.push(correction);
                });
              } else if (includeAllStudents) {
                // Créer un placeholder pour cet étudiant
                let classId = null;
                let className = 'Classe non attribuée';
                
                if (student.allClasses && student.allClasses.length > 0) {
                  classId = student.allClasses[0].classId;
                  className = student.allClasses[0].className || `Classe ${classId}`;
                }
                
                const emptyCorrection = createEmptyCorrectionAutre(
                  student.id,
                  Number(activityInfo.id),
                  classId,
                  `${student.last_name} ${student.first_name}`,
                  activity?.name || `Activité ${activityInfo.id}`,
                  className,
                  pointsCount
                );
                
                result[activityKey].items[subClassName].corrections.push(emptyCorrection);
              }
            });
            
            // Si ce sous-groupe n'a pas d'étudiants mais qu'on veut l'inclure quand même
            if (studentsInSubClass.length === 0 && includeAllStudents) {
              const emptyCorrection = createEmptyCorrectionAutre(
                -1, // ID étudiant fictif
                Number(activityInfo.id),
                null,
                "Aucun étudiant",
                activity?.name || `Activité ${activityInfo.id}`,
                'Classe non attribuée',
                pointsCount
              );
              result[activityKey].items[subClassName].corrections.push(emptyCorrection);
            }
            
            // Trier les corrections par nom d'étudiant dans chaque sous-classe
            result[activityKey].items[subClassName].corrections = sortCorrectionsByStudentName(
              result[activityKey].items[subClassName].corrections
            );
          });
        }
        else {
          // Pas de sous-arrangement
          if (!result[activityKey].corrections) {
            result[activityKey].corrections = [];
          }
          
          // Pour chaque étudiant pertinent (tous ou ceux avec des corrections pour cette activité)
          const studentsToProcess = includeAllStudents 
            ? sortedStudents 
            : sortedStudents.filter(student => {
                return correctionsMap[student.id] && 
                       Object.values(correctionsMap[student.id]).some(
                         c => c.activity_id === Number(activityInfo.id)
                       );
              });
          
          studentsToProcess.forEach(student => {
            // Chercher les corrections de cet étudiant pour cette activité
            const studentCorrections = correctionsMap[student.id] 
              ? Object.values(correctionsMap[student.id]).filter(c => c.activity_id === Number(activityInfo.id))
              : [];
            
            if (studentCorrections.length > 0) {
              studentCorrections.forEach(correction => {
                // Enrichir la correction avec les noms pour l'affichage
                const classId = correction.class_id;
                const className = classId !== null 
                  ? (classesMap.get(classId)?.name || `Classe ${classId}`) 
                  : 'Classe non attribuée';
                
                const enrichedCorrection = {
                  ...correction,
                  student_name: `${student.last_name} ${student.first_name}`,
                  class_name: className,
                  activity_name: activity?.name || `Activité ${activityInfo.id}`
                };
                
                result[activityKey].corrections.push(enrichedCorrection);
              });
            } else if (includeAllStudents) {
              // Créer un placeholder pour les étudiants sans correction
              let classId = null;
              let className = 'Classe non attribuée';
              
              // Déterminer la classe à partir de allClasses si disponible
              if (student.allClasses && student.allClasses.length > 0) {
                classId = student.allClasses[0].classId;
                className = student.allClasses[0].className || `Classe ${classId}`;
              }
              
              const emptyCorrection = createEmptyCorrectionAutre(
                student.id,
                Number(activityInfo.id),
                classId,
                `${student.last_name} ${student.first_name}`,
                activity?.name || `Activité ${activityInfo.id}`,
                className,
                pointsCount
              );
              
              // Ajouter le placeholder directement aux corrections de cette activité
              result[activityKey].corrections.push(emptyCorrection);
            }
          });
          
          // Trier les corrections par nom d'étudiant
          if (result[activityKey].corrections) {
            result[activityKey].corrections = sortCorrectionsByStudentName(
              result[activityKey].corrections
            );
          }
        }
      });
      break;
  }
  
  // Avant de retourner le résultat, trier toutes les corrections dans chaque arrangement et sous-arrangement
  Object.keys(result).forEach(key => {
    // Si cet arrangement a des corrections directes
    if (result[key].corrections) {
      result[key].corrections = sortCorrectionsByStudentName(result[key].corrections);
    }
    
    // Si cet arrangement a des sous-arrangements
    if (result[key].items) {
      Object.keys(result[key].items).forEach(itemKey => {
        if (result[key].items[itemKey].corrections) {
          result[key].items[itemKey].corrections = sortCorrectionsByStudentName(
            result[key].items[itemKey].corrections
          );
        }
      });
    }
  });
  
  return result;
};

export const allCorrectionsAutreDataProcessingService = {
  organizeAllCorrectionsData
};