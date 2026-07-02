"use client";
import React from 'react';
import { TemplateMetadata } from '@/types/visualizer';
import Image from 'next/image';

interface TemplateGalleryProps {
  templates: TemplateMetadata[];
  selectedTemplateId: string | null;
  onSelect: (id: string) => void;
}

export default function TemplateGallery({ templates, selectedTemplateId, onSelect }: TemplateGalleryProps) {
  return (
    <div className="flex flex-col gap-4 h-full">
      <h2 className="text-lg font-bold text-white">Templates</h2>
      <div className="overflow-y-auto pr-2 grid grid-cols-1 gap-4">
        {templates.map(t => (
          <div 
            key={t.id} 
            className={`cursor-pointer border-2 rounded-xl overflow-hidden transition-all duration-200 ${selectedTemplateId === t.id ? 'border-blue-500 scale-[1.02] shadow-lg shadow-blue-500/20' : 'border-white/10 hover:border-white/30'}`}
            onClick={() => onSelect(t.id)}
          >
            <div className="relative w-full h-32 bg-neutral-800">
              <Image 
                src={`/templates/bathrooms/${t.id}/background.jpg`} 
                alt={t.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-3 bg-neutral-900">
              <h3 className="text-sm font-semibold text-white">{t.name}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
