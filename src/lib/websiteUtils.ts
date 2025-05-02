import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Constants for website processing
 */
export const WEBSITE_CONSTANTS = {
  DEFAULT_CHUNK_SIZE: 1000,
  DEFAULT_CHUNK_OVERLAP: 200,
  TIMEOUT_MS: 10000, // 10 seconds timeout for fetching
  MAX_CONTENT_LENGTH: 5000000, // ~5MB max content size
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

  // Try to access the URL
  try {
    const response = await axios.head(url, {
      timeout: WEBSITE_CONSTANTS.TIMEOUT_MS,
      maxRedirects: 5,
    });
    
    // Check if the response is successful (status code 2xx)
    if (response.status >= 200 && response.status < 300) {
      return { isValid: true };
    } else {
      return { isValid: false, message: `URL returned status code: ${response.status}` };
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        return { isValid: false, message: 'Connection timed out' };
      }
      return { isValid: false, message: error.message || 'Error accessing URL' };
    }
    return { isValid: false, message: 'Error accessing URL' };
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
    // Fetch the website content
    const response = await axios.get(url, {
      timeout: WEBSITE_CONSTANTS.TIMEOUT_MS,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, noscript, iframe, embed, object').remove();

    // Extract the title
    const title = $('title').text().trim() || new URL(url).hostname;
    
    // Extract the description
    const description = $('meta[name="description"]').attr('content') || '';

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

    // Create the metadata
    const metadata: WebsiteMetadata = {
      url,
      title,
      description,
      extractedAt: new Date().toISOString(),
      contentLength: bodyText.length,
    };

    return {
      content: bodyText,
      metadata
    };
  } catch (error) {
    let errorMessage = 'Failed to extract website content';
    if (axios.isAxiosError(error)) {
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
  const chunks: WebsiteChunk[] = [];
  const contentLength = content.length;
  
  // If content is smaller than chunk size, return a single chunk
  if (contentLength <= chunkSize) {
    chunks.push({
      chunkNumber: 0,
      content,
      metadata: {
        url: metadata.url,
        chunkIndex: 0,
        startPosition: 0,
        endPosition: contentLength - 1,
      },
    });
    return chunks;
  }
  
  // Split content into chunks
  let startIdx = 0;
  let chunkNumber = 0;
  
  while (startIdx < contentLength) {
    // Calculate end index for this chunk
    let endIdx = Math.min(startIdx + chunkSize, contentLength);
    
    // Adjust end index to not cut words in the middle if not at the end
    if (endIdx < contentLength) {
      // Look for the nearest space or newline after the calculated end index
      while (endIdx < contentLength && content[endIdx] !== ' ' && content[endIdx] !== '\n') {
        endIdx++;
      }
    }
    
    // Extract this chunk
    const chunkContent = content.substring(startIdx, endIdx).trim();
    
    // Add to chunks array
    if (chunkContent) {
      chunks.push({
        chunkNumber,
        content: chunkContent,
        metadata: {
          url: metadata.url,
          chunkIndex: chunkNumber,
          startPosition: startIdx,
          endPosition: endIdx - 1,
        },
      });
    }
    
    // Move to the next chunk with overlap
    startIdx = endIdx - chunkOverlap;
    if (startIdx < 0) startIdx = 0;
    
    // If we're at the end, break
    if (startIdx >= contentLength) {
      break;
    }
    
    chunkNumber++;
  }
  
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