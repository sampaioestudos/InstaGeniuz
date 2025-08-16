
import React, { useState } from 'react';
import type { PostHistoryItem } from '../types';
import { Clipboard, Check, History, Image as ImageIcon, Info } from 'lucide-react';

interface PostHistoryProps {
  history: PostHistoryItem[];
}

export const PostHistory: React.FC<PostHistoryProps> = ({ history }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg p-6 md:p-8 mt-8">
      <h2 className="text-2xl font-bold text-center mb-6 text-white flex items-center justify-center">
        <History className="w-7 h-7 mr-3" />
        Your Post History
      </h2>
      {history.length === 0 ? (
        <div className="text-center text-gray-400 py-8 flex flex-col items-center">
          <Info className="w-8 h-8 mb-2" />
          <p>You haven't published any posts yet.</p>
          <p className="text-sm">Your history will appear here after you publish.</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {history.map((item) => (
            <div key={item.id} className="bg-gray-900 p-4 rounded-lg flex items-start gap-4 border border-gray-700">
              <a href={item.imageUrl} target="_blank" rel="noopener noreferrer" title="View full image">
                <img 
                    src={item.imageUrl} 
                    alt="Post thumbnail" 
                    className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-md flex-shrink-0 bg-gray-700"
                    loading="lazy"
                />
              </a>
              <div className="flex-grow">
                <p className="text-sm font-semibold text-gray-300 line-clamp-1">Prompt: "{item.prompt}"</p>
                <p className="text-xs text-gray-500 mb-2">
                  {new Date(item.timestamp).toLocaleString()}
                </p>
                <p className="text-sm text-gray-400 whitespace-pre-wrap line-clamp-2">
                  {item.fullCaption}
                </p>
              </div>
              <button
                onClick={() => handleCopy(item.fullCaption, item.id)}
                className="flex-shrink-0 self-start p-2 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors text-gray-300"
                aria-label="Copy caption text"
              >
                {copiedId === item.id ? <Check className="w-5 h-5 text-green-400" /> : <Clipboard className="w-5 h-5" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
