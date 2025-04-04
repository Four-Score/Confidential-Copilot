import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    // Use the server-side Supabase client which has admin privileges
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data, error, count } = await supabase
      .from('auth.users')
      .select('id', { count: 'exact' })
      .eq('email', email)
      .limit(1);
      
    if (error) {
      console.error("Error checking user existence:", error);
      return NextResponse.json({ error: 'Failed to check user existence' }, { status: 500 });
    }
    
    return NextResponse.json({ userExists: !!count && count > 0 });
  } catch (error) {
    console.error("Error in check-user-exists route:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}