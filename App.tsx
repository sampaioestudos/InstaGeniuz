
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { PostForm } from './components/PostForm';
import { ImageSelector } from './components/ImageSelector';
import { PreviewCard } from './components/PreviewCard';
import { Loader } from './components/Loader';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { PostHistory } from './components/PostHistory';
import type { PostFormState, GeneratedMedia, GeneratedText, AppState, PostHistoryItem, ApiTestId, ApiTestState, ApiKeys } from './types';
import { POST_OPTIONS } from './constants';
import { AlertTriangle, CheckCircle2, RotateCcw, RefreshCw, ServerCrash } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';

const initialApiTestState: Record<ApiTestId, ApiTestState> = {
  generate: { status: 'idle' },
  'generate-text': { status: 'idle' },
  publish: { status: 'idle' },
};

const initialApiKeys: ApiKeys = {
  gemini: '',
  cloudinaryCloudName: '',
  cloudinaryApiKey: '',
  cloudinaryApiSecret: '',
  instagramUserId: '',
  instagramAccessToken: '',
};

const App: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [formState, setFormState] = useState<PostFormState>({
    prompt: '',
    postType: 'feed-square',
    tone: 'friendly',
    length: 'short',
  });
  const [generatedMedia, setGeneratedMedia] = useState<GeneratedMedia | null>(null);
  const [generatedText, setGeneratedText] = useState<GeneratedText | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [appState, setAppState] = useState<AppState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [optimizedImageUrl, setOptimizedImageUrl] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<'generate-media' | 'generate-text' | 'publish' | null>(null);
  const [postHistory, setPostHistory] = useState<PostHistoryItem[]>([]);
  const [apiTestStatus, setApiTestStatus] = useState<Record<ApiTestId, ApiTestState>>(initialApiTestState);
  const [apiKeys, setApiKeys] = useLocalStorage<ApiKeys>('instagenius-apikeys', initialApiKeys);

  const areApiKeysSet = apiKeys && apiKeys.gemini && apiKeys.cloudinaryCloudName;

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('instagenius-history');
      if (savedHistory) {
        setPostHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error("Failed to load post history from localStorage", e);
      localStorage.removeItem('instagenius-history');
    }
  }, []);
  
  const handleApiTest = useCallback(async (testId: ApiTestId) => {
    setApiTestStatus(prev => ({ ...prev, [testId]: { status: 'loading' } }));
    
    let url = `/api/${testId}`;
    let body: any;
    
    const dummyImageBase64 = "R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=";

    switch (testId) {
      case 'generate':
        body = { prompt: "a cute cat", postType: 'feed-square', aspectRatio: '1:1', apiKeys };
        break;
      case 'generate-text':
        body = { prompt: "a cute cat", tone: "friendly", length: "short", imageBase64: dummyImageBase64, apiKeys };
        break;
      case 'publish':
        body = { imageBase64: dummyImageBase64, caption: "Test caption", apiKeys };
        break;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errorDetails = `Server responded with status ${response.status}.`;
        try {
          const errorData = await response.json();
          errorDetails = errorData.error || errorDetails;
        } catch (e) { /* Ignore */ }
        throw new Error(errorDetails);
      }
      
      setApiTestStatus(prev => ({ ...prev, [testId]: { status: 'success', message: 'API responded successfully!' } }));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setApiTestStatus(prev => ({ ...prev, [testId]: { status: 'error', message: errorMessage } }));
    }
  }, [apiKeys]);

  const handleGenerateMedia = useCallback(async () => {
    setAppState('loading-media');
    setError(null);
    setGeneratedMedia(null);
    setGeneratedText(null);
    setLastAction('generate-media');

    const aspectRatio = POST_OPTIONS.find(p => p.id === formState.postType)?.aspectRatio || '1:1';

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formState, aspectRatio, apiKeys }),
      });

      if (!response.ok) {
        let errorDetails = `Server responded with status ${response.status}.`;
        try {
          const errorData = await response.json();
          errorDetails = errorData.error || errorDetails;
        } catch (e) {
          // Body was not JSON or empty, stick with the status message
        }
        throw new Error(errorDetails);
      }
      
      const data = await response.json();
      setGeneratedMedia(data);
      setAppState('selecting-image');
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Media Generation Failed: ${errorMessage}`);
      setAppState('error');
    }
  }, [formState, apiKeys]);

  const handleGenerateText = useCallback(async (selectedIndex: number) => {
    if (!generatedMedia) return;
    
    setSelectedImageIndex(selectedIndex);
    setAppState('loading-text');
    setError(null);
    setLastAction('generate-text');

    try {
        const response = await fetch('/api/generate-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...formState,
                imageBase64: generatedMedia.imageBases64[selectedIndex],
                apiKeys,
            }),
        });
        
        if (!response.ok) {
            let errorDetails = `Server responded with status ${response.status}.`;
            try {
              const errorData = await response.json();
              errorDetails = errorData.error || errorDetails;
            } catch (e) {
              // Ignore JSON parse error on a failed response
            }
            throw new Error(errorDetails);
        }

        const data = await response.json();
        setGeneratedText(data);
        setAppState('preview');
    } catch (err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Text Generation Failed: ${errorMessage}`);
        setAppState('error');
    }
  }, [formState, generatedMedia, apiKeys]);

  const handlePublish = useCallback(async (currentVariation: any, currentImageIndex: number) => {
    if (!generatedMedia || !generatedText) {
        setError('Cannot publish. Missing generated content.');
        setAppState('error');
        return;
    }
    setAppState('publishing');
    setError(null);
    setLastAction('publish');

    const imageToPublish = formState.postType === 'carousel' 
        ? generatedMedia.imageBases64[currentImageIndex]
        : generatedMedia.imageBases64[selectedImageIndex];
    
    const fullCaption = `${currentVariation.caption}\n\n${currentVariation.cta}\n\n${generatedText.hashtags}`;

    try {
        const response = await fetch('/api/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                imageBase64: imageToPublish,
                caption: fullCaption,
                apiKeys,
            }),
        });

        if (!response.ok) {
            let errorDetails = `Server responded with status ${response.status}.`;
            try {
              const errorData = await response.json();
              errorDetails = errorData.error || errorDetails;
            } catch (e) {
               // Ignore JSON parse error on a failed response
            }
            throw new Error(errorDetails);
        }
        
        const data = await response.json();
        setOptimizedImageUrl(data.optimizedImageUrl);
        setAppState('published');

        // Add to history
        const newHistoryItem: PostHistoryItem = {
            id: `post_${Date.now()}`,
            imageUrl: data.optimizedImageUrl,
            fullCaption: fullCaption,
            prompt: formState.prompt,
            postType: formState.postType,
            timestamp: Date.now(),
        };
        const updatedHistory = [newHistoryItem, ...postHistory].slice(0, 10); // Keep last 10
        setPostHistory(updatedHistory);
        localStorage.setItem('instagenius-history', JSON.stringify(updatedHistory));


    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during publishing.';
      setError(`Publishing Failed: ${errorMessage}`);
      setAppState('error');
    }
  }, [generatedMedia, generatedText, selectedImageIndex, formState, postHistory, apiKeys]);
  
  const handleContentChange = (newVariations: any[], newHashtags: string) => {
    if (generatedText) {
      setGeneratedText({
        ...generatedText,
        captionVariations: newVariations,
        hashtags: newHashtags
      });
    }
  };

  const handleReset = () => {
    setAppState('idle');
    setGeneratedMedia(null);
    setGeneratedText(null);
    setError(null);
    setOptimizedImageUrl(null);
    setLastAction(null);
    setFormState({
        prompt: '',
        postType: 'feed-square',
        tone: 'friendly',
        length: 'short',
    });
  };

  const handleRetry = useCallback(() => {
    if (lastAction === 'generate-text') {
      handleGenerateText(selectedImageIndex);
    } else if (lastAction === 'generate-media') {
      handleGenerateMedia();
    } else {
        handleGenerateMedia();
    }
  }, [lastAction, handleGenerateMedia, handleGenerateText, selectedImageIndex]);

  const renderContent = () => {
    switch(appState) {
        case 'idle':
            return <PostForm formState={formState} setFormState={setFormState} onSubmit={handleGenerateMedia} isLoading={false} disabled={!areApiKeysSet} />;
        case 'loading-media':
            return <Loader message="Generating stunning images with AI..." />;
        case 'selecting-image':
            if (generatedMedia) {
                return <ImageSelector images={generatedMedia.imageBases64} onSelect={handleGenerateText} isLoading={false} />;
            }
            return null;
        case 'loading-text':
            if (generatedMedia) {
                 return <ImageSelector images={generatedMedia.imageBases64} onSelect={() => {}} isLoading={true} selectedIndex={selectedImageIndex} />;
            }
            return <Loader message="Analyzing image and crafting captions..." />;
        case 'preview':
            if (generatedMedia && generatedText) {
                const previewImage = formState.postType === 'carousel' ? generatedMedia.imageBases64 : [generatedMedia.imageBases64[selectedImageIndex]];
                return <PreviewCard 
                    images={previewImage}
                    text={generatedText} 
                    onContentChange={handleContentChange}
                    onPublish={handlePublish} 
                    onReset={handleReset}
                    isCarousel={formState.postType === 'carousel'}
                />;
            }
            return null;
        case 'publishing':
            return <Loader message="Optimizing image and publishing post..." />;
        case 'published':
            return (
                <div className="text-center p-8 bg-green-900/20 border border-green-500 rounded-lg">
                    <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-green-300">Post Published Successfully!</h3>
                    <p className="text-green-200 mt-2 mb-6">Your content is now live on Instagram (simulation).</p>
                    {optimizedImageUrl && (
                        <div className="mb-4">
                            <p className="text-sm text-gray-400">Cloudinary Image URL:</p>
                            <a href={optimizedImageUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 break-all">{optimizedImageUrl}</a>
                        </div>
                    )}
                    <button onClick={handleReset} className="mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                        Create Another Post
                    </button>
                </div>
            );
        case 'error':
             return (
                <div className="text-center p-8 bg-red-900/20 border border-red-500 rounded-lg animate-fade-in">
                    <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-red-300">An Error Occurred</h3>
                    <p className="text-red-200 mt-2 mb-6 max-w-lg mx-auto">{error}</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                        <button onClick={handleReset} className="w-full sm:w-auto flex items-center justify-center bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                            <RotateCcw className="mr-2 h-5 w-5" />
                            Start Over
                        </button>
                        <button onClick={handleRetry} className="w-full sm:w-auto flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                            <RefreshCw className="mr-2 h-5 w-5" />
                            Try Again
                        </button>
                    </div>
                </div>
            );
        default:
            return null;
    }
  }


  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <Header onSettingsClick={() => setIsSettingsOpen(true)} />
      <main className="container mx-auto p-4 md:p-8 max-w-4xl">
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          apiKeys={apiKeys}
          setApiKeys={setApiKeys}
          apiTestStatus={apiTestStatus}
          onApiTest={handleApiTest}
        />
        
        <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-2 text-white">InstaGenius AI</h1>
            <p className="text-center text-gray-400 mb-8">Automate your Instagram content creation with AI.</p>
            
            {appState === 'idle' && !areApiKeysSet && (
                <div className="mb-6 flex items-start space-x-3 bg-yellow-900/30 text-yellow-300 p-4 rounded-lg border border-yellow-500">
                    <ServerCrash className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold">Configuration Required</h4>
                        <p className="text-sm">Please set your API keys to enable content generation. Click the gear icon to open the settings panel.</p>
                    </div>
                </div>
            )}

            {renderContent()}
        </div>
        
        {postHistory.length > 0 && <PostHistory history={postHistory} />}

        {appState === 'idle' && postHistory.length === 0 && <PrivacyPolicy />}

        <footer className="text-center mt-8 text-gray-500 text-sm">
            <p>Powered by Gemini, Cloudinary, and the Instagram Graph API.</p>
        </footer>
      </main>
    </div>
  );
};

export default App;
