import { useEffect, useState } from 'react';
import { X, Sparkles, ShieldCheck, Smartphone } from 'lucide-react';

interface Slide {
  icon: typeof Sparkles;
  text: string;
  route?: any;
}

const SLIDES: Slide[] = [
  { icon: Sparkles, text: 'Devenez hôte et générez des revenus avec Bluefin Immo', route: { name: 'become-host' } },
  { icon: ShieldCheck, text: 'Logements vérifiés et certifiés Bluefin Immo partout au Bénin' },
  { icon: Smartphone, text: 'Payez en toute sécurité par Mobile Money (MTN, Moov, Orange)' },
];

export function PromoCarousel({ onNavigate }: { onNavigate?: (route: any) => void }) {
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 4500);
    return () => clearInterval(timer);
  }, [dismissed]);

  if (dismissed) return null;
  const slide = SLIDES[index];
  const Icon = slide.icon;

  return (
    <button
      onClick={() => slide.route && onNavigate?.(slide.route)}
      className="w-full text-left block mx-4 mb-3 rounded-2xl bg-[#0f2940] px-4 py-3.5 flex items-center gap-3 relative"
      style={{ width: 'calc(100% - 2rem)' }}
    >
      <span className="w-8 h-8 rounded-xl bg-[#ffc93c]/20 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-[#ffc93c]" />
      </span>
      <span className="text-sm text-white leading-snug pr-6">{slide.text}</span>
      <span
        role="button"
        aria-label="Fermer"
        onClick={(e) => {
          e.stopPropagation();
          setDismissed(true);
        }}
        className="absolute top-3 right-3 text-white/60 hover:text-white"
      >
        <X className="w-4 h-4" />
      </span>
      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {SLIDES.map((_, i) => (
          <span
            key={i}
            className={`h-1 rounded-full transition-all ${i === index ? 'w-4 bg-[#ffc93c]' : 'w-1 bg-white/30'}`}
          />
        ))}
      </span>
    </button>
  );
}
