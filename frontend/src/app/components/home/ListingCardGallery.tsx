import { useRef, useState } from 'react';
import { PhotoPlaceholder } from '../PhotoPlaceholder';

/**
 * Galerie défilante d'une carte d'annonce.
 *
 * Chaque image est chargée telle quelle : celles qui échouent sont retirées de
 * la galerie plutôt que remplacées par une photo de substitution. Montrer la
 * photo d'un autre logement à la place d'une image manquante induit le
 * visiteur en erreur sur ce qu'il réserve — et sur une plateforme dont
 * l'argument principal est la confiance, c'est le pire endroit où tricher.
 *
 * Si aucune image ne subsiste, on retombe sur l'aplat neutre, qui se lit comme
 * un choix de mise en page et non comme une erreur.
 */
export function ListingCardGallery({
  images,
  alt,
  seed,
}: {
  images: string[];
  alt: string;
  seed: string | number;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [broken, setBroken] = useState<Set<string>>(new Set());
  const [active, setActive] = useState(0);

  const usable = images.filter((src) => src && !broken.has(src));

  if (usable.length === 0) {
    return <PhotoPlaceholder seed={seed} />;
  }

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index !== active) setActive(index);
  };

  return (
    <div className="relative w-full h-full">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        // stopPropagation : sans ça, faire défiler la galerie déclencherait
        // aussi le clic du bouton parent et ouvrirait la fiche de l'annonce.
        onClick={(e) => usable.length > 1 && e.stopPropagation()}
        className="flex w-full h-full overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {usable.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={i === 0 ? alt : ''}
            loading="lazy"
            onError={() => setBroken((prev) => new Set(prev).add(src))}
            className="w-full h-full flex-shrink-0 snap-start object-cover"
          />
        ))}
      </div>

      {usable.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
          {usable.map((src, i) => (
            <span
              key={src}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? 'w-4 bg-white' : 'w-1.5 bg-white/55'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
