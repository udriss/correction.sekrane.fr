import { 
  ArrangementType, 
  SubArrangementType
} from './types';

import { Student, CorrectionAutreEnriched, ActivityAutre } from '@/lib/types';

interface OrganizeDataParams {
  corrections: CorrectionAutreEnriched[];
  includeAllStudents: boolean;
  filterActivity: number | 'all';
  filterSubClass: string | 'all';
  arrangement: ArrangementType;
  subArrangement: SubArrangementType;
  classData: any;
  uniqueSubClasses: { id: number | string; name: string }[];
  uniqueActivities: { id: number | string; name: string }[];
  students: Student[];
  getActivityById: (activityId: number) => any;
  getStudentById: (studentId: number | null) => Student | undefined;
}

const organizeData = ({
  corrections,
  includeAllStudents,
  filterActivity,
  filterSubClass,
  arrangement,
  subArrangement,
  classData,
  uniqueSubClasses,
  uniqueActivities,
  students,
  getActivityById,
  getStudentById
}: OrganizeDataParams) => {
  const result: any = {};
  
  // Si l'option pour inclure tous les étudiants est activée, préparer une liste d'étudiants à inclure
  let studentsToInclude: Student[] = [];
  
  // Créer une table de hachage pour les corrections existantes
  // Structure: { studentId: { activityId: correction } }
  const correctionsMap: Record<number, Record<number, CorrectionAutreEnriched>> = {};
  
  // Remplir la table de hachage avec les corrections existantes
  corrections.forEach(correction => {
    if (correction.student_id !== null) {
      if (!correctionsMap[correction.student_id]) {
        correctionsMap[correction.student_id] = {};
      }
      correctionsMap[correction.student_id][correction.activity_id] = correction;
    }
  });
  
  if (includeAllStudents) {
    // Filtrer les étudiants en fonction du groupe sélectionné
    if (filterSubClass !== 'all') {
      const subClassValue = parseInt(filterSubClass);
      studentsToInclude = students.filter(s => s.sub_class === subClassValue);
    } else {
      // Si aucun groupe spécifique n'est sélectionné, inclure tous les étudiants
      studentsToInclude = [...students];
    }
  }
  
  // Premier niveau d'organisation (arrangement principal)
  switch (arrangement) {
    case 'student':
      // D'abord traiter les corrections existantes
      corrections.forEach(correction => {
        const student = getStudentById(correction.student_id);
        if (!student) return;
        
        const studentKey = `${student.last_name} ${student.first_name}`;
        if (!result[studentKey]) {
          result[studentKey] = {
            info: { student },
            items: {}
          };
        }
        
        // Deuxième niveau (sous-arrangement)
        if (subArrangement === 'activity') {
          const activity = getActivityById(correction.activity_id);
          const activityKey = activity?.name || `Activité ${correction.activity_id}`;
          
          if (!result[studentKey].items[activityKey]) {
            result[studentKey].items[activityKey] = {
              info: { activity },
              corrections: []
            };
          }
          
          result[studentKey].items[activityKey].corrections.push(correction);
        } 
        else if (subArrangement === 'class') {
          // Déterminer la classe de l'étudiant (on utilise la classe générale)
          const classKey = classData.name || 'Classe';
          
          if (!result[studentKey].items[classKey]) {
            result[studentKey].items[classKey] = {
              info: { className: classData.name },
              corrections: []
            };
          }
          
          result[studentKey].items[classKey].corrections.push(correction);
        }
        else if (subArrangement === 'subclass') {
          // Déterminer le groupe de l'étudiant
          const subClass = student.sub_class;
          const subClassName = subClass 
            ? uniqueSubClasses.find(sc => sc.id === subClass)?.name || `Groupe ${subClass}`
            : 'Sans groupe';
          
          if (!result[studentKey].items[subClassName]) {
            result[studentKey].items[subClassName] = {
              info: { subClass },
              corrections: []
            };
          }
          
          result[studentKey].items[subClassName].corrections.push(correction);
        }
        else {
          // Pas de sous-arrangement, mettre directement les corrections
          if (!result[studentKey].corrections) {
            result[studentKey].corrections = [];
          }
          result[studentKey].corrections.push(correction);
        }
      });
      
      // Ensuite, ajouter les étudiants sans correction si l'option est activée
      if (includeAllStudents) {
        studentsToInclude.forEach(student => {
          const studentKey = `${student.last_name} ${student.first_name}`;
          
          // Vérifier si l'étudiant a déjà été ajouté via une correction
          if (!result[studentKey]) {
            result[studentKey] = {
              info: { student },
              items: {}
            };
          }
          
          // Pour chaque activité sélectionnée, ajouter un placeholder
          if (subArrangement === 'activity') {
            // Si une activité spécifique est sélectionnée
            if (filterActivity !== 'all') {
              const activity = getActivityById(filterActivity as number);
              const activityKey = activity?.name || `Activité ${filterActivity}`;
              const correctionKey = `${student.id}_${filterActivity}`;
              
              // Vérifier si l'étudiant a déjà une correction pour cette activité
              if (!correctionsMap[Number(student.id)] || !correctionsMap[Number(student.id)][Number(filterActivity)]) {
                if (!result[studentKey].items[activityKey]) {
                  result[studentKey].items[activityKey] = {
                    info: { activity },
                    corrections: []
                  };
                }
                
                result[studentKey].items[activityKey].corrections.push({
                  id: -1, // ID négatif pour marquer comme placeholder
                  student_id: student.id,
                  activity_id: filterActivity as number,
                  placeholder: true,
                  isPlaceholder: true,
                  grade: null,
                  status: 'NON_NOTE'
                });
              }
            } 
            // Si toutes les activités sont sélectionnées et qu'il y a des activités
            else if (uniqueActivities.length > 0) {
              // Parcourir toutes les activités pour ajouter un placeholder pour chacune
              uniqueActivities.forEach(activity => {
                const activityKey = activity.name || `Activité ${activity.id}`;
                const correctionKey = `${student.id}_${activity.id}`;
                
                // Ajouter seulement si l'étudiant n'a pas déjà une correction pour cette activité
                if (!correctionsMap[Number(student.id)] || !correctionsMap[Number(student.id)][Number(activity.id)]) {
                  if (!result[studentKey].items[activityKey]) {
                    result[studentKey].items[activityKey] = {
                      info: { activity },
                      corrections: []
                    };
                  }
                  
                  // Vérifier si nous n'avons pas déjà ajouté un placeholder
                  const hasPlaceholder = result[studentKey].items[activityKey].corrections.some(
                    (c: any) => c.student_id === student.id && c.activity_id === activity.id && c.placeholder
                  );
                  
                  if (!hasPlaceholder) {
                    result[studentKey].items[activityKey].corrections.push({
                      id: -1,
                      student_id: student.id,
                      activity_id: activity.id,
                      placeholder: true,
                      isPlaceholder: true,
                      grade: null,
                      status: 'NON_NOTE'
                    });
                  }
                }
              });
            }
          } 
          else if (subArrangement === 'class') {
            const classKey = classData.name || 'Classe';
            
            if (!result[studentKey].items[classKey]) {
              result[studentKey].items[classKey] = {
                info: { className: classData.name },
                corrections: [{
                  id: -1,
                  student_id: student.id,
                  activity_id: filterActivity !== 'all' ? filterActivity as number : (uniqueActivities[0]?.id || 0),
                  placeholder: true,
                  isPlaceholder: true,
                  grade: null,
                  status: 'NON_NOTE'
                }]
              };
            }
          }
          else if (subArrangement === 'subclass') {
            const subClass = student.sub_class;
            const subClassName = subClass 
              ? uniqueSubClasses.find(sc => sc.id === subClass)?.name || `Groupe ${subClass}`
              : 'Sans groupe';
            
            if (!result[studentKey].items[subClassName]) {
              result[studentKey].items[subClassName] = {
                info: { subClass },
                corrections: [{
                  id: -1,
                  student_id: student.id,
                  activity_id: filterActivity !== 'all' ? filterActivity as number : (uniqueActivities[0]?.id || 0),
                  placeholder: true,
                  isPlaceholder: true,
                  grade: null,
                  status: 'NON_NOTE'
                }]
              };
            }
          }
          else {
            // Pas de sous-arrangement
            if (!result[studentKey].corrections) {
              result[studentKey].corrections = [];
            }
            
            // Vérifier le statut pour chaque activité individuellement
            if (filterActivity !== 'all') {
              // Si une activité spécifique est sélectionnée, vérifier si l'étudiant a déjà une correction pour cette activité
              const correctionKey = `${student.id}_${filterActivity}`;
              
              if (!correctionsMap[Number(student.id)] || !correctionsMap[Number(student.id)][Number(filterActivity)]) {
                // Ajouter uniquement si aucune correction n'existe déjà
                result[studentKey].corrections.push({
                  id: -1,
                  student_id: student.id,
                  activity_id: filterActivity as number,
                  placeholder: true,
                  isPlaceholder: true,
                  grade: null,
                  status: 'NON_NOTE'
                });
              }
            } else {
              // Si toutes les activités sont sélectionnées, vérifier chaque activité individuellement
              uniqueActivities.forEach(activity => {
                const correctionKey = `${student.id}_${activity.id}`;
                
                if (!correctionsMap[Number(student.id)] || !correctionsMap[Number(student.id)][Number(activity.id)]) {
                  // Vérifier si un placeholder pour cette activité n'existe pas déjà
                  const hasPlaceholder = result[studentKey].corrections.some(
                    (c: any) => c.student_id === student.id && c.activity_id === activity.id && c.placeholder
                  );
                  
                  if (!hasPlaceholder) {
                    // Ajouter un placeholder uniquement pour les activités sans correction existante
                    result[studentKey].corrections.push({
                      id: -1,
                      student_id: student.id,
                      activity_id: activity.id,
                      placeholder: true,
                      isPlaceholder: true,
                      grade: null,
                      status: 'NON_NOTE'
                    });
                  }
                }
              });
            }
          }
        });
      }
      break;
      
    case 'class':
      // Par classe principale (tous les étudiants sont dans la même classe)
      const className = classData.name || 'Classe';
      
      if (!result[className]) {
        result[className] = {
          info: { className: classData.name },
          items: {}
        };
      }
      
      // Traiter d'abord les corrections existantes
      corrections.forEach(correction => {
        const student = getStudentById(correction.student_id);
        if (!student) return;
        
        if (subArrangement === 'student') {
          const studentKey = `${student.last_name} ${student.first_name}`;
          
          if (!result[className].items[studentKey]) {
            result[className].items[studentKey] = {
              info: { student },
              corrections: []
            };
          }
          
          result[className].items[studentKey].corrections.push(correction);
        } 
        else if (subArrangement === 'activity') {
          const activity = getActivityById(correction.activity_id);
          const activityKey = activity?.name || `Activité ${correction.activity_id}`;
          
          if (!result[className].items[activityKey]) {
            result[className].items[activityKey] = {
              info: { activity },
              corrections: []
            };
          }
          
          result[className].items[activityKey].corrections.push(correction);
        }
        else if (subArrangement === 'subclass') {
          // Sous-arrangement par groupe au sein de la classe
          const subClass = student.sub_class;
          const subClassName = subClass 
            ? uniqueSubClasses.find(sc => sc.id === subClass)?.name || `Groupe ${subClass}`
            : 'Sans groupe';
          
          if (!result[className].items[subClassName]) {
            result[className].items[subClassName] = {
              info: { subClass },
              corrections: []
            };
          }
          
          result[className].items[subClassName].corrections.push(correction);
        }
        else {
          // Pas de sous-arrangement
          if (!result[className].corrections) {
            result[className].corrections = [];
          }
          result[className].corrections.push(correction);
        }
      });
      
      // Ajouter les étudiants sans correction si l'option est activée
      if (includeAllStudents) {
        studentsToInclude.forEach(student => {
          if (subArrangement === 'student') {
            const studentKey = `${student.last_name} ${student.first_name}`;
            
            // Vérifier si cet étudiant a déjà été ajouté via une correction
            if (!result[className].items[studentKey]) {
              result[className].items[studentKey] = {
                info: { student },
                corrections: []
              };
            } 
            
            // Si l'étudiant existe mais n'a pas de correction pour l'activité filtrée
            if (filterActivity !== 'all') {
              const hasActivityCorrection = result[className].items[studentKey].corrections.some(
                (c: any) => c.activity_id === filterActivity
              );
              
              if (!hasActivityCorrection) {
                result[className].items[studentKey].corrections.push({
                  id: -1,
                  student_id: student.id,
                  activity_id: filterActivity as number,
                  placeholder: true,
                  isPlaceholder: true,
                  grade: null,
                  status: 'NON_NOTE'
                });
              }
            } else {
              // Pour toutes les activités
              uniqueActivities.forEach(activity => {
                const hasActivityCorrection = result[className].items[studentKey].corrections.some(
                  (c: any) => c.activity_id === activity.id
                );
                
                if (!hasActivityCorrection) {
                  result[className].items[studentKey].corrections.push({
                    id: -1,
                    student_id: student.id,
                    activity_id: activity.id,
                    placeholder: true,
                    isPlaceholder: true,
                    grade: null,
                    status: 'NON_NOTE'
                  });
                }
              });
            }
          } 
          else if (subArrangement === 'activity') {
            // Si une activité spécifique est sélectionnée
            if (filterActivity !== 'all') {
              const activity = getActivityById(filterActivity as number);
              const activityKey = activity?.name || `Activité ${filterActivity}`;
              
              if (!result[className].items[activityKey]) {
                result[className].items[activityKey] = {
                  info: { activity },
                  corrections: []
                };
              }
              
              // Vérifier si cet étudiant a déjà une correction pour cette activité
              const hasStudentCorrection = result[className].items[activityKey].corrections.some(
                (c: any) => c.student_id === student.id
              );
              
              if (!hasStudentCorrection) {
                result[className].items[activityKey].corrections.push({
                  id: -1,
                  student_id: student.id,
                  activity_id: filterActivity as number,
                  placeholder: true,
                  isPlaceholder: true,
                  grade: null,
                  status: 'NON_NOTE'
                });
              }
            } 
            // Si toutes les activités sont sélectionnées
            else if (uniqueActivities.length > 0) {
              // Parcourir toutes les activités au lieu de juste la première
              uniqueActivities.forEach(activity => {
                const activityKey = activity.name || `Activité ${activity.id}`;
                
                if (!result[className].items[activityKey]) {
                  result[className].items[activityKey] = {
                    info: { activity },
                    corrections: []
                  };
                }
                
                // Vérifier si cet étudiant a déjà une correction pour cette activité
                const hasStudentCorrection = result[className].items[activityKey].corrections.some(
                  (c: any) => c.student_id === student.id
                );
                
                if (!hasStudentCorrection) {
                  result[className].items[activityKey].corrections.push({
                    id: -1,
                    student_id: student.id,
                    activity_id: activity.id,
                    placeholder: true,
                    isPlaceholder: true,
                    grade: null,
                    status: 'NON_NOTE'
                  });
                }
              });
            }
          }
          else if (subArrangement === 'subclass') {
            const subClass = student.sub_class;
            const subClassName = subClass 
              ? uniqueSubClasses.find(sc => sc.id === subClass)?.name || `Groupe ${subClass}`
              : 'Sans groupe';
            
            if (!result[className].items[subClassName]) {
              result[className].items[subClassName] = {
                info: { subClass },
                corrections: []
              };
            }
            
            // Vérifier si cet étudiant a déjà une correction dans ce groupe
            const hasStudentCorrection = result[className].items[subClassName].corrections.some(
              (c: any) => c.student_id === student.id
            );
            
            if (!hasStudentCorrection) {
              // Si une activité spécifique est sélectionnée
              if (filterActivity !== 'all') {
                result[className].items[subClassName].corrections.push({
                  id: -1,
                  student_id: student.id,
                  activity_id: filterActivity as number,
                  placeholder: true,
                  isPlaceholder: true,
                  grade: null,
                  status: 'NON_NOTE'
                });
              } 
              // Si toutes les activités sont sélectionnées, ajouter un placeholder pour chaque activité
              else if (uniqueActivities.length > 0) {
                uniqueActivities.forEach(activity => {
                  // Vérifier si l'étudiant a déjà un placeholder pour cette activité
                  const hasActivityPlaceholder = result[className].items[subClassName].corrections.some(
                    (c: any) => c.student_id === student.id && c.activity_id === activity.id
                  );
                  
                  if (!hasActivityPlaceholder) {
                    result[className].items[subClassName].corrections.push({
                      id: -1,
                      student_id: student.id,
                      activity_id: activity.id,
                      placeholder: true,
                      isPlaceholder: true,
                      grade: null,
                      status: 'NON_NOTE'
                    });
                  }
                });
              }
            }
          }
          else {
            // Pas de sous-arrangement
            if (!result[className].corrections) {
              result[className].corrections = [];
            }
            
            // Vérifier si cet étudiant a déjà une correction
            // Si une activité spécifique est sélectionnée
            if (filterActivity !== 'all') {
              const hasStudentActivityCorrection = result[className].corrections.some(
                (c: any) => c.student_id === student.id && c.activity_id === filterActivity
              );
              
              if (!hasStudentActivityCorrection) {
                result[className].corrections.push({
                  id: -1,
                  student_id: student.id,
                  activity_id: filterActivity as number,
                  placeholder: true,
                  isPlaceholder: true,
                  grade: null,
                  status: 'NON_NOTE'
                });
              }
            } 
            // Si toutes les activités sont sélectionnées
            else if (uniqueActivities.length > 0) {
              uniqueActivities.forEach(activity => {
                const hasStudentActivityCorrection = result[className].corrections.some(
                  (c: any) => c.student_id === student.id && c.activity_id === activity.id
                );
                
                if (!hasStudentActivityCorrection) {
                  result[className].corrections.push({
                    id: -1,
                    student_id: student.id,
                    activity_id: activity.id,
                    placeholder: true,
                    isPlaceholder: true,
                    grade: null,
                    status: 'NON_NOTE'
                  });
                }
              });
            }
          }
        });
      }
      break;
      
    case 'subclass':
      // Créer une structure organisée pour les sous-classes
      const subClassStructure: Record<string, any> = {};
      
      // Créer d'abord toutes les entrées de sous-classes pour assurer l'ordre
      uniqueSubClasses.forEach(subClassObj => {
        const subClassName = subClassObj.name || `Groupe ${subClassObj.id}`;
        subClassStructure[subClassName] = {
          info: { subClass: subClassObj.id },
          items: {}
        };
      });
      
      // Ajouter aussi la catégorie "Sans groupe" si nécessaire
      subClassStructure['Sans groupe'] = {
        info: { subClass: null },
        items: {}
      };
      
      // Traiter d'abord les corrections existantes
      corrections.forEach(correction => {
        const student = getStudentById(correction.student_id);
        if (!student) return;
        
        const subClass = student.sub_class;
        // Trouver le nom exact du sous-classe par son ID
        const subClassObj = uniqueSubClasses.find(sc => Number(sc.id) === Number(subClass));
        const subClassName = subClassObj ? subClassObj.name : (subClass ? `Groupe ${subClass}` : 'Sans groupe');
        
        if (!subClassStructure[subClassName]) {
          subClassStructure[subClassName] = {
            info: { subClass },
            items: {}
          };
        }
        
        // Deuxième niveau (sous-arrangement)
        if (subArrangement === 'student') {
          const studentKey = `${student.last_name} ${student.first_name}`;
          
          if (!subClassStructure[subClassName].items[studentKey]) {
            subClassStructure[subClassName].items[studentKey] = {
              info: { student },
              corrections: []
            };
          }
          
          subClassStructure[subClassName].items[studentKey].corrections.push(correction);
        } 
        else if (subArrangement === 'activity') {
          const activity = getActivityById(correction.activity_id);
          const activityKey = activity?.name || `Activité ${correction.activity_id}`;
          
          if (!subClassStructure[subClassName].items[activityKey]) {
            subClassStructure[subClassName].items[activityKey] = {
              info: { activity },
              corrections: []
            };
          }
          
          subClassStructure[subClassName].items[activityKey].corrections.push(correction);
        }
        else if (subArrangement === 'class') {
          // Sous-arrangement par classe principale
          const className = classData.name || 'Classe';
          
          if (!subClassStructure[subClassName].items[className]) {
            subClassStructure[subClassName].items[className] = {
              info: { className: classData.name },
              corrections: []
            };
          }
          
          subClassStructure[subClassName].items[className].corrections.push(correction);
        }
        else {
          // Pas de sous-arrangement
          if (!subClassStructure[subClassName].corrections) {
            subClassStructure[subClassName].corrections = [];
          }
          subClassStructure[subClassName].corrections.push(correction);
        }
      });
      
      // Ajouter les étudiants sans correction si l'option est activée
      if (includeAllStudents) {
        studentsToInclude.forEach(student => {
          const subClass = student.sub_class;
          // Utiliser la même logique pour trouver le nom exact du sous-classe
          const subClassObj = uniqueSubClasses.find(sc => Number(sc.id) === Number(subClass));
          const subClassName = subClassObj ? subClassObj.name : (subClass ? `Groupe ${subClass}` : 'Sans groupe');
          
          if (!subClassStructure[subClassName]) {
            subClassStructure[subClassName] = {
              info: { subClass },
              items: {}
            };
          }
          
          if (subArrangement === 'student') {
            const studentKey = `${student.last_name} ${student.first_name}`;
            
            if (!subClassStructure[subClassName].items[studentKey]) {
              subClassStructure[subClassName].items[studentKey] = {
                info: { student },
                corrections: []
              };
            }
            
            // Si une activité spécifique est sélectionnée
            if (filterActivity !== 'all') {
              const hasActivityCorrection = subClassStructure[subClassName].items[studentKey].corrections.some(
                (c: any) => c.activity_id === filterActivity
              );
              
              if (!hasActivityCorrection) {
                subClassStructure[subClassName].items[studentKey].corrections.push({
                  id: -1,
                  student_id: student.id,
                  activity_id: filterActivity as number,
                  placeholder: true,
                  isPlaceholder: true,
                  grade: null,
                  status: 'NON_NOTE'
                });
              }
            } 
            // Si toutes les activités sont sélectionnées
            else if (uniqueActivities.length > 0) {
              uniqueActivities.forEach(activity => {
                const hasActivityCorrection = subClassStructure[subClassName].items[studentKey].corrections.some(
                  (c: any) => c.activity_id === activity.id
                );
                
                if (!hasActivityCorrection) {
                  subClassStructure[subClassName].items[studentKey].corrections.push({
                    id: -1,
                    student_id: student.id,
                    activity_id: activity.id,
                    placeholder: true,
                    isPlaceholder: true,
                    grade: null,
                    status: 'NON_NOTE'
                  });
                }
              });
            }
          } 
          else if (subArrangement === 'activity') {
            // Si une activité spécifique est sélectionnée
            if (filterActivity !== 'all') {
              const activity = getActivityById(filterActivity as number);
              const activityKey = activity?.name || `Activité ${filterActivity}`;
              
              if (!subClassStructure[subClassName].items[activityKey]) {
                subClassStructure[subClassName].items[activityKey] = {
                  info: { activity },
                  corrections: []
                };
              }
              
              // Vérifier si cet étudiant a déjà une correction pour cette activité
              const hasStudentCorrection = subClassStructure[subClassName].items[activityKey].corrections.some(
                (c: any) => c.student_id === student.id
              );
              
              if (!hasStudentCorrection) {
                subClassStructure[subClassName].items[activityKey].corrections.push({
                  id: -1,
                  student_id: student.id,
                  activity_id: filterActivity as number,
                  placeholder: true,
                  isPlaceholder: true,
                  grade: null,
                  status: 'NON_NOTE'
                });
              }
            }
            // Si toutes les activités sont sélectionnées
            else if (uniqueActivities.length > 0) {
              uniqueActivities.forEach(activity => {
                const activityKey = activity.name || `Activité ${activity.id}`;
                
                if (!subClassStructure[subClassName].items[activityKey]) {
                  subClassStructure[subClassName].items[activityKey] = {
                    info: { activity },
                    corrections: []
                  };
                }
                
                // Vérifier si cet étudiant a déjà une correction pour cette activité
                const hasStudentCorrection = subClassStructure[subClassName].items[activityKey].corrections.some(
                  (c: any) => c.student_id === student.id
                );
                
                if (!hasStudentCorrection) {
                  subClassStructure[subClassName].items[activityKey].corrections.push({
                    id: -1,
                    student_id: student.id,
                    activity_id: activity.id,
                    placeholder: true,
                    isPlaceholder: true,
                    grade: null,
                    status: 'NON_NOTE'
                  });
                }
              });
            }
          }
          else if (subArrangement === 'class') {
            const className = classData.name || 'Classe';
            
            if (!subClassStructure[subClassName].items[className]) {
              subClassStructure[subClassName].items[className] = {
                info: { className: classData.name },
                corrections: []
              };
            }
            
            // Si une activité spécifique est sélectionnée
            if (filterActivity !== 'all') {
              // Vérifier si cet étudiant a déjà une correction dans cette classe pour cette activité
              const hasStudentActivityCorrection = subClassStructure[subClassName].items[className].corrections.some(
                (c: any) => c.student_id === student.id && c.activity_id === filterActivity
              );
              
              if (!hasStudentActivityCorrection) {
                subClassStructure[subClassName].items[className].corrections.push({
                  id: -1,
                  student_id: student.id,
                  activity_id: filterActivity as number,
                  placeholder: true,
                  isPlaceholder: true,
                  grade: null,
                  status: 'NON_NOTE'
                });
              }
            }
            // Si toutes les activités sont sélectionnées
            else if (uniqueActivities.length > 0) {
              uniqueActivities.forEach(activity => {
                // Vérifier si cet étudiant a déjà une correction dans cette classe pour cette activité
                const hasStudentActivityCorrection = subClassStructure[subClassName].items[className].corrections.some(
                  (c: any) => c.student_id === student.id && c.activity_id === activity.id
                );
                
                if (!hasStudentActivityCorrection) {
                  subClassStructure[subClassName].items[className].corrections.push({
                    id: -1,
                    student_id: student.id,
                    activity_id: activity.id,
                    placeholder: true,
                    isPlaceholder: true,
                    grade: null,
                    status: 'NON_NOTE'
                  });
                }
              });
            }
          }
          else {
            // Pas de sous-arrangement
            if (!subClassStructure[subClassName].corrections) {
              subClassStructure[subClassName].corrections = [];
            }
            
            // Si une activité spécifique est sélectionnée
            if (filterActivity !== 'all') {
              // Vérifier si cet étudiant a déjà une correction pour cette activité
              const hasStudentActivityCorrection = subClassStructure[subClassName].corrections.some(
                (c: any) => c.student_id === student.id && c.activity_id === filterActivity
              );
              
              if (!hasStudentActivityCorrection) {
                subClassStructure[subClassName].corrections.push({
                  id: -1,
                  student_id: student.id,
                  activity_id: filterActivity as number,
                  placeholder: true,
                  isPlaceholder: true,
                  grade: null,
                  status: 'NON_NOTE'
                });
              }
            }
            // Si toutes les activités sont sélectionnées
            else if (uniqueActivities.length > 0) {
              uniqueActivities.forEach(activity => {
                // Vérifier si cet étudiant a déjà une correction pour cette activité
                const hasStudentActivityCorrection = subClassStructure[subClassName].corrections.some(
                  (c: any) => c.student_id === student.id && c.activity_id === activity.id
                );
                
                if (!hasStudentActivityCorrection) {
                  subClassStructure[subClassName].corrections.push({
                    id: -1,
                    student_id: student.id,
                    activity_id: activity.id,
                    placeholder: true,
                    isPlaceholder: true,
                    grade: null,
                    status: 'NON_NOTE'
                  });
                }
              });
            }
          }
        });
      }
      
      // Transférer la structure ordonnée des sous-classes vers le résultat final
      Object.entries(subClassStructure).forEach(([subClassName, data]) => {
        // Ne pas inclure les groupes vides
        if (Object.keys(data.items).length > 0 || (data.corrections && data.corrections.length > 0)) {
          result[subClassName] = data;
        }
      });
      break;
      
    case 'activity':
      // Traiter d'abord les corrections existantes
      corrections.forEach(correction => {
        const activity = getActivityById(correction.activity_id);
        const activityKey = activity?.name || `Activité ${correction.activity_id}`;
        
        if (!result[activityKey]) {
          result[activityKey] = {
            info: { activity },
            items: {}
          };
        }
        
        // Deuxième niveau (sous-arrangement)
        if (subArrangement === 'student') {
          const student = getStudentById(correction.student_id);
          if (!student) return;
          
          const studentKey = `${student.last_name} ${student.first_name}`;
          
          if (!result[activityKey].items[studentKey]) {
            result[activityKey].items[studentKey] = {
              info: { student },
              corrections: []
            };
          }
          
          result[activityKey].items[studentKey].corrections.push(correction);
        } 
        else if (subArrangement === 'class') {
          // Sous-arrangement par classe principale
          const className = classData.name || 'Classe';
          
          if (!result[activityKey].items[className]) {
            result[activityKey].items[className] = {
              info: { className: classData.name },
              corrections: []
            };
          }
          
          result[activityKey].items[className].corrections.push(correction);
        }
        else if (subArrangement === 'subclass') {
          // Sous-arrangement par groupe
          const student = getStudentById(correction.student_id);
          if (!student) return;
          
          const subClass = student.sub_class;
          const subClassName = subClass 
            ? uniqueSubClasses.find(sc => sc.id === subClass)?.name || `Groupe ${subClass}`
            : 'Sans groupe';
          
          if (!result[activityKey].items[subClassName]) {
            result[activityKey].items[subClassName] = {
              info: { subClass },
              corrections: []
            };
          }
          
          result[activityKey].items[subClassName].corrections.push(correction);
        }
        else {
          // Pas de sous-arrangement
          if (!result[activityKey].corrections) {
            result[activityKey].corrections = [];
          }
          result[activityKey].corrections.push(correction);
        }
      });
      
      // Ajouter les étudiants sans correction si l'option est activée
      if (includeAllStudents) {
        // Pour l'activité filtrée ou pour TOUTES les activités si 'all' est sélectionné
        let targetActivities: any[] = [];
        
        if (filterActivity !== 'all') {
          targetActivities = [{ id: filterActivity, name: uniqueActivities.find(a => a.id === filterActivity)?.name || `Activité ${filterActivity}` }];
        } else {
          // Important: inclure TOUTES les activités et pas seulement la première
          targetActivities = [...uniqueActivities];
        }
        
        targetActivities.forEach(activity => {
          const activityKey = activity.name || `Activité ${activity.id}`;
          
          if (!result[activityKey]) {
            result[activityKey] = {
              info: { activity },
              items: {}
            };
          }
          
          studentsToInclude.forEach(student => {
            if (subArrangement === 'student') {
              const studentKey = `${student.last_name} ${student.first_name}`;
              
              if (!result[activityKey].items[studentKey]) {
                result[activityKey].items[studentKey] = {
                  info: { student },
                  corrections: []
                };
              }
              
              // Vérifier si l'étudiant a déjà une correction pour cette activité
              const hasActivityCorrection = result[activityKey].items[studentKey].corrections.some(
                (c: any) => c.activity_id === activity.id
              );
              
              if (!hasActivityCorrection) {
                result[activityKey].items[studentKey].corrections.push({
                  id: -1,
                  student_id: student.id,
                  activity_id: activity.id,
                  placeholder: true,
                  isPlaceholder: true,
                  grade: null,
                  status: 'NON_NOTE'
                });
              }
            } 
            else if (subArrangement === 'class') {
              const className = classData.name || 'Classe';
              
              if (!result[activityKey].items[className]) {
                result[activityKey].items[className] = {
                  info: { className: classData.name },
                  corrections: []
                };
              }
              
              // Vérifier si l'étudiant a déjà une correction pour cette activité dans cette classe
              const hasStudentCorrection = result[activityKey].items[className].corrections.some(
                (c: any) => c.student_id === student.id
              );
              
              if (!hasStudentCorrection) {
                result[activityKey].items[className].corrections.push({
                  id: -1,
                  student_id: student.id,
                  activity_id: activity.id,
                  placeholder: true,
                  isPlaceholder: true,
                  grade: null,
                  status: 'NON_NOTE'
                });
              }
            }
            else if (subArrangement === 'subclass') {
              const subClass = student.sub_class;
              const subClassName = subClass 
                ? uniqueSubClasses.find(sc => sc.id === subClass)?.name || `Groupe ${subClass}`
                : 'Sans groupe';
              
              if (!result[activityKey].items[subClassName]) {
                result[activityKey].items[subClassName] = {
                  info: { subClass },
                  corrections: []
                };
              }
              
              // Vérifier si l'étudiant a déjà une correction pour cette activité dans ce groupe
              const hasStudentCorrection = result[activityKey].items[subClassName].corrections.some(
                (c: any) => c.student_id === student.id
              );
              
              if (!hasStudentCorrection) {
                result[activityKey].items[subClassName].corrections.push({
                  id: -1,
                  student_id: student.id,
                  activity_id: activity.id,
                  placeholder: true,
                  isPlaceholder: true,
                  grade: null,
                  status: 'NON_NOTE'
                });
              }
            }
            else {
              // Pas de sous-arrangement
              if (!result[activityKey].corrections) {
                result[activityKey].corrections = [];
              }
              
              // Vérifier si l'étudiant a déjà une correction pour cette activité
              const hasStudentCorrection = result[activityKey].corrections.some(
                (c: any) => c.student_id === student.id
              );
              
              if (!hasStudentCorrection) {
                result[activityKey].corrections.push({
                  id: -1,
                  student_id: student.id,
                  activity_id: activity.id,
                  placeholder: true,
                  isPlaceholder: true,
                  grade: null,
                  status: 'NON_NOTE'
                });
              }
            }
          });
        });
      }
      break;
  }
  
  return result;
};

export const dataProcessingService = {
  organizeData
};