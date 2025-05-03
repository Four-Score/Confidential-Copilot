import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';

// Extract YouTube video ID from URL
function extractVideoId(url: string): string | null {
  if (!url) return null;
  
  // Handle youtu.be format
  if (url.includes('youtu.be/')) {
    return url.split('youtu.be/')[1].split('?')[0];
  }
  
  // Handle youtube.com format
  const match = url.match(/(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { video_url } = body;

    if (!video_url) {
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(video_url);
    
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Get transcript using youtube-transcript library
    const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId);
    
    // Combine transcript text
    const transcriptText = transcriptArray.map(item => item.text).join(' ');
    
    return NextResponse.json({ transcript: transcriptText });
  } catch (error: any) {
    console.error('Transcript error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch transcript' },
      { status: 500 }
    );
  }
}