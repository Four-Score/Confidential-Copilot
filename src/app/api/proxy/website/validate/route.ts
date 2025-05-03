import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import axios from 'axios';
import { AxiosError } from 'axios';

// List of user agents to rotate through
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0'
];

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
    
    // Get a random user agent
    const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    
    // Common request configuration
    const config = {
      timeout: 15000, // 15 seconds timeout
      maxRedirects: 10,
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      validateStatus: (status: number) => status < 500 // Accept all responses under 500
    };
    
    // Try HEAD request first
    try {
      const response = await axios.head(url, config);
      
      // Check if the response is successful
      if (response.status >= 200 && response.status < 400) {
        return NextResponse.json({ isValid: true });
      }
      
      // If we get here, the HEAD request didn't succeed but didn't throw - try GET
      throw new Error('HEAD request returned status: ' + response.status);
      
    } catch (headError) {
      // If HEAD fails, try GET (some servers don't support HEAD)
      try {
        console.log('HEAD request failed, trying GET:', headError);
        
        const response = await axios.get(url, {
          ...config,
          responseType: 'text',
          // Only get the headers and a small part of the body
          transformResponse: [(data) => data.substring(0, 1000)]
        });
        
        if (response.status >= 200 && response.status < 400) {
          return NextResponse.json({ isValid: true });
        } else {
          return NextResponse.json(
            { error: `URL returned status code: ${response.status}` },
            { status: 400 }
          );
        }
      } catch (getError: any) {
        // Process the error and return meaningful info
        const axiosError = getError as AxiosError;
        let errorMessage = 'Error accessing URL';
        
        if (axiosError.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          errorMessage = `Server returned ${axiosError.response.status}: ${axiosError.message}`;
        } else if (axiosError.request) {
          // The request was made but no response was received
          if (axiosError.code === 'ECONNABORTED') {
            errorMessage = 'Request timed out';
          } else if (axiosError.code === 'ENOTFOUND') {
            errorMessage = 'Domain not found';
          } else if (axiosError.code === 'CERT_HAS_EXPIRED') {
            errorMessage = 'Website has SSL certificate issues';
          } else {
            errorMessage = `No response received: ${axiosError.code || axiosError.message}`;
          }
        } else {
          // Something happened in setting up the request
          errorMessage = axiosError.message;
        }
        
        return NextResponse.json(
          { error: errorMessage },
          { status: 400 }
        );
      }
    }
    
  } catch (error: any) {
    console.error('Error in website validation endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}