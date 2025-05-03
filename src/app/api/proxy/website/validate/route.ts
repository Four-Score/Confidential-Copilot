import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import axios from 'axios';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Initialize Supabase client
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { url } = body;
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }
    
    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }
    
    // Try to access the URL
    try {
      const response = await axios.head(url, {
        timeout: 10000,
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      // Check if the response is successful
      if (response.status >= 200 && response.status < 300) {
        return NextResponse.json({ isValid: true });
      } else {
        return NextResponse.json(
          { error: `URL returned status code: ${response.status}` },
          { status: 400 }
        );
      }
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Error accessing URL' },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('Error in website validation endpoint:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}