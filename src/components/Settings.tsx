import React, { useState } from 'react';
import { Settings as SettingsIcon, X } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

export function Settings({ settings, onSettingsChange }: SettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);

  const handleSave = () => {
    onSettingsChange(tempSettings);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempSettings(settings);
    setIsOpen(false);
  };

  const commonModels = [
    'gpt-4o',
    'gpt-4-turbo',
    'claude-3-opus',
    'claude-3-sonnet',
    'llama-3-70b',
    'mixtral-8x7b'
  ];

  const defaultPrompt = `你是一个专业的PDF文档分析助手。请将提供的PDF文档内容转换为清晰、结构化的Markdown格式。

要求：
1. 保持原文档的逻辑结构和层次关系
2. 正确识别标题、段落、列表等元素
3. 保留重要的格式信息
4. 如果有表格，请用Markdown表格格式呈现
5. 如果有代码块，请正确标记语言类型
6. 移除页眉、页脚等冗余信息
7. 确保输出的Markdown语法正确

请直接输出转换后的Markdown内容，不要添加额外的说明文字。`;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="设置"
      >
        <SettingsIcon className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">设置</h2>
              <button
                onClick={handleCancel}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  VLLM API地址
                </label>
                <input
                  type="url"
                  value={tempSettings.apiUrl}
                  onChange={(e) => setTempSettings({ ...tempSettings, apiUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="http://localhost:8000/v1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  模型名称
                </label>
                <div className="space-y-2">
                  <select
                    value={commonModels.includes(tempSettings.model) ? tempSettings.model : 'custom'}
                    onChange={(e) => {
                      if (e.target.value !== 'custom') {
                        setTempSettings({ ...tempSettings, model: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {commonModels.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                    <option value="custom">自定义模型</option>
                  </select>
                  
                  {!commonModels.includes(tempSettings.model) && (
                    <input
                      type="text"
                      value={tempSettings.model}
                      onChange={(e) => setTempSettings({ ...tempSettings, model: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="输入自定义模型名称"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  System Prompt
                </label>
                <textarea
                  value={tempSettings.systemPrompt}
                  onChange={(e) => setTempSettings({ ...tempSettings, systemPrompt: e.target.value })}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder={defaultPrompt}
                />
                <button
                  onClick={() => setTempSettings({ ...tempSettings, systemPrompt: defaultPrompt })}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  恢复默认提示词
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}