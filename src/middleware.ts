import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Add more verbose logging to diagnose the issue
  console.log(`Middleware running for path: ${request.nextUrl.pathname}`);
  
  try {
    // update user's auth session
    const response = await updateSession(request);
    
    // Add diagnostic header to track middleware execution
    response.headers.set('x-middleware-executed', 'true');
    
    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    
    // Return a response that won't disrupt the user experience
    // but will signal there was a middleware problem
    const response = NextResponse.next();
    response.headers.set('x-middleware-error', 'true');
    return response;
  }
}

// Define on which paths the middleware will be executed
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - Debug and login paths that should work without auth
     */
    '/((?!_next/static|_next/image|favicon.ico|public|login|sign-up|api/check-user-exists|.+\\.svg).*)',
  ],
};