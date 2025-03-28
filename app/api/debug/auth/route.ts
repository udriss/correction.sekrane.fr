import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/auth';
import { getUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get user from both auth systems
    const session = await getServerSession(authOptions);
    const customUser = await getUser(request);
    
    // Get auth cookie information
    const authCookie = request.cookies.get('auth_token');
    const nextAuthSessionCookie = request.cookies.get('next-auth.session-token');
    
    // Return debug information
    return NextResponse.json({
      nextAuth: {
        session: session ? {
          ...session,
          user: {
            ...session.user,
            id: session.user?.id, // Include the important ID
            idType: session.user?.id ? typeof session.user.id : null,
          }
        } : null,
        cookieExists: !!nextAuthSessionCookie,
      },
      customAuth: {
        user: customUser,
        userIdType: customUser?.id ? typeof customUser.id : null,
        cookieExists: !!authCookie,
      },
      effectiveUserId: customUser?.id || session?.user?.id || null,
      effectiveUserIdType: customUser?.id || session?.user?.id ? 
        typeof (customUser?.id || session?.user?.id) : null,
    });
  } catch (error) {
    console.error('Auth debug error:', error);
    return NextResponse.json({ error: 'Error getting debug info', details: (error as Error).message }, 
      { status: 500 });
  }
}
