// src/app/router.ts

export type Page =
  | 'home'
  | 'search-logements'
  | 'search-hotels'
  | 'experience'
  | 'services'
  | 'listing'
  | 'booking'
  | 'confirmation'
  | 'profile'
  | 'account'
  | 'become-host'
  | 'account-reservations'
  | 'host-dashboard'
  | 'host-experience-dashboard'
  | 'host-experiences-list'
  | 'host-experience-messages'
  | 'experience-booking'
  | 'host-service-dashboard'
  | 'host-service-list'
  | 'host-service-calendar'
  | 'host-service-reservations'
  | 'host-service-messages'
  | 'service-booking'
  | 'host-annonces'
  | 'host-calendrier'
  | 'host-reservations'
  | 'host-messages'
  | 'host-favorites'
  | 'admin-properties'
  | 'messages'
  | 'favorites'
  | 'publish'
  | 'help'
  | 'about'
  | 'blog'
  | 'terms'
  | 'not-found'
  | 'popular'
  | 'hotels'
  | 'city'
  | 'auth'
  | 'site-functioning'
  | 'company-info'
  | 'footer-info'
  | 'admin-dashboard'
  | 'admin-users'
  | 'admin-bookings'
  | 'admin-bookings-logements'
  | 'admin-bookings-experiences-services'
  | 'admin-payments'
  | 'admin-host-payments'
  | 'admin-messages'
  | 'admin-reports'
  | 'admin-login'
  | 'admin-experiences'
  | 'admin-services'
  // ✅ ROUTES FEDAPAY
  | 'fedapay-payment'
  | 'fedapay-callback';

export type Route = {
  name: Page;
  id?: string;
  city?: string;
  type?: 'privacy' | 'cgu';
  search?: string;
  params?: any;
  bookingData?: any;
  transactionId?: string;
  status?: string;
  bookingId?: string;
};

/**
 * Convertit un chemin URL en objet Route
 */
