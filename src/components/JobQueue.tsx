import { CheckCircle, XCircle, Clock, Loader2, Download } from 'lucide-react';
import { ConversionJob } from '../types';

interface JobQueueProps {
  jobs: ConversionJob[];
  onDownload: (job: ConversionJob) => void;
  onRemove: (jobId: string) => void;
}

export function JobQueue({ jobs, onDownload, onRemove }: JobQueueProps) {
  const getStatusIcon = (status: ConversionJob['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-400" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusText = (status: ConversionJob['status']) => {
    switch (status) {
      case 'pending':
        return '等待中';
      case 'processing':
        return '处理中';
      case 'completed':
        return '已完成';
      case 'error':
        return '转换失败';
    }
  };

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>暂无转换任务</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">转换队列</h2>
      {jobs.map((job) => (
        <div key={job.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              {getStatusIcon(job.status)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {job.filename}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-500">
                    {getStatusText(job.status)}
                  </span>
                  {job.status === 'processing' && (
                    <span className="text-xs text-blue-600">
                      {job.progress}%
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {job.status === 'completed' && (
                <button
                  onClick={() => onDownload(job)}
                  className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full transition-colors"
                  title="下载结果"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => onRemove(job.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="移除"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {job.status === 'processing' && (
            <div className="mt-3">
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
            </div>
          )}
          
          {job.status === 'error' && job.error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {job.error}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}