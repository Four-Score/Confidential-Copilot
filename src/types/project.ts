export interface Project {
    id: string;
    name: string;
    description?: string;
    created_at: string;
    user_id: string;
    document_count?: number;
    website_count?: number;
  }