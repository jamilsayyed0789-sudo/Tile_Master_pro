import React, { useState, useRef } from 'react';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Check, Crop as CropIcon } from 'lucide-react';

export default function ImageCropperModal({ 
  imageUrl, 
  onClose, 
  onCropComplete 
}: { 
  imageUrl: string, 
  onClose: () => void, 
  onCropComplete: (url: string) => void 
}) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement>(null);

  const handleComplete = async () => {
    if (!completedCrop || !imgRef.current || completedCrop.width === 0 || completedCrop.height === 0) {
      // If no crop was drawn, just return the original image
      onCropComplete(imageUrl);
      return;
    }
    
    const canvas = document.createElement('canvas');
    const image = imgRef.current;
    
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );
    
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
    if (blob) {
      const newUrl = URL.createObjectURL(blob);
      onCropComplete(newUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-4xl w-full flex flex-col max-h-[90vh] shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CropIcon className="w-5 h-5 text-amber-500" /> Crop Tile Image
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="text-neutral-400 text-sm mb-4">
          Drag to select exactly the part of the image that contains the tile texture.
        </div>
        
        <div className="flex-1 overflow-auto bg-neutral-950 rounded-2xl flex items-center justify-center relative p-4 border border-neutral-800">
          <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)}>
            <img 
              ref={imgRef} 
              src={imageUrl} 
              className="max-h-[60vh] object-contain" 
              crossOrigin="anonymous" 
            />
          </ReactCrop>
        </div>
        
        <div className="mt-6 flex justify-end gap-3">
          <button 
            onClick={() => onCropComplete(imageUrl)} 
            className="px-5 py-2.5 text-neutral-400 font-semibold hover:text-white transition"
          >
            Skip Cropping
          </button>
          <button 
            onClick={handleComplete} 
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl flex items-center gap-2 shadow-lg"
          >
            <Check className="w-4 h-4" /> Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
}
