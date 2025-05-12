// src/app/api/process-transcript/route.ts
import { NextResponse } from 'next/server';
import { processTranscript, summarizeTranscript, extractActionItems } from '@/features/meeting-summarizer/transcript-processor';

export async function POST(request: Request) {
  try {
    const { transcript, only } = await request.json();

    if (!transcript || typeof transcript !== 'string' || transcript.trim() === '') {
      return NextResponse.json(
        { error: 'Transcript is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (only === 'summary') {
      const summary = await summarizeTranscript(transcript);
      return NextResponse.json({ summary });
    }

    if (only === 'action_items') {
      const action_items = await extractActionItems(transcript);
      return NextResponse.json({ action_items });
    }

    // Default: do both (legacy)
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