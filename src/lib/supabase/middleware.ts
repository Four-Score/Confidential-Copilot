import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function updateSession(request: NextRequest) {
  // Create a response to modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Log the request for debugging
  console.log(`Updating session for: ${request.nextUrl.pathname}`);

  try {
    // Create a Supabase client specifically for the middleware context
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return request.cookies.get(name)?.value;
          },
          set(name, value, options) {
            // Set new cookies on the response
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name, options) {
            // Remove cookies on the response
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    // Add proper error handling for getSession
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error in middleware:', sessionError);
      response.headers.set('x-auth-error', `session:${sessionError.message}`);
      return response;
    }
    
    const session = sessionData?.session;

    // Add session status header for debugging
    response.headers.set('x-auth-session-status', session ? 'active' : 'none');
    
    // Only refresh if we have a valid session
    if (session) {
      try {
        // Refresh session if needed - required for Server Components
        const { data: { user: userData }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('User error in middleware:', userError);
          response.headers.set('x-auth-error', `user:${userError.message}`);
        } else if (userData) {
          // Successfully retrieved user data
          response.headers.set('x-auth-user-id', userData.id);
          console.log('Session successfully verified for user:', userData.id);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Unexpected error in auth middleware:', errorMessage);
        response.headers.set('x-auth-error', `unexpected:${errorMessage}`);
      }
    } else {
      console.log('No active session found in middleware.');
    }

    return response;
  } catch (e) {
    console.error('Critical error in middleware:', e);
    return response;
  }
}