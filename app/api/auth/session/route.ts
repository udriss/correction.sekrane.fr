import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// This endpoint provides compatibility with Next Auth by exposing a session endpoint
// that returns data in the format NextAuth expects but using your custom JWT
export async function GET(request: NextRequest) {
  try {
    // Get the token from your custom auth system
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ user: null });
    }
    
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'changeme');
    
    try {
      // Verify the token
      const { payload } = await jwtVerify(token, secret);
      
      // Return session data in NextAuth format
      return NextResponse.json({
        user: {
          id: payload.id,
          name: payload.name || payload.username,
          username: payload.username
        },
        expires: new Date(payload.exp as number * 1000).toISOString()
      });
    } catch (e) {
      console.error('Invalid token:', e);
      return NextResponse.json({ user: null });
    }
  } catch (error) {
    console.error('Error in session route:', error);
    return NextResponse.json({ user: null });
  }
}
