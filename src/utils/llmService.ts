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
      stream: false
    })
  });

  onProgress?.(80);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API请求失败: ${response.status} ${response.statusText}\n${errorText}`);
  }

  const result = await response.json();
  onProgress?.(95);

  if (result.choices && result.choices[0] && result.choices[0].message) {
    onProgress?.(100);
    return {
      success: true,
      result: result.choices[0].message.content
    };
  } else {
    throw new Error('API返回格式错误');
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

  onProgress?.(80);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API请求失败: ${response.status} ${response.statusText}\n${errorText}`);
  }

  const result = await response.json();
  onProgress?.(95);

  if (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts) {
    const textParts = result.candidates[0].content.parts
      .filter((part: any) => part.text)
      .map((part: any) => part.text);
    
    if (textParts.length > 0) {
      onProgress?.(100);
      return {
        success: true,
        result: textParts.join('')
      };
    }
  }

  throw new Error('Gemini API返回格式错误');
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