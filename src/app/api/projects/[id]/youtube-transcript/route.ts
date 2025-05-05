import { NextResponse } from 'next/server';
import { fetchYoutubeTranscript } from '@/lib/youtubeUtils';

export async function POST(request: Request) {
  try {
    const { video_url } = await request.json();
    if (!video_url) {
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
    }
    const { transcript, videoId } = await fetchYoutubeTranscript(video_url);
    return NextResponse.json({ transcript, videoId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch transcript' }, { status: 500 });
  }
}