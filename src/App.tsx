import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { JobQueue } from './components/JobQueue';
import { Settings } from './components/Settings';
import { useConversionQueue } from './hooks/useConversionQueue';
import { downloadMarkdown } from './utils/api';
import { AppSettings, ConversionJob } from './types';
import { Play, Trash2, Download } from 'lucide-react';

const defaultSettings: AppSettings = {
  apiUrl: 'http://localhost:8000/v1',
  model: 'gpt-4o',
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

function App() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const {
    jobs,
    isProcessing,
    addJobs,
    removeJob,
    processQueue,
    clearCompleted,
    clearAll
  } = useConversionQueue();

  const handleDownload = (job: ConversionJob) => {
    if (job.result) {
      downloadMarkdown(job.filename, job.result);
    }
  };

  const handleDownloadAll = () => {
    const completedJobs = jobs.filter(job => job.status === 'completed' && job.result);
    if (completedJobs.length === 0) return;

    if (completedJobs.length === 1) {
      handleDownload(completedJobs[0]);
      return;
    }

    const allContent = completedJobs
      .map(job => `# ${job.filename}\n\n${job.result}`)
      .join('\n\n---\n\n');
    
    downloadMarkdown('批量转换结果.md', allContent);
  };

  const pendingCount = jobs.filter(job => job.status === 'pending').length;
  const completedCount = jobs.filter(job => job.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">PDF转Markdown工具</h1>
                <p className="text-sm text-gray-600 mt-1">
                  批量将PDF文档转换为Markdown格式
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Settings settings={settings} onSettingsChange={setSettings} />
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <FileUpload onFilesSelect={addJobs} />

            {jobs.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => processQueue(settings)}
                    disabled={isProcessing || pendingCount === 0}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-md transition-colors"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {isProcessing ? '处理中...' : `开始转换 (${pendingCount})`}
                  </button>
                  
                  {completedCount > 0 && (
                    <button
                      onClick={handleDownloadAll}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      下载全部 ({completedCount})
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {completedCount > 0 && (
                    <button
                      onClick={clearCompleted}
                      className="text-sm text-gray-600 hover:text-gray-800 underline"
                    >
                      清除已完成
                    </button>
                  )}
                  <button
                    onClick={clearAll}
                    disabled={isProcessing}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    清空队列
                  </button>
                </div>
              </div>
            )}

            <JobQueue 
              jobs={jobs} 
              onDownload={handleDownload}
              onRemove={removeJob}
            />
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>支持的文件格式：PDF | 推荐模型：GPT-4o, Claude-3</p>
        </div>
      </div>
    </div>
  );
}

export default App;