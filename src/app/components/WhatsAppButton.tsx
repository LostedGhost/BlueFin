// WhatsAppButton.tsx
import { MessageCircle } from 'lucide-react';

export function WhatsAppButton() {
  const phoneNumber = "22901020304";
  const message = "Bonjour, je souhaite obtenir plus d'informations sur vos services immobiliers.";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed z-[100] transition-all duration-300 hover:scale-110
                 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14
                 bottom-20 sm:bottom-5 md:bottom-6
                 right-3 sm:right-5 md:right-6
                 bg-[#25D366] rounded-full 
                 flex items-center justify-center
                 shadow-md hover:shadow-xl
                 group"
    >
      <MessageCircle 
        className="text-white w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7
                   transition-all duration-300
                   group-hover:scale-110"
      />
      
      {/* Tooltip au survol (desktop seulement) */}
      <span className="hidden md:block absolute right-full mr-3 bg-gray-900 text-white 
                     text-sm px-4 py-2 rounded-lg opacity-0 
                     group-hover:opacity-100 transition-all duration-300
                     whitespace-nowrap pointer-events-none
                     shadow-lg font-medium">
        💬 Besoin d'aide ? Contactez-nous
      </span>
    </a>
  );
}