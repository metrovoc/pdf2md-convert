import { useState } from 'react';
import { LLMService, AppSettings } from '../types';
import { Edit3, Check, X, Key, Globe, Cpu, ChevronDown, ChevronUp } from 'lucide-react';
import { ServiceIcon } from './ServiceIcon';

interface ServiceCardProps {
  service: LLMService;
  isActive: boolean;
  settings: AppSettings;
  onServiceUpdate: (serviceId: string, updates: Partial<LLMService>) => void;
  onServiceSelect: (serviceId: string) => void;
  onModelChange: (model: string) => void;
}

export function ServiceCard({ 
  service, 
  isActive, 
  settings,
  onServiceUpdate, 
  onServiceSelect, 
  onModelChange 
}: ServiceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedService, setEditedService] = useState(service);

  const handleSave = () => {
    onServiceUpdate(service.id, editedService);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedService(service);
    setIsEditing(false);
  };

  const canEdit = !service.isBuiltIn || isExpanded;
  const hasApiKey = Boolean(service.apiKey);

  return (
    <div className={`
      border rounded-lg p-4 transition-all duration-200 cursor-pointer
      ${isActive 
        ? 'border-blue-500 bg-blue-50 shadow-md' 
        : 'border-gray-200 bg-white hover:border-gray-300'
      }
    `}>
      {/* 卡片头部 */}
      <div 
        className="flex items-center justify-between"
        onClick={() => onServiceSelect(service.id)}
      >
        <div className="flex items-center space-x-3">
          <ServiceIcon 
            iconPath={service.iconPath}
            className="w-8 h-8"
            fallback="🤖"
          />
          <div>
            <h3 className="font-medium text-gray-900">{service.name}</h3>
            <p className="text-xs text-gray-500">{service.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* API密钥状态指示器 */}
          <div className={`
            w-2 h-2 rounded-full
            ${hasApiKey ? 'bg-green-500' : 'bg-gray-300'}
          `} title={hasApiKey ? 'API密钥已配置' : 'API密钥未配置'} />
          
          {/* 展开/收起按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* 展开内容 */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
          {/* 服务信息 */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2 text-gray-600">
              <Globe className="w-4 h-4" />
              <span>类型: {service.type.toUpperCase()}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Cpu className="w-4 h-4" />
              <span>模型: {service.models.length}</span>
            </div>
          </div>

          {/* API密钥配置 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API密钥
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <input
                  type="password"
                  value={isEditing ? editedService.apiKey : service.apiKey}
                  onChange={(e) => isEditing 
                    ? setEditedService({ ...editedService, apiKey: e.target.value })
                    : onServiceUpdate(service.id, { apiKey: e.target.value })
                  }
                  placeholder="输入API密钥"
                  className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  disabled={isEditing ? false : !canEdit}
                />
                <Key className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* 模型选择 */}
          {isActive && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择模型
              </label>
              <select
                value={settings.currentModel}
                onChange={(e) => onModelChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                {service.models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 自定义服务编辑 */}
          {!service.isBuiltIn && (
            <div className="space-y-3">
              {isEditing ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      服务名称
                    </label>
                    <input
                      type="text"
                      value={editedService.name}
                      onChange={(e) => setEditedService({ ...editedService, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base URL
                    </label>
                    <input
                      type="url"
                      value={editedService.baseUrl}
                      onChange={(e) => setEditedService({ ...editedService, baseUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      默认模型
                    </label>
                    <input
                      type="text"
                      value={editedService.defaultModel}
                      onChange={(e) => setEditedService({ ...editedService, defaultModel: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSave}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      保存
                    </button>
                    <button
                      onClick={handleCancel}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    >
                      <X className="w-4 h-4 mr-1" />
                      取消
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <p>Base URL: {service.baseUrl}</p>
                    <p>默认模型: {service.defaultModel}</p>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    <Edit3 className="w-3 h-3 mr-1" />
                    编辑
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}