import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '../components/Navbar';
import { Seo } from '../components/Seo';
import { HomeMobileHeader } from '../components/home/HomeMobileHeader';
import { PromoCarousel } from '../components/home/PromoCarousel';
import { VerticalTabs, type HomeVertical } from '../components/home/VerticalTabs';
import { CitySection } from '../components/home/CitySection';
import { CityCarousel, type CityCarouselItem } from '../components/home/CityCarousel';
import { ScrollTopButton } from '../components/home/ScrollTopButton';
import type { HomeListing } from '../components/home/ListingCard';
import propertyService from '../../services/property.service';
import experienceService from '../../services/experience.service';
import serviceService from '../../services/service.service';
import { getFirstExperienceImage, getServiceImages } from '../utils/imageHelper';
import { mapProperty } from '../pages';

function toListing(p: any): HomeListing {
  return {
    id: p.id,
    title: p.title,
    location: p.location || p.city || 'Bénin',
    image: p.image,
    images: Array.isArray(p.images) ? p.images : undefined,
    priceDisplay: p.priceDisplay,
    priceUnit: '/nuit',
    bluefinCertified: p.bluefin_certified,
  };
}

function titleCase(s: string): string {
  return s
    .split(/([\s-])/)
    .map((part) => (/[\s-]/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()))
    .join('');
}

function groupByCity(listings: HomeListing[]): [string, HomeListing[]][] {
  const map = new Map<string, HomeListing[]>();
  for (const item of listings) {
    const key = titleCase(item.location.split(',').pop()?.trim() || 'Bénin');
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
}

/**
 * Montant en FCFA formate a la francaise. Les espaces fines insecables
 * produites par fr-FR sont ramenees a une espace normale : a la taille de
 * texte des cartes, elles sont si etroites que le nombre parait ne pas
 * avoir de separateur du tout.
 */
function formatFcfa(value: unknown): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString('fr-FR').replace(/[  ]/g, ' ');
}

/**
 * Prix médian d'un groupe d'annonces, reformaté comme les prix affichés.
 * Médiane et non moyenne : une seule villa à 250 000 FCFA fausserait
 * complètement une moyenne sur un échantillon de cette taille.
 */
function medianPrice(listings: HomeListing[]): string | undefined {
  const values = listings
    .map((l) => Number(String(l.priceDisplay).replace(/[^\d]/g, '')))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);

  if (values.length === 0) return undefined;

  const mid = Math.floor(values.length / 2);
  const value = values.length % 2 ? values[mid] : Math.round((values[mid - 1] + values[mid]) / 2);
  return formatFcfa(value);
}

