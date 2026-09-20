import React from 'react';
import { X, Download, ZoomIn } from 'lucide-react';

export default function ImageLightbox({ imageUrl, altText, onClose }) {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 animate-fade-in"
      onClick={onClose}
    >
      {/* Top Bar Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-3 z-10" onClick={(e) => e.stopPropagation()}>
        <a
          href={imageUrl}
          download
          target="_blank"
          rel="noopener noreferrer"
          title="Download Image"
          className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl backdrop-blur-md border border-slate-700/60 transition-all flex items-center gap-2 text-xs font-semibold shadow-lg"
        >
          <Download className="w-4 h-4" />
          <span>Download</span>
        </a>
        <button
          onClick={onClose}
          title="Close (Esc)"
          className="p-2.5 bg-slate-800/80 hover:bg-rose-600 text-white rounded-xl backdrop-blur-md border border-slate-700/60 transition-all shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center Image */}
      <div className="relative max-w-4xl max-h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <img
          src={imageUrl}
          alt={altText || 'Chat image'}
          className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl ring-1 ring-white/10"
        />
      </div>
    </div>
  );
}
