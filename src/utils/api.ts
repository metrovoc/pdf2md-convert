import { AppSettings, ConversionResponse } from '../types';

export async function convertPdfToMarkdown(
  file: File,
  settings: AppSettings,
  onProgress?: (progress: number) => void
): Promise<ConversionResponse> {
  try {
    onProgress?.(10);

    // 将PDF转换为图像
    const images = await pdfToImages(file);
    onProgress?.(40);

    if (images.length === 0) {
      throw new Error('PDF转换失败：无法提取图像');
    }

    // 构建包含多张图像的消息内容
    const content = [
      {
        type: 'text' as const,
        text: `请将这个PDF文档转换为清晰、结构化的Markdown格式。PDF共有${images.length}页，请按页面顺序处理并合并为一个完整的Markdown文档。`
      },
      ...images.map((imageBase64) => ({
        type: 'image_url' as const,
        image_url: {
          url: `data:image/png;base64,${imageBase64}`,
          detail: 'high' as const
        }
      }))
    ];

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
            content
          }
        ],
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
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

async function pdfToImages(file: File): Promise<string[]> {
  try {
    // 在浏览器环境中，我们需要使用不同的方法
    // 由于pdf2pic是Node.js库，我们需要使用浏览器兼容的方案
    return await convertPdfToImagesInBrowser(file);
  } catch (error) {
    console.error('PDF转换失败:', error);
    throw new Error('PDF转换为图像失败');
  }
}

async function convertPdfToImagesInBrowser(file: File): Promise<string[]> {
  // 动态导入PDF.js
  const pdfjsLib = await import('pdfjs-dist');
  
  // 设置worker
  if (typeof pdfjsLib.GlobalWorkerOptions !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const images: string[] = [];
  const scale = 2.0; // 提高分辨率
  
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    await page.render(renderContext).promise;
    
    // 转换为base64
    const base64 = canvas.toDataURL('image/png').split(',')[1];
    images.push(base64);
  }
  
  return images;
}

export function downloadMarkdown(filename: string, content: string) {
  try {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace('.pdf', '.md');
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    
    // 延迟清理，确保下载能够完成
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error('下载失败:', error);
    alert('下载失败，请重试');
  }
}