export function parseRoute(path: string): Route {
  let search: string | undefined;
  const queryIndex = path.indexOf('?');
  if (queryIndex !== -1) {
    search = path.slice(queryIndex + 1);
    path = path.slice(0, queryIndex);
  }
  
  const cleaned = path.replace(/\/+/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
  const segments = cleaned.split('/').filter(Boolean);

  if (segments.length === 0) return { name: 'home', search };

  // Pages statiques
  const staticPages: Record<string, Page> = {
    popular: 'popular',
    hotels: 'hotels',
    experience: 'experience',
    services: 'services',
    'become-host': 'become-host',
    'devenir-hote': 'become-host',
    auth: 'auth',
    connexion: 'auth',
    login: 'auth',
    'a-propos': 'about',
    about: 'about',
    aide: 'help',
    help: 'help',
    blog: 'blog',
    'mentions-legales': 'terms',
    confidentialite: 'terms',
    cgu: 'terms',
    fonctionnement: 'site-functioning',
    entreprise: 'company-info',
    footer: 'footer-info',
    'admin-login': 'admin-login',
  };
  
  if (staticPages[segments[0]]) {
    const name = staticPages[segments[0]];
    if (name === 'terms') {
      let type: 'privacy' | 'cgu' | undefined;
      if (segments[0] === 'confidentialite') type = 'privacy';
      if (segments[0] === 'cgu') type = 'cgu';
      return { name, type, search };
    }
    return { name, search };
  }

  // Recherche
  if (segments[0] === 's') {
    return { name: segments[1] === 'hotels' ? 'search-hotels' : 'search-logements', search };
  }

  // Annonce
  if (segments[0] === 'annonce') {
    return { name: 'listing', id: segments[1] ?? '1', search };
  }

  // Réservation
  if (segments[0] === 'reserver') {
    if (segments[1] === 'confirmation') {
      return { name: 'confirmation', id: segments[2] ?? '1', search };
    }
    return { name: 'booking', id: segments[1] ?? '1', search };
  }

  // Profil public
  if (segments[0] === 'profil') {
    return { name: 'profile', id: segments[1] ?? 'me', search };
  }

  // Mon compte
  if (segments[0] === 'mon-compte') {
    return { name: segments[1] === 'reservations' ? 'account-reservations' : 'account', search };
  }

  // ✅ ROUTES EXPÉRIENCES HÔTE
  if (segments[0] === 'host' && segments[1] === 'experience' && segments[2] === 'messages') {
    return { name: 'host-experience-messages', id: segments[3], search };
  }

  if (segments[0] === 'experience-booking') {
    return { name: 'experience-booking', id: segments[1] ?? '1', search };
  }

  // ✅ ROUTES SERVICE BOOKING
  if (segments[0] === 'service-booking') {
    return { name: 'service-booking', id: segments[1] ?? '1', search };
  }

  // Espace hôte
  if (segments[0] === 'hote') {
    const sub = segments[1];
    
    // Dashboard général
    if (sub === 'tableau-de-bord') return { name: 'host-dashboard', search };
    
    // ✅ ROUTES EXPÉRIENCES
    if (sub === 'experiences' && segments[2] === 'liste') return { name: 'host-experiences-list', search };
    if (sub === 'experiences' && segments[2] === 'calendrier') return { name: 'host-experience-calendar', search };
    if (sub === 'experiences' && segments[2] === 'reservations') return { name: 'host-experience-reservations', search };
    if (sub === 'experiences' && segments[2] === 'messages') {
      return { name: 'host-experience-messages', id: segments[3], search };
    }
    if (sub === 'experiences') return { name: 'host-experience-dashboard', search };
    
    // ✅ ROUTES SERVICES
    if (sub === 'services' && segments[2] === 'liste') return { name: 'host-service-list', search };
    if (sub === 'services' && segments[2] === 'calendrier') return { name: 'host-service-calendar', search };
    if (sub === 'services' && segments[2] === 'reservations') return { name: 'host-service-reservations', search };
    if (sub === 'services' && segments[2] === 'messages') {
      return { name: 'host-service-messages', id: segments[3], search };
    }
    if (sub === 'services') return { name: 'host-service-dashboard', search };
    
    // ✅ ROUTES LOGEMENTS
    if (sub === 'annonces') return { name: 'host-annonces', search };
    if (sub === 'calendrier') return { name: 'host-calendrier', id: segments[2], search };
    if (sub === 'reservations') return { name: 'host-reservations', search };
    if (sub === 'messages') return { name: 'host-messages', id: segments[2], search };
    if (sub === 'favoris') return { name: 'host-favorites', search };
    
    return { name: 'host-dashboard', search };
  }

  // Routes admin
  if (segments[0] === 'admin') {
    const sub = segments[1];
    if (sub === 'dashboard') return { name: 'admin-dashboard', search };
    if (sub === 'properties') return { name: 'admin-properties', search };
    if (sub === 'experiences') return { name: 'admin-experiences', search };
    if (sub === 'services') return { name: 'admin-services', search };
    if (sub === 'users') return { name: 'admin-users', search };
    if (sub === 'bookings') return { name: 'admin-bookings', search };
    if (sub === 'bookings-logements') return { name: 'admin-bookings-logements', search };
    if (sub === 'bookings-offres') return { name: 'admin-bookings-experiences-services', search };
    if (sub === 'payments') return { name: 'admin-payments', search };
    if (sub === 'host-payments') return { name: 'admin-host-payments', search };
    if (sub === 'messages') return { name: 'admin-messages', search };
    if (sub === 'reports') return { name: 'admin-reports', search };
    return { name: 'admin-dashboard', search };
  }

  // Routes Fedapay
  if (segments[0] === 'payment') {
    if (segments[1] === 'fedapay') {
      if (segments[2] === 'callback') {
        return { name: 'fedapay-callback', search };
      }
      if (segments[2] === 'cancel') {
        return { name: 'fedapay-callback', search: `status=cancelled${search ? '&' + search : ''}` };
      }
      return { name: 'fedapay-payment', search };
    }
  }

  // Autres pages
  if (segments[0] === 'messages') return { name: 'messages', id: segments[1], search };
  if (segments[0] === 'favoris') return { name: 'favorites', search };
  if (segments[0] === 'publier-annonce') return { name: 'publish', search };

  // Ville
  if (segments[0] === 'city' && segments[1]) {
    return { name: 'city', city: segments[1], search };
  }

  return { name: 'not-found', search };
}

/**
 * Convertit une Route en chemin URL
 */
export function routeToPath(route: Route): string {
  let path = '';
  switch (route.name) {
    case 'home': path = '/'; break;
    case 'popular': path = '/popular'; break;
    case 'hotels': path = '/hotels'; break;
    case 'city': path = `/city/${route.city ?? 'cotonou'}`; break;
    case 'experience': path = '/experience'; break;
    case 'services': path = '/services'; break;
    case 'become-host': path = '/devenir-hote'; break;
    case 'auth': path = '/auth'; break;
    case 'about': path = '/a-propos'; break;
    case 'help': path = '/aide'; break;
    case 'blog': path = '/blog'; break;
    case 'site-functioning': path = '/fonctionnement'; break;
    case 'company-info': path = '/entreprise'; break;
    case 'footer-info': path = '/footer'; break;
    case 'search-logements': path = '/s/logements'; break;
    case 'search-hotels': path = '/s/hotels'; break;
    case 'listing': path = `/annonce/${route.id ?? '1'}`; break;
    case 'booking': path = `/reserver/${route.id ?? '1'}`; break;
    case 'confirmation': path = `/reserver/confirmation/${route.id ?? '1'}`; break;
    case 'profile': path = `/profil/${route.id ?? 'me'}`; break;
    case 'account': path = '/mon-compte'; break;
    case 'account-reservations': path = '/mon-compte/reservations'; break;
    case 'host-dashboard': path = '/hote/tableau-de-bord'; break;
    
    // ✅ ROUTES EXPÉRIENCES
    case 'host-experience-dashboard': path = '/hote/experiences'; break;
    case 'host-experiences-list': path = '/hote/experiences/liste'; break;
    case 'host-experience-calendar': path = '/hote/experiences/calendrier'; break;
    case 'host-experience-reservations': path = '/hote/experiences/reservations'; break;
    case 'host-experience-messages': 
      path = route.id ? `/hote/experiences/messages/${route.id}` : '/hote/experiences/messages'; 
      break;
    case 'experience-booking': 
      path = `/experience-booking/${route.id ?? '1'}`; 
      break;
    
    // ✅ ROUTES SERVICES
    case 'host-service-dashboard': 
      path = '/hote/services'; 
      break;
    case 'host-service-list': 
      path = '/hote/services/liste'; 
      break;
    case 'host-service-calendar': 
      path = '/hote/services/calendrier'; 
      break;
    case 'host-service-reservations': 
      path = '/hote/services/reservations'; 
      break;
    case 'host-service-messages': 
      path = route.id ? `/hote/services/messages/${route.id}` : '/hote/services/messages'; 
      break;
    case 'service-booking':
      path = `/service-booking/${route.id ?? '1'}`;
      break;
    
    // ✅ ROUTES LOGEMENTS
    case 'host-annonces': path = '/hote/annonces'; break;
    case 'host-calendrier': path = route.id ? `/hote/calendrier/${route.id}` : '/hote/calendrier'; break;
    case 'host-reservations': path = '/hote/reservations'; break;
    case 'host-messages': path = route.id ? `/hote/messages/${route.id}` : '/hote/messages'; break;
    case 'host-favorites': path = '/hote/favoris'; break;
    
    case 'messages':
      path = `/messages/${route.id || ''}`;
      if (route.search) {
        path += `?${route.search}`;
      }
      break;
    case 'favorites': path = '/favoris'; break;
    case 'publish': path = '/publier-annonce'; break;
    case 'admin-dashboard': path = '/admin/dashboard'; break;
    case 'admin-properties': path = '/admin/properties'; break;
    case 'admin-experiences': path = '/admin/experiences'; break;
    case 'admin-services': path = '/admin/services'; break;
    case 'admin-users': path = '/admin/users'; break;
    case 'admin-bookings': path = '/admin/bookings'; break;
    case 'admin-bookings-logements': path = '/admin/bookings-logements'; break;
    case 'admin-bookings-experiences-services': path = '/admin/bookings-offres'; break;
    case 'admin-payments': path = '/admin/payments'; break;
    case 'admin-host-payments': path = '/admin/host-payments'; break;
    case 'admin-messages': path = '/admin/messages'; break;
    case 'admin-reports': path = '/admin/reports'; break;
    case 'admin-login': path = '/admin-login'; break;
    case 'terms':
      if (route.type === 'privacy') path = '/confidentialite';
      else if (route.type === 'cgu') path = '/cgu';
      else path = '/mentions-legales';
      break;
    // ✅ ROUTES FEDAPAY
    case 'fedapay-payment':
      path = '/payment/fedapay';
      if (route.bookingData) {
        path += `?data=${encodeURIComponent(JSON.stringify(route.bookingData))}`;
      }
      break;
    case 'fedapay-callback':
      path = '/payment/fedapay/callback';
      break;
    default: path = '/404';
  }
  
  if (route.search) {
    path += `?${route.search}`;
  }
  
  return path;
}

/**
 * Détermine l'onglet de navigation mobile à partir du nom de la page
 */
export function tabFromPage(page: Page): 'explore' | 'favorites' | 'trips' | 'messages' | 'profile' {
  // Explorer
  if (page === 'home' || page === 'popular' || page === 'hotels' || page === 'city' || 
      page === 'experience' || page === 'services' || page === 'listing' || page === 'search-logements' || 
      page === 'search-hotels' || page === 'booking' || page === 'confirmation') {
    return 'explore';
  }
  
  // Favoris
  if (page === 'favorites' || page === 'host-favorites') {
    return 'favorites';
  }
  
  // Trips (Voyages/Réservations)
  if (page === 'account-reservations' || page === 'account') {
    return 'trips';
  }
  
  // Messages
  if (page === 'messages' || page === 'host-messages' || page === 'host-experience-messages' || page === 'host-service-messages') {
    return 'messages';
  }
  
  // Profil
  if (page === 'profile') {
    return 'profile';
  }
  
  return 'explore';
}

/**
 * Construit une Route à partir d’un onglet de navigation mobile
 */
export function routeFromTab(
  tab: 'explore' | 'favorites' | 'trips' | 'messages' | 'profile' | 'auth',
  userType?: string,
  hostType?: string
): Route {
  switch (tab) {
    case 'explore': return { name: 'home' };
    case 'favorites': return { name: 'favorites' };
    case 'trips': return { name: 'account-reservations' };
    case 'messages':
      // ✅ Si hôte service, rediriger vers host-service-messages
      if (userType === 'hote' && hostType === 'service') {
        return { name: 'host-service-messages' };
      }
      // ✅ Si hôte expérience, rediriger vers host-experience-messages
      if (userType === 'hote' && hostType === 'experience') {
        return { name: 'host-experience-messages' };
      }
      // ✅ Si hôte logement, rediriger vers host-messages
      if (userType === 'hote') {
        return { name: 'host-messages' };
      }
      // ✅ Voyageur ou utilisateur non connecté
      return { name: 'messages' };
    case 'profile': return { name: 'profile' };
    case 'auth': return { name: 'auth' };
    default: return { name: 'home' };
  }
}