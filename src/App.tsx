import { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { JobQueue } from './components/JobQueue';
import { Settings } from './components/Settings';
import { useConversionQueue } from './hooks/useConversionQueue';
import { downloadMarkdown } from './utils/api';
import { AppSettings, ConversionJob } from './types';
import { loadSettings, saveSettings } from './utils/storage';
import { Play, Trash2, Download } from 'lucide-react';

function App() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings());

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);
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

    // 逐个下载每个文件
    completedJobs.forEach((job, index) => {
      setTimeout(() => {
        handleDownload(job);
      }, index * 200); // 间隔200ms避免浏览器阻止多个下载
    });
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
          <p>支持的文件格式：PDF | 推荐模型：Gemini 2.5 Pro, GPT-4o</p>
        </div>
      </div>
    </div>
  );
}

export default App;