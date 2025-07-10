import { AppSettings, ConversionResponse } from '../types';
import { callLLMService, createMessageContent } from './llmService';
import { getActiveService } from './storage';

export async function convertPdfToMarkdown(
  file: File,
  settings: AppSettings,
  onProgress?: (progress: number) => void
): Promise<ConversionResponse> {
  try {
    onProgress?.(10);

    // 将PDF转换为图像，传递进度回调
    const images = await pdfToImages(file, (pdfProgress) => {
      // PDF处理占总进度的10%-40%
      const totalProgress = 10 + (pdfProgress * 30);
      onProgress?.(totalProgress);
    });
    onProgress?.(40);

    if (images.length === 0) {
      throw new Error('PDF转换失败：无法提取图像');
    }

    // 获取当前活跃的服务
    const activeService = getActiveService(settings);
    if (!activeService) {
      throw new Error('未找到可用的LLM服务');
    }

    if (!activeService.apiKey) {
      throw new Error(`请先配置 ${activeService.name} 的API密钥`);
    }

    // 构建消息内容
    const content = createMessageContent(images, `PDF文档共${images.length}页：`);

    // 使用统一的LLM服务调用接口
    return await callLLMService(
      activeService,
      settings.systemPrompt,
      content,
      {
        temperature: settings.temperature,
        outputLength: settings.outputLength,
        currentModel: settings.currentModel
      },
      onProgress
    );
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

async function pdfToImages(file: File, onProgress?: (progress: number) => void): Promise<string[]> {
  try {
    // 在浏览器环境中，我们需要使用不同的方法
    // 由于pdf2pic是Node.js库，我们需要使用浏览器兼容的方案
    return await convertPdfToImagesInBrowser(file, onProgress);
  } catch (error) {
    console.error('PDF转换失败:', error);
    throw new Error('PDF转换为图像失败');
  }
}

async function convertPdfToImagesInBrowser(file: File, onProgress?: (progress: number) => void): Promise<string[]> {
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
    
    // 更新进度：基于已处理的页数
    const pageProgress = pageNum / pdf.numPages;
    onProgress?.(pageProgress);
    
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