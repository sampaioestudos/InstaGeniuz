
import React, { useState, useEffect } from 'react';
import { X, TestTube2, RefreshCw, CheckCircle, XCircle, KeyRound, Save } from 'lucide-react';
import type { ApiTestId, ApiTestState, ApiKeys } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeys: ApiKeys;
  setApiKeys: (keys: ApiKeys) => void;
  apiTestStatus: Record<ApiTestId, ApiTestState>;
  onApiTest: (testId: ApiTestId) => void;
}

const API_KEY_FIELDS = [
    { id: 'gemini', name: 'Gemini API Key', service: 'Gemini', required: true },
    { id: 'cloudinaryCloudName', name: 'Cloudinary Cloud Name', service: 'Cloudinary', required: true },
    { id: 'cloudinaryApiKey', name: 'Cloudinary API Key', service: 'Cloudinary', required: false },
    { id: 'cloudinaryApiSecret', name: 'Cloudinary API Secret', service: 'Cloudinary', required: false },
    { id: 'instagramUserId', name: 'Instagram User ID', service: 'Instagram (Simulated)', required: false },
    { id: 'instagramAccessToken', name: 'Instagram Access Token', service: 'Instagram (Simulated)', required: false },
] as const;


const API_TESTS: { id: ApiTestId; name: string; description: string; }[] = [
    { id: 'generate', name: 'Test Image Generation', description: 'Calls the /api/generate endpoint.' },
    { id: 'generate-text', name: 'Test Text Generation', description: 'Calls the /api/generate-text endpoint.' },
    { id: 'publish', name: 'Test Publish Flow', description: 'Calls the /api/publish endpoint.' },
];

const StatusIcon = ({ status }: { status: ApiTestState['status'] }) => {
    switch (status) {
        case 'loading':
            return <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />;
        case 'success':
            return <CheckCircle className="w-5 h-5 text-green-400" />;
        case 'error':
            return <XCircle className="w-5 h-5 text-red-400" />;
        default:
            return null;
    }
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, apiKeys, setApiKeys, apiTestStatus, onApiTest }) => {
  const [localKeys, setLocalKeys] = useState<ApiKeys>(apiKeys);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
      setLocalKeys(apiKeys);
  }, [apiKeys, isOpen]);

  const handleSave = () => {
    setApiKeys(localKeys);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };
  
  const handleInputChange = (field: keyof ApiKeys, value: string) => {
    setLocalKeys(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl border border-gray-700 m-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">API Key Configuration</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-200 flex items-center">
                  <KeyRound className="w-5 h-5 mr-2" />
                  Your API Keys
              </h3>
              <p className="text-sm text-gray-400">
                  Enter your API keys below. They will be saved securely in your browser's local storage and will not leave your machine.
              </p>
              <div className="space-y-4">
                  {API_KEY_FIELDS.map(field => (
                      <div key={field.id}>
                          <label htmlFor={field.id} className="block text-sm font-medium text-gray-300">
                              {field.name} {field.required && <span className="text-red-400">*</span>}
                          </label>
                          <input
                              id={field.id}
                              type="password"
                              className="mt-1 w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder:text-gray-500 font-mono"
                              placeholder={`Enter your ${field.service} key`}
                              value={localKeys[field.id]}
                              onChange={(e) => handleInputChange(field.id, e.target.value)}
                          />
                      </div>
                  ))}
              </div>
          </div>
          
          <div className="border-t border-gray-700 my-4"></div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-200 flex items-center">
                <TestTube2 className="w-5 h-5 mr-2" />
                API Endpoint Tests
            </h3>
            <p className="text-sm text-gray-400">After saving your keys, use these tests to check if each backend API is responding correctly.</p>
            <div className="space-y-3">
              {API_TESTS.map(({ id, name }) => {
                  const status = apiTestStatus[id];
                  return (
                    <div key={id} className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{name}</p>
                        <div className="flex items-center gap-2">
                          <StatusIcon status={status.status} />
                          <button 
                            onClick={() => onApiTest(id)}
                            disabled={status.status === 'loading'}
                            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-500 rounded-md disabled:bg-gray-600 disabled:cursor-wait"
                          >
                            {status.status === 'loading' ? 'Testing...' : 'Run Test'}
                          </button>
                        </div>
                      </div>
                      {status.message && (
                        <div className={`mt-2 p-2 text-xs rounded-md ${status.status === 'success' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                          <p className="font-mono break-all">{status.message}</p>
                        </div>
                      )}
                    </div>
                  );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center p-4 bg-gray-900 border-t border-gray-700 rounded-b-lg">
          <button onClick={onClose} className="px-6 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-bold transition-colors">Close</button>
          <div className="flex items-center gap-3">
              {showSaved && <span className="text-sm text-green-400 transition-opacity flex items-center gap-1"><CheckCircle size={16}/> Saved!</span>}
              <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors">
                  <Save className="w-5 h-5" />
                  Save Keys
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};
