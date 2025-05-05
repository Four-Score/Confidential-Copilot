import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { videoId, transcript } = await request.json();
    const projectId = params.id;

    // TODO: Save videoId and transcript to your database, associated with projectId

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to ingest YouTube data' }, { status: 500 });
  }
}