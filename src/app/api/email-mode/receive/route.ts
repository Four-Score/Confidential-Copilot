import { NextRequest, NextResponse } from 'next/server';

// This handles CORS preflight request (OPTIONS)
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*', // Allow all during dev
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}

// This handles the real POST request
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const secret = process.env.EMAIL_EXTENSION_SECRET;

    if (!authHeader || authHeader !== `Bearer ${secret}`) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const body = await request.json();
    const { emailSummaries } = body;

    if (!emailSummaries || !Array.isArray(emailSummaries)) {
      return new NextResponse(JSON.stringify({ error: 'Invalid emailSummaries format' }), {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    console.log('Received email summaries:', emailSummaries);

    return new NextResponse(JSON.stringify({ message: 'Email summaries received successfully.' }), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Error receiving email summaries:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
