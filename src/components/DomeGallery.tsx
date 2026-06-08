import React, { useState, useRef, useEffect } from 'react';
import { Play, RotateCw, Grid, Layers, Eye, Heart, MapPin, Sparkles, X, ZoomIn } from 'lucide-react';
import { GalleryImage } from '../types';

interface DomeGalleryProps {
  images: GalleryImage[];
}

export default function DomeGallery({ images }: DomeGalleryProps) {
  const [viewMode, setViewMode] = useState<'dome' | 'grid'>('dome');
  const [spin, setSpin] = useState<number>(0);
  const [spinY, setSpinY] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Drag states
  const isDragging = useRef<boolean>(false);
  const hasDragged = useRef<boolean>(false);
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const startSpin = useRef<number>(0);
  const startSpinY = useRef<number>(0);

  // Auto rotation effect
  useEffect(() => {
    if (!autoRotate || viewMode === 'grid') return;
    
    let animationId: number;
    const startTime = Date.now();
    const tick = () => {
      setSpin(prev => (prev + 0.15) % 360);
      
      // Gentle floating up and down movement
      const elapsed = (Date.now() - startTime) / 1000;
      setSpinY(Math.sin(elapsed * 0.4) * 12);
      
      animationId = requestAnimationFrame(tick);
    };
    
    animationId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationId);
  }, [autoRotate, viewMode]);

  // Handle Dragging / Swiping
  const handleMouseDown = (e: React.MouseEvent) => {
    if (viewMode === 'grid') return;
    isDragging.current = true;
    hasDragged.current = false;
    setAutoRotate(false);
    startX.current = e.clientX;
    startY.current = e.clientY;
    startSpin.current = spin;
    startSpinY.current = spinY;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || viewMode === 'grid') return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasDragged.current = true;
    }
    // Map pixels to rotation degrees
    const sensitivity = 0.25;
    setSpin(startSpin.current - dx * sensitivity);
    setSpinY(Math.max(-45, Math.min(45, startSpinY.current + dy * sensitivity)));
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (viewMode === 'grid') return;
    isDragging.current = true;
    hasDragged.current = false;
    setAutoRotate(false);
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    startSpin.current = spin;
    startSpinY.current = spinY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || viewMode === 'grid') return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasDragged.current = true;
    }
    const sensitivity = 0.35;
    setSpin(startSpin.current - dx * sensitivity);
    setSpinY(Math.max(-45, Math.min(45, startSpinY.current + dy * sensitivity)));
  };

  return (
    <div className="space-y-6">
      {/* Visual Header Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-900/60 p-4 rounded-2xl border border-stone-800/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Sparkles className="w-4 h-4" />
          </span>
          <div className="text-left">
            <h4 className="text-xs font-black text-stone-100 uppercase tracking-wider">Gallery Projection Arena</h4>
            <p className="text-[10px] text-stone-400 font-sans font-medium">Select your preferred perspective of the cozy den</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === 'dome' && (
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-mono tracking-widest uppercase transition-all duration-300 border cursor-pointer ${
                autoRotate
                  ? 'bg-amber-600/10 border-amber-500/40 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                  : 'bg-stone-950/40 border-stone-800 text-stone-400'
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
              {autoRotate ? 'Auto Spinning' : 'Spin Paused'}
            </button>
          )}

          <div className="flex items-center bg-stone-950 p-1 rounded-xl border border-stone-800/80">
            <button
              id="view-dome-btn"
              onClick={() => setViewMode('dome')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all cursor-pointer ${
                viewMode === 'dome'
                  ? 'bg-amber-600 text-stone-950 font-bold shadow-lg shadow-amber-950/20'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> 3D Dome Arena
            </button>
            <button
              id="view-grid-btn"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-amber-600 text-stone-950 font-bold shadow-lg shadow-amber-950/20'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" /> Classic Grid
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'dome' ? (
        /* Immersive 3D Spherical Dome Perspective */
        <div className="relative w-full aspect-square max-w-[620px] mx-auto overflow-hidden bg-gradient-to-b from-stone-950 to-stone-900 rounded-full border-4 border-stone-800/80 p-6 md:p-12 flex flex-col justify-between items-center select-none shadow-[0_0_80px_rgba(245,158,11,0.08)]">
          {/* Futuristic cosmic background details (resembles the uploaded reference mockup) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[98%] aspect-square rounded-full border border-stone-800/30 scale-100" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[82%] aspect-square rounded-full border border-stone-800/20 scale-100" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[64%] aspect-square rounded-full border border-amber-900/15 scale-100" />
            {/* Subtle multi-color background particle glowing spots */}
            <div className="absolute top-[20%] left-[10%] w-56 h-56 rounded-full bg-pink-700/5 blur-[80px]" />
            <div className="absolute bottom-[20%] right-[10%] w-56 h-56 rounded-full bg-cyan-700/5 blur-[80px]" />
            <div className="absolute top-[50%] left-[40%] w-56 h-56 rounded-full bg-purple-700/5 blur-[80px]" />
            
            {/* Scattered cosmic stars */}
            <div className="absolute top-10 left-[20%] w-1.5 h-1.5 bg-pink-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
            <div className="absolute top-24 right-[15%] w-1 h-1 bg-cyan-400/35 rounded-full animate-ping" style={{ animationDuration: '4s' }} />
            <div className="absolute bottom-20 left-[15%] w-1 h-1 bg-amber-400/20 rounded-full" />
            <div className="absolute bottom-12 right-[30%] w-1.5 h-1.5 bg-emerald-400/30 rounded-full animate-pulse" />
          </div>

          <div className="text-center relative z-10 max-w-sm mx-auto pt-4">
            <span className="text-stone-500 font-mono text-[9px] uppercase tracking-widest font-bold">
              🖥️ Spin Sphere Demo
            </span>
            <p className="text-[10px] text-stone-400 leading-normal font-sans mt-0.5 px-4 font-medium">
              ✨ Swipe/drag up & down or spin left & right to rotate the immersive spherical fisheye projection.
            </p>
          </div>

          {/* Interactive Drag Stage */}
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUpOrLeave}
            className="flex-1 w-full flex items-center justify-center cursor-grab active:cursor-grabbing py-8 overflow-visible relative"
            style={{ perspective: '1100px' }}
          >
            {/* Grid of cards warped spherically in 3D */}
            <div 
              className="relative w-full h-[340px] md:h-[400px] transition-transform duration-200"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {images.map((img, index) => {
                // Arrange into a 3x5 layout
                // rows: 0, 1, 2
                // cols: 0, 1, 2, 3, 4
                const colsCount = 5;
                const r = Math.floor(index / colsCount); // 0 to 2
                const c = index % colsCount; // 0 to 4

                // Symmetrical column spacing around the complete 360-degree cylinder
                const baseAngleY = c * (360 / colsCount); 
                const dy = r - 1; // -1, 0, 1
                const baseAngleX = dy * 45; // vertical angle row offset

                // Stagger alternate rows by half a column spacing (36 deg) so they interlock
                const staggerOffset = Math.abs(dy) === 1 ? 36 : 0; 

                // Add current continuous spin offset to the Y angle, and stagger it
                const angleY = baseAngleY + spin + staggerOffset;
                const angleX = baseAngleX + spinY;

                // Calculate coordinates
                const radY = (angleY * Math.PI) / 180;
                const radX = (angleX * Math.PI) / 180;

                // Radius of the 3D floating sphere cylinder
                const R = 270; 
                
                // Coordinates on a 3D bubble/sphere (pure spherical coordinates)
                const xVal = R * Math.sin(radY) * Math.cos(radX);
                const yVal = R * Math.sin(radX);
                // Perspective with depth
                const zVal = R * Math.cos(radY) * Math.cos(radX) - R;

                // Check depth visibility: if item is on the back half, fade it out smoothly as it rounds the corner
                const cosValue = Math.cos(radY);
                const opacityVal = cosValue < 0.0 ? 0.0 : cosValue < 0.35 ? cosValue / 0.35 : 1.0;

                return (
                  <div
                    key={img.id}
                    onClick={() => {
                      if (!hasDragged.current) setSelectedImage(img);
                    }}
                    className="absolute top-1/2 left-1/2 -mt-[35px] -ml-[35px] w-[70px] h-[70px] md:-mt-[42px] md:-ml-[42px] md:w-[85px] md:h-[85px] rounded-full overflow-hidden border-2 bg-stone-900 group transition-all duration-300 shadow-2xl flex flex-col justify-end cursor-pointer"
                    style={{
                      transform: `translate3d(${xVal}px, ${yVal}px, ${zVal}px) rotateY(${angleY}deg) rotateX(${angleX * 0.4}deg)`,
                      opacity: opacityVal,
                      pointerEvents: opacityVal < 0.25 ? 'none' : 'auto',
                      zIndex: Math.round(zVal + 1000),
                      borderColor: img.color === 'pink' ? '#ec4899' : img.color === 'cyan' || img.color === 'blue' ? '#06b6d4' : img.color === 'amber' ? '#f59e0b' : img.color === 'purple' ? '#a855f7' : '#10b981',
                      boxShadow: `0 0 16px ${img.glowColor}`
                    }}
                  >
                    <img
                      src={img.url}
                      alt={img.caption}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 pointer-events-none"
                      referrerPolicy="no-referrer"
                    />

                    {/* Highly stylized caption with gradient center overlay */}
                    <div className="absolute inset-0 bg-stone-950/85 p-3 flex flex-col justify-center items-center text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <ZoomIn className="w-4 h-4 text-white mb-1 opacity-80" />
                      <p className="text-[7.5px] md:text-[9.5px] font-black text-stone-100 leading-tight font-sans mb-1 px-1">
                        {img.caption}
                      </p>
                      <div className="flex items-center justify-center gap-1.5 text-[7px] md:text-[8px] text-stone-300 font-mono">
                        <span className="flex items-center gap-0.5"><Heart className="w-2 h-2 text-pink-500 fill-pink-500" /> {img.likes}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5"><Eye className="w-2 h-2 text-stone-400" /> {img.views}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-center relative z-10 font-sans text-[8px] text-stone-550/80 tracking-widest uppercase pb-4">
            Drag Up, Down, Left, or Right • 15 Cozy Sphere Slides Registered
          </div>
        </div>
      ) : (
        /* Classic flat masonry layout */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {images.map((img) => (
            <div
              key={img.id}
              onClick={() => setSelectedImage(img)}
              className={`group relative bg-stone-900 border-2 rounded-full overflow-hidden aspect-square shadow-lg hover:-translate-y-1.5 hover:scale-105 transition-all duration-300 cursor-pointer`}
              style={{
                borderColor: img.color === 'pink' ? '#ec4899' : img.color === 'cyan' || img.color === 'blue' ? '#06b6d4' : img.color === 'amber' ? '#f59e0b' : img.color === 'purple' ? '#a855f7' : '#10b981',
                boxShadow: `0 0 16px ${img.glowColor}`
              }}
            >
              <img
                src={img.url}
                alt={img.caption}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-stone-950/85 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-center items-center text-center">
                <ZoomIn className="w-6 h-6 text-white mb-2 opacity-80" />
                <span className="text-[8px] uppercase font-bold text-amber-500 font-mono flex items-center gap-1 mb-1">
                  <MapPin className="w-2.5 h-2.5 text-amber-500" /> Jhargram
                </span>
                <p className="text-stone-100 text-[10px] md:text-[11px] font-black leading-snug font-sans px-1">
                  {img.caption}
                </p>
                <div className="flex items-center justify-center gap-2 pt-1.5 text-[8px] text-stone-300 font-mono mt-1">
                  <span className="flex items-center gap-0.5"><Heart className="w-2.5 h-2.5 text-pink-500 fill-pink-500" /> {img.likes}</span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" /> {img.views}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Image Full Screen Zoom / Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/95 backdrop-blur-md"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 p-2 rounded-full bg-stone-900/50 text-stone-300 hover:text-white hover:bg-stone-800 transition-colors z-50"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage(null);
            }}
          >
            <X className="w-6 h-6" />
          </button>
          
          <div 
            className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={selectedImage.url} 
              alt={selectedImage.caption} 
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl border border-stone-800"
              style={{
                boxShadow: `0 0 40px ${selectedImage.glowColor}`
              }}
              referrerPolicy="no-referrer"
            />
            
            <div className="mt-4 text-center">
              <h3 className="text-stone-100 text-lg md:text-xl font-bold font-sans">
                {selectedImage.caption}
              </h3>
              <div className="mt-2 flex items-center justify-center gap-4 text-stone-400 font-mono text-sm">
                <span className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-pink-500 fill-pink-500" /> {selectedImage.likes} Likes
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" /> {selectedImage.views} Views
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
