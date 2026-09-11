// Carte des annonces (onglet « Carte » de la barre mobile).
//
// Une annonce avec coordonnées (latitude/longitude) est placée exactement,
// avec son prix. Les autres — aujourd'hui toutes, les coordonnées n'étant
// saisies qu'à partir de la publication — sont regroupées au centre de leur
// ville, dans une bulle indiquant leur nombre. Aucune position n'est inventée.
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, MapPin, Loader2 } from 'lucide-react';
import propertyService from '../../services/property.service';
import { mapProperty } from '../pages';
import { ListingCard, type HomeListing } from '../components/home/ListingCard';
import { BENIN_CENTER, cityCoordinates, cityLabel, type LatLng } from '../constants/beninCities';

type Group = {
  key: string;
  label: string;
  position: LatLng;
  precise: boolean;
  listings: HomeListing[];
  priceLabel?: string;
};

const toListing = (p: any): HomeListing => ({
  id: p.id,
  title: p.title,
  location: p.location || p.city || 'Bénin',
  image: p.image,
  images: Array.isArray(p.images) ? p.images : undefined,
  priceDisplay: p.priceDisplay,
  priceUnit: '/nuit',
  bluefinCertified: p.bluefin_certified,
});

/**
 * Vue éloignée (compact) : simples pastilles sans texte, sinon les villes de
 * la côte (Ouidah, Cotonou, Porto-Novo) se chevauchent. Les noms et les prix
 * apparaissent en zoomant.
 */
function markerIcon(group: Group, active: boolean, compact: boolean) {
  const bg = active ? '#0f2940' : group.precise ? '#ffffff' : '#00c9a7';
  const fg = active ? '#ffffff' : group.precise ? '#0f2940' : '#ffffff';
  const html = compact
    ? (group.precise
        ? `<span style="background:${bg};border-color:#00c9a7" class="bf-dot"></span>`
        : `<span style="background:${bg};color:${fg}" class="bf-count">${group.listings.length}</span>`)
    : group.precise
      ? `<span style="background:${bg};color:${fg}" class="bf-pin">${group.priceLabel ?? ''}</span>`
      : `<span style="background:${bg};color:${fg}" class="bf-bubble"><b>${group.listings.length}</b> ${group.label}</span>`;
  return L.divIcon({ html, className: 'bf-marker', iconSize: undefined as any, iconAnchor: [0, 0] });
}

