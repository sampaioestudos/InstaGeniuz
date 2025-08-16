
import React from 'react';
import { X, AlertTriangle, ExternalLink, TestTube2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import type { ApiTestId, ApiTestState } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiTestStatus: Record<ApiTestId, ApiTestState>;
  onApiTest: (testId: ApiTestId) => void;
}

const ENV_VARS = [
    { name: 'GEMINI_API_KEY', service: 'Gemini', description: 'Required for all content and image generation.' },
    { name: 'CLOUDINARY_CLOUD_NAME', service: 'Cloudinary', description: 'Used for the simulated image upload.' },
    { name: 'CLOUDINARY_API_KEY', service: 'Cloudinary', description: 'Used for the simulated image upload.' },
    { name: 'CLOUDINARY_API_SECRET', service: 'Cloudinary', description: 'Would be required for real signed uploads.' },
    { name: 'INSTAGRAM_USER_ID', service: 'Instagram', description: 'Required for the simulated publishing flow.' },
    { name: 'INSTAGRAM_ACCESS_TOKEN', service: 'Instagram', description: 'Required for the simulated publishing flow.' },
];

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

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, apiTestStatus, onApiTest }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl border border-gray-700 m-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Vercel Deployment Settings</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="flex items-start space-x-3 bg-blue-900/30 text-blue-300 p-3 rounded-lg border border-blue-500">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-400" />
            <div>
              <h4 className="font-semibold">Action Required for Deployment</h4>
              <p className="text-sm">To deploy this application on Vercel, you must configure the following Environment Variables in your Vercel project settings. The app's serverless functions use these keys to securely connect to the APIs.</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-200">Required Environment Variables:</h3>
            <div className="border border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-900 text-xs text-gray-400 uppercase">
                        <tr>
                            <th scope="col" className="px-4 py-2">Variable Name</th>
                            <th scope="col" className="px-4 py-2">Service</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {ENV_VARS.map(v => (
                            <tr key={v.name} className="hover:bg-gray-700/50">
                                <td className="px-4 py-2 font-mono text-blue-400">{v.name}</td>
                                <td className="px-4 py-2">{v.service}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <a href="https://vercel.com/docs/projects/environment-variables" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm">
                How to add Environment Variables on Vercel
                <ExternalLink className="ml-1.5 h-4 w-4" />
            </a>
          </div>

          <div className="border-t border-gray-700 my-4"></div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-200 flex items-center">
                <TestTube2 className="w-5 h-5 mr-2" />
                API Endpoint Tests
            </h3>
            <p className="text-sm text-gray-400">If you're encountering errors, use these tests to check if each backend API is configured and responding correctly.</p>
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

        <div className="flex justify-end p-4 bg-gray-900 border-t border-gray-700 rounded-b-lg">
          <button onClick={onClose} className="px-6 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
};
