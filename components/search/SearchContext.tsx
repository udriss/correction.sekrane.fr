'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
// Import required icons
import CategoryIcon from '@mui/icons-material/Category';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CodeIcon from '@mui/icons-material/Code';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import GradeIcon from '@mui/icons-material/Grade';
import LinkIcon from '@mui/icons-material/Link';
import { debounce } from '@/utils/debounce';

// Define interfaces
export interface Category {
  id: number;
  name: string;
}

export interface Fragment {
  id: number;
  content: string;
  category_id?: number;
  categories?: Array<{id: number, name: string}> | number[];
  activity_id?: number;
  activity_name?: string;
  created_at: string;
  usage_count?: number;
}

export interface SearchResult {
  table: string;
  count: number;
  items: any[];
}

interface SearchContextType {
  // Search state
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isSearching: boolean;
  results: SearchResult[];
  error: string | null;
  
  // Filters
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  selectedTables: {
    categories: boolean;
    classes: boolean;
    students: boolean;
    activities: boolean;
    fragments: boolean;
  };
  
  // Tab management
  tabValue: number;
  setTabValue: (value: number) => void;
  
  // Results data
  totalResults: number;
  categories: Category[];
  
  // Fragment edit modal
  editModalOpen: boolean;
  editingFragment: Fragment | null;
  editingSuccess: boolean;
  
  // Methods
  handleSearch: (e?: React.FormEvent) => Promise<void>;
  handleClearSearch: () => void;
  handleTableFilterChange: (table: string) => void;
  handleEditFragment: (fragment: Fragment) => void;
  handleCloseEditModal: () => void;
  handleEditSuccess: (updatedFragment: Fragment) => void;
  
  // Utility functions
  getTableIcon: (table: string) => JSX.Element;
  getTableDisplayName: (table: string) => string;
  getResultLink: (table: string, id: number) => string;
  getResultLabel: (table: string, item: any) => string;
  getResultSecondaryText: (table: string, item: any) => string;
  getItemStats: (category: string, item: any) => { icon: JSX.Element; label: string | JSX.Element };

  // New state properties
  searchInputValue: string; // Input value that changes immediately
  isWaitingToSearch: boolean; // Indicates debounce waiting period
  hasSearched: boolean; // Indicates if search has been executed at least once
  
  // New methods
  setSearchInputValue: (value: string) => void;
  handleManualSearch: (e?: React.FormEvent) => Promise<void>; // For immediate search

  // Category management state and methods
  categoryDialogOpen: boolean;
  setCategoryDialogOpen: (open: boolean) => void;
  handleOpenCategoryDialog: () => void;
  updateCategories: (newCategories: Category[]) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchContextProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams?.get('q') || '';
  