/** Suit le niveau de zoom (affichage compact en vue éloignée). */
function ZoomWatcher({ onZoom }: { onZoom: (z: number) => void }) {
  const map = useMapEvents({ zoomend: () => onZoom(map.getZoom()) });
  useEffect(() => { onZoom(map.getZoom()); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/** Au choix d'un marqueur en vue éloignée, zoom sur sa ville. */
function FlyTo({ target }: { target: LatLng | null }) {
  const map = useMap();
  useEffect(() => { if (target && map.getZoom() < 11) map.flyTo(target, 12, { duration: 0.6 }); }, [target?.[0], target?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/** Cadre la carte sur les marqueurs au premier affichage. */
function FitBounds({ positions }: { positions: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) map.setView(positions[0], 11);
    // Marge haute plus grande : le bandeau d'explication est au-dessus de la carte.
    else map.fitBounds(L.latLngBounds(positions), { paddingTopLeft: [40, 90], paddingBottomRight: [40, 40], maxZoom: 12 });
  }, [positions.map((p) => p.join(',')).join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export function MapPage({ onNavigate }: { onNavigate?: (route: any) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(7);
  const compact = zoom < 9;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['map-properties'],
    queryFn: () => propertyService.getAll({ per_page: 200 }),
    staleTime: 5 * 60 * 1000,
  });

  const { groups, unplaced } = useMemo(() => {
    const raw = (data as any)?.data?.data || (data as any)?.data || [];
    const byKey = new Map<string, Group>();
    const unplacedList: HomeListing[] = [];

    for (const p of raw) {
      const mapped = mapProperty(p);
      if (!mapped.isVisible) continue;
      const listing = toListing(mapped);
      const lat = Number(p.latitude);
      const lng = Number(p.longitude);

      if (p.latitude != null && p.longitude != null && Number.isFinite(lat) && Number.isFinite(lng) && (lat || lng)) {
        byKey.set(`p-${p.id}`, {
          key: `p-${p.id}`, label: p.title, position: [lat, lng], precise: true, listings: [listing],
          priceLabel: new Intl.NumberFormat('fr-FR').format(Number(p.price_per_night) || 0).replace(/[  ]/g, ' '),
        });
        continue;
      }
      const coords = cityCoordinates(p.city);
      if (!coords) { unplacedList.push(listing); continue; }
      const key = `c-${coords.join(',')}`;
      const group = byKey.get(key) ?? { key, label: cityLabel(String(p.city)), position: coords, precise: false, listings: [] };
      group.listings.push(listing);
      byKey.set(key, group);
    }
    return { groups: [...byKey.values()], unplaced: unplacedList };
  }, [data]);

  const current = groups.find((g) => g.key === selected) ?? null;

  return (
    <div className="relative">
      <style>{`
        .bf-marker { background: none; border: none; }
        .bf-pin { display:inline-block; transform: translate(-50%,-50%); padding: 4px 10px; border-radius: 999px;
          font: 700 12px/1.2 var(--font-primary); box-shadow: 0 2px 8px rgba(15,41,64,.25); white-space: nowrap; }
        .bf-bubble { display:inline-flex; align-items:center; gap:5px; transform: translate(-50%,-50%);
          padding: 4px 10px 4px 5px; border-radius: 999px; font: 600 12px/1.2 var(--font-primary); white-space: nowrap;
          box-shadow: 0 3px 10px rgba(15,41,64,.28); border: 2px solid #fff; }
        .bf-count { display:inline-flex; align-items:center; justify-content:center; transform: translate(-50%,-50%);
          width: 26px; height: 26px; border-radius: 999px; font: 700 12px/1 var(--font-primary);
          border: 2px solid #fff; box-shadow: 0 2px 8px rgba(15,41,64,.3); }
        .bf-dot { display:block; transform: translate(-50%,-50%); width: 14px; height: 14px; border-radius: 999px;
          border: 3px solid; box-shadow: 0 2px 6px rgba(15,41,64,.3); }
        .bf-bubble b { display:inline-flex; align-items:center; justify-content:center; min-width: 20px; height: 20px;
          border-radius: 999px; background: rgba(255,255,255,.25); font-size: 12px; }
      `}</style>

      <div className="h-[calc(100dvh-8.5rem)] lg:h-[calc(100vh-9rem)] w-full">
        <MapContainer center={BENIN_CENTER} zoom={7} className="h-full w-full z-0" zoomControl={false} attributionControl>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <FitBounds positions={groups.map((g) => g.position)} />
          <ZoomWatcher onZoom={setZoom} />
          <FlyTo target={groups.find((g) => g.key === selected)?.position ?? null} />
          {groups.map((g) => (
            <Marker
              key={g.key}
              position={g.position}
              icon={markerIcon(g, g.key === selected, compact)}
              // Les regroupements par ville passent au-dessus des repères précis.
              zIndexOffset={g.precise ? 0 : 1000}
              eventHandlers={{ click: () => setSelected(g.key) }}
              title={g.precise ? g.label : `${g.listings.length} annonce(s) à ${g.label}`}
            />
          ))}
        </MapContainer>
      </div>

      {/* Explication, discrète, en haut */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex justify-center pointer-events-none">
        <p className="pointer-events-auto max-w-md text-center text-xs bg-white/95 text-[#0f2940] rounded-full px-4 py-2 shadow-md">
          {isLoading ? <span className="inline-flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Chargement des annonces…</span>
            : isError ? 'Impossible de charger les annonces.'
            : 'Les annonces sans adresse précise sont regroupées au centre de leur ville.'}
        </p>
      </div>

      {/* Annonces du marqueur choisi */}
      {current && (
        <div className="absolute left-0 right-0 bottom-0 z-[500] bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(15,41,64,.18)] pt-3 pb-4">
          <div className="flex items-center justify-between px-4 mb-3">
            <p className="font-semibold text-[#0f2940] flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#00c9a7]" />
              {current.precise ? current.label : `${current.listings.length} annonce${current.listings.length > 1 ? 's' : ''} à ${current.label}`}
            </p>
            <button onClick={() => setSelected(null)} aria-label="Fermer" className="p-1.5 rounded-full hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pl-4 scroll-pl-4 snap-x snap-mandatory pb-1">
            {current.listings.map((l) => (
              <ListingCard key={l.id} listing={l} onNavigate={onNavigate} route={{ name: 'listing', id: String(l.id) }} />
            ))}
            <div className="w-4 flex-shrink-0" aria-hidden="true" />
          </div>
        </div>
      )}

      {!isLoading && unplaced.length > 0 && !current && (
        <p className="absolute bottom-3 left-3 right-3 z-[400] text-center text-[11px] text-slate-600 bg-white/90 rounded-xl px-3 py-1.5">
          {unplaced.length} annonce{unplaced.length > 1 ? 's' : ''} dans une ville non reconnue n’apparai{unplaced.length > 1 ? 'ssent' : 't'} pas sur la carte.
        </p>
      )}
    </div>
  );
}
