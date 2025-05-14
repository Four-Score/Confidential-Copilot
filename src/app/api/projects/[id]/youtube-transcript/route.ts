import { NextResponse } from 'next/server';
import { fetchYoutubeTranscript } from '@/lib/youtubeUtils';

export async function POST(request: Request) {
  try {
    const { video_url } = await request.json();
    if (!video_url) {
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
    }
    const { transcript, videoId } = await fetchYoutubeTranscript(video_url);

    // Handle missing transcript
    if (!transcript) {
      return NextResponse.json(
        { error: 'No transcript available for this YouTube video.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ transcript, videoId });
  } catch (error: any) {
    // Handle known transcript disabled error
    if (
      error.message &&
      error.message.toLowerCase().includes('transcript is disabled')
    ) {
      return NextResponse.json(
        { error: 'Transcript is disabled or unavailable for this YouTube video.' },
        { status: 404 }
      );
    }
    return NextResponse.json({ error: error.message || 'Failed to fetch transcript' }, { status: 500 });
  }
}