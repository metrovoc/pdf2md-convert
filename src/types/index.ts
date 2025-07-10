export interface ConversionJob {
  id: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  file: File;
  result?: string;
  error?: string;
  createdAt: Date;
}

export interface AppSettings {
  apiUrl: string;
  model: string;
  systemPrompt: string;
}

export interface ConversionResponse {
  success: boolean;
  result?: string;
  error?: string;
}