import { NextRequest, NextResponse } from 'next/server';
import { withConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth'; // Add import for custom auth

// Get all categories
export async function GET(request: NextRequest) {
  try {
    return await withConnection(async (connection) => {
      // Query to get all unique categories from fragments
      const [rows] = await connection.query(
        `SELECT DISTINCT category FROM fragments WHERE category IS NOT NULL`
      );
      
      // Extract categories from result
      const categories = Array.isArray(rows) 
        ? rows.map((row: any) => row.category).filter(Boolean)
        : [];
      
      return NextResponse.json(categories);
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des catégories' },
      { status: 500 }
    );
  }
}

// Create or update categories (optional, for advanced category management)
export async function POST(request: NextRequest) {
  try {
    // Get user session to check authentication status
    const session = await getServerSession(authOptions);
    const customUser = await getUser(request);
    
    // Use either auth system, starting with custom auth
    const userId = customUser?.id || session?.user?.id;
    console.log('User ID:', userId);
    
    // Check if user is authenticated
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }
    
    // Get categories data from request body
    const { categories } = await request.json();
    
    if (!Array.isArray(categories)) {
      return NextResponse.json(
        { error: 'Format de données invalide' },
        { status: 400 }
      );
    }
    
    // Process categories
    // Note: This is just an example. In practice, you might want to
    // create a separate table for categories or handle them differently.
    return NextResponse.json({ success: true, categories });
    
  } catch (error) {
    console.error('Error managing categories:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la gestion des catégories' },
      { status: 500 }
    );
  }
}
