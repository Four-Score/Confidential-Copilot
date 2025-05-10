import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { VectorSearchRequest, VectorSearchResult, ChunkSearchResult, SearchConfig, DEFAULT_SEARCH_CONFIG } from '@/types/search';

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
    const requestBody: VectorSearchRequest = await request.json();
    
    const { 
      query, 
      queryEmbedding, 
      projectId, 
      documentIds,
      config = {} 
    } = requestBody;
    

    // Validate required parameters
    if (!query || !queryEmbedding || !projectId) {
      return NextResponse.json(
        { error: 'Missing required parameters' }, 
        { status: 400 }
      );
    }

    // Merge default config with provided config
    const searchConfig: SearchConfig = {
      ...DEFAULT_SEARCH_CONFIG,
      ...config
    };
    

    // Initialize arrays to store results
    let encryptedResults: ChunkSearchResult[] = [];
    let unencryptedResults: ChunkSearchResult[] = [];
    
    // Search encrypted documents
    const { data: encryptedData, error: encryptedError } = await supabase.rpc(
      'match_document_chunks',
      {
        query_embedding: queryEmbedding,
        match_threshold: searchConfig.matchThreshold,
        match_count: searchConfig.matchCount,
        user_id: user.id,
        project_id: projectId,
        optional_doc_ids: documentIds
      }
    );

    if (encryptedError) {
      console.error('Error searching encrypted documents:', encryptedError);
    } else if (encryptedData) {
      
      // Transform results to match ChunkSearchResult interface
      encryptedResults = encryptedData.map((item: any) => ({
        chunkId: item.chunk_id,
        documentId: item.document_id,
        documentName: item.document_name,
        documentType: item.document_type,
        chunkNumber: item.chunk_number,
        encryptedContent: item.encrypted_chunk_content,
        metadata: item.encrypted_metadata,
        similarity: item.similarity,
        isDecrypted: false
      }));
    } else {
      console.log('No encrypted document results');
    }

    // Search unencrypted documents
    const { data: unencryptedData, error: unencryptedError } = await supabase.rpc(
      'match_v2_document_chunks',
      {
        query_embedding: queryEmbedding,
        match_threshold: searchConfig.matchThreshold,
        match_count: searchConfig.matchCount,
        user_id: user.id,
        project_id: projectId,
        optional_doc_ids: documentIds
      }
    );

    if (unencryptedError) {
      console.error('Error searching unencrypted documents:', unencryptedError);
    } else if (unencryptedData) {
      
      // Transform results to match ChunkSearchResult interface
      unencryptedResults = unencryptedData.map((item: any) => ({
        chunkId: item.chunk_id,
        documentId: item.document_id,
        documentName: item.document_name,
        documentType: item.document_type,
        chunkNumber: item.chunk_number,
        content: item.chunk_content,
        metadata: item.metadata,
        similarity: item.similarity,
        isDecrypted: true
      }));
    } else {
      console.log('No unencrypted document results');
    }

    // Combine and sort results by similarity
    const combinedResults = [...encryptedResults, ...unencryptedResults]
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, searchConfig.matchCount);
    
    // Return the search results
    const result: VectorSearchResult = {
      encryptedResults,
      unencryptedResults,
      combinedResults,
      query,
      totalResults: combinedResults.length,
      searchConfig
    };
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to perform vector search' }, 
      { status: 500 }
    );
  }
}