import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { 
  Star, Bed, Bath, Heart, Filter, ChevronDown, ArrowLeft, 
  Share2, Sparkles, Award, Crown, Key, MapPin, Check, X, 
  Calendar, Smartphone, CreditCard, Phone
} from "lucide-react";
import type { Route } from '../router';

// ==================== TYPES ====================
type PopularProperty = {
  id: number;
  title: string;
  location: string;
  city: string;
  country: string;
  price: string;
  priceNumber: number;
  rating: number;
  reviews: number;
  image: string;
  images?: string[];
  beds: number;
  baths: number;
  bedrooms: number;
  guests: number;
  description: string;
  longDescription?: string;
  host: string;
  hostImage: string;
  hostSince: string;
  superhost: boolean;
  responseRate: number;
  responseTime: string;
  amenities: string[];
  unavailableAmenities?: string[];
  checkInTime: string;
  checkOutTime: string;
  selfCheckIn: boolean;
  neighborhood?: string;
  walkScore?: string;
  testimonials?: { name: string; date: string; text: string; rating: number; avatar?: string }[];
};

// Fonction pour garantir au moins 3 témoignages
const ensureThreeTestimonials = (property: PopularProperty): { name: string; date: string; text: string; rating: number }[] => {
  const existing = property.testimonials || [];
  if (existing.length >= 3) return existing;
  const defaultTestimonials = [
    { name: "Voyageur", date: "récemment", text: "Séjour incroyable, tout était parfait !", rating: 5 },
    { name: "Visiteur", date: "il y a 1 mois", text: "Très bonne expérience, logement fidèle aux photos.", rating: 4.8 }
  ];
  const needed = 3 - existing.length;
  const extra = defaultTestimonials.slice(0, needed);
  return [...existing, ...extra];
};

