import React from 'react';
import { WhatsAppButton } from '../components/WhatsAppButton';

interface PageProps {
  onNavigate?: (page: { name: string }) => void;
  children: React.ReactNode;
  currentPage?: string;
}

export function Layout({ onNavigate, children, currentPage }: PageProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* NAVBAR
      <nav className="bg-[#0F2940] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); onNavigate?.({ name: 'home' }); }}
          className="text-lg font-semibold text-white tracking-wide"
        >
          BLUEFIN <span className="text-[#00C9A7]">IMMO</span>
        </a>
        <div className="hidden md:flex gap-6">
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); onNavigate?.({ name: 'listings' }); }}
            className={`text-sm transition-colors duration-300 relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-[#00C9A7] after:transition-all after:duration-300 hover:after:w-full hover:text-white ${
              currentPage === 'listings' ? 'text-[#00C9A7] after:w-full' : 'text-white/50'
            }`}
          >
            Logements
          </a>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); onNavigate?.({ name: 'about' }); }}
            className={`text-sm transition-colors duration-300 relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-[#00C9A7] after:transition-all after:duration-300 hover:after:w-full hover:text-white ${
              currentPage === 'about' ? 'text-[#00C9A7] after:w-full' : 'text-white/50'
            }`}
          >
            À propos
          </a>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); onNavigate?.({ name: 'contact' }); }}
            className={`text-sm transition-colors duration-300 relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-[#00C9A7] after:transition-all after:duration-300 hover:after:w-full hover:text-white ${
              currentPage === 'contact' ? 'text-[#00C9A7] after:w-full' : 'text-white/50'
            }`}
          >
            Contact
          </a>
        </div>
        <button 
          onClick={() => onNavigate?.({ name: 'listings' })}
          className="bg-[#00C9A7] text-[#0F2940] border-none rounded-md px-5 py-2 text-sm font-medium cursor-pointer transition-all duration-300 hover:opacity-90 hover:scale-[1.02] hover:shadow-[0_4px_12px_rgba(0,201,167,0.3)]"
        >
          Voir les logements →
        </button>
      </nav> */}

      {/* CONTENU PRINCIPAL */}
      <main className="flex-1">
        {children}
      </main>

      {/* FOOTER
      <footer className="bg-[#0F2940] py-6 px-8 text-center">
        <p className="text-xs text-white/30">
          © 2025 Bluefin Immo · Tous droits réservés ·{' '}
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); onNavigate?.({ name: 'contact' }); }}
            className="text-[#00C9A7] no-underline transition-opacity duration-300 hover:opacity-80"
          >
            contact@bluefinimmo.bj
          </a>
        </p>
      </footer> */}
    </div>
  );
}