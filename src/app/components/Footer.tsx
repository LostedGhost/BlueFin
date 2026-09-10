// src/app/components/Footer.tsx
import { useState } from 'react';
import { Facebook, Instagram, MessageCircle, Globe, ChevronRight, MapPin, Phone, Mail, Clock, Building, HelpCircle, FileText, Users, Shield, CreditCard } from 'lucide-react';
import type { Route } from '../router';
import { CONTACT_INFO } from '../config/legalInfo';

interface FooterProps {
  onNavigate?: (route: Route) => void;
}

// Destinations pour le footer
const footerFilters = ['Cotonou', 'Porto-Novo', 'Abomey-Calavi', 'Parakou', 'Ouidah', 'Grand-Popo', 'Abomey', 'Dassa-Zoumè'];

const footerDestinations: Record<string, string[]> = {
  'Cotonou': ['Haie Vive', 'Fidjrossè', 'Akpakpa', 'Menontin', 'Ganhi', 'Cocotiers', 'Patte d\'Oie', 'Cadjèhoun'],
  'Porto-Novo': ['Centre-ville', 'Djassin', 'Ouando', 'Ajara', 'Houéyiho', 'Porto-Novo plage'],
  'Abomey-Calavi': ['Calavi centre', 'Kpankpan', 'Togba', 'Blaise Pascal', 'Carrefour Akpakpa'],
  'Parakou': ['Centre ville', 'Wansoun', 'Gogounou', 'Tchatchou', 'Banignangui'],
  'Ouidah': ['Plage de Ouidah', 'Centre historique', 'Route des Esclaves', 'Temple des Pythons'],
  'Grand-Popo': ['Plage de Grand-Popo', 'Bouches du Roy', 'Agoué', 'Ganthier'],
  'Abomey': ['Palais Royaux', 'Zoungou', 'Tokpota', 'Djégbé'],
  'Dassa-Zoumè': ['Centre-ville', 'Collines de Dassa', 'Stade de Dassa', 'Marché central']
};

export function Footer({ onNavigate }: FooterProps) {
  const [selectedFilter, setSelectedFilter] = useState('Cotonou');
  const [showAllDestinations, setShowAllDestinations] = useState(false);
  const currentYear = new Date().getFullYear();

  const handleNavigation = (name: string, type?: 'privacy' | 'cgu') => {
    if (type) {
      onNavigate?.({ name: 'terms', type });
    } else {
      onNavigate?.({ name: name as any });
    }
  };

  const handleCityClick = (city: string) => {
    onNavigate?.({ name: 'city', city });
  };

  return (
    <footer className="bg-slate-950 text-slate-100 mt-16 pb-20 lg:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        
        {/* Section principale avec grid responsive et alignement vertical */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-6 border-t border-slate-800 pt-8 sm:pt-12 pb-6 sm:pb-8">
          
          {/* COLONNE 1 - Assistance (3 colonnes sur 12) */}
          <div className="lg:col-span-3 flex flex-col">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2 text-base">
              <Building className="w-4 h-4 text-[#00C9A7]" />
              Assistance
            </h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li>
                <button onClick={() => handleNavigation('about')} className="hover:text-[#00C9A7] transition-colors duration-300 flex items-center gap-1 group">
                  <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
                  <span className="group-hover:translate-x-1 transition-transform duration-300">À propos de nous</span>
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation('blog')} className="hover:text-[#00C9A7] transition-colors duration-300 flex items-center gap-1 group">
                  <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Blog & Actualités</span>
                </button>
              </li>
            </ul>
          </div>

          {/* COLONNE 2 - Espace hôte (4 colonnes sur 12) */}
          <div className="lg:col-span-4 flex flex-col">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2 text-base">
              <Users className="w-4 h-4 text-[#00C9A7]" />
              Devenir hôte
            </h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li>
                <button onClick={() => handleNavigation('publish')} className="hover:text-[#00C9A7] transition-colors duration-300 flex items-center gap-1 group">
                  <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Mettez votre logement sur Bluefin Immo</span>
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation('experience')} className="hover:text-[#00C9A7] transition-colors duration-300 flex items-center gap-1 group">
                  <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Proposez une expérience</span>
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation('services')} className="hover:text-[#00C9A7] transition-colors duration-300 flex items-center gap-1 group">
                  <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Proposez un service</span>
                </button>
              </li>
            </ul>
          </div>

          {/* COLONNE 3 - Contact (3 colonnes sur 12) */}
          <div className="lg:col-span-3 flex flex-col">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2 text-base">
              <Mail className="w-4 h-4 text-[#00C9A7]" />
              Contact
            </h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 text-[#00C9A7] flex-shrink-0" />
                <span>Cotonou, Bénin</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#00C9A7] flex-shrink-0" />
                <span>{CONTACT_INFO.phone}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#00C9A7] flex-shrink-0" />
                <span className="break-all">{CONTACT_INFO.email}</span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 mt-0.5 text-[#00C9A7] flex-shrink-0" />
                <span>Lun - Ven : 9h - 18h</span>
              </li>
            </ul>
          </div>

          {/* COLONNE 4 - Aide (2 colonnes sur 12 - poussée à droite) */}
          <div className="lg:col-span-2 lg:col-start-11 flex flex-col">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2 text-base">
              <HelpCircle className="w-4 h-4 text-[#00C9A7]" />
              Aide
            </h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li>
                <button onClick={() => handleNavigation('help')} className="hover:text-[#00C9A7] transition-colors duration-300 flex items-center gap-1 group">
                  <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Centre d'aide</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright et bas de page */}
        <div className="border-t border-slate-800 pt-6 sm:pt-8 mt-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2 order-1 lg:order-1">
              <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shrink-0">
                <div className="w-5 h-5 border-2 border-[#00C9A7] rounded relative">
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#00C9A7] rounded transform rotate-45"></div>
                </div>
              </div>
              <div className="text-white text-sm font-bold">Bluefin-Immo</div>
            </div>

            {/* Liens légaux */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs order-3 lg:order-2">
              <button onClick={() => handleNavigation('terms', 'privacy')} className="text-slate-400 hover:text-[#00C9A7] transition whitespace-nowrap">
                Confidentialité
              </button>
              <span className="text-slate-600">|</span>
              <button onClick={() => handleNavigation('cgu')} className="text-slate-400 hover:text-[#00C9A7] transition whitespace-nowrap">
                CGU
              </button>
              <span className="text-slate-600">|</span>
              <button onClick={() => handleNavigation('site-functioning')} className="text-slate-400 hover:text-[#00C9A7] transition whitespace-nowrap">
                Fonctionnement
              </button>
            </div>

            {/* Réseaux sociaux + Copyright */}
            <div className="flex items-center gap-3 order-2 lg:order-3">
              <div className="flex items-center gap-2">
                <a href="#" className="text-slate-400 hover:text-[#00C9A7] transition">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="#" className="text-slate-400 hover:text-[#00C9A7] transition">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="#" className="text-slate-400 hover:text-[#00C9A7] transition">
                  <MessageCircle className="w-4 h-4" />
                </a>
              </div>
              <div className="text-xs text-slate-500 whitespace-nowrap">
                © {currentYear}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}