"use client";
import React, { useEffect, useState, useRef } from 'react';
import TemplateGallery from '@/components/bathroom-visualizer/TemplateGallery';
import TileSelector from '@/components/bathroom-visualizer/TileSelector';
import VisualizerRenderer from '@/components/bathroom-visualizer/VisualizerRenderer';
import { TemplateMetadata } from '@/types/visualizer';
import { Download, RefreshCcw, Box, Maximize2, Minimize2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';
import { ErrorBoundary } from '@/components/ErrorBoundary';

import Visualizer3D from '@/components/bathroom-visualizer/Visualizer3D';

export default function BathroomVisualizerPage() {
  const [layoutId, setLayoutId] = useState<string>('modern_asymmetric');
  const [activeSurface, setActiveSurface] = useState<'wall' | 'floor' | 'accent'>('wall');
  const [tileSize, setTileSize] = useState<'2x4' | '2.5x5'>('2x4');
  const [wallTileUrl, setWallTileUrl] = useState<string | null>(null);
  const [floorTileUrl, setFloorTileUrl] = useState<string | null>(null);
  const [accentTileUrl, setAccentTileUrl] = useState<string | null>(null);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const visualizerRef = useRef<HTMLDivElement>(null);

  const toggleShowroomView = async () => {
    try {
      if (!isTheaterMode) {
        if (visualizerRef.current) {
          await visualizerRef.current.requestFullscreen();
        }
        setIsTheaterMode(true);
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
        setIsTheaterMode(false);
      }
    } catch (err) {
      console.error("Fullscreen err:", err);
      setIsTheaterMode(!isTheaterMode);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsTheaterMode(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const layouts = [
    { id: 'striped_center_column', name: 'Striped Center Column', description: 'Center column with alternating horizontal stripes' },
    { id: 'split_floor_accent_back', name: 'Split Floor', description: 'Accent tile on back wall and left half of floor' },
    { id: 'framed_monolith', name: 'Framed Monolith', description: 'Solid center accent column with wrap-around double horizontal stripes' },
    { id: 'alternating_tower', name: 'Alternating Tower', description: 'Center column with large base and alternating stripes' },
    { id: 'showroom_columns', name: 'Showroom Wrap', description: 'Dual accent columns wrapping from back wall to floor edges' },
    { id: 'diagonal_stripes', name: 'Diagonal Stripes', description: '45-degree alternating diagonal stripes on back wall' },
    { id: 'modern_asymmetric', name: 'Modern Asymmetric', description: 'Left stripes, middle solid, right dado' },
    { id: 'shower_strip', name: 'Vertical Shower Band', description: '2 ft vertical accent column on back wall & matching accent floor' },
    { id: 'luxury', name: 'Luxury Column', description: 'Center accent column on wall & floor' },
    { id: 'accent_back', name: 'Accent Back Wall', description: 'Full accent back wall, main side walls' },
    { id: 'double_column', name: 'Double Column', description: 'Two vertical accent columns on back wall' },
    { id: 'highlighter', name: 'Highlighter Strip', description: 'Horizontal strip on all walls' },
    { id: 'double_highlighter', name: 'Double Highlighter', description: 'Two horizontal accent strips on all walls' },
    { id: 'dado', name: 'Dado Half-Wall', description: 'Bottom half accent tile, top half main' },
    { id: 'accent_corners', name: 'Accent Corners', description: 'Accent columns in room corners' },
    { id: 'accent_baseboard', name: 'Accent Baseboard', description: 'Bottom border accent strip' },
    { id: 'accent_frieze', name: 'Accent Frieze', description: 'Top border accent strip near ceiling' },
    { id: 'vertical_pinstripes', name: 'Vertical Pinstripes', description: 'Thin vertical accent bands' },
    { id: 'horizontal_pinstripes', name: 'Horizontal Pinstripes', description: 'Thin horizontal accent bands' },
    { id: 'three_tile_mix', name: 'Dado 3-Tile Mix', description: 'Floor tile bottom, accent middle, wall top' },
    { id: 'picture_frame', name: 'Picture Frame Panel', description: 'Framed accent tile on back wall' },
    { id: 'shower_accent', name: 'Shower Wall Accent', description: 'Vertical accent strip on left wall' },
    { id: 'checkerboard_floor', name: 'Checkerboard Floor', description: 'Alternating tiles on floor' },
    { id: 'border_floor', name: 'Border Floor', description: 'Floor with accent perimeter border' },
    { id: 'accent_floor', name: 'Accent Floor', description: 'Entire floor uses accent tile' },
    { id: 'standard', name: 'Standard Room', description: 'Single tile wall & floor' },
  ];

  const handleReset = () => {
    setWallTileUrl(null);
    setFloorTileUrl(null);
    setAccentTileUrl(null);
  };

  const handleDownload = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `bathroom-design-${layoutId}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export 3D view", err);
    }
  };

  const handleDownload360 = () => {
    window.dispatchEvent(new CustomEvent('export-360-visualizer'));
  };

  const handleDownloadGLB = () => {
    window.dispatchEvent(new CustomEvent('export-glb-visualizer'));
  };

  const tileW = tileSize === '2x4' ? 4 : 5;
  const tileH = tileSize === '2x4' ? 2 : 2.5;

  return (
    <AuthGuard>
      <div className="h-screen overflow-hidden bg-neutral-950 flex flex-col">
        <Navbar />
        
        <div className="flex-1 p-4 flex gap-4 h-[calc(100vh-64px)]">
          {/* LEFT: 3D Layout Templates */}
          <div className="w-64 flex-shrink-0 bg-neutral-900 border border-white/10 rounded-2xl p-4 flex flex-col">
            <h2 className="text-lg font-bold text-white mb-4">3D Layouts</h2>
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
              {layouts.map((lay) => (
                <button
                  key={lay.id}
                  onClick={() => setLayoutId(lay.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    layoutId === lay.id
                      ? 'bg-blue-500/10 border-blue-500 text-white shadow-lg shadow-blue-500/5'
                      : 'bg-neutral-800/40 border-white/5 text-neutral-400 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-sm mb-1">{lay.name}</div>
                  <div className="text-xs opacity-75 leading-relaxed">{lay.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* CENTER: 3D Renderer */}
          <div ref={visualizerRef} className="flex-1 bg-neutral-900 border border-white/10 rounded-2xl p-4 flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">3D Visualizer: {layouts.find(l => l.id === layoutId)?.name}</h2>
              <button
                onClick={toggleShowroomView}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all duration-300 ${
                  isTheaterMode
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20 shadow-md shadow-blue-500/5'
                    : 'bg-neutral-600 text-neutral-400 border-neutral-900 hover:text-white hover:border-neutral-850'
                }`}
                title={isTheaterMode ? "Exit Fullscreen Showroom Mode" : "Enter Showroom Mode (Full Width)"}
              >
                {isTheaterMode ? (
                  <><Minimize2 className="w-3.5 h-3.5" /><span>Standard View</span></>
                ) : (
                  <><Maximize2 className="w-3.5 h-3.5" /><span>Showroom View</span></>
                )}
              </button>
            </div>
            
            <div className="flex-1 relative bg-black/50 rounded-xl overflow-hidden shadow-inner">
              <ErrorBoundary>
                <Visualizer3D 
                  layoutId={layoutId}
                  wallTileUrl={wallTileUrl}
                  floorTileUrl={floorTileUrl}
                  accentTileUrl={accentTileUrl}
                  tileW={tileW}
                  tileH={tileH}
                />
              </ErrorBoundary>
            </div>
          </div>

          {/* RIGHT: Tile Selector and Actions */}
          <div className="w-80 flex-shrink-0 bg-neutral-900 border border-white/10 rounded-2xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Select Tile</h2>
              <div className="flex bg-neutral-800 rounded-lg p-1">
                <button 
                  onClick={() => setActiveSurface('wall')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${activeSurface === 'wall' ? 'bg-blue-500 text-white' : 'text-neutral-400 hover:text-white'}`}
                >
                  Wall
                </button>
                <button 
                  onClick={() => setActiveSurface('floor')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${activeSurface === 'floor' ? 'bg-blue-500 text-white' : 'text-neutral-400 hover:text-white'}`}
                >
                  Floor
                </button>
                <button 
                  onClick={() => setActiveSurface('accent')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${activeSurface === 'accent' ? 'bg-blue-500 text-white' : 'text-neutral-400 hover:text-white'}`}
                >
                  Accent
                </button>
              </div>
            </div>
            
            <div className="flex-1 min-h-0 mb-4 overflow-hidden">
              <TileSelector 
                selectedImageUrl={activeSurface === 'wall' ? wallTileUrl : activeSurface === 'floor' ? floorTileUrl : accentTileUrl} 
                onSelect={(url) => {
                  if (activeSurface === 'wall') setWallTileUrl(url);
                  else if (activeSurface === 'floor') setFloorTileUrl(url);
                  else setAccentTileUrl(url);
                }}
              />
            </div>

            <div className="flex flex-col gap-4 pt-4 border-t border-white/10">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-neutral-400">Tile Size</span>
                <div className="flex bg-neutral-800 rounded-lg p-1">
                  <button 
                    onClick={() => setTileSize('2x4')}
                    className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-colors ${tileSize === '2x4' ? 'bg-blue-500 text-white' : 'text-neutral-400 hover:text-white'}`}
                  >
                    2 × 4 ft
                  </button>
                  <button 
                    onClick={() => setTileSize('2.5x5')}
                    className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-colors ${tileSize === '2.5x5' ? 'bg-blue-500 text-white' : 'text-neutral-400 hover:text-white'}`}
                  >
                    2.5 × 5 ft
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <button 
                    onClick={handleReset}
                    className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-colors text-sm"
                  >
                    Reset
                  </button>
                  <button 
                    onClick={handleDownload}
                    className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Save View
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
