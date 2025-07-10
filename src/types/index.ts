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
  apiKey: string;
  model: string;
  customModels: string[];
  systemPrompt: string;
  temperature: number;
  outputLength: number;
}

export interface ConversionResponse {
  success: boolean;
  result?: string;
  error?: string;
}