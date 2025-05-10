export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string
          project_id: string
          name: string
          type: string
          upload_date: string
          encrypted_content?: string
          encrypted_metadata?: Json
          file_size?: number
          page_count?: number
          user_id: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          type: string
          upload_date?: string
          encrypted_content?: string
          encrypted_metadata?: Json
          file_size?: number
          page_count?: number
          user_id: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          type?: string
          upload_date?: string
          encrypted_content?: string
          encrypted_metadata?: Json
          file_size?: number
          page_count?: number
          user_id?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description?: string
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          created_at?: string
          user_id?: string
        }
      }
      user_keys: {
        Row: {
          id: string
          user_id: string
          enc_key_pw: string
          iv_pw: string
          enc_key_recovery: string
          iv_recovery: string
          encrypted_dcpe_keys?: string
          salt: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          enc_key_pw: string
          iv_pw: string
          enc_key_recovery: string
          iv_recovery: string
          encrypted_dcpe_keys?: string
          salt: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          enc_key_pw?: string
          iv_pw?: string
          enc_key_recovery?: string
          iv_recovery?: string
          encrypted_dcpe_keys?: string
          salt?: string
          created_at?: string
          updated_at?: string
        }
      }
      v2_documents: {
        Row: {
          id: string
          project_id: string
          name: string
          type: string
          upload_date: string
          content?: string
          metadata?: Json
          file_size?: number
          page_count?: number
          user_id: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          type: string
          upload_date?: string
          content?: string
          metadata?: Json
          file_size?: number
          page_count?: number
          user_id: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          type?: string
          upload_date?: string
          content?: string
          metadata?: Json
          file_size?: number
          page_count?: number
          user_id?: string
        }
      }
      vector_chunks: {
        Row: {
          id: string
          document_id: string
          chunk_number: number
          encrypted_chunk_content: string
          encrypted_embeddings: number[]
          metadata?: Json
        }
        Insert: {
          id?: string
          document_id: string
          chunk_number: number
          encrypted_chunk_content: string
          encrypted_embeddings: number[]
          metadata?: Json
        }
        Update: {
          id?: string
          document_id?: string
          chunk_number?: number
          encrypted_chunk_content?: string
          encrypted_embeddings?: number[]
          metadata?: Json
        }
      }
      v2_vector_chunks: {
        Row: {
          id: string
          document_id: string
          chunk_number: number
          chunk_content: string
          encrypted_embeddings: number[]
          metadata?: Json
        }
        Insert: {
          id?: string
          document_id: string
          chunk_number: number
          chunk_content: string
          encrypted_embeddings: number[]
          metadata?: Json
        }
        Update: {
          id?: string
          document_id?: string
          chunk_number?: number
          chunk_content?: string
          encrypted_embeddings?: number[]
          metadata?: Json
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_document_chunks: {
        Args: {
          query_embedding: number[]
          match_threshold: number
          match_count: number
          user_id: string
          project_id: string
          doc_ids?: string[]
        }
        Returns: {
          id: string
          document_id: string
          document_name: string
          document_type: string
          chunk_number: number
          similarity: number
          encrypted_content: string
          metadata: Json
        }[]
      }
      match_v2_document_chunks: {
        Args: {
          query_embedding: number[]
          match_threshold: number
          match_count: number
          user_id: string
          project_id: string
          doc_ids?: string[]
        }
        Returns: {
          id: string
          document_id: string
          document_name: string
          document_type: string
          chunk_number: number
          similarity: number
          content: string
          metadata: Json
        }[]
      }
      insert_document_with_chunks: {
        Args: {
          p_project_id: string
          p_name: string
          p_type: string
          p_file_size: number
          p_page_count: number
          p_encrypted_content: string
          p_encrypted_metadata: Json
          p_chunks: Json
        }
        Returns: Json
      }
      insert_website_with_chunks: {
        Args: {
          p_project_id: string
          p_name: string
          p_content: string
          p_metadata: Json
          p_file_size: number
          p_chunks: Json
        }
        Returns: Json
      }
    }
    Enums: {
      document_type: "pdf" | "link" | "video" | "website" | "youtube"
    }
  }
}