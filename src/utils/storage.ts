import { AppSettings, SystemPromptPreset, ConversionJob, PersistedJobData } from "../types";

const STORAGE_KEY = "pdf2md-settings";
const QUEUE_STORAGE_KEY = "pdf2md-queue";

export const defaultSettings: AppSettings = {
  apiUrl: "http://localhost:8000/v1",
  apiKey: "",
  model: "gemini-2.5-pro",
  customModels: [],
  systemPrompt: `你是一个专业的PDF文档分析助手。请将提供的PDF文档内容转换为清晰、结构化的Markdown格式。

要求：
1. 保持原文档的逻辑结构和层次关系
2. 正确识别标题、段落、列表等元素
3. 保留重要的格式信息
4. 如果有表格，请用Markdown表格格式呈现
5. 如果有代码块，请正确标记语言类型
6. 移除页眉、页脚等冗余信息
7. 确保输出的Markdown语法正确

请直接输出转换后的Markdown内容，不要添加额外的说明文字。`,
  temperature: 0,
  outputLength: 65536,
  systemPromptPresets: [],
};

export function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultSettings, ...parsed };
    }
  } catch (error) {
    console.warn("加载设置失败，使用默认设置:", error);
  }
  return defaultSettings;
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("保存设置失败:", error);
  }
}

export function resetSettings(): AppSettings {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("重置设置失败:", error);
  }
  return defaultSettings;
}

export function generatePresetId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function createSystemPromptPreset(
  name: string,
  prompt: string
): SystemPromptPreset {
  return {
    id: generatePresetId(),
    name,
    prompt,
    createdAt: new Date(),
  };
}

export function addSystemPromptPreset(
  settings: AppSettings,
  preset: SystemPromptPreset
): AppSettings {
  return {
    ...settings,
    systemPromptPresets: [...settings.systemPromptPresets, preset],
  };
}

export function removeSystemPromptPreset(
  settings: AppSettings,
  presetId: string
): AppSettings {
  return {
    ...settings,
    systemPromptPresets: settings.systemPromptPresets.filter(
      (p) => p.id !== presetId
    ),
  };
}

export function updateSystemPromptPreset(
  settings: AppSettings,
  presetId: string,
  updates: Partial<SystemPromptPreset>
): AppSettings {
  return {
    ...settings,
    systemPromptPresets: settings.systemPromptPresets.map((p) =>
      p.id === presetId ? { ...p, ...updates } : p
    ),
  };
}

// 队列持久化函数
export function persistQueue(jobs: ConversionJob[]): void {
  try {
    const persistedData: PersistedJobData[] = jobs.map(job => ({
      id: job.id,
      filename: job.filename,
      status: job.status,
      progress: job.progress,
      result: job.result,
      error: job.error,
      createdAt: job.createdAt.toISOString(),
      lastUpdated: job.lastUpdated.toISOString(),
      fileSize: job.file.size,
      fileType: job.file.type
    }));
    
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(persistedData));
  } catch (error) {
    console.error('保存队列失败:', error);
  }
}

export function loadPersistedQueue(): PersistedJobData[] {
  try {
    const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('加载队列失败:', error);
  }
  return [];
}

export function clearPersistedQueue(): void {
  try {
    localStorage.removeItem(QUEUE_STORAGE_KEY);
  } catch (error) {
    console.error('清除队列失败:', error);
  }
}

export function isJobRecoverable(persistedJob: PersistedJobData): boolean {
  // 只恢复未完成的任务，避免恢复处理中的任务（可能已经中断）
  return persistedJob.status === 'pending' || persistedJob.status === 'completed';
}
