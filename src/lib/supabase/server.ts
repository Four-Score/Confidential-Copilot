import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  
  // Track any cookie operation failures
  const cookieErrors: Array<{name: string, error: unknown}> = [];

  // Create a server-side client with cookie handling
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookies: { name: string; value: string; options?: CookieOptions }[]) {
          cookies.forEach(({ name, value, options }) => {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // Log the error with details
              const errorMessage = error instanceof Error ? error.message : String(error);
              console.error(`Cookie operation failed for ${name}:`, errorMessage);
              
              // Track the failure
              cookieErrors.push({ name, error });
              
              // Specifically log auth cookie failures as they're critical
              if (name.includes('sb-') || name.includes('auth')) {
                console.error(`⚠️ Authentication cookie operation failed: ${name}`);
              }
            }
          });
          
          // Log a summary if there were any failures
          if (cookieErrors.length > 0) {
            console.error(`Failed to set ${cookieErrors.length} cookies. Auth might be affected.`);
          }
        },
      },
    }
  );
}