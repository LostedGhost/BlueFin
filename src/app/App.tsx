// src/app/App.tsx (version finale corrigée)
import { useEffect, useState } from 'react';
import { BrowserRouter, useLocation, useNavigate as useRouterNavigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Navbar } from './components/Navbar';
import { Seo } from './components/Seo';
import { MobileBottomNav, type Tab } from './components/MobileBottomNav';
import { MobileBookingSheet } from './components/MobileBookingSheet';
import { Footer } from './components/Footer';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

import {
  SearchPage,
  ListingPage,
  BookingPage,
  ConfirmationPage,
  ProfilePage,
  AccountPage,
  AccountReservationsPage,
  HostDashboardPage,
  HostExperienceDashboardPage,
  HostExperienceListPage,
  HostExperienceCalendarPage,
  HostExperienceReservationsPage,
  HostExperienceMessagesPage,
  ExperienceBookingPage ,
  HostServiceDashboardPage,
  HostServiceListPage ,
  ServiceBookingPage,
  HostListingsPage,
  HostCalendarPage,
  HostReservationsPage,
  HostMessagesPage,
  MessagesPage,
  FavoritesPage,
  PublishListingPage,
  HelpPage,
  AboutPage,
  BlogPage,
  TermsPage,
  CguPage,
  NotFoundPage,
  AllPropertiesPage,
  HotelsPage,
  CityPage,
  ExperiencePage,
  ServicesPage,
  BecomeHost,
  AuthPage,
  SiteFunctioningPage,
  CompanyInfoPage,
  AdminDashboardPage,
  AdminUsersPage,
  AdminBookingsPage,
  AdminBookingsLogementsPage,
  AdminBookingsExperiencesServicesPage,
  AdminPaymentsPage,
  AdminMessagesPage,
  AdminReportsPage,
  AdminExperiencesPage,
  AdminServicesPage,
} from './pages';
import { AdminPropertiesPage } from './pages/admin/AdminPropertiesPage';
import { HomePage } from './pages/Home';
import { parseRoute, routeToPath, tabFromPage, routeFromTab, type Route, type Page } from './router';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminHeader } from './components/AdminHeader';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { WhatsAppButton } from './components/WhatsAppButton';
import { BookingSummaryPage } from '../app/pages/BookingSummaryPage';
import { AdminHostPaymentsPage } from './pages/admin/AdminHostPaymentsPage';
import { FedapayPaymentPage } from './pages/FedapayPaymentPage';
import { FedapayCallbackPage } from './pages/FedapayCallbackPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

// ============================================
// COMPOSANT ADMIN LAYOUT
// ============================================
function AdminLayoutContent({
  currentPage,
  onNavigate,
}: {
  currentPage: Page;
  onNavigate: (to: Route | string) => void;
}) {
  const { isDark } = useTheme();

  const renderAdminPage = () => {
    console.log('🔄 Rendu page admin:', currentPage);
    
    switch (currentPage) {
      case 'admin-dashboard': 
        return <AdminDashboardPage onNavigate={onNavigate} />;
      case 'admin-properties': 
        return <AdminPropertiesPage onNavigate={onNavigate} />;
      case 'admin-experiences':
        return <AdminExperiencesPage onNavigate={onNavigate} />;
      case 'admin-services':
        return <AdminServicesPage onNavigate={onNavigate} />;
      case 'admin-users': 
        return <AdminUsersPage onNavigate={onNavigate} />;
      case 'admin-bookings': 
        return <AdminBookingsPage onNavigate={onNavigate} />;
      case 'admin-bookings-logements':
        return <AdminBookingsLogementsPage onNavigate={onNavigate} />;
      case 'admin-bookings-experiences-services':
        return <AdminBookingsExperiencesServicesPage onNavigate={onNavigate} />;
      case 'admin-payments': 
        return <AdminPaymentsPage onNavigate={onNavigate} />;
      case 'admin-host-payments': 
        return <AdminHostPaymentsPage onNavigate={onNavigate} />;
      case 'admin-messages': 
        return <AdminMessagesPage onNavigate={onNavigate} />;
      case 'admin-reports': 
        return <AdminReportsPage onNavigate={onNavigate} />;
      default: 
        return <AdminDashboardPage onNavigate={onNavigate} />;
    }
  };

  return (
    <div className={`flex h-screen ${isDark ? 'bg-slate-900' : 'bg-gray-100'} transition-colors duration-300 overflow-hidden`}>
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <AdminHeader />
        <main className={`flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 ${isDark ? 'bg-slate-900' : 'bg-gray-100'} transition-colors duration-300`}>
          {renderAdminPage()}
        </main>
      </div>
    </div>
  );
}

