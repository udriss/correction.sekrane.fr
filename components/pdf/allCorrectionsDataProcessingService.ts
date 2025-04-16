// Service de traitement des données pour ExportPDFComponentAllCorrections
import { 
  ArrangementType, 
  SubArrangementType,
  createEmptyCorrection
} from './types';
import { Correction as ProviderCorrection } from '@/app/components/CorrectionsDataProvider';
import { Student, CorrectionAutreEnriched } from '@/lib/types';
interface OrganizeAllCorrectionsDataParams {
  corrections: CorrectionAutreEnriched[];
  includeAllStudents: boolean;
  filterActivity: number | 'all';
  arrangement: ArrangementType;
  subArrangement: SubArrangementType;
  uniqueActivities: { id: number | string; name: string }[];
  students: Student[];
  getActivityById: (activityId: number) => any;
  getStudentById: (studentId: number | null) => Student | undefined;
  classesMap?: Map<number | null, any>; // Map des ID de classes vers les données de classe
}

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
  const correctionsMap: Record<number, Record<number, CorrectionAutreEnriched>> = {};
  
  // Remplir la table de hachage avec les corrections existantes
  corrections.forEach(correction => {
    if (!correctionsMap[correction.activity_id]) {
      correctionsMap[correction.activity_id] = {};
    }

  });
  
  // Créer une carte des étudiants par classe pour une organisation plus efficace
  // Structure: { classId: Student[] }
  const studentsByClass: Record<string, Student[]> = {};
  
  // Organiser les étudiants par classe en utilisant l'attribut allClasses
  students.forEach(student => {
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
                const emptyCorrection = createEmptyCorrection(
                  student.id, 
                  Number(activityInfo.id), 
                  classId,
                  `${student.last_name} ${student.first_name}`,
                  activity?.name || `Activité ${activityInfo.id}`,
                  className
                );
                result[classKey].items[activityKey].corrections.push(emptyCorrection);
                
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
                    const emptyCorrection = createEmptyCorrection(
                      student.id, 
                      Number(activityInfo.id), 
                      classId,
                      `${student.last_name} ${student.first_name}`,
                      activity?.name || `Activité ${activityInfo.id}`,
                      className
                    );
                    result[classKey].items[subClassName].corrections.push(emptyCorrection);
                  }
                });
                
                // S'il n'y a aucun étudiant dans ce sous-groupe mais que nous voulons le traiter quand même
                if (studentsInSubClass.length === 0 && includeAllStudents) {
                  // Ajouter un placeholder vide pour cette activité dans ce sous-groupe
                  const activity = getActivityById(Number(activityInfo.id));
                  const emptyCorrection = createEmptyCorrection(
                    -1, // ID étudiant fictif
                    Number(activityInfo.id),
                    classId,
                    "Aucun étudiant",
                    activity?.name || `Activité ${activityInfo.id}`,
                    className
                  );
                  result[classKey].items[subClassName].corrections.push(emptyCorrection);
                }
              });
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
                const emptyCorrection = createEmptyCorrection(
                  student.id, 
                  Number(filterActivity), 
                  classId,
                  `${student.last_name} ${student.first_name}`,
                  activity?.name || `Activité ${filterActivity}`,
                  className
                );
                result[classKey].corrections.push(emptyCorrection);
              } else {
                // Pour toutes les activités si aucune activité spécifique n'est sélectionnée
                uniqueActivities.forEach(activityInfo => {
                  const activity = getActivityById(Number(activityInfo.id));
                  const emptyCorrection = createEmptyCorrection(
                    student.id, 
                    Number(activityInfo.id), 
                    classId,
                    `${student.last_name} ${student.first_name}`,
                    activity?.name || `Activité ${activityInfo.id}`,
                    className
                  );
                  result[classKey].corrections.push(emptyCorrection);
                });
              }
            }
          }
        });
      });
      break;

    case 'student':
      // Pour l'arrangement par étudiant, on parcourt tous les étudiants
      students.forEach(student => {
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
                
                const emptyCorrection = createEmptyCorrection(
                  student.id, 
                  Number(activityInfo.id), 
                  classId,
                  `${student.last_name} ${student.first_name}`,
                  activity?.name || `Activité ${activityInfo.id}`,
                  className
                );
                result[studentKey].items[activityKey].corrections.push(emptyCorrection);
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
                
                // Créer un placeholder pour cette activité
                const emptyCorrection = createEmptyCorrection(
                  student.id,
                  activityId,
                  classId,
                  `${student.last_name} ${student.first_name}`,
                  activity?.name || `Activité ${activityId}`,
                  className
                );
                
                result[studentKey].corrections.push(emptyCorrection);
              }
            });
          }
        }
      });
      break;

    case 'subclass':
      // Pour l'arrangement par groupe (subclass)
      // Étape 1: Regrouper les étudiants par sous-classe
      const studentsBySubClass: Record<string, { students: Student[], classIds: Set<number | null> }> = {};
      
      // Parcourir tous les étudiants pour les regrouper par sous-classe
      students.forEach(student => {
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
                
                // Déterminer la classe pour le placeholder
                let classId = null;
                let className = 'Classe non attribuée';
                
                if (student.allClasses && student.allClasses.length > 0) {
                  classId = student.allClasses[0].classId;
                  className = student.allClasses[0].className || `Classe ${classId}`;
                }
                
                // Créer un placeholder pour cette activité
                const emptyCorrection = createEmptyCorrection(
                  student.id,
                  activityId,
                  classId,
                  `${student.last_name} ${student.first_name}`,
                  activity?.name || `Activité ${activityId}`,
                  className
                );
                
                result[groupName].items[studentKey].corrections.push(emptyCorrection);
              });
            }
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
            
            if (!result[groupName].items[activityKey]) {
              result[groupName].items[activityKey] = {
                info: { activity },
                corrections: []
              };
            }
            
            // Pour chaque étudiant dans ce groupe
            data.students.forEach(student => {
              // Récupérer les corrections de cet étudiant
              const studentCorrections = correctionsMap[student.id] || {};
              const correction = studentCorrections[activityId];
              
              if (correction) {
                result[groupName].items[activityKey].corrections.push(correction);
              } else if (includeAllStudents) {
                // Créer un placeholder pour cet étudiant et cette activité
                let classId = null;
                let className = 'Classe non attribuée';
                
                if (student.allClasses && student.allClasses.length > 0) {
                  classId = student.allClasses[0].classId;
                  className = student.allClasses[0].className || `Classe ${classId}`;
                }
                
                const emptyCorrection = createEmptyCorrection(
                  student.id,
                  activityId,
                  classId,
                  `${student.last_name} ${student.first_name}`,
                  activity?.name || `Activité ${activityId}`,
                  className
                );
                
                result[groupName].items[activityKey].corrections.push(emptyCorrection);
              }
            });
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
                  
                  // Vérifier si l'étudiant a déjà une correction pour cette activité dans cette classe
                  const hasCorrection = studentCorrections.some(c => 
                    c.activity_id === activityId && c.class_id === classId
                  );
                  
                  if (!hasCorrection) {
                    // Créer un placeholder pour cette activité
                    const emptyCorrection = createEmptyCorrection(
                      student.id,
                      activityId,
                      classId,
                      `${student.last_name} ${student.first_name}`,
                      activity?.name || `Activité ${activityId}`,
                      className
                    );
                    
                    result[groupName].items[className].corrections.push(emptyCorrection);
                  }
                });
              }
            });
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
          
          // Déterminer toutes les activités à traiter (filtrées ou toutes)
          const activitiesToProcess = filterActivity === 'all'
            ? uniqueActivities
            : uniqueActivities.filter(a => a.id === filterActivity);
          
          // Pour chaque activité
          activitiesToProcess.forEach(activityInfo => {
            const activityId = Number(activityInfo.id);
            const activity = getActivityById(activityId);
            
            // Vérifier si ce groupe a déjà une correction pour cette activité
            const hasActivityCorrection = result[groupName].corrections.some(
              (c: CorrectionAutreEnriched) => c.activity_id === activityId
            );
            
            // Si le groupe n'a pas de correction pour cette activité, ajouter un placeholder pour chaque étudiant
            if (!hasActivityCorrection) {
              // Si le groupe a des étudiants, ajouter un placeholder pour chaque étudiant
              if (data.students.length > 0) {
                data.students.forEach(student => {
                  let classId = null;
                  let className = 'Classe non attribuée';
                  
                  if (student.allClasses && student.allClasses.length > 0) {
                    classId = student.allClasses[0].classId;
                    className = student.allClasses[0].className || `Classe ${classId}`;
                  }
                  
                  const emptyCorrection = createEmptyCorrection(
                    student.id,
                    activityId,
                    classId,
                    `${student.last_name} ${student.first_name}`,
                    activity?.name || `Activité ${activityId}`,
                    className
                  );
                  
                  result[groupName].corrections.push(emptyCorrection);
                });
              } else {
                // Si le groupe n'a pas d'étudiants, ajouter un placeholder générique
                const emptyCorrection = createEmptyCorrection(
                  -1, // ID étudiant fictif
                  activityId,
                  null,
                  "Aucun étudiant",
                  activity?.name || `Activité ${activityId}`,
                  'Classe non attribuée'
                );
                
                result[groupName].corrections.push(emptyCorrection);
              }
            }
          });
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
            ? students 
            : students.filter(student => {
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
            const studentCorrections = correctionsMap[student.id] || {};
            const correction = studentCorrections[Number(activityInfo.id)];
            
            if (correction) {
              result[activityKey].items[studentKey].corrections.push(correction);
            } else if (includeAllStudents) {
              // Pour les étudiants sans correction, créer un placeholder pour cette activité
              let classId = null;
              
              // Essayer de déterminer la classe à partir de allClasses
              if (student.allClasses && student.allClasses.length > 0) {
                classId = student.allClasses[0].classId; // Utiliser la première classe disponible
              }
              
              const emptyCorrection = createEmptyCorrection(
                student.id, 
                Number(activityInfo.id), 
                classId,
                `${student.last_name} ${student.first_name}`,
                activity?.name || `Activité ${activityInfo.id}`,
                classId !== null ? (classesMap.get(classId)?.name || `Classe ${classId}`) : 'Classe non attribuée'
              );
              result[activityKey].items[studentKey].corrections.push(emptyCorrection);
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
            classIds.add(null); // Ajouter une entrée "Sans classe"
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
            if (includeAllStudents && classId !== null) {
              const studentsInClass = studentsByClass[String(classId)] || [];
              
              studentsInClass.forEach(student => {
                // Vérifier si cet étudiant a déjà une correction pour cette activité
                const hasCorrection = result[activityKey].items[classKey].corrections.some(
                  (c: ProviderCorrection) => c.student_id === student.id
                );
                
                // Si l'étudiant n'a pas de correction pour cette activité, ajouter un placeholder
                if (!hasCorrection) {
                  const emptyCorrection = createEmptyCorrection(
                    student.id, 
                    Number(activityInfo.id), 
                    classId,
                    `${student.last_name} ${student.first_name}`,
                    activity?.name || `Activité ${activityInfo.id}`,
                    className
                  );
                  result[activityKey].items[classKey].corrections.push(emptyCorrection);
                }
              });
            }
          });
        }
        else {
          // Pas de sous-arrangement
          if (!result[activityKey].corrections) {
            result[activityKey].corrections = [];
          }
          
          // Pour chaque étudiant pertinent (tous ou ceux avec des corrections pour cette activité)
          const studentsToProcess = includeAllStudents 
            ? students 
            : students.filter(student => {
                return correctionsMap[student.id] && 
                       correctionsMap[student.id][Number(activityInfo.id)];
              });
          
          studentsToProcess.forEach(student => {
            // Chercher la correction de cet étudiant pour cette activité
            const studentCorrections = correctionsMap[student.id] || {};
            const correction = studentCorrections[Number(activityInfo.id)];
            
            if (correction) {
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
            } else if (includeAllStudents) {
              // Créer un placeholder pour les étudiants sans correction
              let classId = null;
              let className = 'Classe non attribuée';
              
              // Déterminer la classe à partir de allClasses si disponible
              if (student.allClasses && student.allClasses.length > 0) {
                classId = student.allClasses[0].classId;
                className = student.allClasses[0].className || `Classe ${classId}`;
              }
              
              const emptyCorrection = createEmptyCorrection(
                student.id,
                Number(activityInfo.id),
                classId,
                `${student.last_name} ${student.first_name}`,
                activity?.name || `Activité ${activityInfo.id}`,
                className
              );
              
              // Ajouter le placeholder directement aux corrections de cette activité
              result[activityKey].corrections.push(emptyCorrection);
            }
          });
        }
      });
      break;
  }
  
  return result;
};

export const allCorrectionsDataProcessingService = {
  organizeAllCorrectionsData
};