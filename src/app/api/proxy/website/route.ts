import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import axios from 'axios';
import { AxiosError } from 'axios';
import * as cheerio from 'cheerio';

// List of user agents to rotate through
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0'
];

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
    
    // Request the website content server-side
    try {
      const response = await axios.get(url, {
        timeout: 20000, // 20 seconds timeout
        maxRedirects: 10,
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        responseType: 'text',
        // Accept all responses to process them manually
        validateStatus: (status: number) => status < 500
      });
      
      // Handle non-200 responses
      if (response.status >= 400) {
        return NextResponse.json(
          { 
            error: `Website returned error status: ${response.status}`,
            details: `${response.statusText}`
          },
          { status: response.status }
        );
      }
      
      const html = response.data;
      
      // Check if we actually got HTML content
      if (typeof html !== 'string' || html.trim().length === 0) {
        return NextResponse.json(
          { error: 'Website returned empty or invalid content' },
          { status: 422 }
        );
      }
      
      // Basic check for HTML-like content
      const hasHtmlStructure = /<html|<body|<head|<!DOCTYPE html/i.test(html);
      if (!hasHtmlStructure) {
        console.warn('Website content does not appear to be HTML:', url);
        // Continue anyway but log the warning
      }
      
      // Use cheerio to extract basic metadata
      try {
        const $ = cheerio.load(html);
        const title = $('title').text().trim() || new URL(url).hostname;
        const description = $('meta[name="description"]').attr('content') || 
                           $('meta[property="og:description"]').attr('content') || '';
        const favicon = $('link[rel="icon"]').attr('href') || 
                       $('link[rel="shortcut icon"]').attr('href') || '';
        
        // Get absolute favicon URL if it's relative
        let absoluteFavicon = favicon;
        if (favicon && !favicon.startsWith('http')) {
          const baseUrl = new URL(url);
          absoluteFavicon = new URL(favicon, baseUrl.origin).toString();
        }
        
        // Return the HTML content and basic metadata
        return NextResponse.json({
          success: true,
          html,
          metadata: {
            title,
            description,
            url,
            favicon: absoluteFavicon || ''
          }
        });
      } catch (cheerioError) {
        // If Cheerio fails, still return the HTML but with minimal metadata
        console.error('Error extracting metadata with cheerio:', cheerioError);
        return NextResponse.json({
          success: true,
          html,
          metadata: {
            title: new URL(url).hostname,
            description: '',
            url
          }
        });
      }
      
    } catch (fetchError: any) {
      const axiosError = fetchError as AxiosError;
      let errorMessage = 'Failed to fetch website content';
      let errorDetails = fetchError.message || 'Unknown error';
      
      if (axiosError.response) {
        errorMessage = `Server returned ${axiosError.response.status}`;
        errorDetails = axiosError.message;
      } else if (axiosError.request) {
        if (axiosError.code === 'ECONNABORTED') {
          errorMessage = 'Request timed out';
        } else if (axiosError.code === 'ENOTFOUND') {
          errorMessage = 'Domain not found';
        } else if (axiosError.code === 'CERT_HAS_EXPIRED') {
          errorMessage = 'Website has SSL certificate issues';
        } else {
          errorMessage = `No response received: ${axiosError.code || ''}`;
        }
      }
      
      console.error('Error fetching website:', errorMessage, errorDetails);
      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorDetails
        },
        { status: 502 }
      );
    }
    
  } catch (error: any) {
    console.error('Error in website proxy endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}