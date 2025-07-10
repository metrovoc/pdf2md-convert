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
  startTime?: Date;
  endTime?: Date;
  duration?: number; // 毫秒
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
  startTime?: string;
  endTime?: string;
  duration?: number;
  fileSize: number;
  fileType: string;
}

export interface SystemPromptPreset {
  id: string;
  name: string;
  prompt: string;
  createdAt: Date;
}

export type LLMServiceType = 'openai' | 'gemini' | 'custom';

export interface LLMService {
  id: string;
  name: string;
  type: LLMServiceType;
  baseUrl: string;
  apiKey: string;
  models: string[];
  defaultModel: string;
  isBuiltIn: boolean;
  isActive: boolean;
  description?: string;
  iconPath?: string;
}

export interface AppSettings {
  services: LLMService[];
  activeServiceId: string;
  currentModel: string;
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