import { SearchResult } from '../SearchContext';

/**
 * Enriches search results with relationship data
 */
export function enrichSearchResults(results: SearchResult[]): SearchResult[] {
  // Step 1: Create a flattened dataset for easier lookup
  const dataset = {
    students: extractItemsByTable('students', results),
    classes: extractItemsByTable('classes', results),
    activities: extractItemsByTable('activities', results),
    categories: extractItemsByTable('categories', results),
    fragments: extractItemsByTable('fragments', results),
    corrections: extractItemsByTable('corrections', results),
  };
  
  // Step 2: Create relationship maps
  const relationships = {
    // class_id -> student_ids[]
    classStudents: createRelationshipMap(
      dataset.students, 
      'class_id', 
      'id'
    ),
    
    // student_id -> activity_ids[]
    studentActivities: createRelationshipMap(
      dataset.activities, 
      'student_id', 
      'id'
    ),
    
    // category_id -> activity_ids[]
    categoryActivities: createRelationshipMap(
      dataset.activities, 
      'category_id', 
      'id'
    ),
    
    // activity_id -> class_ids[]
    activityClasses: createMultiRelationshipMap(
      dataset.activities, 
      'class_ids', 
      'id'
    ),
    
    // fragment_id -> category_ids[]
    fragmentCategories: createMultiRelationshipMap(
      dataset.fragments, 
      'categories', 
      'id',
      (cat) => typeof cat === 'object' ? cat.id : cat
    ),
  };
  
  // Step 3: Enrich each result with relationship counts
  return results.map(category => {
    const items = category.items.map(item => {
      const enriched = { ...item };
      
      switch(category.table) {
        case 'classes':
          const studentIds = relationships.classStudents.get(item.id) || new Set();
          enriched.student_count = studentIds.size;
          break;
        
        case 'students':
          const activityIds = relationships.studentActivities.get(item.id) || new Set();
          enriched.activity_count = activityIds.size;
          break;
        
        case 'activities':
          // Calculate average grade if available
          if (item.grades && Array.isArray(item.grades) && item.grades.length > 0) {
            const grades = item.grades.filter((g: any) => !isNaN(parseFloat(g)));
            if (grades.length > 0) {
              enriched.avg_grade = grades.reduce((sum: number, g: any) => sum + parseFloat(g), 0) / grades.length;
            }
          }
          break;
        
        case 'categories':
          const activityIdsForCategory = relationships.categoryActivities.get(item.id) || new Set();
          enriched.activity_count = activityIdsForCategory.size;
          break;
        
        case 'fragments':
          const categoryIds = relationships.fragmentCategories.get(item.id) || new Set();
          enriched.category_count = categoryIds.size;
          break;
      }
      
      return enriched;
    });
    
    return { ...category, items };
  });
}

/**
 * Extract items of a specific table from search results
 */
function extractItemsByTable(tableName: string, results: SearchResult[]): any[] {
  const categoryResult = results.find(r => r.table === tableName);
  return categoryResult ? categoryResult.items : [];
}

/**
 * Create a map of relationships between entities
 * @param items Source items array
 * @param foreignKeyField The field containing the foreign key
 * @param idField The field containing the item's ID
 */
function createRelationshipMap(
  items: any[], 
  foreignKeyField: string, 
  idField: string
): Map<number, Set<number>> {
  const map = new Map<number, Set<number>>();
  
  items.forEach(item => {
    const foreignKeyValue = item[foreignKeyField];
    const id = item[idField];
    
    if (foreignKeyValue) {
      if (!map.has(foreignKeyValue)) {
        map.set(foreignKeyValue, new Set());
      }
      map.get(foreignKeyValue)?.add(id);
    }
  });
  
  return map;
}

/**
 * Create a map of relationships for fields that contain arrays of foreign keys
 */
function createMultiRelationshipMap(
  items: any[],
  foreignKeyArrayField: string,
  idField: string,
  valueExtractor: (item: any) => number = (item) => item
): Map<number, Set<number>> {
  const map = new Map<number, Set<number>>();
  
  items.forEach(item => {
    const id = item[idField];
    const foreignKeys = item[foreignKeyArrayField];
    
    if (Array.isArray(foreignKeys)) {
      foreignKeys.forEach(fk => {
        const foreignKeyValue = valueExtractor(fk);
        
        if (foreignKeyValue) {
          if (!map.has(foreignKeyValue)) {
            map.set(foreignKeyValue, new Set());
          }
          map.get(foreignKeyValue)?.add(id);
        }
      });
    }
  });
  
  return map;
}
