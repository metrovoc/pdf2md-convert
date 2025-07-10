import { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { JobQueue } from './components/JobQueue';
import { Settings } from './components/Settings';
import { ServiceIcon } from './components/ServiceIcon';
import { useConversionQueue } from './hooks/useConversionQueue';
import { usePageVisibility } from './hooks/usePageVisibility';
import { useBeforeUnload } from './hooks/useBeforeUnload';
import { downloadMarkdown } from './utils/api';
import { AppSettings, ConversionJob } from './types';
import { loadSettings, saveSettings, getActiveService } from './utils/storage';
import { Play, Trash2, Download, RefreshCw, AlertCircle, X, WifiOff, Wifi } from 'lucide-react';

function App() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const { isVisible, isOnline } = usePageVisibility();

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);
  const {
    jobs,
    isProcessing,
    hasRecoverableJobs,
    addJobs,
    removeJob,
    processQueue,
    clearCompleted,
    clearAll,
    recoverJobs,
    discardRecovery
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
  const processingCount = jobs.filter(job => job.status === 'processing').length;
  
  const activeService = getActiveService(settings);
  const hasValidService = activeService && activeService.apiKey;

  // 当有进行中的任务时，离开页面需要确认
  const hasActiveJobs = isProcessing || processingCount > 0;
  useBeforeUnload(hasActiveJobs, '您有正在进行的转换任务，确定要离开吗？');

  // 网络状态变化时的处理
  useEffect(() => {
    if (!isOnline && isProcessing) {
      console.warn('网络连接断开，转换任务可能会失败');
    }
  }, [isOnline, isProcessing]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* 网络离线提示 */}
        {!isOnline && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <WifiOff className="w-5 h-5 text-red-600 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">网络连接断开</h3>
                <p className="text-sm text-red-700 mt-1">
                  当前网络不可用，转换功能暂时无法使用。请检查网络连接后重试。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* API密钥缺失提示 */}
        {isOnline && !hasValidService && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800">API密钥未配置</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  请在设置中配置 {activeService?.name} 的API密钥才能使用转换功能。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 恢复队列提示 */}
        {hasRecoverableJobs && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800">检测到未完成的任务</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  上次会话中有未完成的转换任务，是否要恢复这些任务？
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={recoverJobs}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-yellow-800 bg-yellow-100 hover:bg-yellow-200 rounded-md transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  恢复任务
                </button>
                <button
                  onClick={discardRecovery}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <X className="w-4 h-4 mr-1" />
                  放弃
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">PDF转Markdown工具</h1>
                <div className="flex items-center space-x-4 mt-1">
                  <p className="text-sm text-gray-600">
                    批量将PDF文档转换为Markdown格式
                  </p>
                  {activeService && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-gray-500">当前服务:</span>
                      <div className="flex items-center space-x-1">
                        <ServiceIcon 
                          iconPath={activeService.iconPath}
                          className="w-4 h-4"
                          fallback="🤖"
                        />
                        <span className="font-medium text-gray-700">{activeService.name}</span>
                        <div className={`w-2 h-2 rounded-full ${hasValidService ? 'bg-green-500' : 'bg-red-500'}`} 
                             title={hasValidService ? 'API密钥已配置' : 'API密钥未配置'} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* 网络状态指示器 */}
                <div className="flex items-center space-x-1">
                  {isOnline ? (
                    <div className="flex items-center text-green-600" title="网络已连接">
                      <Wifi className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600" title="网络断开">
                      <WifiOff className="w-4 h-4" />
                    </div>
                  )}
                  {!isVisible && (
                    <div className="text-xs text-gray-500 ml-2" title="页面在后台运行">
                      后台
                    </div>
                  )}
                </div>
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
                    disabled={isProcessing || pendingCount === 0 || !isOnline || !hasValidService}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-md transition-colors"
                    title={!isOnline ? '网络连接断开' : !hasValidService ? '请先配置API密钥' : ''}
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