import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

// Extract YouTube video ID from URL (keep the existing function)
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
        { error: 'Transcript not available' },
        { status: 404 }
      );
    }

    // Extract just the transcript text from the first item
    const transcriptText = items[0]?.transcript || '';
    
    // Return the transcript in the same format as the original function
    return NextResponse.json({ transcript: transcriptText });
  } catch (error: any) {
    console.error('Transcript error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch transcript' },
      { status: 500 }
    );
  }
}