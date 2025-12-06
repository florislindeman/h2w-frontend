export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface Document {
  id: string;
  title: string;
  file_name: string;
  file_type: string;
  file_url: string;
  file_size: number;
  upload_date: string;
  uploaded_by: string;
  tags: string[];
  categories: Category[];
  uploader_name: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface ChatMessage {
  question: string;
  answer: string;
  confidence: number;
  sources: SourceDocument[];
  created_at: string;
}

export interface SourceDocument {
  document_id: string;
  document_title: string;
  document_url: string;
  file_type: string;
}