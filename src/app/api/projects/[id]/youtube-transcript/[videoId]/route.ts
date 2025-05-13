import { NextResponse } from 'next/server';

export async function POST(request: Request, context: any) {
  try {
    const { videoId, transcript } = await request.json();
    const projectId = context.params.id;


    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to ingest YouTube data' },
      { status: 500 }
    );
  }
}
