// Choix de la position exacte d'une annonce : l'hôte touche la carte (ou
// utilise la position de son téléphone) pour placer son logement. Sans
// position, l'annonce reste regroupée au centre de sa ville sur la carte.
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed, Trash2 } from 'lucide-react';
import { BENIN_CENTER, cityCoordinates, type LatLng } from '../../constants/beninCities';

const pinIcon = L.divIcon({
  className: '',
  html: '<span style="display:block;width:22px;height:22px;border-radius:50% 50% 50% 0;background:#00c9a7;border:3px solid #fff;transform:translate(-50%,-100%) rotate(-45deg);box-shadow:0 2px 6px rgba(15,41,64,.35)"></span>',
  iconAnchor: [0, 0],
});

function ClickToPlace({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({ click: (e) => onPick([e.latlng.lat, e.latlng.lng]) });
  return null;
}

function Recenter({ center, zoom }: { center: LatLng; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom); }, [center[0], center[1], zoom]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

const round = (n: number) => Math.round(n * 1e6) / 1e6;

export function LocationPicker({
  city, latitude, longitude, onChange,
}: {
  city?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  onChange: (lat: number | null, lng: number | null) => void;
}) {
  const lat = latitude != null && latitude !== '' ? Number(latitude) : null;
  const lng = longitude != null && longitude !== '' ? Number(longitude) : null;
  const value: LatLng | null = lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
  const cityCenter = cityCoordinates(city);
  const [geoError, setGeoError] = useState('');

  const center: LatLng = value ?? cityCenter ?? BENIN_CENTER;
  const zoom = value ? 16 : cityCenter ? 13 : 7;

  const useMyPosition = () => {
    setGeoError('');
    if (!navigator.geolocation) return setGeoError('La géolocalisation n’est pas disponible sur cet appareil.');
    navigator.geolocation.getCurrentPosition(
      (pos) => onChange(round(pos.coords.latitude), round(pos.coords.longitude)),
      () => setGeoError('Position refusée ou indisponible. Touchez la carte pour placer le logement.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-[#0F2940]">Position sur la carte <span className="text-slate-400 font-normal">(recommandé)</span></p>
        <div className="flex gap-2">
          <button type="button" onClick={useMyPosition}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-[#e2f5f2] text-[#00806b] hover:bg-[#f4fffe]">
            <LocateFixed className="w-3.5 h-3.5" /> Ma position
          </button>
          {value && (
            <button type="button" onClick={() => onChange(null, null)}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50">
              <Trash2 className="w-3.5 h-3.5" /> Retirer
            </button>
          )}
        </div>
      </div>
      <div className="h-64 rounded-2xl overflow-hidden border border-[#e2f5f2] relative z-0">
        <MapContainer center={center} zoom={zoom} className="h-full w-full" scrollWheelZoom={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
          <Recenter center={center} zoom={zoom} />
          <ClickToPlace onPick={([a, b]) => onChange(round(a), round(b))} />
          {value && (
            <Marker position={value} icon={pinIcon} draggable
              eventHandlers={{ dragend: (e) => { const p = (e.target as L.Marker).getLatLng(); onChange(round(p.lat), round(p.lng)); } }} />
          )}
        </MapContainer>
      </div>
      <p className="text-xs text-slate-500">
        {value ? 'Position enregistrée. Faites glisser le repère pour l’ajuster.' : 'Touchez la carte à l’emplacement du logement. Sans position, l’annonce apparaît au centre de sa ville.'}
      </p>
      {geoError && <p className="text-xs text-red-600">{geoError}</p>}
    </div>
  );
}
