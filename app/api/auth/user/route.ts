import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function GET() {
  try {
    const token = (await cookies()).get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'changeme');
    const { payload } = await jwtVerify(token, secret);
    
    return NextResponse.json({ 
      user: {
        id: payload.id,
        username: payload.username,
        name: payload.name
      }
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
