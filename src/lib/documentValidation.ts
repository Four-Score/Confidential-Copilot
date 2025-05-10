import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

/**
 * Validate that the user has access to all specified documents
 * @param supabase Supabase client
 * @param userId User ID
 * @param documentIds Array of document IDs to check
 * @returns Boolean indicating whether the user has access to all documents
 */
export async function validateDocumentAccess(
  supabase: SupabaseClient<Database>,
  userId: string,
  documentIds: string[]
): Promise<boolean> {
  if (!documentIds.length) return true;
  
  try {
    // Check encrypted documents
    const { data: encryptedDocs, error: encryptedError } = await supabase
      .from('documents')
      .select('id, project_id')
      .in('id', documentIds)
      .eq('user_id', userId);
    
    if (encryptedError) {
      console.error('Error checking encrypted documents:', encryptedError);
      return false;
    }
    
    // Check unencrypted documents
    const { data: unencryptedDocs, error: unencryptedError } = await supabase
      .from('v2_documents')
      .select('id, project_id')
      .in('id', documentIds)
      .eq('user_id', userId);
    
    if (unencryptedError) {
      console.error('Error checking unencrypted documents:', unencryptedError);
      return false;
    }
    
    // Combine both document sets and check if all requested IDs are included
    const foundDocIds = new Set([
      ...(encryptedDocs || []).map(doc => doc.id),
      ...(unencryptedDocs || []).map(doc => doc.id)
    ]);
    
    return documentIds.every(id => foundDocIds.has(id));
  } catch (error) {
    console.error('Error validating document access:', error);
    return false;
  }
}