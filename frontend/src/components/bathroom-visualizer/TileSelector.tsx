"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { getToken } from '@/utils/auth';

interface Tile {
  id?: number;
  tile_name: string;
  tile_number: string;
  image_url: string | null;
}

interface TileSelectorProps {
  onSelect: (imageUrl: string) => void;
  selectedImageUrl: string | null;
}

export default function TileSelector({ onSelect, selectedImageUrl }: TileSelectorProps) {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 500);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const fetchTiles = async () => {
      setLoading(true);
      try {
        const token = getToken();
        const url = debouncedQuery.trim()
          ? `/api/catalog/search?q=${encodeURIComponent(debouncedQuery)}`
          : `/api/catalog/tiles`;
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          // filter out tiles without image_url
          setTiles(data.filter((t: Tile) => !!t.image_url));
        }
      } catch (err) {
        console.error("Failed to fetch tiles", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTiles();
  }, [debouncedQuery]);

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
        <input 
          type="text" 
          placeholder="Search tiles..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-neutral-900 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 gap-3 content-start">
        {loading ? (
          <div className="col-span-2 text-center text-sm text-neutral-500 py-4">Loading...</div>
        ) : tiles.length === 0 ? (
          <div className="col-span-2 text-center text-sm text-neutral-500 py-4">No tiles found</div>
        ) : (
          tiles.map(t => {
            // Check if absolute or relative
            const imgUrl = t.image_url?.startsWith('http') ? t.image_url : `/api/local/image?path=${encodeURIComponent(t.image_url || '')}`;
            const isSelected = selectedImageUrl === imgUrl;
            return (
              <div 
                key={t.id} 
                onClick={() => onSelect(imgUrl)}
                className={`cursor-pointer border rounded-xl p-2 transition-all ${isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/30 bg-neutral-900/50'}`}
              >
                <div className="relative w-full aspect-square bg-neutral-800 rounded-lg overflow-hidden mb-2">
                  <img src={imgUrl} alt={t.tile_name} className="object-cover w-full h-full" crossOrigin="anonymous" />
                </div>
                <p className="text-xs text-white font-semibold truncate">{t.tile_name}</p>
                <p className="text-[10px] text-neutral-400 truncate">{t.tile_number}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
