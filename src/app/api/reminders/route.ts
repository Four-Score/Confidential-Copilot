import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Use getUser() for server-side authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // console.log('User from supabase.auth.getUser():', user);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action_item, date } = body;

    if (!action_item) {
      return NextResponse.json({ error: 'Action item is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('reminders')
      .insert([
        {
          user_id: user.id,
          action_item,
          ...(date ? { date } : {})
        }
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reminder: data }, { status: 201 });
  } catch (error: any) {
    console.error('Error saving reminder:', error);
    return NextResponse.json({ error: 'Failed to save reminder' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reminders: data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
  }
}