// ==================== DONNÉES : LOGEMENTS POPULAIRES ====================
const popularProperties: PopularProperty[] = [
  { 
    id: 1, title: "Villa luxueuse avec piscine", location: "Fidjrossè, Cotonou, Bénin", city: "Fidjrossè", country: "Bénin",
    price: "125 000 FCFA / nuit", priceNumber: 125000, rating: 4.9, reviews: 128,
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80",
    images: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80","https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80","https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80","https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80"],
    beds: 4, baths: 3, bedrooms: 4, guests: 8,
    description: "Magnifique villa avec piscine privée, jardin tropical et vue imprenable.",
    longDescription: "Villa de standing avec grande piscine, terrasse aménagée et personnel sur demande. Idéal pour les familles ou les groupes d'amis.",
    host: "Sophie", hostImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
    hostSince: "2 ans", superhost: true, responseRate: 98, responseTime: "dans l'heure",
    amenities: ["Piscine", "Wifi", "Climatisation", "Cuisine équipée", "Parking gratuit", "Jardin", "Terrasse", "Personnel"],
    checkInTime: "15:00", checkOutTime: "11:00", selfCheckIn: true,
    testimonials: [
      { name: "Marc", date: "mars 2026", text: "Villa incroyable, piscine magnifique. Le personnel est aux petits soins.", rating: 5 },
      { name: "Sophie", date: "février 2026", text: "Un séjour de rêve, le jardin est splendide. Je recommande vivement !", rating: 4.9 },
      { name: "Jean", date: "janvier 2026", text: "Très belle villa, conforme aux photos. Parfait pour des vacances en famille.", rating: 4.8 }
    ]
  },
  { 
    id: 2, title: "Appartement moderne vue mer", location: "Haie Vive, Cotonou, Bénin", city: "Cotonou", country: "Bénin",
    price: "85 000 FCFA / nuit", priceNumber: 85000, rating: 4.8, reviews: 94,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80",
    images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80","https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80","https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80"],
    beds: 2, baths: 2, bedrooms: 2, guests: 4,
    description: "Appartement chic avec vue sur l'océan, terrasse privée.",
    longDescription: "Appartement entièrement rénové avec vue imprenable sur l'océan. Terrasse privée parfaite pour les apéros au coucher du soleil.",
    host: "Jean-Marc", hostImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    hostSince: "1 an", superhost: true, responseRate: 95, responseTime: "dans l'heure",
    amenities: ["Vue mer", "Terrasse", "Wifi", "Climatisation", "Cuisine", "TV", "Parking"],
    checkInTime: "14:00", checkOutTime: "11:00", selfCheckIn: false,
    testimonials: [
      { name: "Fatou", date: "avril 2026", text: "Superbe vue, appartement très propre. La terrasse est un vrai plus.", rating: 5 },
      { name: "Lamine", date: "mars 2026", text: "Terrasse agréable, bien situé près des commerces.", rating: 4.7 },
      { name: "Claire", date: "février 2026", text: "Je recommande, tout était parfait. Excellente communication avec l'hôte.", rating: 4.9 }
    ]
  },
  { 
    id: 3, title: "Studio cosy centre ville", location: "Cocotiers, Cotonou, Bénin", city: "Cotonou", country: "Bénin",
    price: "35 000 FCFA / nuit", priceNumber: 35000, rating: 4.7, reviews: 56,
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
    images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80","https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80"],
    beds: 1, baths: 1, bedrooms: 1, guests: 2,
    description: "Studio confortable en plein cœur de Cotonou.",
    longDescription: "Petit studio fonctionnel et bien situé, à proximité des commerces et restaurants. Idéal pour un court séjour.",
    host: "Marie", hostImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
    hostSince: "3 ans", superhost: false, responseRate: 92, responseTime: "quelques heures",
    amenities: ["Wifi", "Climatisation", "Mini-réfrigérateur", "TV", "Bureau"],
    checkInTime: "12:00", checkOutTime: "10:00", selfCheckIn: true,
    testimonials: [
      { name: "Ali", date: "mai 2026", text: "Studio propre et bien situé, parfait pour une nuit.", rating: 4.5 },
      { name: "Fatima", date: "avril 2026", text: "Bon rapport qualité-prix, je reviendrai.", rating: 4.3 },
      { name: "Kevin", date: "mars 2026", text: "Idéal pour un séjour pro, le wifi fonctionne bien.", rating: 4.6 }
    ]
  },
  { 
    id: 4, title: "Loft design avec rooftop", location: "Ganhi, Cotonou, Bénin", city: "Cotonou", country: "Bénin",
    price: "95 000 FCFA / nuit", priceNumber: 95000, rating: 4.9, reviews: 42,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80",
    images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80","https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80"],
    beds: 2, baths: 2, bedrooms: 2, guests: 4,
    description: "Loft lumineux avec terrasse privée sur le toit.",
    longDescription: "Loft design avec matériaux nobles, grande terrasse rooftop avec vue sur la ville. Parfait pour les couples ou petits groupes.",
    host: "Alex", hostImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
    hostSince: "2 ans", superhost: true, responseRate: 97, responseTime: "dans l'heure",
    amenities: ["Rooftop", "Wifi", "Climatisation", "Cuisine équipée", "TV", "Machine à café"],
    checkInTime: "15:00", checkOutTime: "11:00", selfCheckIn: true,
    testimonials: [
      { name: "Emma", date: "avril 2026", text: "Le rooftop est incroyable, coucher de soleil magnifique.", rating: 5 },
      { name: "Lucas", date: "mars 2026", text: "Loft très bien décoré, emplacement calme.", rating: 4.8 },
      { name: "Sarah", date: "février 2026", text: "Séjour parfait, hôte très réactif.", rating: 4.9 }
    ]
  },
  { 
    id: 5, title: "Maison de ville traditionnelle", location: "Akpakpa, Cotonou, Bénin", city: "Akpakpa", country: "Bénin",
    price: "55 000 FCFA / nuit", priceNumber: 55000, rating: 4.6, reviews: 67,
    image: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80",
    images: ["https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80","https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80"],
    beds: 3, baths: 2, bedrooms: 3, guests: 6,
    description: "Maison authentique avec cour intérieure.",
    longDescription: "Maison de ville typique avec une belle cour intérieure, idéale pour découvrir la vie locale béninoise.",
    host: "Pascal", hostImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80",
    hostSince: "5 ans", superhost: true, responseRate: 96, responseTime: "dans l'heure",
    amenities: ["Cour intérieure", "Wifi", "Cuisine", "Parking", "Eau chaude"],
    checkInTime: "14:00", checkOutTime: "11:00", selfCheckIn: false,
    testimonials: [
      { name: "Abdoul", date: "mai 2026", text: "Maison typique, très propre. Expérience authentique.", rating: 4.8 },
      { name: "Isabelle", date: "avril 2026", text: "La cour est très agréable, bon rapport qualité-prix.", rating: 4.5 },
      { name: "Thomas", date: "mars 2026", text: "Hôte accueillant, maison bien située.", rating: 4.6 }
    ]
  },
  { 
    id: 6, title: "Duplex moderne", location: "Patte d'Oie, Cotonou, Bénin", city: "Cotonou", country: "Bénin",
    price: "110 000 FCFA / nuit", priceNumber: 110000, rating: 4.8, reviews: 33,
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80",
    images: ["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80","https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80"],
    beds: 3, baths: 3, bedrooms: 3, guests: 6,
    description: "Duplex contemporain avec grande terrasse.",
    longDescription: "Magnifique duplex moderne avec de grands espaces, terrasse aménagée et vue sur la ville.",
    host: "Catherine", hostImage: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&q=80",
    hostSince: "3 ans", superhost: true, responseRate: 99, responseTime: "dans l'heure",
    amenities: ["Terrasse", "Wifi", "Climatisation", "Cuisine", "Parking", "Ascenseur"],
    checkInTime: "15:00", checkOutTime: "12:00", selfCheckIn: true,
    testimonials: [
      { name: "Nicolas", date: "avril 2026", text: "Duplex spacieux, très bien équipé. La terrasse est un plus.", rating: 4.9 },
      { name: "Valérie", date: "mars 2026", text: "Séjour excellent, hôte très professionnelle.", rating: 4.7 },
      { name: "David", date: "février 2026", text: "Je recommande, très belle prestation.", rating: 4.8 }
    ]
  },
  { 
    id: 7, title: "Villa de charme", location: "Fidjrossè, Cotonou, Bénin", city: "Fidjrossè", country: "Bénin",
    price: "135 000 FCFA / nuit", priceNumber: 135000, rating: 4.9, reviews: 78,
    image: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=80",
    images: ["https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=80","https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80"],
    beds: 4, baths: 3, bedrooms: 4, guests: 8,
    description: "Villa raffinée avec piscine à débordement.",
    longDescription: "Villa de luxe avec piscine à débordement, jardin tropical et personnel à disposition. Idéal pour des vacances inoubliables.",
    host: "Isabelle", hostImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
    hostSince: "4 ans", superhost: true, responseRate: 100, responseTime: "dans l'heure",
    amenities: ["Piscine à débordement", "Jardin", "Personnel", "Wifi", "Parking", "Cuisine"],
    checkInTime: "15:00", checkOutTime: "11:00", selfCheckIn: false,
    testimonials: [
      { name: "Pierre", date: "mars 2026", text: "Villa exceptionnelle, piscine magnifique. Service parfait.", rating: 5 },
      { name: "Julie", date: "février 2026", text: "Un séjour de rêve, tout était parfait.", rating: 5 },
      { name: "Michel", date: "janvier 2026", text: "Très belle villa, conforme aux photos. Je recommande.", rating: 4.8 }
    ]
  },
  { 
    id: 8, title: "Studio design", location: "Haie Vive, Cotonou, Bénin", city: "Cotonou", country: "Bénin",
    price: "45 000 FCFA / nuit", priceNumber: 45000, rating: 4.7, reviews: 44,
    image: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=1200&q=80",
    images: ["https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=1200&q=80","https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80"],
    beds: 1, baths: 1, bedrooms: 1, guests: 2,
    description: "Studio moderne, entièrement équipé.",
    longDescription: "Studio design avec décoration soignée, entièrement équipé pour un séjour confortable.",
    host: "Julien", hostImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    hostSince: "1 an", superhost: false, responseRate: 90, responseTime: "quelques heures",
    amenities: ["Wifi", "Climatisation", "Cuisine", "TV", "Machine à café"],
    checkInTime: "14:00", checkOutTime: "10:00", selfCheckIn: true,
    testimonials: [
      { name: "Laura", date: "mai 2026", text: "Studio très bien agencé, décoration moderne.", rating: 4.6 },
      { name: "Mohamed", date: "avril 2026", text: "Propre et fonctionnel, bonne situation.", rating: 4.5 },
      { name: "Emma", date: "mars 2026", text: "Parfait pour un court séjour, je recommande.", rating: 4.7 }
    ]
  }
];

