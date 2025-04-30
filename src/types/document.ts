export interface Document {
    id: string;
    project_id: string;
    name: string;
    type: 'pdf' | 'link' | 'video';
    upload_date: string;
    file_size: number;
    page_count?: number;
    encrypted_metadata?: any;
  }