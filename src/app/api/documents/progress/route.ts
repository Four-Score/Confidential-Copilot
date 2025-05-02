import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// In-memory store for tracking progress
// In a production app, you would use Redis or another shared storage
// that can be accessed across serverless function invocations
const progressStore: Record<string, {
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  lastUpdated: Date;
  contentType: 'document' | 'website';
}> = {};

// Clean up old entries periodically
const CLEANUP_THRESHOLD = 1000 * 60 * 30; // 30 minutes
function cleanupOldEntries() {
  const now = new Date();
  Object.keys(progressStore).forEach(key => {
    const entry = progressStore[key];
    if (now.getTime() - entry.lastUpdated.getTime() > CLEANUP_THRESHOLD) {
      delete progressStore[key];
    }
  });
}

/**
 * Updates the progress for a document upload
 * POST: Sets progress status for a document upload
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Initialize Supabase client with cookies
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    const { uploadId, progress, status, error, contentType = 'document' } = body;

    if (!uploadId || typeof progress !== 'number' || !status) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }
    
    // Store the progress
    progressStore[uploadId] = {
      progress: Math.min(100, Math.max(0, progress)), // Ensure between 0-100
      status,
      error,
      contentType, // Include the content type in the stored data
      lastUpdated: new Date()
    };
    
    // Occasionally clean up old entries
    if (Math.random() < 0.1) { // 10% chance on each request
      cleanupOldEntries();
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}

/**
 * Gets the progress for a document upload
 * GET: Retrieves current progress status for a document upload
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Get the upload ID from the URL
    const url = new URL(req.url);
    const uploadId = url.searchParams.get('uploadId');
    
    if (!uploadId) {
      return NextResponse.json(
        { error: 'Upload ID is required' },
        { status: 400 }
      );
    }
    
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
    
    // Get the progress
    const progressData = progressStore[uploadId];
    
    if (!progressData) {
      return NextResponse.json(
        { error: 'No progress data found for this upload ID' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      progress: progressData.progress,
      status: progressData.status,
      error: progressData.error,
      contentType: progressData.contentType || 'document', 
      lastUpdated: progressData.lastUpdated
    });
    
  } catch (error) {
    console.error('Error getting progress:', error);
    return NextResponse.json(
      { error: 'Failed to get progress' },
      { status: 500 }
    );
  }
}