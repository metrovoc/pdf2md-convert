import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, X, Plus, Save, Edit3, Download } from 'lucide-react';
import { AppSettings, SystemPromptPreset, LLMService } from '../types';
import { ServiceCard } from './ServiceCard';
import { 
  defaultSettings, 
  createSystemPromptPreset, 
  addSystemPromptPreset, 
  removeSystemPromptPreset, 
  updateSystemPromptPreset,
  updateService,
  addCustomService,
  switchActiveService
} from '../utils/storage';

interface SettingsProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

export function Settings({ settings, onSettingsChange }: SettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);
  const [newPresetName, setNewPresetName] = useState('');
  const [isCreatingPreset, setIsCreatingPreset] = useState(false);
  const [editingPreset, setEditingPreset] = useState<string | null>(null);
  const [isAddingCustomService, setIsAddingCustomService] = useState(false);
  const [newCustomService, setNewCustomService] = useState<{
    name: string;
    type: 'openai' | 'gemini';
    baseUrl: string;
    apiKey: string;
    defaultModel: string;
    description: string;
  }>({
    name: '',
    type: 'openai',
    baseUrl: '',
    apiKey: '',
    defaultModel: '',
    description: ''
  });

  const handleSave = () => {
    onSettingsChange(tempSettings);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempSettings(settings);
    setIsOpen(false);
  };

  useEffect(() => {
    setTempSettings(settings);
  }, [settings]);

  const handleServiceUpdate = (serviceId: string, updates: Partial<LLMService>) => {
    setTempSettings(updateService(tempSettings, serviceId, updates));
  };

  const handleServiceSelect = (serviceId: string) => {
    setTempSettings(switchActiveService(tempSettings, serviceId));
  };

  const handleModelChange = (model: string) => {
    setTempSettings({
      ...tempSettings,
      currentModel: model
    });
  };

  const handleCreatePreset = () => {
    if (newPresetName.trim() && tempSettings.systemPrompt.trim()) {
      const preset = createSystemPromptPreset(newPresetName.trim(), tempSettings.systemPrompt);
      setTempSettings(addSystemPromptPreset(tempSettings, preset));
      setNewPresetName('');
      setIsCreatingPreset(false);
    }
  };

  const handleDeletePreset = (presetId: string) => {
    setTempSettings(removeSystemPromptPreset(tempSettings, presetId));
  };

  const handleLoadPreset = (preset: SystemPromptPreset) => {
    setTempSettings({
      ...tempSettings,
      systemPrompt: preset.prompt
    });
  };

  const handleUpdatePreset = (presetId: string, newName: string) => {
    setTempSettings(updateSystemPromptPreset(tempSettings, presetId, { name: newName.trim() }));
    setEditingPreset(null);
  };

  const handleAddCustomService = () => {
    if (newCustomService.name && newCustomService.baseUrl && newCustomService.defaultModel) {
      const serviceToAdd = {
        ...newCustomService,
        models: [newCustomService.defaultModel],
        isActive: false
      };
      setTempSettings(addCustomService(tempSettings, serviceToAdd));
      setNewCustomService({
        name: '',
        type: 'openai',
        baseUrl: '',
        apiKey: '',
        defaultModel: '',
        description: ''
      });
      setIsAddingCustomService(false);
    }
  };


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
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">设置</h2>
              <button
                onClick={handleCancel}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* LLM服务管理 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">LLM服务配置</h3>
                  <button
                    onClick={() => setIsAddingCustomService(true)}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    添加自定义服务
                  </button>
                </div>

                <div className="space-y-4">
                  {tempSettings.services.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      isActive={service.id === tempSettings.activeServiceId}
                      settings={tempSettings}
                      onServiceUpdate={handleServiceUpdate}
                      onServiceSelect={handleServiceSelect}
                      onModelChange={handleModelChange}
                    />
                  ))}
                </div>

                {/* 添加自定义服务表单 */}
                {isAddingCustomService && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-3">添加自定义LLM服务</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="服务名称"
                        value={newCustomService.name}
                        onChange={(e) => setNewCustomService({ ...newCustomService, name: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <select
                        value={newCustomService.type}
                        onChange={(e) => setNewCustomService({ ...newCustomService, type: e.target.value as 'openai' | 'gemini' })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="openai">OpenAI兼容</option>
                        <option value="gemini">Gemini</option>
                      </select>
                      <input
                        type="url"
                        placeholder="Base URL"
                        value={newCustomService.baseUrl}
                        onChange={(e) => setNewCustomService({ ...newCustomService, baseUrl: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="默认模型"
                        value={newCustomService.defaultModel}
                        onChange={(e) => setNewCustomService({ ...newCustomService, defaultModel: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="描述（可选）"
                        value={newCustomService.description}
                        onChange={(e) => setNewCustomService({ ...newCustomService, description: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm col-span-2"
                      />
                    </div>
                    <div className="flex items-center space-x-2 mt-3">
                      <button
                        onClick={handleAddCustomService}
                        disabled={!newCustomService.name || !newCustomService.baseUrl || !newCustomService.defaultModel}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-md transition-colors"
                      >
                        添加服务
                      </button>
                      <button
                        onClick={() => setIsAddingCustomService(false)}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 生成参数配置 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">生成参数</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temperature
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={tempSettings.temperature}
                      onChange={(e) => setTempSettings({ ...tempSettings, temperature: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">控制输出的随机性 (0-2)</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      输出长度限制
                    </label>
                    <input
                      type="number"
                      min="1024"
                      max="131072"
                      step="1024"
                      value={tempSettings.outputLength}
                      onChange={(e) => setTempSettings({ ...tempSettings, outputLength: parseInt(e.target.value) || 65536 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="65536"
                    />
                    <p className="text-xs text-gray-500 mt-1">最大输出token数</p>
                  </div>
                </div>
              </div>

              {/* System Prompt配置 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    System Prompt
                  </label>
                  <button
                    onClick={() => setIsCreatingPreset(true)}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                  >
                    <Save className="w-3 h-3 mr-1" />
                    保存为预设
                  </button>
                </div>

                {/* 预设管理 */}
                {tempSettings.systemPromptPresets.length > 0 && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">快速加载预设</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {tempSettings.systemPromptPresets.map((preset) => (
                        <div key={preset.id} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div className="flex-1">
                            {editingPreset === preset.id ? (
                              <input
                                type="text"
                                defaultValue={preset.name}
                                onBlur={(e) => handleUpdatePreset(preset.id, e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleUpdatePreset(preset.id, e.currentTarget.value)}
                                className="text-sm font-medium text-gray-900 bg-transparent border-none outline-none focus:bg-gray-50 px-1 py-0.5 rounded"
                                autoFocus
                              />
                            ) : (
                              <span className="text-sm font-medium text-gray-900">{preset.name}</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleLoadPreset(preset)}
                              className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                              title="加载预设"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingPreset(preset.id)}
                              className="p-1 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
                              title="编辑名称"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeletePreset(preset.id)}
                              className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                              title="删除预设"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 创建预设对话框 */}
                {isCreatingPreset && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newPresetName}
                        onChange={(e) => setNewPresetName(e.target.value)}
                        placeholder="输入预设名称"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <button
                        onClick={handleCreatePreset}
                        disabled={!newPresetName.trim()}
                        className="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-md transition-colors"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => {
                          setIsCreatingPreset(false);
                          setNewPresetName('');
                        }}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}

                <textarea
                  value={tempSettings.systemPrompt}
                  onChange={(e) => setTempSettings({ ...tempSettings, systemPrompt: e.target.value })}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder={defaultSettings.systemPrompt}
                />
                <div className="flex space-x-4 mt-2">
                  <button
                    onClick={() => setTempSettings({ ...tempSettings, systemPrompt: defaultSettings.systemPrompt })}
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    恢复默认提示词
                  </button>
                  <button
                    onClick={() => setTempSettings(defaultSettings)}
                    className="text-sm text-red-600 hover:text-red-700 underline"
                  >
                    恢复所有默认设置
                  </button>
                </div>
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