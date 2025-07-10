import { AppSettings, ConversionResponse } from '../types';

export async function convertPdfToMarkdown(
  file: File,
  settings: AppSettings,
  onProgress?: (progress: number) => void
): Promise<ConversionResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    onProgress?.(10);

    const fileContent = await fileToBase64(file);
    onProgress?.(30);

    const response = await fetch(`${settings.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(settings.apiKey && { 'Authorization': `Bearer ${settings.apiKey}` }),
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [
          {
            role: 'system',
            content: settings.systemPrompt
          },
          {
            role: 'user',
            content: `请将这个PDF文档转换为Markdown格式：\n\n[PDF文档内容]\n${fileContent}`
          }
        ],
        temperature: 0.1,
        max_tokens: 4096,
        stream: false
      })
    });

    onProgress?.(70);

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    onProgress?.(90);

    if (result.choices && result.choices[0] && result.choices[0].message) {
      onProgress?.(100);
      return {
        success: true,
        result: result.choices[0].message.content
      };
    } else {
      throw new Error('API返回格式错误');
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('无法读取文件'));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

export function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.replace('.pdf', '.md');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}