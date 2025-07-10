import {
  AppSettings,
  SystemPromptPreset,
  ConversionJob,
  PersistedJobData,
  LLMService,
} from "../types";

const STORAGE_KEY = "pdf2md-settings";
const QUEUE_STORAGE_KEY = "pdf2md-queue";

const builtInServices: LLMService[] = [
  {
    id: "openrouter-gemini",
    name: "OpenRouter",
    type: "openai",
    baseUrl: "https://openrouter.ai/api/v1",
    apiKey: "",
    models: ["google/gemini-2.5-pro", "google/gemini-2.5-flash"],
    defaultModel: "google/gemini-2.5-pro",
    isBuiltIn: true,
    isActive: true,
    description: "通过OpenRouter访问多种AI模型",
    iconPath: "/assets/openrouter.svg",
  },
  {
    id: "gemini-direct",
    name: "Google Gemini",
    type: "gemini",
    baseUrl: "https://generativelanguage.googleapis.com",
    apiKey: "",
    models: ["gemini-2.5-pro", "gemini-2.5-flash"],
    defaultModel: "gemini-2.5-flash",
    isBuiltIn: true,
    isActive: false,
    description: "直接访问Google Gemini API",
    iconPath: "/assets/gemini-color.svg",
  },
  {
    id: "openai-gpt4o",
    name: "OpenAI",
    type: "openai",
    baseUrl: "https://api.openai.com/v1",
    apiKey: "",
    models: ["gpt-4o"],
    defaultModel: "gpt-4o",
    isBuiltIn: true,
    isActive: false,
    description: "OpenAI GPT-4o 多模态模型",
    iconPath: "/assets/openai.svg",
  },
];

export const defaultSettings: AppSettings = {
  services: [...builtInServices],
  activeServiceId: "openrouter-gemini",
  currentModel: "google/gemini-2.5-pro",
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
      // 确保内置服务存在且版本是最新的
      const mergedServices = mergeServices(
        parsed.services || [],
        builtInServices
      );
      return {
        ...defaultSettings,
        ...parsed,
        services: mergedServices,
      };
    }
  } catch (error) {
    console.warn("加载设置失败，使用默认设置:", error);
  }
  return defaultSettings;
}

function mergeServices(
  storedServices: LLMService[],
  builtInServices: LLMService[]
): LLMService[] {
  const merged = [...builtInServices];

  // 保留用户的API密钥和自定义服务
  storedServices.forEach((stored) => {
    const builtInIndex = merged.findIndex(
      (builtin) => builtin.id === stored.id
    );
    if (builtInIndex >= 0) {
      // 更新内置服务的API密钥，但保持其他配置为最新
      merged[builtInIndex] = {
        ...merged[builtInIndex],
        apiKey: stored.apiKey,
        isActive: stored.isActive,
      };
    } else if (!stored.isBuiltIn) {
      // 添加自定义服务
      merged.push(stored);
    }
  });

  return merged;
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
    const persistedData: PersistedJobData[] = jobs.map((job) => ({
      id: job.id,
      filename: job.filename,
      status: job.status,
      progress: job.progress,
      result: job.result,
      error: job.error,
      createdAt: job.createdAt.toISOString(),
      lastUpdated: job.lastUpdated.toISOString(),
      fileSize: job.file.size,
      fileType: job.file.type,
    }));

    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(persistedData));
  } catch (error) {
    console.error("保存队列失败:", error);
  }
}

export function loadPersistedQueue(): PersistedJobData[] {
  try {
    const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn("加载队列失败:", error);
  }
  return [];
}

export function clearPersistedQueue(): void {
  try {
    localStorage.removeItem(QUEUE_STORAGE_KEY);
  } catch (error) {
    console.error("清除队列失败:", error);
  }
}

export function isJobRecoverable(persistedJob: PersistedJobData): boolean {
  // 只恢复未完成的任务，避免恢复处理中的任务（可能已经中断）
  return (
    persistedJob.status === "pending" || persistedJob.status === "completed"
  );
}

// LLM服务管理函数
export function addCustomService(
  settings: AppSettings,
  service: Omit<LLMService, "id" | "isBuiltIn">
): AppSettings {
  const newService: LLMService = {
    ...service,
    id: generatePresetId(),
    isBuiltIn: false,
  };

  return {
    ...settings,
    services: [...settings.services, newService],
  };
}

export function updateService(
  settings: AppSettings,
  serviceId: string,
  updates: Partial<LLMService>
): AppSettings {
  return {
    ...settings,
    services: settings.services.map((service) =>
      service.id === serviceId ? { ...service, ...updates } : service
    ),
  };
}

export function removeService(
  settings: AppSettings,
  serviceId: string
): AppSettings {
  const newServices = settings.services.filter(
    (service) => service.id !== serviceId
  );

  return {
    ...settings,
    services: newServices,
    // 如果删除的是当前活跃服务，切换到第一个可用服务
    activeServiceId:
      settings.activeServiceId === serviceId
        ? (newServices.find((s) => s.isActive) || newServices[0])?.id ||
          "openrouter-gemini"
        : settings.activeServiceId,
  };
}

export function getActiveService(settings: AppSettings): LLMService | null {
  return (
    settings.services.find(
      (service) => service.id === settings.activeServiceId
    ) || null
  );
}

export function switchActiveService(
  settings: AppSettings,
  serviceId: string
): AppSettings {
  const service = settings.services.find((s) => s.id === serviceId);
  if (!service) return settings;

  return {
    ...settings,
    activeServiceId: serviceId,
    currentModel: service.defaultModel,
    services: settings.services.map((s) => ({
      ...s,
      isActive: s.id === serviceId,
    })),
  };
}
