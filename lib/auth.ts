import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export interface User {
  id: number;
  username: string;
  name: string;
}

export async function getUser(req?: NextRequest): Promise<User | null> {
  try {
    const cookieStore = req ? req.cookies : await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return null;
    }

    // Verify the token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'changeme');
    const { payload } = await jwtVerify(token, secret);
    
    return {
      id: payload.id as number,
      username: payload.username as string,
      name: payload.name as string
    };
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}
