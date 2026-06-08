import React from 'react';
import { CAFE_GALLERY_IMAGES } from '../data/initialData';
import { Sparkles, MapPin, Heart, Eye } from 'lucide-react';

export default function GallerySection() {
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

      {/* Grid gallery */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CAFE_GALLERY_IMAGES.map(img => (
          <div
            key={img.id}
            className="group relative bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden aspect-[4/3] shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block"
          >
            <img
              src={img.url}
              alt={img.caption}
              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            {/* Dark glass backdrop with captions */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
              <div className="space-y-1 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <span className="text-[10px] uppercase font-bold text-amber-400 font-mono flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-500" /> Jhargram Bar
                </span>
                <p className="text-stone-100 text-xs font-bold leading-normal font-sans">
                  {img.caption}
                </p>
                <div className="flex items-center gap-2 pt-1 text-[10px] text-stone-400 font-mono">
                  <span className="flex items-center gap-0.5"><Heart className="w-3 h-3 text-red-500 fill-red-500" /> 140 Likes</span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> 590 views</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Specialty Clay Kulhad Cup interactive lore card */}
      <div className="bg-gradient-to-r from-amber-950/40 via-stone-900 to-amber-950/40 rounded-3xl p-6 md:p-8 border border-stone-800 flex flex-col md:flex-row items-center gap-6 max-w-4xl mx-auto">
        <div className="w-full md:w-1/3 aspect-square rounded-2xl overflow-hidden bg-stone-950 border border-stone-800">
          <img
            src="https://images.unsplash.com/photo-1627834377411-8da5f4f09de8?q=80&w=600"
            alt="Boiling Chai"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex-1 space-y-3 text-xs">
          <span className="text-amber-500 font-mono font-bold uppercase tracking-widest text-[10px] block">
            Tradition meets hygiene
          </span>
          <h4 className="text-lg font-black text-stone-100">
            Why do we serve in clay Kulhad cups?
          </h4>
          <p className="text-stone-300 leading-relaxed font-sans">
            The earthen clay holds heat far better than standard glass, infusing the tea with a delightful organic, smoky, sweet muddy fragrance known around India as <strong>'Sondhi Khushboo'</strong>. It is 100% natural, biodegradable, and single-use, guaranteeing absolute clean status for every sip.
          </p>
          <div className="pt-2 flex items-center gap-4 text-stone-400 font-mono text-[10px]">
            <span>🌿 100% Organic Soils</span>
            <span>🔥 Oven Fired Crafts</span>
            <span>♻️ Zero Plastic Footprint</span>
          </div>
        </div>
      </div>
    </div>
  );
}