  // State
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Fragment edit state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingFragment, setEditingFragment] = useState<Fragment | null>(null);
  const [editingSuccess, setEditingSuccess] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  
  // Table filters
  const [selectedTables, setSelectedTables] = useState({
    categories: true,
    classes: true,
    students: true,
    activities: true,
    fragments: true
  });
  
  // Calculate total results
  const totalResults = results.reduce((sum, category) => sum + category.count, 0);
  
  // Add a function to enhance search results with relationship data
  const enhanceSearchResults = (results: SearchResult[]): SearchResult[] => {
    // Create maps to track relationships
    const classStudentMap = new Map<number, Set<number>>();
    const studentClassMap = new Map<number, Set<number>>();
    const activityClassMap = new Map<number, Set<number>>();
    const categoryActivityMap = new Map<number, Set<number>>();
    const fragmentCategoryMap = new Map<number, Set<number>>();
  
    // First, build relationship maps from all available data
    results.forEach(category => {
      if (category.table === 'classes') {
        category.items.forEach(classItem => {
          if (!classStudentMap.has(classItem.id)) {
            classStudentMap.set(classItem.id, new Set());
          }
        });
      }
      
      if (category.table === 'students') {
        category.items.forEach(student => {
          if (student.class_id) {
            // Add student to class
            if (!classStudentMap.has(student.class_id)) {
              classStudentMap.set(student.class_id, new Set());
            }
            classStudentMap.get(student.class_id)?.add(student.id);
            
            // Add class to student
            if (!studentClassMap.has(student.id)) {
              studentClassMap.set(student.id, new Set());
            }
            studentClassMap.get(student.id)?.add(student.class_id);
          }
        });
      }
      
      if (category.table === 'activities') {
        category.items.forEach(activity => {
          if (activity.class_ids && Array.isArray(activity.class_ids)) {
            activity.class_ids.forEach((classId: number) => {
              if (!activityClassMap.has(activity.id)) {
                activityClassMap.set(activity.id, new Set());
              }
              activityClassMap.get(activity.id)?.add(classId);
            });
          }
          
          if (activity.category_id) {
            if (!categoryActivityMap.has(activity.category_id)) {
              categoryActivityMap.set(activity.category_id, new Set());
            }
            categoryActivityMap.get(activity.category_id)?.add(activity.id);
          }
        });
      }
      
      if (category.table === 'categories') {
        category.items.forEach(cat => {
          if (!categoryActivityMap.has(cat.id)) {
            categoryActivityMap.set(cat.id, new Set());
          }
        });
      }
      
      if (category.table === 'fragments') {
        category.items.forEach(fragment => {
          if (fragment.categories && Array.isArray(fragment.categories)) {
            fragment.categories.forEach((cat: any) => {
              const catId = typeof cat === 'object' ? cat.id : cat;
              if (catId) {
                if (!fragmentCategoryMap.has(fragment.id)) {
                  fragmentCategoryMap.set(fragment.id, new Set());
                }
                fragmentCategoryMap.get(fragment.id)?.add(catId);
              }
            });
          } else if (fragment.category_id) {
            if (!fragmentCategoryMap.has(fragment.id)) {
              fragmentCategoryMap.set(fragment.id, new Set());
            }
            fragmentCategoryMap.get(fragment.id)?.add(fragment.category_id);
          }
        });
      }
    });
    
    // Now enhance each result with relationship counts
    return results.map(category => {
      const enhancedItems = category.items.map(item => {
        const enhancedItem = { ...item };
        
        // Add relationship counts based on table type
        if (category.table === 'classes') {
          enhancedItem.student_count = classStudentMap.get(item.id)?.size || 0;
        }
        
        if (category.table === 'students') {
          enhancedItem.activity_count = (item.activities?.length) || 0;
          enhancedItem.class_count = studentClassMap.get(item.id)?.size || 0;
        }
        
        if (category.table === 'activities') {
          // Calculate average grade if available
          if (item.corrections && Array.isArray(item.corrections) && item.corrections.length > 0) {
            const validGrades = item.corrections
              .map((c: any) => parseFloat(c.grade))
              .filter((g: number) => !isNaN(g));
              
            if (validGrades.length > 0) {
              const avgGrade = validGrades.reduce((sum: number, grade: number) => sum + grade, 0) / validGrades.length;
              enhancedItem.avg_grade = avgGrade;
            }
          }
          
          enhancedItem.class_count = activityClassMap.get(item.id)?.size || 0;
        }
        
        if (category.table === 'categories') {
          enhancedItem.activity_count = categoryActivityMap.get(item.id)?.size || 0;
        }
        
        if (category.table === 'fragments') {
          enhancedItem.category_count = fragmentCategoryMap.get(item.id)?.size || 0;
        }
        
        return enhancedItem;
      });
      
      return { ...category, items: enhancedItems };
    });
  };
  
  // Fetch relationship data for metadata stats - add better error handling
  const fetchRelationshipData = async (results: SearchResult[]): Promise<SearchResult[]> => {
    try {
      // Extract IDs from search results
      const classIds = results
        .find(r => r.table === 'classes')?.items
        .map(item => item.id) || [];
        
      const studentIds = results
        .find(r => r.table === 'students')?.items
        .map(item => item.id) || [];
        
      const activityIds = results
        .find(r => r.table === 'activities')?.items
        .map(item => item.id) || [];
        
      const categoryIds = results
        .find(r => r.table === 'categories')?.items
        .map(item => item.id) || [];
        
      const fragmentIds = results
        .find(r => r.table === 'fragments')?.items
        .map(item => item.id) || [];
      
      // Only fetch data if we need it
      if (
        classIds.length === 0 && 
        studentIds.length === 0 && 
        activityIds.length === 0 && 
        categoryIds.length === 0 && 
        fragmentIds.length === 0
      ) {
        return results;
      }
      
      // Build query parameters
      const params = new URLSearchParams();
      if (classIds.length > 0) params.set('classIds', classIds.join(','));
      if (studentIds.length > 0) params.set('studentIds', studentIds.join(','));
      if (activityIds.length > 0) params.set('activityIds', activityIds.join(','));
      if (categoryIds.length > 0) params.set('categoryIds', categoryIds.join(','));
      if (fragmentIds.length > 0) params.set('fragmentIds', fragmentIds.join(','));
      
      // Fetch relationships data with GET
      const response = await fetch(`/api/relationships?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch relationship data');
      }
      
      const relationshipData = await response.json();
      
      // Now enhance results with the relationship data
      return results.map(category => {
        const items = category.items.map(item => {
          const enhanced = { ...item };
          
          if (category.table === 'classes' && relationshipData.classStudents) {
            // Count unique students in this class
            enhanced.student_count = relationshipData.classStudents
              .filter((rel: any) => rel.class_id === item.id)
              .length;
              
            // Count activities assigned to this class
            if (relationshipData.classActivities) {
              enhanced.activity_count = relationshipData.classActivities
                .filter((rel: any) => rel.class_id === item.id)
                .length;
            }
          }
          
          if (category.table === 'students' && relationshipData.studentActivities) {
            // Count activities this student has corrections for
            const studentCorrections = relationshipData.studentActivities
              .filter((rel: any) => rel.student_id === item.id);
            
            // Total assigned activities
            enhanced.activity_count = studentCorrections.length;
            
            // Count graded activities vs pending activities
            const gradedActivities = studentCorrections.filter((rel: any) => rel.grade !== null && rel.grade !== undefined);
            enhanced.graded_activity_count = gradedActivities.length;
            enhanced.pending_activity_count = enhanced.activity_count - enhanced.graded_activity_count;
            
            // Calculate average grade for this student across all graded activities
            if (gradedActivities.length > 0) {
              const grades = gradedActivities.map((correction: any) => {
                const grade = parseFloat(correction.grade);
                return isNaN(grade) ? 0 : grade;
              }).filter((g: number) => g > 0);
              
              if (grades.length > 0) {
                enhanced.avg_grade = grades.reduce((sum: number, grade: number) => sum + grade, 0) / grades.length;
              }
            }
          }
          
          if (category.table === 'activities') {
            // Get activity data including points
            if (relationshipData.activitiesData) {
              const activityData = relationshipData.activitiesData.find(
                (a: any) => a.id === item.id
              );
              
              if (activityData) {
                // Add points data if not already present
                if (!enhanced.experimental_points && activityData.experimental_points !== undefined) {
                  enhanced.experimental_points = activityData.experimental_points;
                }
                if (!enhanced.theoretical_points && activityData.theoretical_points !== undefined) {
                  enhanced.theoretical_points = activityData.theoretical_points;
                }
              }
            }
            
            if (relationshipData.activityCorrections) {
              // Get all corrections for this activity
              const activityCorrections = relationshipData.activityCorrections
                .filter((rel: any) => rel.activity_id === item.id);
              
              if (activityCorrections.length > 0) {
                // Calculate total points possible for this activity
                const totalPossiblePoints = (
                  (parseFloat(enhanced.experimental_points) || 0) + 
                  (parseFloat(enhanced.theoretical_points) || 0)
                );
                
                // Calculate average grade - normalize to a scale of 20 if needed
                const validGrades = activityCorrections
                  .map((c: any) => parseFloat(c.grade))
                  .filter((g: number) => !isNaN(g));
                  
                if (validGrades.length > 0) {
                  const rawAvg = validGrades.reduce((sum: number, g: number) => sum + g, 0) / validGrades.length;
                  
                  // Store both raw average and normalized to /20
                  enhanced.avg_grade_raw = rawAvg;
                  enhanced.avg_grade = totalPossiblePoints > 0 ? 
                    (rawAvg / totalPossiblePoints) * 20 : 
                    rawAvg;
                    
                  // Add correction count
                  enhanced.correction_count = validGrades.length;
                }
              }
            }
          }
          
          if (category.table === 'categories' && relationshipData.categoryActivities) {
            // Add activity count
            enhanced.activity_count = relationshipData.categoryActivities
              .filter((rel: any) => rel.category_id === item.id)
              .length;
          }
          
          if (category.table === 'fragments' && relationshipData.fragmentCategories) {
            // Add category count
            enhanced.category_count = relationshipData.fragmentCategories
              .filter((rel: any) => rel.fragment_id === item.id)
              .length;
          }
          
          return enhanced;
        });
        
        return { ...category, items };
      });
    } catch (error: any) {
      console.error('Error enhancing search results:', error);
      
      // Check for database connection error and rethrow to be handled by the caller
      if (error.message && (
        error.message.includes('too many connections') || 
        error.message.includes('ECONNRESET') ||
        error.message.includes('Connection refused')
      )) {
        throw error;
      }
      
      // For other errors, return unenhanced results
      return results;
    }
  };

  // Handle search form submission
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!searchTerm || searchTerm.length < 1) {
      setError('Saisir au moins 1 caractère pour effectuer une recherche');
      return;
    }
    
    setError(null);
    setIsSearching(true);
    
    try {
      // Build tables parameter for API
      const enabledTables = Object.entries(selectedTables)
        .filter(([_, enabled]) => enabled)
        .map(([table]) => table)
        .join(',');
      
      // Update URL with search parameters
      const params = new URLSearchParams();
      params.set('q', searchTerm);
      if (enabledTables !== 'categories,classes,students,activities,fragments') {
        params.set('tables', enabledTables);
      }
      router.push(`/recherches?${params.toString()}`);
      
      // Call the API
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}&tables=${enabledTables}`);
      
      // Try to parse the response to get possible error message
      const data = await response.json();
      setHasSearched(true);

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la recherche');
      }
      
      // Initial results
      const rawResults = data.results || [];
      
      try {
        // Fetch relationship data and enhance results
        const enhancedResults = await fetchRelationshipData(rawResults);
        
        // Set the enhanced results
        setResults(enhancedResults);
      } catch (relationshipError: any) {
        console.error('Error fetching relationship data:', relationshipError);
        
        // Check for database connection error
        if (relationshipError.message && relationshipError.message.includes('too many connections')) {
          setError('Erreur de connexion à la base de données : trop de connexions simultanées. Veuillez réessayer dans quelques instants.');
        } else {
          // Still show results, but without relationship data
          setResults(rawResults);
          console.warn('Using results without relationship data due to error');
        }
      }
    } catch (err: any) {
      console.error('Error searching:', err);
      
      // Handle specific database connection errors
      if (err.message && err.message.includes('too many connections')) {
        setError('Erreur de connexion à la base de données : trop de connexions simultanées. Veuillez réessayer dans quelques instants.');
      } else {
        setError(err instanceof Error ? `Erreur : ${err.message}` : 'Une erreur est survenue lors de la recherche');
      }
    } finally {
      setIsSearching(false);
      setIsWaitingToSearch(false); 
    }
  };


  
  // Handle table filter changes  
  const handleTableFilterChange = (table: string) => {
    setSelectedTables({
      ...selectedTables,
      [table]: !selectedTables[table as keyof typeof selectedTables]
    });
  };
  
  // Fragment edit handlers
  const handleEditFragment = (fragment: Fragment) => {
    // Format the fragment data if needed to match what the modal expects
    // Make sure categories are in the right format
    const formattedFragment = {
      ...fragment,
      // Keep existing id and content
      id: fragment.id,
      content: fragment.content,
      
      // Ensure categories is in the right format
      categories: Array.isArray(fragment.categories) 
        ? fragment.categories
        : fragment.category_id 
          ? [fragment.category_id] 
          : []
    };
    
    // Set the fragment data and open the modal
    setEditingFragment(formattedFragment);
    setEditModalOpen(true);
    setEditingSuccess(false);
  };

  const handleCloseEditModal = () => {
    if (!editingSuccess) {
      setEditModalOpen(false);
      setEditingFragment(null);
    }
  };
  
  const handleEditSuccess = (updatedFragment: Fragment) => {
    setEditingSuccess(true);
    
    // Update the fragment in the search results with better category handling
    setResults(prevResults => 
      prevResults.map(category => {
        if (category.table === 'fragments') {
          return {
            ...category,
            items: category.items.map(item => {
              if (item.id === updatedFragment.id) {
                // Ensure category_count is correctly updated based on the new categories
                const newItem = { 
                  ...item, 
                  ...updatedFragment,
                  // Set category_count directly from the categories array length
                  category_count: updatedFragment.categories 
                    ? Array.isArray(updatedFragment.categories) 
                      ? updatedFragment.categories.length 
                      : 1
                    : 0
                };
                
                return newItem;
              }
              return item;
            })
          };
        }
        return category;
      })
    );
    
    setNotification({
      open: true,
      message: 'Fragment mis à jour avec succès',
      severity: 'success'
    });
    
    setTimeout(() => {
      setEditModalOpen(false);
      setEditingFragment(null);
      setEditingSuccess(false);
    }, 1500);
  };
  
  // Implement utility functions
  const getTableIcon = (table: string) => {
    switch (table) {
      case 'categories': return <CategoryIcon />;
      case 'classes': return <SchoolIcon />;
      case 'students': return <PersonIcon />;
      case 'activities': return <AssignmentIcon />;
      case 'fragments': return <CodeIcon />;
      default: return <InfoOutlinedIcon />;
    }
  };
  
  const getTableDisplayName = (table: string) => {
    switch (table) {
      case 'categories': return 'Catégories';
      case 'classes': return 'Classes';
      case 'students': return 'Étudiants';
      case 'activities': return 'Activités';
      case 'fragments': return 'Fragments';
      default: return table;
    }
  };
  
  const getResultLink = (table: string, id: number) => {
    switch (table) {
      case 'categories': return '#'; // Return '#' instead of `/categories/${id}`
      case 'classes': return `/classes/${id}`;
      case 'students': return `/students/${id}`;
      case 'activities': return `/activities/${id}`;
      case 'fragments': return `/fragments/`;
      default: return '#';
    }
  };
  
  const getResultLabel = (table: string, item: any) => {
    switch (table) {
      case 'categories': return item.name;
      case 'classes': return `${item.name} (${item.academic_year || 'N/A'})`;
      case 'students': return `${item.firstname} ${item.lastname}`;
      case 'activities': return item.name;
      case 'fragments': return `Fragment #${item.id}${item.activity_id ? ` (Activité ${item.activity_id})` : ''}`;
      default: return 'Résultat';
    }
  };
  
  const getResultSecondaryText = (table: string, item: any) => {
    switch (table) {
      case 'categories': '';
      case 'classes': return item.description || 'Aucune description';
      case 'students': return item.email || item.student_id || 'Aucun détail supplémentaire';
      case 'activities': 
        // Create more detailed activity description
        let details = [];
        if (item.content) {
          details.push(item.content.length > 100 ? `${item.content.substring(0, 100)}...` : item.content);
        }

        
        // Add class info if available
        if (item.class_count !== undefined) {
          details.push(`Assigné à ${item.class_count} classe${item.class_count !== 1 ? 's' : ''}`);
        }
        
        return details.join(' • ') || 'Aucune description';
      case 'fragments': return item.content ? (item.content.length > 100 ? `${item.content.substring(0, 100)}...` : item.content) : 'Aucune description';
      default: return '';
    }
  };
  
  // Updated getItemStats function to match actual data relationships
  const getItemStats = (category: string, item: any) => {
    switch (category) {
      case 'classes':
        // Show both student and activity counts if available
        if (item.student_count !== undefined && item.activity_count !== undefined) {
          return {
            icon: <PersonIcon fontSize="small" />,
            label: `${item.student_count} étudiant${item.student_count !== 1 ? 's' : ''}, ${item.activity_count} activité${item.activity_count !== 1 ? 's' : ''}`
          };
        }
        // Otherwise just show student count
        return {
          icon: <PersonIcon fontSize="small" />,
          label: item.student_count !== undefined && item.student_count !== null 
            ? `${item.student_count} étudiant${item.student_count !== 1 ? 's' : ''}` 
            : 'Classe d\'étudiants'
        };
      
      case 'students':
        // Show graded activities, pending activities, and average grade if available
        if (item.graded_activity_count !== undefined && item.pending_activity_count !== undefined) {
          return {
            icon: <AssignmentIcon fontSize="small" />,
            label: (
              <>
                <span>
                  {item.graded_activity_count} évaluée{item.graded_activity_count !== 1 ? 's' : ''}, 
                  {' '}{item.pending_activity_count} en attente
                </span>
                {item.avg_grade !== undefined && (
                  <span style={{ display: 'block' }}>
                    Moy: {Number(item.avg_grade).toFixed(1)}/20
                  </span>
                )}
              </>
            )
          };
        }
        // Otherwise just show activity count
        return {
          icon: <AssignmentIcon fontSize="small" />,
          label: item.activity_count !== undefined && item.activity_count !== null
            ? `${item.activity_count} activité${item.activity_count !== 1 ? 's' : ''}` 
            : 'Profil étudiant'
        };
      
      case 'activities':
        // Show detailed grading stats when available
        if (item.avg_grade !== undefined) {
            return {
            icon: <GradeIcon fontSize="small" />,
            label: (
              <>
                <span>Moy: {Number(item.avg_grade).toFixed(1)}/20 ({item.correction_count || 0} corrections)</span>
                <br />
                <span>{item.experimental_points || 0} pts exp + {item.theoretical_points || 0} pts théo</span>
              </>
            )
            };
        }
        // Otherwise show points structure
        return {
          icon: <GradeIcon fontSize="small" />,
          label: `${item.experimental_points || 0} pts exp + ${item.theoretical_points || 0} pts théo`
        };
      
      case 'categories':
        // No direct relationship with activities in schema
        return {
          icon: <AssignmentIcon fontSize="small" />,
          label: item.fragment_count !== undefined && item.fragment_count !== null
            ? `${item.fragment_count} fragment${item.fragment_count !== 1 ? 's' : ''}` 
            : 'Catégorie'
        };
      
      case 'fragments':
        // Enhanced fragment stats display with explicit category information
        if (item.categories && Array.isArray(item.categories) && item.categories.length > 0) {
          return {
            icon: <CategoryIcon fontSize="small" />,
            label: `${item.categories.length} catégorie${item.categories.length !== 1 ? 's' : ''}`
          };
        } else if (item.category_count && item.category_count > 0) {
          return {
            icon: <CategoryIcon fontSize="small" />,
            label: `${item.category_count} catégorie${item.category_count !== 1 ? 's' : ''}`
          };
        } else if (item.activity_name) {
          return {
            icon: <LinkIcon fontSize="small" />,
            label: `${item.activity_name}`
          };
        } else {
          return {
            icon: <CodeIcon fontSize="small" />,
            label: 'Fragment de code'
          };
        }
      
      default:
        // Fallback to table name
        return {
          icon: getTableIcon(category),
          label: getTableDisplayName(category)
        };
    }
  };
  
  // Load categories for fragment editing
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Run search on initial load if query exists in URL
  useEffect(() => {
    if (initialQuery) {
      handleSearch();
    }
  }, [initialQuery]);

  // New state variables for better search handling - simplify to avoid race conditions
  const [searchInputValue, setSearchInputValue] = useState(initialQuery);
  const [isWaitingToSearch, setIsWaitingToSearch] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);
  const [debouncedTimeoutId, setDebouncedTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
  // Add category management state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  // Add method to handle opening category dialog
  const handleOpenCategoryDialog = () => {
    setCategoryDialogOpen(true);
  };
  
  // Add method to update categories after operations
  const updateCategories = (newCategories: Category[]) => {
    setCategories(newCategories);
  };

  
  // Handle input value changes with simpler implementation
  const handleSearchInputChange = (value: string) => {
    setSearchInputValue(value);
    
    // Cancel any pending debounce timer
    if (debouncedTimeoutId) {
      clearTimeout(debouncedTimeoutId);
    }
    
    // Only set waiting state and create timeout if input has content
    if (value.trim().length >= 1) {
      setIsWaitingToSearch(true);
      
      // Create new timer
      const timeoutId = setTimeout(() => {
        setSearchTerm(value); // First update the search term
        setTimeout(() => handleSearch(), 0); // Then trigger search on next tick
      }, 800);
      
      setDebouncedTimeoutId(timeoutId);
    } else {
      setIsWaitingToSearch(false);
    }
  };
  
  // Handle manual search (when user clicks search button)
  const handleManualSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Cancel any pending debounce timer
    if (debouncedTimeoutId) {
      clearTimeout(debouncedTimeoutId);
      setDebouncedTimeoutId(null);
    }
    
    if (!searchInputValue || searchInputValue.trim().length < 1) {
      setError('Veuillez saisir au moins 1 caractère pour effectuer une recherche');
      return;
    }
    
    setSearchTerm(searchInputValue);
    handleSearch(e);
  };
  
  // Clear search with improved state handling
  const handleClearSearch = () => {
    // Cancel any pending debounce timer
    if (debouncedTimeoutId) {
      clearTimeout(debouncedTimeoutId);
      setDebouncedTimeoutId(null);
    }
    
    setSearchTerm('');
    setSearchInputValue('');
    setResults([]);
    setIsWaitingToSearch(false);
    setHasSearched(false);
    setError(null); // Clear any error messages
    router.push('/recherches');
  };
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (debouncedTimeoutId) {
        clearTimeout(debouncedTimeoutId);
      }
    };
  }, [debouncedTimeoutId]);

  const contextValue: SearchContextType = {
    searchTerm,
    setSearchTerm,
    isSearching,
    results,
    error,
    showFilters,
    setShowFilters,
    selectedTables,
    tabValue,
    setTabValue,
    totalResults,
    categories,
    editModalOpen,
    editingFragment,
    editingSuccess,
    handleSearch,
    handleClearSearch,
    handleTableFilterChange,
    handleEditFragment,
    handleCloseEditModal,
    handleEditSuccess,
    getTableIcon,
    getTableDisplayName,
    getResultLink,
    getResultLabel,
    getResultSecondaryText,
    getItemStats,
    searchInputValue,
    isWaitingToSearch,
    hasSearched,
    setSearchInputValue: handleSearchInputChange,
    handleManualSearch,
    categoryDialogOpen,
    setCategoryDialogOpen,
    handleOpenCategoryDialog,
    updateCategories
  };
  
  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchContext() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearchContext must be used within a SearchContextProvider');
  }
  return context;
}
