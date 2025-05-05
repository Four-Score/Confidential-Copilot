import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// Request body interface
interface DecryptRequest {
  chunks: {
    chunkId: string;
    encryptedContent: string;
    metadata?: any;
  }[];
}

// Response interface for decrypted chunks
interface DecryptResponse {
  chunks: {
    chunkId: string;
    content: string;
    metadata?: any;
  }[];
}

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client with cookies for auth
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const requestBody: DecryptRequest = await request.json();
    const { chunks } = requestBody;
    
    if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or empty chunks array' }, 
        { status: 400 }
      );
    }
    
    // In a zero-trust architecture, we don't actually perform decryption server-side
    // We just validate the request and return a structured response that the client
    // will need to decrypt client-side
    
    // Instead of decrypting, we simply acknowledge the request
    // The actual decryption will happen on the client using the Key Management Service
    
    // For debugging purposes, validate that the chunks actually exist and belong to the user
    // This is an extra security step that's not strictly necessary but helps prevent abuse
    for (const chunk of chunks) {
      const { data: chunkData, error } = await supabase
        .from('vector_chunks')
        .select('id, document_id')
        .eq('id', chunk.chunkId)
        .single();
      
      if (error || !chunkData) {
        // If chunk doesn't exist or there's an error, skip validation for this chunk
        console.warn(`Chunk validation failed for ${chunk.chunkId}:`, error);
        continue;
      }
      
      // Check if the document belongs to the user
      const { data: documentData, error: documentError } = await supabase
        .from('documents')
        .select('project_id')
        .eq('id', chunkData.document_id)
        .single();
      
      if (documentError || !documentData) {
        console.warn(`Document validation failed for chunk ${chunk.chunkId}:`, documentError);
        continue;
      }
      
      // Check if the project belongs to the user
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', documentData.project_id)
        .eq('user_id', user.id)
        .single();
      
      if (projectError || !projectData) {
        console.warn(`Project validation failed for chunk ${chunk.chunkId}:`, projectError);
        return NextResponse.json({ error: 'Unauthorized access to chunk' }, { status: 403 });
      }
    }
    
    // Return the same structure that was received, indicating the client should proceed with decryption
    const response: DecryptResponse = {
      chunks: chunks.map(chunk => ({
        chunkId: chunk.chunkId,
        content: chunk.encryptedContent, // Client will need to decrypt this
        metadata: chunk.metadata      // Client will need to decrypt this
      }))
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Batch decryption error:', error);
    return NextResponse.json(
      { error: 'Failed to process batch decryption' }, 
      { status: 500 }
    );
  }
}