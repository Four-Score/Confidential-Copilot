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
    // ✅ Create Supabase client with the access token (not service key!)
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
    const { emailData } = body;

    if (!emailData) {
      return new NextResponse(JSON.stringify({ error: 'Missing emailData' }), {
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    console.log(`✅ Authenticated user: ${user.email}`);
    console.log('📨 Received email data:', emailData);

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
