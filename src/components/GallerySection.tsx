import React from 'react';
import { CAFE_GALLERY_IMAGES } from '../data/initialData';
import { Sparkles, MapPin, Heart, Eye } from 'lucide-react';
import DomeGallery from './DomeGallery';
import { GalleryImage } from '../types';

interface GallerySectionProps {
  galleryImages: GalleryImage[];
}

export default function GallerySection({ galleryImages }: GallerySectionProps) {
  return (
    <div className="space-y-8">
      {/* Short introduction paragraph */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="text-amber-500 font-mono text-xs uppercase tracking-widest font-black inline-flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Aesthetic Cozy Radiance
        </span>
        <h3 className="text-2xl font-black text-stone-100">
          Capture the Cozy Vibrations
        </h3>
        <p className="text-stone-300 text-xs leading-relaxed font-sans mt-1">
          Feast your eyes on the authentic moments from Cafe Chai Sutta Bar in Jhargram, West Bengal. Warm hanging incandescent bulbs, wooden tables, and hot steaming clay Kulhad cups.
        </p>
      </div>

      {/* Immersive interactive dome gallery arena */}
      <DomeGallery images={galleryImages} />


    </div>
  );
}
