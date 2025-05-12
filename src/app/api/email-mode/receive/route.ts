import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// CORS preflight
export async function OPTIONS(_: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Main POST handler
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse(JSON.stringify({ error: 'Missing or malformed token' }), {
        status: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    const accessToken = authHeader.replace('Bearer ', '');
    console.log('🔐 Access Token Received:', accessToken.slice(0, 20));

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );

    const { data, error } = await supabase.auth.getUser();
    const user = data?.user;

    console.log('👤 Supabase user data:', data);
    console.log('🚨 Supabase error:', error);

    if (error || !user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    const body = await request.json();
    console.log('📦 Parsed request body:', body);

    const { emailData, projectName } = body;

    if (!projectName) {
      console.error('❌ Missing projectName in request body');
      return new NextResponse(JSON.stringify({ error: 'Missing projectName' }), {
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (!emailData) {
      console.error('❌ Missing emailData in request body');
      return new NextResponse(JSON.stringify({ error: 'Missing emailData' }), {
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('name', projectName)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      console.error(`❌ Project not found: ${projectName}`, projectError);
      return new NextResponse(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    console.log(`📁 Saving email to project: ${projectName} (id: ${project.id})`);
    console.log(`📨 Received email data:`, emailData);

    return new NextResponse(JSON.stringify({ success: true, user: user.email }), {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });

  } catch (err) {
    console.error('❌ Server error:', err);
    return new NextResponse(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }
}
