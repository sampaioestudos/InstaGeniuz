import React from 'react';

interface ImageSelectorProps {
  images: string[];
  onSelect: (index: number) => void;
  isLoading: boolean;
  selectedIndex?: number;
}

export const ImageSelector: React.FC<ImageSelectorProps> = ({ images, onSelect, isLoading, selectedIndex }) => {
  const isMultiImage = images.length > 1;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">{isMultiImage ? 'Step 2: Choose Your Favorite Image' : 'Step 2: Review Your Image'}</h2>
        <p className="text-gray-400">{isMultiImage ? 'Click on an image to generate contextual captions for it.' : 'Click the image below to generate captions.'}</p>
      </div>
      <div className={`grid gap-4 ${isMultiImage ? 'grid-cols-2' : 'grid-cols-1 max-w-sm mx-auto'}`}>
        {images.map((base64, index) => (
          <div key={index} className="relative group">
            <img
              src={`data:image/jpeg;base64,${base64}`}
              alt={`Generated option ${index + 1}`}
              className="rounded-lg w-full h-full object-cover aspect-square transition-all duration-300 group-hover:opacity-70 cursor-pointer"
              onClick={() => !isLoading && onSelect(index)}
            />
            {isLoading && selectedIndex === index && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-lg">
                    <div className="w-8 h-8 border-2 border-gray-500 border-t-white rounded-full animate-spin"></div>
                    <p className="text-sm mt-2">Analyzing...</p>
                </div>
            )}
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
              <span className="text-white font-bold text-lg">Select Image</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};