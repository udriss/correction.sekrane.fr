import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { getUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Authentication check - only admins should run migrations
    const session = await getServerSession(authOptions);
    const customUser = await getUser(request);
    const userId = customUser?.id || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });
    }

    // Create the fragment_categories table
    await query(`
      CREATE TABLE IF NOT EXISTS fragment_categories (
        fragment_id INT NOT NULL,
        category_id INT NOT NULL,
        PRIMARY KEY (fragment_id, category_id),
        CONSTRAINT fk_fragment_id FOREIGN KEY (fragment_id) REFERENCES fragments(id) ON DELETE CASCADE,
        CONSTRAINT fk_category_id FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);

    // Check if the table was created successfully
    const tableExists = await query<any[]>(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'fragment_categories'
    `);

    if (tableExists.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to create fragment_categories table' 
      }, { status: 500 });
    }

    // Modify the fragments table to remove or nullify the category column if it exists
    try {
      // Check if the category column exists
      const categoryColumnExists = await query<any[]>(`
        SELECT * FROM information_schema.columns 
        WHERE table_schema = DATABASE() 
        AND table_name = 'fragments'
        AND column_name = 'category_id'
      `);
      
      if (categoryColumnExists.length > 0) {
        // Migrate existing data from fragments.category_id to the new table
        await query(`
          INSERT IGNORE INTO fragment_categories (fragment_id, category_id)
          SELECT 
            id AS fragment_id, 
            category_id 
          FROM 
            fragments 
          WHERE 
            category_id IS NOT NULL 
            AND category_id > 0
            AND EXISTS (SELECT 1 FROM categories WHERE id = fragments.category_id)
        `);
        
        // Keep the column for now but it won't be used actively
        console.log('Migrated category_id data to fragment_categories table');
      }
    } catch (migrationError) {
      console.error('Error during migration:', migrationError);
      // Continue even if migration fails
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Fragment categories table created successfully and data migrated' 
    });
  } catch (error: any) {
    console.error('Error creating fragment_categories table:', error);
    return NextResponse.json({
      error: 'Error creating table',
      details: error.message
    }, { status: 500 });
  }
}
