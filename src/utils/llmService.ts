import { LLMService, ConversionResponse } from '../types';

interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
    detail?: string;
  };
}

interface OpenAIMessage {
  role: 'system' | 'user';
  content: string | MessageContent[];
}

interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

interface GeminiContent {
  parts: GeminiPart[];
}

export async function callLLMService(
  service: LLMService,
  systemPrompt: string,
  content: MessageContent[],
  settings: { temperature: number; outputLength: number; currentModel?: string },
  onProgress?: (progress: number) => void
): Promise<ConversionResponse> {
  try {
    onProgress?.(10);

    switch (service.type) {
      case 'openai':
        return await callOpenAIService(service, systemPrompt, content, settings, onProgress);
      case 'gemini':
        return await callGeminiService(service, systemPrompt, content, settings, onProgress);
      case 'custom':
        // 自定义服务默认使用OpenAI格式
        return await callOpenAIService(service, systemPrompt, content, settings, onProgress);
      default:
        throw new Error(`不支持的服务类型: ${service.type}`);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

async function callOpenAIService(
  service: LLMService,
  systemPrompt: string,
  content: MessageContent[],
  settings: { temperature: number; outputLength: number; currentModel?: string },
  onProgress?: (progress: number) => void
): Promise<ConversionResponse> {
  onProgress?.(30);

  const messages: OpenAIMessage[] = [
    {
      role: 'system',
      content: systemPrompt
    },
    {
      role: 'user',
      content: content
    }
  ];

  const response = await fetch(`${service.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(service.apiKey && { 'Authorization': `Bearer ${service.apiKey}` }),
    },
    body: JSON.stringify({
      model: settings.currentModel || service.defaultModel,
      messages,
      temperature: settings.temperature,
      max_tokens: settings.outputLength,
      stream: true
    })
  });

  onProgress?.(50);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API请求失败: ${response.status} ${response.statusText}\n${errorText}`);
  }

  // 处理流式响应
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('无法读取响应流');
  }

  const decoder = new TextDecoder();
  let streamContent = '';
  let totalTokens = 0;
  const estimatedTokens = settings.outputLength || 4000;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            break;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
              const deltaContent = parsed.choices[0].delta.content;
              streamContent += deltaContent;
              totalTokens += deltaContent.length;
              
              // 更新进度：基于接收到的内容量
              const progress = Math.min(95, 50 + (totalTokens / estimatedTokens) * 45);
              onProgress?.(progress);
            }
          } catch (e) {
            // 忽略解析错误，继续处理
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  onProgress?.(95);

  if (streamContent) {
    onProgress?.(100);
    return {
      success: true,
      result: extractMarkdownContent(streamContent)
    };
  } else {
    throw new Error('API返回内容为空');
  }
}

async function callGeminiService(
  service: LLMService,
  systemPrompt: string,
  content: MessageContent[],
  settings: { temperature: number; outputLength: number; currentModel?: string },
  onProgress?: (progress: number) => void
): Promise<ConversionResponse> {
  onProgress?.(30);

  // 转换内容格式为Gemini格式
  const parts: GeminiPart[] = [];
  
  // 添加系统提示作为第一个部分
  parts.push({ text: systemPrompt + '\n\n' });

  // 转换用户内容
  for (const item of content) {
    if (item.type === 'text' && item.text) {
      parts.push({ text: item.text });
    } else if (item.type === 'image_url' && item.image_url) {
      // 提取base64数据和mime类型
      const dataUrl = item.image_url.url;
      if (dataUrl.startsWith('data:')) {
        const [mimeTypePart, base64Data] = dataUrl.split(',');
        const mimeType = mimeTypePart.split(':')[1].split(';')[0];
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        });
      }
    }
  }

  const geminiContent: GeminiContent = { parts };

  const model = settings.currentModel || service.defaultModel;
  const url = `${service.baseUrl}/v1beta/models/${model}:generateContent`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': service.apiKey,
    },
    body: JSON.stringify({
      contents: [geminiContent],
      generationConfig: {
        temperature: settings.temperature,
        maxOutputTokens: settings.outputLength,
      }
    })
  });

  onProgress?.(50);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API请求失败: ${response.status} ${response.statusText}\n${errorText}`);
  }

  // 模拟进度更新，因为Gemini的标准API不支持流式传输
  const progressInterval = setInterval(() => {
    onProgress?.(50 + Math.random() * 40);
  }, 500);

  try {
    const result = await response.json();
    clearInterval(progressInterval);
    onProgress?.(95);

    if (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts) {
      const textParts = result.candidates[0].content.parts
        .filter((part: any) => part.text)
        .map((part: any) => part.text);
      
      if (textParts.length > 0) {
        onProgress?.(100);
        const rawContent = textParts.join('');
        return {
          success: true,
          result: extractMarkdownContent(rawContent)
        };
      }
    }
  } catch (error) {
    clearInterval(progressInterval);
    throw error;
  }

  throw new Error('Gemini API返回格式错误');
}

/**
 * 从LLM响应中提取和清理markdown内容
 */
export function extractMarkdownContent(rawResponse: string): string {
  if (!rawResponse || typeof rawResponse !== 'string') {
    return '';
  }

  let content = rawResponse.trim();
  
  // 检测并提取```markdown```代码块
  const markdownBlockRegex = /```markdown\s*\n([\s\S]*?)\n```/i;
  const match = content.match(markdownBlockRegex);
  
  if (match && match[1]) {
    content = match[1].trim();
  } else {
    // 检测其他可能的代码块格式
    const genericBlockRegex = /```\s*\n([\s\S]*?)\n```/;
    const genericMatch = content.match(genericBlockRegex);
    
    if (genericMatch && genericMatch[1]) {
      // 只有当代码块内容看起来像markdown时才提取
      const blockContent = genericMatch[1].trim();
      if (looksLikeMarkdown(blockContent)) {
        content = blockContent;
      }
    }
  }
  
  // 清理多余的空行
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return content.trim();
}

/**
 * 判断文本内容是否看起来像markdown
 */
function looksLikeMarkdown(content: string): boolean {
  const markdownFeatures = [
    /^#{1,6}\s+/m,           // 标题
    /^\*\s+/m,               // 无序列表
    /^\d+\.\s+/m,            // 有序列表
    /\*\*.*?\*\*/,           // 粗体
    /\[.*?\]\(.*?\)/,        // 链接
    /^\|.*?\|/m,             // 表格
  ];
  
  return markdownFeatures.some(regex => regex.test(content));
}

export function createMessageContent(images: string[], text: string): MessageContent[] {
  const content: MessageContent[] = [
    {
      type: 'text',
      text: text
    }
  ];

  images.forEach((imageBase64) => {
    content.push({
      type: 'image_url',
      image_url: {
        url: `data:image/png;base64,${imageBase64}`,
        detail: 'high'
      }
    });
  });

  return content;
}