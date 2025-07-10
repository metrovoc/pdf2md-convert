import { AppSettings } from '../types';

const STORAGE_KEY = 'pdf2md-settings';

export const defaultSettings: AppSettings = {
  apiUrl: 'http://localhost:8000/v1',
  apiKey: '',
  model: 'gemini-2.5-pro',
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

请直接输出转换后的Markdown内容，不要添加额外的说明文字。`
};

export function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultSettings, ...parsed };
    }
  } catch (error) {
    console.warn('加载设置失败，使用默认设置:', error);
  }
  return defaultSettings;
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('保存设置失败:', error);
  }
}

export function resetSettings(): AppSettings {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('重置设置失败:', error);
  }
  return defaultSettings;
}