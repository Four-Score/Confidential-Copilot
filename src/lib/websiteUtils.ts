import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Constants for website processing
 */
export const WEBSITE_CONSTANTS = {
  DEFAULT_CHUNK_SIZE: 5000,
  DEFAULT_CHUNK_OVERLAP: 200,
  TIMEOUT_MS: 10000, // 10 seconds timeout for fetching
  MAX_CONTENT_LENGTH: 5000000, 
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
};

/**
 * Interface for website extraction result
 */
export interface WebsiteExtractionResult {
  url: string;
  title: string;
  content: string;
  chunks: WebsiteChunk[];
  metadata: WebsiteMetadata;
}

/**
 * Interface for website chunk
 */
export interface WebsiteChunk {
  chunkNumber: number;
  content: string;
  metadata: WebsiteChunkMetadata;
}

/**
 * Interface for website metadata
 */
export interface WebsiteMetadata {
  url: string;
  title: string;
  description?: string;
  extractedAt: string;
  contentLength: number;
}

/**
 * Interface for website chunk metadata
 */
export interface WebsiteChunkMetadata {
  url: string;
  chunkIndex: number;
  startPosition: number;
  endPosition: number;
}

/**
 * Validates if a URL is properly formatted and accessible
 * @param url - The URL to validate
 * @returns A promise that resolves to a validation result
 */
export async function validateWebsiteUrl(
  url: string
): Promise<{ isValid: boolean; message?: string }> {
  // Check if the URL is formatted correctly
  try {
    new URL(url);
  } catch (error) {
    return { isValid: false, message: 'Invalid URL format' };
  }

  // Try to access the URL using our proxy
  try {
    const response = await fetch('/api/proxy/website/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });
    
    if (response.ok) {
      return { isValid: true };
    } else {
      const data = await response.json();
      return { isValid: false, message: data.error || `URL validation failed: ${response.status}` };
    }
  } catch (error) {
    return { 
      isValid: false, 
      message: error instanceof Error ? error.message : 'Error accessing URL' 
    };
  }
}

/**
 * Extracts content from a website URL
 * @param url - The URL to extract content from
 * @returns A promise that resolves to the website content and metadata
 */
export async function extractWebsiteContent(
  url: string
): Promise<{ content: string; metadata: WebsiteMetadata }> {
  try {
    // Use our proxy endpoint instead of direct axios request
    const response = await fetch('/api/proxy/website', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to fetch content: ${response.status}`);
    }
    
    const data = await response.json();
    const html = data.html;
    
    // Use cheerio to process the HTML
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, noscript, iframe, embed, object').remove();

    // Extract text from the body
    // First remove navigation, header, footer etc. if present
    $('nav, footer, header, aside').remove();
    
    // Get all paragraphs, headings, and lists
    let bodyText = '';
    $('p, h1, h2, h3, h4, h5, h6, li, div').each((_, element) => {
      const text = $(element).text().trim();
      if (text) {
        bodyText += text + '\n\n';
      }
    });
    
    // Clean up the text
    bodyText = cleanHtmlContent(bodyText);

    // Create the metadata - use data from proxy if available
    const metadata: WebsiteMetadata = {
      url,
      title: data.metadata?.title || new URL(url).hostname,
      description: data.metadata?.description || '',
      extractedAt: new Date().toISOString(),
      contentLength: bodyText.length,
    };

    return {
      content: bodyText,
      metadata
    };
  } catch (error) {
    let errorMessage = 'Failed to extract website content';
    if (error instanceof Error) {
      errorMessage = `Failed to extract website content: ${error.message}`;
    }
    throw new Error(errorMessage);
  }
}

/**
 * Advanced HTML content cleaning
 * @param html - Raw HTML content
 * @returns Cleaned text content
 */
export function cleanHtmlContent(html: string): string {
    // Remove HTML comments
    let cleanedText = html.replace(/<!--[\s\S]*?-->/g, '');
    
    // Replace common entities
    cleanedText = cleanedText
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    
    // Normalize whitespace
    cleanedText = cleanedText
      .replace(/\s+/g, ' ')  // Replace multiple whitespaces with a single space
      .replace(/\n\s*\n+/g, '\n\n') // Replace multiple newlines with double newline
      .replace(/\t+/g, ' ')  // Replace tabs with spaces
      .trim();              // Remove leading and trailing whitespace
    
    return cleanedText;
  }
  

/**
 * Chunks website content into smaller pieces with metadata
 * @param content - The website content to chunk
 * @param metadata - The website metadata
 * @param chunkSize - The maximum size of each chunk
 * @param chunkOverlap - The overlap between chunks
 * @returns An array of website chunks
 */
export function chunkWebsiteContent(
  content: string,
  metadata: WebsiteMetadata,
  chunkSize: number = WEBSITE_CONSTANTS.DEFAULT_CHUNK_SIZE,
  chunkOverlap: number = WEBSITE_CONSTANTS.DEFAULT_CHUNK_OVERLAP
): WebsiteChunk[] {
  // Safety checks
  if (!content || content.trim().length === 0) {
    return [];
  }
  
  // Clean up the content before chunking
  const cleanedContent = cleanHtmlContent(content);
  
  // Simple sliding window chunking (similar to PDF chunking)
  const chunks: WebsiteChunk[] = [];
  let start = 0;
  let chunkNumber = 0;
  
  while (start < cleanedContent.length) {
    const end = Math.min(start + chunkSize, cleanedContent.length);
    const chunkContent = cleanedContent.substring(start, end).trim();
    
    // Only add non-empty chunks
    if (chunkContent) {
      const chunk = {
        chunkNumber,
        content: chunkContent,
        metadata: {
          url: metadata.url,
          chunkIndex: chunkNumber,
          startPosition: start,
          endPosition: end - 1,
        },
      };
      
      // Log chunk details as it's pushed
      console.log(`Chunk ${chunkNumber} created: URL ${metadata.url} | Size: ${chunkContent.length} | Range: ${start}-${end-1}`);
      
      chunks.push(chunk);
    }
    
    chunkNumber++;
    start += chunkSize - chunkOverlap;
    
    // Safety check to prevent infinite loop
    if (start >= cleanedContent.length || start < 0) {
      break;
    }
  }

  console.log(`Total chunks created: ${chunks.length} for URL: ${metadata.url}`);
  return chunks;
}

/**
 * Handles error cases for website content extraction
 * @param url - The URL that was being processed
 * @param error - The error that occurred
 * @returns An object with error information
 */
export function handleWebsiteError(url: string, error: unknown): { 
    error: true, 
    message: string,
    url: string 
  } {
    let message = 'An unknown error occurred while processing the website';
    
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }
    
    // Log the error for debugging
    console.error(`Error processing ${url}:`, error);
    
    return {
      error: true,
      message,
      url
    };
  }
  
  /**
   * Extracts clean text from HTML elements
   * @param $element - Cheerio element
   * @returns Clean text content
   */
  export function extractCleanText($: cheerio.CheerioAPI, selector: string): string {
    let text = '';
    
    $(selector).each((_, element) => {
      const elementText = $(element).text().trim();
      if (elementText) {
        text += elementText + '\n\n';
      }
    });
    
    return cleanHtmlContent(text);
  }
  
  /**
   * Truncates a string to a specified length, adding ellipsis if needed
   * @param text - Text to truncate
   * @param maxLength - Maximum length
   * @returns Truncated text
   */
  export function truncateText(text: string, maxLength = 100): string {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }