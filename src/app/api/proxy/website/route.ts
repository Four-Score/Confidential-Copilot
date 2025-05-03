import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * POST endpoint for proxying website content requests
 */
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
    
    // Get the URL from the request body
    const body = await request.json();
    const { url } = body;
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }
    
    // Request the website content server-side
    try {
      const response = await axios.get(url, {
        timeout: 10000, // 10 seconds timeout
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const html = response.data;
      
      // Use cheerio to extract basic metadata
      const $ = cheerio.load(html);
      const title = $('title').text().trim() || new URL(url).hostname;
      const description = $('meta[name="description"]').attr('content') || '';
      
      // Return the HTML content and basic metadata
      return NextResponse.json({
        success: true,
        html,
        metadata: {
          title,
          description,
          url
        }
      });
      
    } catch (fetchError: any) {
      console.error('Error fetching website:', fetchError);
      return NextResponse.json(
        { 
          error: 'Failed to fetch website content',
          details: fetchError.message || 'Unknown error'
        },
        { status: 502 }
      );
    }
    
  } catch (error) {
    console.error('Error in website proxy endpoint:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}