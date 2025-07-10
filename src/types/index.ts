export interface ConversionJob {
  id: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  file: File;
  result?: string;
  error?: string;
  createdAt: Date;
  lastUpdated: Date;
}

export interface PersistedJobData {
  id: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  result?: string;
  error?: string;
  createdAt: string;
  lastUpdated: string;
  fileSize: number;
  fileType: string;
}

export interface SystemPromptPreset {
  id: string;
  name: string;
  prompt: string;
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
  systemPromptPresets: SystemPromptPreset[];
}

export interface ConversionResponse {
  success: boolean;
  result?: string;
  error?: string;
}