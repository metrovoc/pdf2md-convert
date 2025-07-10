import { AppSettings } from '../types';

export interface ApiTestResult {
  success: boolean;
  error?: string;
  models?: string[];
  latency?: number;
}

export async function testApiConnection(settings: AppSettings): Promise<ApiTestResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${settings.apiUrl}/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(settings.apiKey && { 'Authorization': `Bearer ${settings.apiKey}` }),
      },
      signal: AbortSignal.timeout(10000), // 10秒超时
    });

    const latency = Date.now() - startTime;

    if (!response.ok) {
      return {
        success: false,
        error: `API请求失败: ${response.status} ${response.statusText}`,
        latency,
      };
    }

    const data = await response.json();
    const models = data.data ? data.data.map((m: any) => m.id) : [];

    return {
      success: true,
      models,
      latency,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        return {
          success: false,
          error: '连接超时，请检查API地址和网络连接',
          latency,
        };
      }
      
      return {
        success: false,
        error: `连接失败: ${error.message}`,
        latency,
      };
    }

    return {
      success: false,
      error: '未知错误',
      latency,
    };
  }
}