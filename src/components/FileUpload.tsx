import React, { useCallback } from 'react';
import { Upload, FileText } from 'lucide-react';
import { ConversionJob } from '../types';

interface FileUploadProps {
  onFilesSelect: (jobs: ConversionJob[]) => void;
}

export function FileUpload({ onFilesSelect }: FileUploadProps) {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const jobs: ConversionJob[] = files.map(file => ({
      id: crypto.randomUUID(),
      filename: file.name,
      status: 'pending',
      progress: 0,
      file,
      createdAt: new Date(),
    }));
    
    onFilesSelect(jobs);
    event.target.value = '';
  }, [onFilesSelect]);

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
      <div className="flex flex-col items-center space-y-4">
        <Upload className="w-12 h-12 text-gray-400" />
        <div>
          <p className="text-lg font-medium text-gray-900 mb-2">选择PDF文件</p>
          <p className="text-sm text-gray-500">支持批量上传PDF文件进行转换</p>
        </div>
        <label className="cursor-pointer">
          <input
            type="file"
            multiple
            accept=".pdf"
            onChange={handleFileChange}
            className="sr-only"
          />
          <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <FileText className="w-4 h-4 mr-2" />
            选择文件
          </span>
        </label>
      </div>
    </div>
  );
}