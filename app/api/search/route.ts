import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    // Get the user from both auth systems
    const session = await getServerSession(authOptions);
    const customUser = await getUser();

    // Use either auth system, starting with custom auth
    const userId = customUser?.id || session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'utilisateur non authentifié' }, { status: 401 });
    }
    
    // Get search parameters
    const searchParams = request.nextUrl.searchParams;
    const searchQuery = searchParams.get('q') || '';
    const tables = searchParams.get('tables') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Return early if no search query
    if (!searchQuery || searchQuery.length < 1) {
      return NextResponse.json({ results: [] });
    }
    
    // Format query for SQL LIKE
    const searchTerm = `%${searchQuery}%`;

    // Initialize results object
    const results: any = {};
    
    // Define the tables we want to search based on the 'tables' parameter
    let tablesToSearch: string[] = [];
    
    if (tables === 'all') {
      tablesToSearch = [
        'categories', 
        'classes', 
        'students', 
        'activities', 
        'fragments'
      ];
    } else {
      tablesToSearch = tables.split(',');
    }
    
    // Search in each table
    for (const table of tablesToSearch) {
      // Define search queries for each table
      let sql = '';
      let params: any[] = [];
      
      switch (table) {
        case 'categories':
          sql = `
            SELECT id, name, 'categories' as source_table
            FROM categories
            WHERE name LIKE ?
            LIMIT ?
          `;
          params = [searchTerm, limit];
          break;
          
        case 'classes':
          sql = `
            SELECT id, name, description, academic_year, 'classes' as source_table
            FROM classes
            WHERE name LIKE ? OR description LIKE ? OR academic_year LIKE ?
            LIMIT ?
          `;
          params = [searchTerm, searchTerm, searchTerm, limit];
          break;
          
        case 'students':
          sql = `
            SELECT id, first_name as firstname, last_name as lastname, email, 'students' as source_table
            FROM students
            WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ?
            LIMIT ?
          `;
          params = [searchTerm, searchTerm, searchTerm, limit];
          break;
          
        case 'activities':
          sql = `
            SELECT id, name, content, 'activities' as source_table
            FROM activities
            WHERE name LIKE ? OR content LIKE ?
            LIMIT ?
          `;
          params = [searchTerm, searchTerm, limit];
          break;
          
        case 'fragments':
          sql = `
            SELECT id, activity_id, content, 'fragments' as source_table
            FROM fragments
            WHERE content LIKE ?
            LIMIT ?
          `;
          params = [searchTerm, limit];
          break;
          
        default:
          continue;
      }
      
      // Execute the query using the query function from lib/db.ts
      try {
        const rows = await query<any[]>(sql, params);
        results[table] = rows;
      } catch (err) {
        console.error(`Error querying ${table}:`, err);
        results[table] = [];
      }
    }
    
    // Format results for the response
    const formattedResults = {
      query: searchQuery,
      results: Object.entries(results).map(([table, items]) => ({
        table,
        count: Array.isArray(items) ? items.length : 0,
        items: items
      }))
    };
    
    return NextResponse.json(formattedResults);
    
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recherche' },
      { status: 500 }
    );
  }
}
