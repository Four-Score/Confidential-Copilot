import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

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
    const { video_url } = await request.json();
    
    if (!video_url) {
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
    }
    
    const videoId = extractVideoId(video_url);
    
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Initialize the Apify client
    const client = new ApifyClient({
      token: process.env.APIFY_API_TOKEN || '',
    });

    // Set up input for the YouTube transcript actor
    const input = {
      "startUrls": [
        video_url
      ],
      "language": "Default",
      "includeTimestamps": "No"
    };

    // Run the actor and wait for results
    console.log('Fetching transcript via Apify for video ID:', videoId);
    const run = await client.actor("dB9f4B02ocpTICIEY").call(input);
    
    // Get results from the dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    if (!items || items.length === 0) {
      console.error('No transcript data received from Apify');
      return NextResponse.json(
        { error: 'No transcript available for this YouTube video.' },
        { status: 404 }
      );
    }

    // Extract just the transcript text from the first item
    const transcript = items[0]?.transcript || '';
    
    // Return both transcript and videoId to maintain API compatibility
    return NextResponse.json({ transcript, videoId });
  } catch (error: any) {
    console.error('Transcript error:', error);
    
    // Handle known transcript disabled error (maintaining original error patterns)
    if (
      error.message &&
      error.message.toLowerCase().includes('transcript is disabled')
    ) {
      return NextResponse.json(
        { error: 'Transcript is disabled or unavailable for this YouTube video.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch transcript' }, 
      { status: 500 }
    );
  }
}