function AdminLayoutWrapper({
  currentPage,
  onNavigate,
}: {
  currentPage: Page;
  onNavigate: (to: Route | string) => void;
}) {
  return (
    <ThemeProvider>
      <AdminLayoutContent currentPage={currentPage} onNavigate={onNavigate} />
    </ThemeProvider>
  );
}

// ============================================
// COMPOSANT CONTENU PRINCIPAL
// ============================================
function AppContent() {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.pathname + window.location.search));
  const [mobileNavActive, setMobileNavActive] = useState<'explore' | 'favorites' | 'trips' | 'messages' | 'profile'>(
    tabFromPage(route.name)
  );
  const [isBookingSheetOpen, setIsBookingSheetOpen] = useState(false);
  const { user, isAuthenticated, loading, refreshUser } = useAuth();
  const routerNavigate = useRouterNavigate();
  const location = useLocation();

  useEffect(() => {
    const nextRoute = parseRoute(location.pathname + location.search);
    setRoute(nextRoute);
  }, [location.pathname, location.search]);

  // ============================================
  // ✅ FONCTION DE NAVIGATION CENTRALISÉE
  // ============================================
  const navigate = (to: Route | string, params?: any) => {
    let routeObject: Route;
    
    if (typeof to === 'string') {
      routeObject = { name: to as Page };
    } else {
      routeObject = to;
    }
    
    if (params) {
      routeObject.params = params;
    }
    
    console.log('🔍 Navigation appelée avec:', routeObject);
    
    if (!routeObject.name) {
      console.error('❌ Route invalide:', routeObject);
      routeObject = { name: 'home' };
    }
    
    setRoute(routeObject);
    const path = routeToPath(routeObject);
    const current = window.location.pathname + window.location.search;
    if (current !== path) {
      window.history.pushState({}, '', path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.dispatchEvent(new Event('authChange'));
  };

  // ============================================
  // ✅ EXPOSER LA FONCTION NAVIGATE GLOBALEMENT
  // ============================================
  useEffect(() => {
    (window as any).navigate = navigate;
    console.log('✅ Fonction navigate exposée globalement');
    
    return () => {
      delete (window as any).navigate;
    };
  }, [navigate]);

  // ============================================
  // GESTION DU POPSTATE
  // ============================================
  useEffect(() => {
    const onPop = () => {
      const newRoute = parseRoute(window.location.pathname + window.location.search);
      console.log('🔍 Popstate détecté, nouvelle route:', newRoute);
      setRoute(newRoute);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    setMobileNavActive(tabFromPage(route.name));
  }, [route.name]);

  useEffect(() => {
    if (!route.name.startsWith('admin-')) {
      document.documentElement.classList.remove('dark');
    }
  }, [route.name]);

  // ============================================
  // ✅ NETTOYER session_expired APRÈS AUTH
  // ============================================
  useEffect(() => {
    if (isAuthenticated && location.search.includes('session_expired=true')) {
      console.log('✅ Session rétablie, nettoyage des paramètres...');
      
      const searchParams = new URLSearchParams(location.search);
      searchParams.delete('session_expired');
      
      const redirect = searchParams.get('redirect');
      const newSearch = searchParams.toString();
      
      const newPath = location.pathname + (newSearch ? `?${newSearch}` : '');
      window.history.replaceState({}, '', newPath);
      
      if (redirect === 'payment') {
        const paymentDataStr = sessionStorage.getItem('fedapay_booking_data') || 
                               localStorage.getItem('fedapay_booking_data');
        
        if (paymentDataStr) {
          try {
            const bookingData = JSON.parse(paymentDataStr);
            console.log('📦 Redirection vers paiement avec données:', bookingData);
            
            setTimeout(() => {
              navigate({ 
                name: 'fedapay-payment'
              }, { bookingData });
            }, 100);
            
            sessionStorage.removeItem('fedapay_booking_data');
            return;
          } catch (e) {
            console.error('❌ Erreur parsing données de paiement:', e);
          }
        }
      }
      
      if (redirect === 'booking') {
        const propertyId = localStorage.getItem('redirect_property_id');
        if (propertyId) {
          navigate({ name: 'booking', id: propertyId });
          localStorage.removeItem('redirect_property_id');
        }
      }
    }
  }, [isAuthenticated, location, navigate]);

  // ============================================
  // ÉCOUTER LES CHANGEMENTS D'AUTHENTIFICATION
  // ============================================
  useEffect(() => {
    const handleAuthChange = () => {
      console.log('🔄 Changement d\'authentification détecté');
      const currentRoute = parseRoute(window.location.pathname + window.location.search);
      
      if (currentRoute.name.startsWith('admin-') && currentRoute.name !== 'admin-login') {
        if (!isAuthenticated || user?.user_type !== 'admin') {
          console.log('🚫 Accès admin non autorisé, redirection vers home');
          navigate({ name: 'home' });
        }
      }
    };
    
    window.addEventListener('authChange', handleAuthChange);
    return () => window.removeEventListener('authChange', handleAuthChange);
  }, [isAuthenticated, user]);

  // ============================================
  // ÉCOUTER LES DONNÉES DE RÉSERVATION TEMPORAIRE
  // ============================================
  useEffect(() => {
    const handleBookingData = (event: CustomEvent) => {
      const data = event.detail;
      console.log('📦 Événement booking-data-available reçu:', data);
      
      if (data && data.propertyId) {
        const params = new URLSearchParams({
          check_in: data.checkIn,
          check_out: data.checkOut,
          guests: data.guests.toString(),
          nights: data.nights.toString()
        });
        
        navigate({ 
          name: 'booking', 
          id: data.propertyId.toString(),
          search: params.toString()
        });
      }
    };
    
    window.addEventListener('booking-data-available', handleBookingData as EventListener);
    return () => {
      window.removeEventListener('booking-data-available', handleBookingData as EventListener);
    };
  }, [navigate]);

  // ============================================
  // ✅ VÉRIFIER LES INTENTIONS DE PAIEMENT
  // ============================================
  useEffect(() => {
    const paymentIntent = sessionStorage.getItem('payment_intent');
    if (paymentIntent && isAuthenticated) {
      console.log('💳 Intention de paiement détectée:', paymentIntent);
      
      try {
        const bookingData = JSON.parse(paymentIntent);
        navigate({ name: 'fedapay-payment' }, { bookingData });
        sessionStorage.removeItem('payment_intent');
      } catch (e) {
        console.error('❌ Erreur parsing payment_intent:', e);
      }
    }
  }, [isAuthenticated, navigate]);

  // ============================================
  // VÉRIFIER LES INTENTIONS DE CHAT
  // ============================================
  useEffect(() => {
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    
    if (currentPath.includes('/messages/inquiry') && !isAuthenticated && !loading) {
      console.log('🔗 Accès direct à /messages/inquiry sans auth, sauvegarde intention');
      
      const urlParams = new URLSearchParams(currentSearch);
      const propertyId = urlParams.get('property');
      
      if (propertyId) {
        localStorage.setItem('redirect_intent', 'chat');
        localStorage.setItem('redirect_property_id', propertyId);
        localStorage.setItem('pendingChatParams', currentSearch.substring(1));
        localStorage.setItem('chatIntent', JSON.stringify({
          propertyId: propertyId,
          checkIn: urlParams.get('check_in'),
          checkOut: urlParams.get('check_out'),
          guests: urlParams.get('guests'),
          timestamp: Date.now()
        }));
      }
      
      navigate({ name: 'auth', search: `redirect=chat&property=${propertyId}` });
    }
  }, [window.location.pathname, window.location.search, isAuthenticated, loading]);

  // ============================================
  // NAVIGATION MOBILE
  // ============================================
  const handleMobileNavigate = (tab: Tab | { name: string; id?: string }) => {
    if (typeof tab === 'object') {
      navigate(tab);
      return;
    }
    
    const routeObj = routeFromTab(tab);
    navigate(routeObj);
    if (tab !== 'auth') setMobileNavActive(tab);
  };

  // ============================================
  // VÉRIFICATION DES ROUTES AUTORISÉES
  // ============================================
  const isRouteAllowed = (route: Route): boolean => {
    if (route.name === 'messages') {
      return true;
    }
    
    const protectedRoutes: Page[] = [
      'account', 'account-reservations', 'host-dashboard', 'host-annonces',
      'host-calendrier', 'host-reservations', 'host-messages', 'favorites', 'publish',
      'host-experience-dashboard', 'host-experiences-list', 'host-experience-calendar',
      'host-experience-reservations', 'host-service-dashboard'
    ];
    
    if (protectedRoutes.includes(route.name)) {
      return isAuthenticated;
    }
    
    if (route.name.startsWith('host-') && route.name !== 'host-dashboard') {
      return isAuthenticated && (user?.user_type === 'hote' || user?.user_type === 'admin');
    }
    
    if (route.name.startsWith('admin-') && route.name !== 'admin-login') {
      return isAuthenticated && user?.user_type === 'admin';
    }
    
    return true;
  };

  // ============================================
  // ÉCRAN DE CHARGEMENT
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f4fffe] to-[#e8fffb]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#00c9a7] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement de votre session...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // CAS SPÉCIAL : MESSAGES SANS AUTH
  // ============================================
  if (route.name === 'messages' && !isAuthenticated) {
    console.log('💬 Messages sans auth, redirection vers login avec intention');
    
    const params = route.search || '';
    const urlParams = new URLSearchParams(params);
    const propertyId = urlParams.get('property');
    
    if (propertyId) {
      localStorage.setItem('redirect_intent', 'chat');
      localStorage.setItem('redirect_property_id', propertyId);
      localStorage.setItem('pendingChatParams', params);
      localStorage.setItem('chatIntent', JSON.stringify({
        propertyId: propertyId,
        checkIn: urlParams.get('check_in'),
        checkOut: urlParams.get('check_out'),
        guests: urlParams.get('guests'),
        timestamp: Date.now()
      }));
    }
    
    return <AuthPage onNavigate={navigate} />;
  }

  // ============================================
  // VÉRIFICATION DES ROUTES
  // ============================================
  if (!isRouteAllowed(route)) {
    console.log('🚫 Route non autorisée, redirection vers home');
    navigate({ name: 'home' });
    return null;
  }

  // ============================================
  // PAGE DE LOGIN ADMIN
  // ============================================
  if (route.name === 'admin-login') {
    return <AdminLoginPage onNavigate={navigate} />;
  }

  // ============================================
  // ROUTES ADMIN PROTÉGÉES
  // ============================================
  if (route.name.startsWith('admin-') && user?.user_type === 'admin') {
    return <AdminLayoutWrapper currentPage={route.name} onNavigate={navigate} />;
  }

  // ============================================
  // ROUTES PUBLIQUES ET PROTÉGÉES CLASSIQUES
  // ============================================
  const showNavbar = route.name !== 'home' && route.name !== 'listing' && route.name !== 'booking';
  const showFooter = route.name !== 'listing' && route.name !== 'booking';
  const showMobileBottomNav = route.name !== 'listing' && route.name !== 'booking';

  // Certaines pages (home, listing) définissent leurs propres balises Seo plus
  // précises ; pour toutes les autres, ce Seo par défaut évite de se retrouver
  // sans aucune balise meta/OG (voir plan-correction-totale.md).
  const hasOwnSeo = route.name === 'home' || route.name === 'listing';

  return (
    <div className="min-h-screen bg-white">
      {!hasOwnSeo && (
        <Seo
          title="Bluefin Immo — Location de logements vérifiés au Bénin"
          description="Réservez des logements, expériences et services vérifiés partout au Bénin. Paiement sécurisé par Mobile Money (MTN, Moov, Orange)."
          path={routeToPath(route)}
        />
      )}
      {showNavbar && (
        <Navbar
          onOpenSearch={() => navigate({ name: 'search-logements' })}
          onGoHome={() => navigate({ name: 'home' })}
          onNavigate={navigate}
          currentPage={route.name}
        />
      )}

      <WhatsAppButton />

      {/* Routes principales */}
      {route.name === 'home' && <HomePage onNavigate={navigate} />}
      {route.name === 'search-logements' && <SearchPage mode="logements" onNavigate={navigate} />}
      {route.name === 'search-hotels' && <SearchPage mode="hotels" onNavigate={navigate} />}
      {route.name === 'listing' && <ListingPage onNavigate={navigate} id={route.id} />}
      {route.name === 'booking' && (
        <BookingPage 
          onNavigate={navigate} 
          id={route.id} 
          search={route.search}
        />
      )}
      {route.name === 'confirmation' && <ConfirmationPage id={route.id!} onNavigate={navigate} />}
      {route.name === 'profile' && <ProfilePage onNavigate={navigate} />}
      {route.name === 'account' && <AccountPage onNavigate={navigate} />}
      {route.name === 'account-reservations' && <AccountReservationsPage onNavigate={navigate} />}
      {route.name === 'host-dashboard' && <HostDashboardPage onNavigate={navigate} />}
      
      {/* ✅ ROUTES EXPÉRIENCES - AJOUTÉES */}
      {route.name === 'host-experience-dashboard' && <HostExperienceDashboardPage onNavigate={navigate} />}
      {route.name === 'host-experiences-list' && <HostExperienceListPage onNavigate={navigate} />}
      {route.name === 'host-experience-calendar' && <HostExperienceCalendarPage onNavigate={navigate} />}
      {route.name === 'host-experience-reservations' && <HostExperienceReservationsPage onNavigate={navigate} />}
      {route.name === 'host-experience-messages' && <HostExperienceMessagesPage onNavigate={navigate} id={route.id} />}
     {route.name === 'experience-booking' && (
  <ExperienceBookingPage 
    onNavigate={navigate} 
    id={route.id} 
    search={route.search} 
  />
)}

{route.name === 'host-service-dashboard' && <HostServiceDashboardPage onNavigate={navigate} />}
{route.name === 'host-service-list' && <HostServiceListPage onNavigate={navigate} />}
{route.name === 'host-service-calendar' && <HostServiceCalendarPage onNavigate={navigate} />}
{route.name === 'host-service-reservations' && <HostServiceReservationsPage onNavigate={navigate} />}
{route.name === 'host-service-messages' && <HostServiceMessagesPage onNavigate={navigate} id={route.id} />}
{route.name === 'service-booking' && (
  <ServiceBookingPage 
    onNavigate={navigate} 
    id={route.id} 
    search={route.search} 
  />
)}


      
    
      {route.name === 'host-annonces' && <HostListingsPage onNavigate={navigate} />}
      {route.name === 'host-calendrier' && <HostCalendarPage onNavigate={navigate} id={route.id} />}
      {route.name === 'host-reservations' && <HostReservationsPage onNavigate={navigate} />}
      {route.name === 'messages' && <MessagesPage onNavigate={navigate} id={route.id} search={route.search} />}
      {route.name === 'host-messages' && <HostMessagesPage onNavigate={navigate} id={route.id} />}
      {route.name === 'favorites' && <FavoritesPage onNavigate={navigate} />}
      {route.name === 'publish' && <PublishListingPage onNavigate={navigate} />}
      {route.name === 'help' && <HelpPage onNavigate={navigate} />}
      {route.name === 'about' && <AboutPage onNavigate={navigate} />}
      {route.name === 'blog' && <BlogPage onNavigate={navigate} />}
      {route.name === 'terms' && <TermsPage type={route.type} onNavigate={navigate} />}
      {route.name === 'cgu' && <CguPage onNavigate={navigate} />}
      {route.name === 'popular' && <AllPropertiesPage onNavigate={navigate} />}
      {route.name === 'hotels' && <HotelsPage onNavigate={navigate} />}
      {route.name === 'city' && <CityPage city={route.city!} onNavigate={navigate} />}
      {route.name === 'experience' && <ExperiencePage onNavigate={navigate} />}
      {route.name === 'services' && <ServicesPage onNavigate={navigate} />}
      {route.name === 'become-host' && <BecomeHost onNavigate={navigate} />}
      {route.name === 'auth' && <AuthPage onNavigate={navigate} search={route.search} />}
      {route.name === 'site-functioning' && <SiteFunctioningPage onNavigate={navigate} />}
      {route.name === 'company-info' && <CompanyInfoPage onNavigate={navigate} />}
      {route.name === 'not-found' && <NotFoundPage onNavigate={navigate} />}
      {route.name === 'booking-summary' && <BookingSummaryPage onNavigate={navigate} id={route.id} search={route.search} />}



      {/* Routes Fedapay */}
      {route.name === 'fedapay-payment' && (
        <FedapayPaymentPage 
          onNavigate={navigate} 
          bookingData={route.params?.bookingData}
        />
      )}
      {route.name === 'fedapay-callback' && (
        <FedapayCallbackPage 
          onNavigate={navigate}
          transactionId={route.params?.transactionId}
          status={route.params?.status}
          bookingId={route.params?.bookingId}
        />
      )}

      {showFooter && <Footer onNavigate={navigate} />}
      {showMobileBottomNav && (
        <div className="lg:hidden">
          <MobileBottomNav active={mobileNavActive} onNavigate={handleMobileNavigate} />
        </div>
      )}
      <MobileBookingSheet isOpen={isBookingSheetOpen} onClose={() => setIsBookingSheetOpen(false)} propertyId={0} pricePerNight={0} />
      <Toaster position="top-right" />
    </div>
  );
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ThemeProvider>
              <AppContent />
            </ThemeProvider>
          </AuthProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}