// Compléter les témoignages
for (const prop of popularProperties) {
  prop.testimonials = ensureThreeTestimonials(prop);
}

const filters = ["Tous", "Prix croissant", "Prix décroissant", "Mieux notés"];

// ==================== MODAL CHECKOUT ====================
const CheckoutModal = ({ property, checkIn, checkOut, guests, totalPrice, onClose }: any) => {
  const [paymentMethod, setPaymentMethod] = useState<"mtn" | "orange" | "card">("mtn");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Paiement de ${totalPrice.toLocaleString()} FCFA via ${
      paymentMethod === 'mtn' ? 'MTN Mobile Money' : paymentMethod === 'orange' ? 'Orange Money' : 'Carte bancaire'
    } accepté. Merci pour votre réservation !`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Confirmer et payer</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex flex-col lg:flex-row h-full overflow-y-auto">
          <div className="lg:w-3/5 p-6 space-y-6 border-r">
            <div>
              <h3 className="font-semibold text-lg mb-2">Choisissez quand vous souhaitez payer</h3>
              <div className="space-y-2">
                <div className="border rounded-lg p-3 border-[#00c9a7] bg-[#00c9a7]/5">
                  <div className="flex justify-between"><span className="font-medium">Payez {totalPrice.toLocaleString()} FCFA maintenant</span><span>✓</span></div>
                  <div className="text-xs text-gray-500">Paiement immédiat, non remboursable</div>
                </div>
                <div className="border rounded-lg p-3 border-gray-200 opacity-50 cursor-not-allowed">
                  <div className="flex justify-between"><span>Payer en 3 fois avec Klarna</span><span>Indisponible</span></div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Ajoutez un mode de paiement</h3>
              <div className="flex gap-3 flex-wrap mb-4">
                <button onClick={() => setPaymentMethod("mtn")} className={`flex items-center gap-2 px-4 py-2 rounded-full border ${paymentMethod === "mtn" ? "border-[#00c9a7] bg-[#00c9a7]/5" : "border-gray-300"}`}>
                  <Smartphone className="w-4 h-4"/> MTN Mobile Money
                </button>
                <button onClick={() => setPaymentMethod("orange")} className={`flex items-center gap-2 px-4 py-2 rounded-full border ${paymentMethod === "orange" ? "border-[#00c9a7] bg-[#00c9a7]/5" : "border-gray-300"}`}>
                  <Smartphone className="w-4 h-4"/> Orange Money
                </button>
                <button onClick={() => setPaymentMethod("card")} className={`flex items-center gap-2 px-4 py-2 rounded-full border ${paymentMethod === "card" ? "border-[#00c9a7] bg-[#00c9a7]/5" : "border-gray-300"}`}>
                  <CreditCard className="w-4 h-4"/> Carte bancaire
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                {(paymentMethod === "mtn" || paymentMethod === "orange") && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Numéro de téléphone</label>
                    <div className="flex items-center border rounded-lg p-2">
                      <Phone className="w-5 h-5 text-gray-400 mr-2" />
                      <input type="tel" placeholder="XX XX XX XX" className="flex-1 outline-none" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
                    </div>
                  </div>
                )}
                {paymentMethod === "card" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Numéro de carte</label>
                      <input type="text" placeholder="1234 5678 9012 3456" className="w-full border rounded-lg p-2" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label>Date d'expiration</label><input type="text" placeholder="MM/AA" className="w-full border rounded-lg p-2" value={expiry} onChange={(e) => setExpiry(e.target.value)} required /></div>
                      <div><label>CVV</label><input type="text" placeholder="123" className="w-full border rounded-lg p-2" value={cvv} onChange={(e) => setCvv(e.target.value)} required /></div>
                    </div>
                  </>
                )}
                <button type="submit" className="w-full bg-[#00c9a7] text-[#0F2940] py-3 rounded-lg font-semibold mt-4 hover:bg-[#00b892] transition-colors">Confirmer et payer</button>
              </form>
              <p className="text-xs text-gray-500 text-center mt-3">Vos informations sont sécurisées.</p>
            </div>
          </div>
          <div className="lg:w-2/5 bg-gray-50 p-6 space-y-4">
            <div className="flex gap-4">
              <img src={property.images?.[0] || property.image || '/placeholder.jpg'} alt={property.title} className="w-20 h-20 rounded-lg object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.jpg'; }} />
              <div>
                <h3 className="font-semibold">{property.title}</h3>
                <div className="flex items-center gap-1 text-sm"><Star className="w-4 h-4 fill-current text-[#00c9a7]"/>{property.rating} ({property.reviews} commentaires)</div>
                <div className="text-xs text-[#00c9a7] font-semibold mt-1">Coup de cœur voyageurs</div>
              </div>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between text-sm"><span>Dates</span><span className="font-medium">{checkIn} – {checkOut}</span></div>
              <div className="flex justify-between text-sm mt-2"><span>Voyageurs</span><span className="font-medium">{guests} adulte{guests > 1 ? 's' : ''}</span></div>
              <button className="text-[#00c9a7] text-sm mt-2 underline">Modifier</button>
            </div>
            <div className="border-t pt-3">
              <h4 className="font-semibold mb-2">Détail du prix</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>{property.priceNumber.toLocaleString()} FCFA x 2 nuits</span><span>{(property.priceNumber * 2).toLocaleString()} FCFA</span></div>
                <div className="flex justify-between"><span>Taxes</span><span>{(property.priceNumber * 2 * 0.1).toLocaleString()} FCFA</span></div>
                <div className="flex justify-between font-bold pt-2 border-t"><span>Total</span><span>{totalPrice.toLocaleString()} FCFA</span></div>
              </div>
            </div>
            <div className="bg-[#0F2940]/10 rounded-lg p-3 text-sm text-[#0F2940]">
              <p className="font-semibold">Perle rare !</p>
              <p>Les réservations pour ce logement sont fréquentes.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== MODAL DE DÉTAIL ====================
const PropertyDetailModal = ({ property, onClose, onReserve }: { property: PopularProperty; onClose: () => void; onReserve: () => void }) => {
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [checkIn, setCheckIn] = useState("15/05/2026");
  const [checkOut, setCheckOut] = useState("17/05/2026");
  const [guests, setGuests] = useState(1);
  const [selectedPriceOption, setSelectedPriceOption] = useState<"non-remboursable" | "remboursable">("non-remboursable");
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [animate, setAnimate] = useState(false);

  const images = property.images || [property.image];
  const nights = 2;
  const subtotal = property.priceNumber * nights;
  const cleaningFee = 15000;
  const serviceFee = 12000;
  const total = subtotal + cleaningFee + serviceFee;
  const nonRefundableTotal = total;
  const refundableTotal = total + 35000;

  const testimonials = property.testimonials || [];

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const interval = setInterval(() => {
      setAnimate(true);
      setTimeout(() => {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
        setAnimate(false);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="min-h-screen">
        <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex justify-between items-center">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-all hover:scale-110"><ArrowLeft className="w-5 h-5"/></button>
          <div className="flex gap-2">
            <button className="p-2 rounded-full hover:bg-gray-100 transition-all hover:scale-110"><Share2 className="w-5 h-5"/></button>
            <button className="p-2 rounded-full hover:bg-gray-100 transition-all hover:scale-110"><Heart className="w-5 h-5"/></button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="relative grid grid-cols-4 gap-2 rounded-2xl overflow-hidden mb-6 group">
            <div className="col-span-2 row-span-2 overflow-hidden">
              <img src={images[0]} className="w-full h-full object-cover min-h-[300px] transition-transform duration-700 group-hover:scale-105" />
            </div>
            {images.slice(1,5).map((img,i)=> (
              <div key={i} className="overflow-hidden">
                <img src={img} className="w-full h-36 object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
            ))}
            <button className="absolute bottom-4 right-4 bg-white rounded-lg px-4 py-2 text-sm font-medium shadow-md hover:shadow-lg transition-all hover:bg-gray-100">Afficher toutes les photos</button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="border-b pb-4">
                <div className="text-sm text-gray-500">Logement entier · {property.bedrooms} chambre · {property.beds} lits · {property.baths} salle de bain</div>
                <h1 className="text-3xl font-semibold text-[#0F2940] mt-2">{property.title}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <Star className="w-5 h-5 fill-current text-[#00c9a7]" />
                  <span className="font-medium">{property.rating}</span>
                  <span className="text-gray-500">· {property.reviews} commentaires</span>
                  <span className="text-gray-500">·</span>
                  <span className="text-[#00c9a7] font-medium">Superhôte</span>
                </div>
              </div>

              <div className="bg-[#00c9a7]/10 rounded-xl p-5 flex gap-4 items-center overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00c9a7]/20 rounded-full -mr-16 -mt-16 animate-pulse"></div>
                <Crown className="w-10 h-10 text-[#00c9a7] animate-bounce" />
                <div>
                  <div className="font-semibold text-lg text-[#0F2940]">Coup de cœur · voyageurs</div>
                  <div className="text-gray-600">Un des logements préférés des voyageurs</div>
                </div>
              </div>

              <div className="flex gap-5 items-start">
                <img
                  src={`https://ui-avatars.com/api/?background=00c9a7&color=fff&name=${encodeURIComponent(property.host || 'Hôte')}&bold=true&size=128`}
                  alt={property.host || 'Hôte'}
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#00c9a7] shadow-lg animate-pulse"
                />
                <div>
                  <div className="font-semibold text-xl text-[#0F2940]">Hôte : {property.host}</div>
                  <div className="flex items-center gap-1 text-[#00c9a7]"><Award className="w-4 h-4"/>Superhôte · {property.hostSince}</div>
                  <div className="text-sm text-gray-600">Taux de réponse {property.responseRate}% · Répond {property.responseTime}</div>
                </div>
              </div>

              <div><p className="text-gray-700 leading-relaxed">{property.description}</p>{property.longDescription && <p className="text-gray-700 mt-3 leading-relaxed">{property.longDescription}</p>}</div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-xl text-[#0F2940]">Équipements</h3>
                  <button onClick={()=>setShowAllAmenities(!showAllAmenities)} className="text-[#00c9a7] text-sm underline hover:no-underline">Voir tout</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {(showAllAmenities ? property.amenities : property.amenities.slice(0,6)).map((a,i)=>(
                    <div key={i} className="flex items-center gap-3 text-gray-700"><Check className="w-5 h-5 text-[#00c9a7]"/>{a}</div>
                  ))}
                </div>
              </div>

              {testimonials.length > 0 && (
                <div className="bg-gradient-to-r from-[#0F2940]/5 to-[#00c9a7]/5 rounded-2xl p-6 overflow-hidden">
                  <h3 className="font-semibold text-xl text-[#0F2940] mb-4 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-[#00c9a7] animate-pulse" />
                    Ce que nos clients disent
                  </h3>
                  <div className={`transition-all duration-300 transform ${animate ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      <div className="relative">
                        <img 
                          src={`https://ui-avatars.com/api/?background=00c9a7&color=fff&name=${testimonials[currentTestimonial].name.charAt(0)}`}
                          alt={testimonials[currentTestimonial].name}
                          className="w-20 h-20 rounded-full object-cover border-4 border-[#00c9a7] shadow-xl animate-spin-slow"
                        />
                        <div className="absolute -bottom-2 -right-2 bg-[#00c9a7] rounded-full p-1">
                          <Star className="w-4 h-4 fill-white text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <span className="font-bold text-lg text-[#0F2940]">{testimonials[currentTestimonial].name}</span>
                          <span className="text-sm text-gray-500">{testimonials[currentTestimonial].date}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < Math.floor(testimonials[currentTestimonial].rating) ? 'fill-current text-[#00c9a7]' : 'text-gray-300'}`} />
                          ))}
                          <span className="text-sm text-gray-500 ml-2">{testimonials[currentTestimonial].rating}</span>
                        </div>
                        <p className="text-gray-700 mt-3 leading-relaxed">"{testimonials[currentTestimonial].text}"</p>
                      </div>
                    </div>
                    <div className="flex justify-center gap-2 mt-6">
                      {testimonials.map((_, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => { setAnimate(true); setTimeout(() => { setCurrentTestimonial(idx); setAnimate(false); }, 300); }}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${currentTestimonial === idx ? 'w-6 bg-[#00c9a7]' : 'bg-gray-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="border rounded-xl p-5">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-lg text-[#0F2940]">2 nuits à {property.city}</h3>
                  <button onClick={()=>setShowCalendar(!showCalendar)} className="text-[#00c9a7] text-sm underline">Sélectionner</button>
                </div>
                {showCalendar && (
                  <div className="mt-4 border rounded-lg p-4">
                    <div className="grid grid-cols-7 gap-1 text-center text-sm">
                      {["L","M","M","J","V","S","D"].map(d=> <div key={d} className="font-medium text-gray-500">{d}</div>)}
                      {Array.from({length: 35}).map((_,i)=> <button key={i} className="aspect-square rounded-full hover:bg-[#00c9a7]/20">{i+1}</button>)}
                    </div>
                  </div>
                )}
                <div className="text-sm text-gray-500 mt-3"><Calendar className="inline w-4 h-4 mr-1"/>{checkIn} — {checkOut}</div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 border rounded-2xl p-6 shadow-xl bg-white">
                <div className="flex justify-between items-center">
                  <div><span className="text-3xl font-bold text-[#0F2940]">{property.priceNumber.toLocaleString()} FCFA</span><span className="text-gray-500"> / nuit</span></div>
                  <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full"><Star className="w-4 h-4 fill-current text-[#00c9a7]"/>{property.rating}</div>
                </div>
                <div className="border rounded-xl my-5 overflow-hidden">
                  <div className="flex">
                    <div className="flex-1 p-3 border-r"><div className="text-xs font-bold text-gray-500 uppercase">Arrivée</div><div className="font-medium">{checkIn}</div></div>
                    <div className="flex-1 p-3"><div className="text-xs font-bold text-gray-500 uppercase">Départ</div><div className="font-medium">{checkOut}</div></div>
                  </div>
                  <div className="p-3 border-t"><div className="text-xs font-bold text-gray-500 uppercase">Voyageurs</div><div className="font-medium">{guests} adulte</div></div>
                </div>
                <div className="space-y-3 mb-5">
                  <div className={`border rounded-xl p-3 cursor-pointer transition-all ${selectedPriceOption==="non-remboursable"?"border-[#00c9a7] bg-[#00c9a7]/5 shadow-md":""}`} onClick={()=>setSelectedPriceOption("non-remboursable")}>
                    <div className="flex justify-between font-medium"><span>Non remboursable</span><span>{nonRefundableTotal.toLocaleString()} FCFA</span></div>
                    <div className="text-xs text-gray-500">Paiement immédiat</div>
                  </div>
                  <div className="border rounded-xl p-3 cursor-not-allowed opacity-50">
                    <div className="flex justify-between"><span>Remboursable</span><span>{refundableTotal.toLocaleString()} FCFA</span></div>
                    <div className="text-xs text-gray-500">Annulation gratuite avant le 10 mai</div>
                  </div>
                </div>
                <button onClick={onReserve} className="w-full bg-[#00c9a7] text-[#0F2940] py-3 rounded-xl font-bold text-lg hover:bg-[#00b892] transition-all hover:scale-105 transform shadow-md">Réserver</button>
                <p className="text-center text-xs text-gray-500 mt-3">Aucun débit pour le moment</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== PAGE PRINCIPALE POPULAR ====================
interface PopularPageProps {
  onNavigate?: (route: Route) => void;
}

export default function Popular({ onNavigate }: PopularPageProps) {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState("Tous");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [detailProperty, setDetailProperty] = useState<PopularProperty | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState<any>(null);

  const filterProperties = (properties: PopularProperty[]) => {
    const filtered = [...properties];
    if (selectedFilter === "Prix croissant") return filtered.sort((a,b)=>a.priceNumber-b.priceNumber);
    if (selectedFilter === "Prix décroissant") return filtered.sort((a,b)=>b.priceNumber-a.priceNumber);
    if (selectedFilter === "Mieux notés") return filtered.sort((a,b)=>b.rating-a.rating);
    return filtered;
  };

  const displayedProperties = filterProperties(popularProperties);

  const handleReserve = (property: PopularProperty) => {
    const total = property.priceNumber * 2 * 1.1;
    setCheckoutData({ property, checkIn: "15/05/2026", checkOut: "17/05/2026", guests: 1, totalPrice: total });
    setShowCheckout(true);
    setDetailProperty(null);
  };

  const handleNavigate = (route: Route) => {
    if (onNavigate) {
      onNavigate(route);
    } else {
      if (route.name === 'listing') {
        navigate(`/annonce/${route.id}`);
      } else if (route.name === 'home') {
        navigate('/');
      }
    }
  };

  const getMapUrl = () => "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d634630.827254447!2d2.2569729!3d6.474903!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1020a44f6b9c7e9b%3A0x9b4b5c1e4f5a6b7!2sBenin!5e0!3m2!1sfr!2sfr!4v1699999999999!5m2!1sfr!2sfr";

  return (
    <div className="min-h-screen bg-white">
      {/* En-tête fixe */}
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center gap-4 z-20">
        <button onClick={() => handleNavigate({ name: 'home' })} className="p-2 rounded-full hover:bg-gray-100 transition-all hover:scale-110">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-[#0F2940]">Logements populaires · Bénin</h1>
      </div>

      {/* Barre de filtres */}
      <div className="sticky top-[73px] bg-white border-b px-4 py-2 z-10">
        <div className="relative inline-block">
          <button onClick={()=>setShowFilterDropdown(!showFilterDropdown)} className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 hover:border-[#00c9a7] transition-colors">
            <Filter className="w-4 h-4 text-[#00c9a7]"/><span className="text-sm">Trier : {selectedFilter}</span><ChevronDown className="w-4 h-4"/>
          </button>
          {showFilterDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-xl border w-40 z-20">
              {filters.map(f=>(
                <div key={f} className="p-2 hover:bg-[#00c9a7]/10 cursor-pointer transition-colors" onClick={()=>{setSelectedFilter(f); setShowFilterDropdown(false);}}>
                  {f}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Deux colonnes : Logements (grille 2x2) à gauche, Carte à droite */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)]">
        {/* Gauche : liste en grille 2 colonnes */}
        <div className="lg:w-1/2 overflow-y-auto p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {displayedProperties.map(property => (
              <div 
                key={property.id} 
                className="border rounded-2xl p-4 hover:shadow-xl transition-all duration-300 cursor-pointer bg-white group hover:border-[#00c9a7] hover:scale-[1.02]" 
                onClick={()=>setDetailProperty(property)}
              >
                <div className="relative overflow-hidden rounded-xl">
                  <img src={property.images?.[0] || property.image || '/placeholder.jpg'} className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.jpg'; }} />
                  <div className="absolute top-3 right-3 bg-[#00c9a7] text-[#0F2940] text-xs font-bold px-2 py-1 rounded-full">Coup de cœur</div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between">
                    <div><h3 className="font-semibold text-[#0F2940] text-lg">{property.title}</h3><p className="text-sm text-gray-500">{property.location}</p></div>
                    <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full"><Star className="w-3 h-3 fill-current text-[#00c9a7]"/><span className="text-sm font-medium">{property.rating}</span></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{property.description}</p>
                  <div className="flex gap-3 text-sm text-gray-500 mt-2"><Bed className="w-4 h-4"/>{property.beds} lits <Bath className="w-4 h-4"/>{property.baths} sdb</div>
                  <div className="mt-3 flex justify-between items-center">
                    <span className="font-bold text-[#0F2940] text-lg">{property.price}</span>
                    <button className="p-2 rounded-full hover:bg-gray-100 transition-colors"><Heart className="w-5 h-5 text-gray-500 hover:text-[#00c9a7]" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Droite : Carte Maps */}
        <div className="lg:w-1/2 h-96 lg:h-auto bg-gray-100 relative">
          <iframe title="Carte" src={getMapUrl()} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" className="w-full h-full" />
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg px-3 py-1 text-xs shadow">📍 Cotonou, Bénin</div>
        </div>
      </div>

      {/* Modals */}
      {detailProperty && <PropertyDetailModal property={detailProperty} onClose={()=>setDetailProperty(null)} onReserve={()=>handleReserve(detailProperty)} />}
      {showCheckout && checkoutData && <CheckoutModal {...checkoutData} onClose={()=>setShowCheckout(false)} />}
    </div>
  );
}