function SectionsSkeleton() {
  return (
    <div className="py-4 space-y-6">
      {[0, 1].map((row) => (
        <div key={row}>
          <div className="flex items-center justify-between px-4 mb-3">
            <div className="h-[19px] w-32 bg-gray-200 rounded animate-pulse" />
            <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
          </div>
          <div className="flex gap-4 overflow-hidden pl-4">
            {[0, 1].map((i) => (
              <div key={i} className="w-[calc(100%-72px)] max-w-[300px] sm:w-[280px] flex-shrink-0 animate-pulse">
                <div className="aspect-[4/3] rounded-2xl bg-gray-200" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mt-2.5" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mt-1.5" />
                <div className="h-4 bg-gray-200 rounded w-2/5 mt-2" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function HomePage({ onNavigate }: { onNavigate?: (route: any) => void }) {
  const [vertical, setVertical] = useState<HomeVertical>('logements');

  const { data: propertiesData, isLoading: propertiesLoading } = useQuery({
    queryKey: ['home-properties'],
    queryFn: () => propertyService.getAll({ per_page: 60, sort_by: 'popular' }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: hotelsData, isLoading: hotelsLoading } = useQuery({
    queryKey: ['home-hotels'],
    queryFn: () => propertyService.getAll({ is_hotel_promoted: true, per_page: 30 }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: vertical === 'hotels',
  });

  const { data: experiencesData, isLoading: experiencesLoading } = useQuery({
    queryKey: ['home-experiences'],
    queryFn: () => experienceService.getFeatured(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: vertical === 'experiences',
  });

  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ['home-services'],
    queryFn: () => serviceService.getFeatured(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: vertical === 'services',
  });

  const properties = useMemo(() => {
    const raw = propertiesData?.data?.data || propertiesData?.data || [];
    return raw.map(mapProperty).filter((p: any) => p.isVisible && !p.is_hotel_promoted);
  }, [propertiesData]);

  const filteredProperties = properties;

  const topListings = useMemo(
    () =>
      [...filteredProperties]
        .sort((a: any, b: any) => (b.bluefin_certified ? 1 : 0) - (a.bluefin_certified ? 1 : 0) || b.rating - a.rating)
        .slice(0, 8)
        .map(toListing),
    [filteredProperties]
  );

  const citySections = useMemo(() => groupByCity(filteredProperties.map(toListing)).slice(0, 6), [filteredProperties]);

  const cityCarouselItems = useMemo(
    (): CityCarouselItem[] =>
      citySections.map(([city, listings]) => ({
        city,
        stats: { count: listings.length, medianPrice: medianPrice(listings) },
        seeAllRoute: { name: 'search-logements', search: `destination=${encodeURIComponent(city)}` },
      })),
    [citySections]
  );

  const hotelListings = useMemo(() => {
    const raw = hotelsData?.data?.data || hotelsData?.data || [];
    return raw.map(mapProperty).filter((p: any) => p.isVisible).map(toListing);
  }, [hotelsData]);

  const hotelCitySections = useMemo(() => groupByCity(hotelListings).slice(0, 6), [hotelListings]);

  const experienceListings = useMemo((): HomeListing[] => {
    const raw = experiencesData?.data?.data || experiencesData?.data || [];
    return raw.map((exp: any) => ({
      id: exp.id,
      title: exp.name,
      location: exp.location || 'Bénin',
      image: getFirstExperienceImage(exp),
      priceDisplay: `${formatFcfa(exp.price)} FCFA`,
      priceUnit: '/séance' as const,
    }));
  }, [experiencesData]);

  const serviceListings = useMemo((): HomeListing[] => {
    const raw = servicesData?.data?.data || servicesData?.data || [];
    return raw.map((svc: any) => ({
      id: svc.id,
      title: svc.title,
      location: svc.location || 'Bénin',
      image: getServiceImages(svc)[0],
      priceDisplay: `${formatFcfa(svc.price)} FCFA`,
      priceUnit: '/prestation' as const,
    }));
  }, [servicesData]);

  const handleDesktopSearch = (params: { destination: string; checkIn: string; checkOut: string; guests: number }) => {
    const search = new URLSearchParams();
    if (params.destination) search.set('destination', params.destination);
    if (params.checkIn) search.set('check_in', params.checkIn);
    if (params.checkOut) search.set('check_out', params.checkOut);
    if (params.guests) search.set('guests', String(params.guests));
    onNavigate?.({ name: 'search-logements', search: search.toString() });
  };

  return (
    // La barre de navigation du bas est `fixed` et fait 64px (80px en sm) : sans
    // réserve équivalente ici, la dernière rangée de cartes passe dessous.
    <div className="min-h-screen bg-white pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-0">
      <Seo
        title="Bluefin Immo — Location de logements vérifiés au Bénin"
        description="Réservez des logements, expériences et services vérifiés partout au Bénin. Paiement sécurisé par Mobile Money (MTN, Moov, Orange)."
        path="/"
      />
      <h1 className="sr-only">Location de logements, expériences et services vérifiés au Bénin</h1>
      <div className="hidden lg:block">
        <Navbar
          onGoHome={() => onNavigate?.({ name: 'home' })}
          onNavigate={onNavigate}
          currentPage="home"
          onSearch={handleDesktopSearch}
        />
      </div>

      <div className="lg:hidden">
        <HomeMobileHeader onNavigate={onNavigate} />
        <PromoCarousel onNavigate={onNavigate} />

        <div className="px-4 mb-3">
          <button
            onClick={() => onNavigate?.({ name: 'search-logements' })}
            className="w-full flex items-center gap-3 bg-white border-[1.5px] border-[#12b8c9] rounded-full pl-4 pr-4 py-2.5 text-left"
          >
            <svg className="w-5 h-5 text-[#0f2940] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-medium text-[#374151]">Que cherchez-vous ?</span>
              <span className="text-xs text-[#9ca3af]">
                {vertical === 'logements' && 'une villa'}
                {vertical === 'hotels' && 'un hôtel'}
                {vertical === 'experiences' && 'une expérience'}
                {vertical === 'services' && 'un service'}
              </span>
            </span>
          </button>
        </div>
      </div>

      {/* Conteneur de rattachement du sticky : doit rester un ancêtre aussi
          grand que la page (pas juste le bloc d'en-tête ci-dessus, sinon le
          bandeau se détache dès que ce bloc, très court, sort de l'écran). */}
      <div className="lg:hidden sticky top-0 z-30 bg-white pt-1 pb-2">
        <VerticalTabs active={vertical} onChange={setVertical} />
      </div>

      <main className="max-w-[1440px] mx-auto lg:px-6 lg:py-6">
        {vertical === 'logements' && (
          <>
            {propertiesLoading ? (
              <SectionsSkeleton />
            ) : (
              <>
                <CityCarousel items={cityCarouselItems} onNavigate={onNavigate} />
                <CitySection
                  title="Les mieux notés"
                  listings={topListings}
                  routeFor={(l) => ({ name: 'listing', id: String(l.id) })}
                  seeAllRoute={{ name: 'popular' }}
                  onNavigate={onNavigate}
                />
                {citySections.map(([city, listings], i) => (
                  <CitySection
                    key={city}
                    title={city}
                    listings={listings}
                    routeFor={(l) => ({ name: 'listing', id: String(l.id) })}
                    seeAllRoute={{ name: 'search-logements', search: `destination=${encodeURIComponent(city)}` }}
                    onNavigate={onNavigate}
                    tinted={i % 2 === 1}
                  />
                ))}
              </>
            )}
          </>
        )}

        {vertical === 'hotels' && (
          <>
            {hotelsLoading ? (
              <SectionsSkeleton />
            ) : hotelCitySections.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-gray-500">Aucun hôtel promu pour le moment.</p>
            ) : (
              hotelCitySections.map(([city, listings]) => (
                <CitySection
                  key={city}
                  title={`Hôtels · ${city}`}
                  listings={listings}
                  routeFor={(l) => ({ name: 'listing', id: String(l.id) })}
                  seeAllRoute={{ name: 'hotels' }}
                  onNavigate={onNavigate}
                />
              ))
            )}
          </>
        )}

        {vertical === 'experiences' && (
          <>
            {experiencesLoading ? (
              <SectionsSkeleton />
            ) : experienceListings.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-gray-500">Aucune expérience disponible pour le moment.</p>
            ) : (
              <CitySection
                title="Expériences à vivre"
                listings={experienceListings}
                routeFor={() => ({ name: 'experience' })}
                seeAllRoute={{ name: 'experience' }}
                onNavigate={onNavigate}
              />
            )}
          </>
        )}

        {vertical === 'services' && (
          <>
            {servicesLoading ? (
              <SectionsSkeleton />
            ) : serviceListings.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-gray-500">Aucun service disponible pour le moment.</p>
            ) : (
              <CitySection
                title="Services disponibles"
                listings={serviceListings}
                routeFor={() => ({ name: 'services' })}
                seeAllRoute={{ name: 'services' }}
                onNavigate={onNavigate}
              />
            )}
          </>
        )}
      </main>

      <ScrollTopButton />
    </div>
  );
}

export default HomePage;
