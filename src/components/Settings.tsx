import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, X, Plus, Trash2, Wifi, WifiOff, Loader2, Save, Edit3, Download } from 'lucide-react';
import { AppSettings, SystemPromptPreset } from '../types';
import { testApiConnection, ApiTestResult } from '../utils/apiTest';
import { defaultSettings, createSystemPromptPreset, addSystemPromptPreset, removeSystemPromptPreset, updateSystemPromptPreset } from '../utils/storage';

interface SettingsProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

export function Settings({ settings, onSettingsChange }: SettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);
  const [apiTest, setApiTest] = useState<ApiTestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [newCustomModel, setNewCustomModel] = useState('');
  const [newPresetName, setNewPresetName] = useState('');
  const [isCreatingPreset, setIsCreatingPreset] = useState(false);
  const [editingPreset, setEditingPreset] = useState<string | null>(null);

  const handleSave = () => {
    onSettingsChange(tempSettings);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempSettings(settings);
    setIsOpen(false);
  };

  const commonModels = [
    'gemini-2.5-pro',
    'gpt-4o'
  ];

  const allModels = [...commonModels, ...tempSettings.customModels];

  useEffect(() => {
    setTempSettings(settings);
  }, [settings]);

  const handleTestApi = async () => {
    setIsTesting(true);
    setApiTest(null);
    const result = await testApiConnection(tempSettings);
    setApiTest(result);
    setIsTesting(false);
  };

  const handleAddCustomModel = () => {
    if (newCustomModel.trim() && !allModels.includes(newCustomModel.trim())) {
      setTempSettings({
        ...tempSettings,
        customModels: [...tempSettings.customModels, newCustomModel.trim()]
      });
      setNewCustomModel('');
    }
  };

  const handleRemoveCustomModel = (modelToRemove: string) => {
    setTempSettings({
      ...tempSettings,
      customModels: tempSettings.customModels.filter(model => model !== modelToRemove),
      model: tempSettings.model === modelToRemove ? commonModels[0] : tempSettings.model
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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    API地址
                  </label>
                  <button
                    onClick={handleTestApi}
                    disabled={isTesting || !tempSettings.apiUrl}
                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 rounded-md transition-colors"
                  >
                    {isTesting ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Wifi className="w-3 h-3 mr-1" />
                    )}
                    {isTesting ? '测试中...' : '测试连接'}
                  </button>
                </div>
                <input
                  type="url"
                  value={tempSettings.apiUrl}
                  onChange={(e) => setTempSettings({ ...tempSettings, apiUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="http://localhost:8000/v1"
                />
                {apiTest && (
                  <div className={`mt-2 p-2 rounded text-sm ${
                    apiTest.success 
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}>
                    <div className="flex items-center">
                      {apiTest.success ? (
                        <Wifi className="w-4 h-4 mr-2" />
                      ) : (
                        <WifiOff className="w-4 h-4 mr-2" />
                      )}
                      {apiTest.success 
                        ? `连接成功 (${apiTest.latency}ms)${apiTest.models?.length ? ` - 发现${apiTest.models.length}个模型` : ''}` 
                        : apiTest.error
                      }
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key (可选)
                </label>
                <input
                  type="password"
                  value={tempSettings.apiKey}
                  onChange={(e) => setTempSettings({ ...tempSettings, apiKey: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="输入API密钥"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  模型选择
                </label>
                <select
                  value={tempSettings.model}
                  onChange={(e) => setTempSettings({ ...tempSettings, model: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                >
                  <optgroup label="推荐模型">
                    {commonModels.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </optgroup>
                  {tempSettings.customModels.length > 0 && (
                    <optgroup label="自定义模型">
                      {tempSettings.customModels.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
                
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newCustomModel}
                      onChange={(e) => setNewCustomModel(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddCustomModel()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="添加自定义模型名称"
                    />
                    <button
                      onClick={handleAddCustomModel}
                      disabled={!newCustomModel.trim() || allModels.includes(newCustomModel.trim())}
                      className="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-md transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {tempSettings.customModels.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">已添加的自定义模型：</p>
                      {tempSettings.customModels.map(model => (
                        <div key={model} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                          <span>{model}</span>
                          <button
                            onClick={() => handleRemoveCustomModel(model)}
                            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

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
                              <Trash2 className="w-3 h-3" />
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