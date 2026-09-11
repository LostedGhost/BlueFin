// Onglet « Favoris » (barre mobile) : logements enregistrés par l'utilisateur.
// Visiteur : invitation à se connecter (la page n'est plus une redirection
// silencieuse vers l'accueil). Données : hook useFavorites (cache partagé).
import { useMemo, useState } from 'react';
import { Heart, MapPin, Map as MapIcon, Compass, BadgeCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites, type FavoriteItem } from '../hooks/useFavorites';
import { PhotoPlaceholder } from '../components/PhotoPlaceholder';

type Sort = 'recent' | 'price_asc' | 'price_desc';
const SORTS: { id: Sort; label: string }[] = [
  { id: 'recent', label: 'Récents' },
  { id: 'price_asc', label: 'Prix croissant' },
  { id: 'price_desc', label: 'Prix décroissant' },
];

function FavoriteCard({ item, onOpen, onRemove }: { item: FavoriteItem; onOpen: () => void; onRemove: () => void }) {
  const [broken, setBroken] = useState(false);
  return (
    <article className="relative">
      <button onClick={onOpen} className="block w-full text-left">
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 shadow-[0_4px_14px_rgba(15,41,64,0.10)]">
          {item.image && !broken
            ? <img src={item.image} alt={item.title} loading="lazy" onError={() => setBroken(true)} className="w-full h-full object-cover" />
            : <PhotoPlaceholder seed={item.property?.id ?? item.id} />}
          {item.property?.bluefin_certified && (
            <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 bg-[#ffc93c] text-[#4a3400] text-[10px] font-extrabold px-2.5 py-1 rounded-full">
              <BadgeCheck className="w-3 h-3" /> Certifié
            </span>
          )}
        </div>
        <h3 className="font-body mt-2.5 text-[15.5px] font-bold text-[#0f2940] line-clamp-1">{item.title}</h3>
        <p className="text-[13px] text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3.5 h-3.5" />{item.location || 'Bénin'}</p>
        <p className="mt-2 inline-block text-sm font-bold text-[#005c4d] bg-[#f4fffe] px-3 py-1 rounded-full">{item.priceDisplay}</p>
      </button>
      {/* Hors du bouton d'ouverture (pas de bouton imbriqué), posé sur la photo. */}
      <button
        onClick={onRemove}
        aria-label={`Retirer « ${item.title} » des favoris`}
        className="absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center rounded-full bg-white/95 shadow-sm active:scale-90 transition-transform"
      >
        <Heart className="w-4 h-4 fill-red-500 text-red-500" />
      </button>
    </article>
  );
}

export function FavoritesScreen({ onNavigate }: { onNavigate?: (route: any) => void }) {
  const { isAuthenticated, user } = useAuth();
  const { favorites, loading, toggleFavorite } = useFavorites();
  const [sort, setSort] = useState<Sort>('recent');

  const sorted = useMemo(() => {
    const list = [...favorites];
    if (sort === 'price_asc') list.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sort === 'price_desc') list.sort((a, b) => (b.price || 0) - (a.price || 0));
    else list.sort((a, b) => String(b.addedAt || '').localeCompare(String(a.addedAt || '')));
    return list;
  }, [favorites, sort]);

  const remove = async (item: FavoriteItem) => {
    const result: any = await toggleFavorite({ id: item.property?.id });
    if (result?.success) {
      toast((t) => (
        <span className="text-sm">
          Retiré des favoris.{' '}
          <button className="font-semibold text-[#00806b] underline" onClick={() => { toggleFavorite({ id: item.property?.id }); toast.dismiss(t.id); }}>
            Annuler
          </button>
        </span>
      ));
    } else if (result?.message) toast.error(result.message);
  };

  const isAdmin = user?.user_type === 'admin';

  return (
    <div className="min-h-[70vh] bg-white px-4 pt-6 pb-28">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-end justify-between gap-3 mb-5">
          <div>
            <h1 className="font-display text-3xl text-[#0f2940]">Favoris</h1>
            {isAuthenticated && !isAdmin && favorites.length > 0 && (
              <p className="text-sm text-slate-500 mt-1">{favorites.length} logement{favorites.length > 1 ? 's' : ''} enregistré{favorites.length > 1 ? 's' : ''}</p>
            )}
          </div>
        </header>

        {!isAuthenticated || isAdmin ? (
          <div className="max-w-md mx-auto text-center py-10 space-y-4">
            <span className="mx-auto w-16 h-16 rounded-full bg-[#f4fffe] flex items-center justify-center">
              <Heart className="w-7 h-7 text-[#00c9a7]" />
            </span>
            <h2 className="font-display text-2xl text-[#0f2940]">Gardez vos coups de cœur</h2>
            <p className="text-slate-600">
              {isAdmin ? 'Les favoris sont réservés aux comptes voyageurs et hôtes.'
                : 'Touchez ♡ sur un logement pour le retrouver ici, sur tous vos appareils.'}
            </p>
            {!isAdmin && (
              <button onClick={() => onNavigate?.({ name: 'auth' })}
                className="w-full bg-gradient-to-r from-[#00c9a7] to-[#0f2940] text-white py-3 rounded-xl font-semibold">
                Se connecter
              </button>
            )}
            <button onClick={() => onNavigate?.({ name: 'home' })} className="text-sm font-medium text-[#00806b]">Explorer les logements</button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] rounded-2xl bg-slate-100" />
                <div className="h-4 bg-slate-100 rounded mt-3 w-2/3" />
                <div className="h-3 bg-slate-100 rounded mt-2 w-1/3" />
              </div>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-10 space-y-4">
            <span className="mx-auto w-16 h-16 rounded-full bg-[#f4fffe] flex items-center justify-center">
              <Heart className="w-7 h-7 text-[#00c9a7]" />
            </span>
            <h2 className="font-display text-2xl text-[#0f2940]">Aucun favori pour l’instant</h2>
            <p className="text-slate-600">Touchez ♡ sur un logement qui vous plaît : il sera enregistré ici.</p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={() => onNavigate?.({ name: 'home' })}
                className="inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0f2940] text-white text-sm font-semibold">
                <Compass className="w-4 h-4" /> Explorer
              </button>
              <button onClick={() => onNavigate?.({ name: 'map' })}
                className="inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-[#e2f5f2] text-[#0f2940] text-sm font-semibold">
                <MapIcon className="w-4 h-4" /> Voir la carte
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4">
              {SORTS.map((s) => (
                <button key={s.id} onClick={() => setSort(s.id)} aria-pressed={sort === s.id}
                  className={`shrink-0 h-8 px-4 rounded-full text-sm border ${sort === s.id ? 'bg-[#0f2940] text-white border-[#0f2940]' : 'border-slate-200 text-slate-600'}`}>
                  {s.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
              {sorted.map((item) => (
                <FavoriteCard key={item.id} item={item}
                  onOpen={() => onNavigate?.({ name: 'listing', id: String(item.property?.id) })}
                  onRemove={() => remove(item)} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
