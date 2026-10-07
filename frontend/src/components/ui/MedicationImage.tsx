import { useState } from 'react';
import { ImageOff } from 'lucide-react';

export function MedicationImage({
  url,
  name,
  badgeText = 'Foto de referencia',
}: {
  url?: string;
  name: string;
  badgeText?: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (!url || !url.trim() || hasError) {
    return (
      <div
        className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 flex flex-col items-center justify-center text-center text-slate-500 h-36 sm:h-40"
        role="img"
        aria-label={`Imagen no disponible para ${name}`}
      >
        <ImageOff className="w-8 h-8 text-slate-400 mb-1" />
        <span className="text-xs font-semibold text-slate-600">Imagen no disponible</span>
        <span className="text-[11px] text-slate-400 mt-0.5">{name}</span>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-2xs group flex items-center justify-center p-3 h-40 sm:h-44">
      <img
        src={url}
        alt={`Fotografía de ${name}`}
        onError={() => setHasError(true)}
        className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-300"
      />
      {badgeText && (
        <div className="absolute bottom-2.5 right-2.5 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm">
          <span>{badgeText}</span>
        </div>
      )}
    </div>
  );
}
