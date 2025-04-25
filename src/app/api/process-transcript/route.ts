// src/app/api/process-transcript/route.ts
import { NextResponse } from 'next/server';
import { processTranscript } from '@/features/meeting-summarizer/transcript-processor';

export async function POST(request: Request) {
  try {
    const { transcript } = await request.json();

    if (!transcript || typeof transcript !== 'string' || transcript.trim() === '') {
      return NextResponse.json(
        { error: 'Transcript is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const results = await processTranscript(transcript);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error processing transcript:', error);
    return NextResponse.json(
      { error: 'Failed to process transcript' },
      { status: 500 }
    );
  }
}