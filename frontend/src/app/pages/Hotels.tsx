import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { 
  Star, Bed, Bath, Heart, Filter, ChevronDown, ArrowLeft, 
  Share2, Sparkles, Award, Crown, Key, MapPin, Check, X, 
  Calendar, Smartphone, CreditCard, Phone
} from "lucide-react";
import type { Route } from '../router';

// ==================== TYPES ====================
type HotelProperty = {
  id: number;
  title: string;
  location: string;
  price: string;
  priceNumber: number;
  rating: number;
  reviews: number;
  image: string;
  images?: string[];
  beds: number;
  baths: number;
  description: string;
  longDescription?: string;
  host: string;
  hostImage: string;
  hostSince: string;
  superhost: boolean;
  responseRate: number;
  responseTime: string;
  amenities: string[];
  checkInTime: string;
  checkOutTime: string;
  selfCheckIn: boolean;
  walkScore?: string;
  testimonials?: { name: string; date: string; text: string; rating: number; avatar?: string }[];
};

// ==================== DONNÉES DES HÔTELS (10 hôtels) ====================
const hotelsProperties: HotelProperty[] = [
  {
    id: 4,
    title: "Hôtel Golden Tulip",
    location: "Cotonou",
    price: "150 000 FCFA / nuit",
    priceNumber: 150000,
    rating: 4.9,
    reviews: 342,
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
    images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80", "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80"],
    beds: 2,
    baths: 2,
    description: "Hôtel 5 étoiles avec spa, piscine et restaurant gastronomique. Parfait pour un séjour détente ou d'affaires.",
    longDescription: "Le Golden Tulip offre une expérience luxueuse avec ses chambres élégantes, son spa de classe mondiale et sa cuisine raffinée. Profitez d'une vue imprenable sur la ville et d'un service irréprochable.",
    host: "Direction Golden Tulip",
    hostImage: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80",
    hostSince: "10 ans",
    superhost: true,
    responseRate: 100,
    responseTime: "dans l'heure",
    amenities: ["Piscine", "Spa", "Restaurant gastronomique", "Wifi haut débit", "Parking sécurisé", "Salle de sport", "Service d'étage 24h/24", "Navette aéroport"],
    checkInTime: "14:00",
    checkOutTime: "12:00",
    selfCheckIn: true,
    walkScore: "Très bien situé",
    testimonials: [
      { name: "Sophie L.", date: "Il y a 2 semaines", text: "Séjour absolument magnifique ! Le personnel est aux petits soins, la chambre était spacieuse avec une vue imprenable. Le petit-déjeuner buffet est un régal. Je recommande vivement !", rating: 5, avatar: "https://randomuser.me/api/portraits/women/1.jpg" },
      { name: "Marc D.", date: "Il y a 1 mois", text: "Un hôtel d'exception. Le spa est incroyable, et le restaurant mérite au moins une étoile Michelin. Rapport qualité-prix excellent pour un 5 étoiles.", rating: 5, avatar: "https://randomuser.me/api/portraits/men/1.jpg" },
      { name: "Amélie K.", date: "Il y a 3 semaines", text: "Parfait pour un voyage d'affaires comme pour des vacances. La piscine est très agréable et le personnel parle parfaitement anglais et français.", rating: 4.8, avatar: "https://randomuser.me/api/portraits/women/2.jpg" }
    ]
  },
  {
    id: 5,
    title: "Novotel Cotonou",
    location: "Cotonou",
    price: "120 000 FCFA / nuit",
    priceNumber: 120000,
    rating: 4.8,
    reviews: 267,
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80",
    images: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80", "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80"],
    beds: 2,
    baths: 2,
    description: "Hôtel d'affaires avec vue sur le lagon, piscine et centre de conférence, idéal pour un séjour confortable.",
    longDescription: "Situé face au lagon, le Novotel allie modernité et sérénité. Idéal pour les voyageurs d'affaires avec ses salles de réunion modernes, mais aussi pour les familles grâce à sa piscine et ses espaces verts.",
    host: "Groupe Novotel",
    hostImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80",
    hostSince: "8 ans",
    superhost: true,
    responseRate: 98,
    responseTime: "dans l'heure",
    amenities: ["Vue sur lagon", "Piscine", "Centre d'affaires", "Wifi", "Parking", "Restaurant"],
    checkInTime: "15:00",
    checkOutTime: "11:00",
    selfCheckIn: true,
    testimonials: [
      { name: "Jean-Paul B.", date: "Il y a 1 semaine", text: "Très bon hôtel, chambre confortable et personnel accueillant. La vue sur le lagon est magnifique au coucher du soleil.", rating: 4.5, avatar: "https://randomuser.me/api/portraits/men/2.jpg" },
      { name: "Fatima Z.", date: "Il y a 2 mois", text: "Idéalement situé, proche du centre-ville. La piscine est propre et agréable. Je recommande pour un séjour pro ou perso.", rating: 4.7, avatar: "https://randomuser.me/api/portraits/women/3.jpg" },
      { name: "Thomas R.", date: "Il y a 3 semaines", text: "Service de qualité, petit-déjeuner copieux. Un grand merci à l'équipe pour leur disponibilité.", rating: 4.6, avatar: "https://randomuser.me/api/portraits/men/3.jpg" }
    ]
  },
  {
    id: 6,
    title: "Azalaï Hôtel",
    location: "Cotonou",
    price: "95 000 FCFA / nuit",
    priceNumber: 95000,
    rating: 4.7,
    reviews: 189,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80",
    images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80", "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80"],
    beds: 2,
    baths: 1,
    description: "Hôtel confortable avec piscine et restaurant, parfait pour les voyageurs d'affaires ou les vacances en couple.",
    longDescription: "L'Azalaï Hôtel vous accueille dans un cadre chaleureux et moderne. Piscine extérieure, restaurant proposant une cuisine locale et internationale, et chambres climatisées.",
    host: "Azalaï Group",
    hostImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    hostSince: "5 ans",
    superhost: false,
    responseRate: 95,
    responseTime: "quelques heures",
    amenities: ["Piscine", "Restaurant", "Wifi", "Parking gratuit", "Climatisation"],
    checkInTime: "14:00",
    checkOutTime: "12:00",
    selfCheckIn: false,
    testimonials: [
      { name: "Laura M.", date: "Il y a 2 semaines", text: "Excellent rapport qualité-prix ! La piscine est très agréable après une journée de travail. Le personnel est souriant et serviable.", rating: 4.5, avatar: "https://randomuser.me/api/portraits/women/4.jpg" },
      { name: "Nicolas P.", date: "Il y a 1 mois", text: "Chambre propre et bien équipée. Le restaurant propose des plats typiques délicieux. Je reviendrai.", rating: 4.4, avatar: "https://randomuser.me/api/portraits/men/4.jpg" },
      { name: "Mariam S.", date: "Il y a 3 semaines", text: "Très bon accueil, hôtel calme et bien situé. Le wifi fonctionne parfaitement, ce qui est rare à Cotonou !", rating: 4.6, avatar: "https://randomuser.me/api/portraits/women/5.jpg" }
    ]
  },
  {
    id: 7,
    title: "Radisson Blu Cotonou",
    location: "Cotonou",
    price: "140 000 FCFA / nuit",
    priceNumber: 140000,
    rating: 4.8,
    reviews: 211,
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80",
    images: ["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80", "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=80"],
    beds: 2,
    baths: 2,
    description: "Hôtel moderne avec piscine extérieure, salle de sport et restaurant élégant.",
    longDescription: "Découvrez le luxe moderne au Radisson Blu. Piscine à débordement, fitness dernier cri et cuisine internationale raffinée.",
    host: "Radisson Group",
    hostImage: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80",
    hostSince: "6 ans",
    superhost: true,
    responseRate: 99,
    responseTime: "dans l'heure",
    amenities: ["Piscine", "Salle de sport", "Restaurant gastronomique", "Wifi", "Parking", "Spa"],
    checkInTime: "15:00",
    checkOutTime: "12:00",
    selfCheckIn: true,
    testimonials: [
      { name: "Claire D.", date: "Il y a 2 semaines", text: "Le meilleur hôtel de Cotonou ! La piscine est sublime, le service impeccable.", rating: 4.9, avatar: "https://randomuser.me/api/portraits/women/6.jpg" },
      { name: "Olivier G.", date: "Il y a 1 mois", text: "Chambre luxueuse, petit-déjeuner buffet incroyable. Je reviendrai sans hésiter.", rating: 4.8, avatar: "https://randomuser.me/api/portraits/men/5.jpg" },
      { name: "Sabrina K.", date: "Il y a 3 semaines", text: "Un séjour de rêve. Le personnel est aux petits soins, la vue sur la ville est magnifique.", rating: 4.7, avatar: "https://randomuser.me/api/portraits/women/7.jpg" }
    ]
  },
  {
    id: 8,
    title: "Royal Orchid Hotel",
    location: "Cotonou",
    price: "110 000 FCFA / nuit",
    priceNumber: 110000,
    rating: 4.7,
    reviews: 162,
    image: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80",
    images: ["https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80", "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80"],
    beds: 2,
    baths: 2,
    description: "Chambres spacieuses, petit déjeuner buffet et service 24h/24.",
    longDescription: "L'hôtel Royal Orchid offre un service de qualité avec des chambres confortables et un personnel attentionné.",
    host: "Royal Orchid",
    hostImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80",
    hostSince: "4 ans",
    superhost: true,
    responseRate: 97,
    responseTime: "dans l'heure",
    amenities: ["Restaurant", "Bar", "Wifi", "Service d'étage"],
    checkInTime: "14:00",
    checkOutTime: "11:00",
    selfCheckIn: true,
    testimonials: [
      { name: "Alain B.", date: "Il y a 1 semaine", text: "Très bon accueil, chambre confortable. Le buffet du petit-déjeuner est varié.", rating: 4.5, avatar: "" },
      { name: "Fanny L.", date: "Il y a 2 mois", text: "Hôtel bien situé, calme. Je recommande.", rating: 4.4, avatar: "" },
      { name: "Karim S.", date: "Il y a 3 semaines", text: "Service rapide, chambre propre.", rating: 4.6, avatar: "" }
    ]
  },
  {
    id: 9,
    title: "Sunset Beach Resort",
    location: "Cotonou",
    price: "135 000 FCFA / nuit",
    priceNumber: 135000,
    rating: 4.9,
    reviews: 278,
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80",
    images: ["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80", "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80"],
    beds: 3,
    baths: 2,
    description: "Resort de bord de mer avec accès direct à la plage et piscine privée.",
    longDescription: "Paradis tropical, le Sunset Beach Resort vous offre plage privée, piscine à débordement et services exclusifs.",
    host: "Sunset Group",
    hostImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
    hostSince: "5 ans",
    superhost: true,
    responseRate: 100,
    responseTime: "dans l'heure",
    amenities: ["Plage privée", "Piscine", "Spa", "Restaurant", "Bar"],
    checkInTime: "15:00",
    checkOutTime: "12:00",
    selfCheckIn: true,
    testimonials: [
      { name: "Julie M.", date: "Il y a 2 semaines", text: "Paradis sur terre! Le coucher de soleil depuis la plage est magique.", rating: 5, avatar: "" },
      { name: "Paul H.", date: "Il y a 1 mois", text: "Resort de luxe, personnel adorable. La piscine est énorme.", rating: 4.9, avatar: "" },
      { name: "Eva C.", date: "Il y a 3 semaines", text: "Un séjour inoubliable, je reviendrai !", rating: 5, avatar: "" }
    ]
  },
  {
    id: 10,
    title: "Palace Hotel Cotonou",
    location: "Cotonou",
    price: "165 000 FCFA / nuit",
    priceNumber: 165000,
    rating: 4.9,
    reviews: 310,
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=80",
    images: ["https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=80", "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80"],
    beds: 3,
    baths: 3,
    description: "Hôtel de luxe avec spa, suite présidentielle et service haut de gamme.",
    longDescription: "Le Palace Hotel incarne le luxe absolu à Cotonou. Suites présidentielles, spa exclusif et service personnalisé.",
    host: "Palace Group",
    hostImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
    hostSince: "7 ans",
    superhost: true,
    responseRate: 100,
    responseTime: "dans l'heure",
    amenities: ["Spa", "Piscine", "Restaurant étoilé", "Service d'étage", "Conciergerie"],
    checkInTime: "14:00",
    checkOutTime: "12:00",
    selfCheckIn: false,
    testimonials: [
      { name: "Henri P.", date: "Il y a 2 semaines", text: "L'apogée du luxe à Cotonou. Suite présidentielle exceptionnelle.", rating: 5, avatar: "" },
      { name: "Isabelle R.", date: "Il y a 1 mois", text: "Service royal, rien à redire.", rating: 5, avatar: "" },
      { name: "Christophe L.", date: "Il y a 3 semaines", text: "Le meilleur hôtel de la ville. Je recommande.", rating: 4.9, avatar: "" }
    ]
  },
  {
    id: 11,
    title: "Lagoon View Suites",
    location: "Cotonou",
    price: "130 000 FCFA / nuit",
    priceNumber: 130000,
    rating: 4.6,
    reviews: 146,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80",
    images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80", "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80"],
    beds: 2,
    baths: 1,
    description: "Suites avec vue sur le lagon, idéal pour un séjour romantique.",
    longDescription: "Suites élégantes avec vue imprenable sur le lagon. Parfait pour les couples en quête de romantisme.",
    host: "Lagoon Group",
    hostImage: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&q=80",
    hostSince: "3 ans",
    superhost: false,
    responseRate: 92,
    responseTime: "quelques heures",
    amenities: ["Vue lagon", "Terrasse", "Wifi", "Jacuzzi"],
    checkInTime: "15:00",
    checkOutTime: "11:00",
    selfCheckIn: true,
    testimonials: [
      { name: "Roméo J.", date: "Il y a 1 semaine", text: "Vue magnifique, parfait pour une nuit de Saint-Valentin.", rating: 4.5, avatar: "" },
      { name: "Juliette B.", date: "Il y a 2 mois", text: "Suite romantique, très propre. Le jacuzzi est un plus.", rating: 4.6, avatar: "" },
      { name: "Nina K.", date: "Il y a 3 semaines", text: "Idéal en couple, calme et reposant.", rating: 4.4, avatar: "" }
    ]
  },
  {
    id: 12,
    title: "Cotonou Urban Inn",
    location: "Cotonou",
    price: "90 000 FCFA / nuit",
    priceNumber: 90000,
    rating: 4.5,
    reviews: 103,
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80",
    images: ["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80", "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80"],
    beds: 1,
    baths: 1,
    description: "Hôtel urbain moderne proche des commerces et du centre-ville.",
    longDescription: "L'Urban Inn est un hôtel moderne idéalement situé près des commerces et restaurants.",
    host: "Urban Group",
    hostImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
    hostSince: "4 ans",
    superhost: false,
    responseRate: 89,
    responseTime: "quelques heures",
    amenities: ["Wifi", "Climatisation", "TV", "Mini-bar"],
    checkInTime: "14:00",
    checkOutTime: "11:00",
    selfCheckIn: true,
    testimonials: [
      { name: "Léna S.", date: "Il y a 2 semaines", text: "Pratique et propre, bon rapport qualité-prix.", rating: 4.2, avatar: "" },
      { name: "Moussa T.", date: "Il y a 1 mois", text: "Idéal pour une nuit de transit. Le personnel est sympa.", rating: 4.3, avatar: "" },
      { name: "Claire F.", date: "Il y a 3 semaines", text: "Chambre petite mais bien agencée. Le wifi fonctionne bien.", rating: 4.4, avatar: "" }
    ]
  },
  {
    id: 13,
    title: "Riviera Boutique Hotel",
    location: "Cotonou",
    price: "100 000 FCFA / nuit",
    priceNumber: 100000,
    rating: 4.7,
    reviews: 128,
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80",
    images: ["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80", "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80"],
    beds: 2,
    baths: 1,
    description: "Ambiance boutique, décoration soignée et service personnalisé.",
    longDescription: "Hôtel boutique au charme unique, décoration design et service sur mesure.",
    host: "Riviera",
    hostImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
    hostSince: "3 ans",
    superhost: true,
    responseRate: 96,
    responseTime: "dans l'heure",
    amenities: ["Décoration design", "Wifi", "Petit-déjeuner inclus", "Parking"],
    checkInTime: "15:00",
    checkOutTime: "11:00",
    selfCheckIn: true,
    testimonials: [
      { name: "Chloé A.", date: "Il y a 2 semaines", text: "Hôtel charmant, ambiance cosy. Le personnel est très attentif.", rating: 4.6, avatar: "" },
      { name: "Romain V.", date: "Il y a 1 mois", text: "Une pépite cachée à Cotonou. Décoration raffinée.", rating: 4.8, avatar: "" },
      { name: "Camille D.", date: "Il y a 3 semaines", text: "Service personnalisé, je me suis sentie comme chez moi.", rating: 4.7, avatar: "" }
    ]
  }
];

const filters = ["Tous", "Prix croissant", "Prix décroissant", "Mieux notés"];

const getMapUrl = (query: string) =>
  `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;

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
                <div className="border rounded-lg p-3 border-gray-200 opacity-50">
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
                <div className="flex items-center gap-1 text-sm"><Star className="w-4 h-4 fill-current text-[#00c9a7]" /><span>{property.rating}</span><span className="text-gray-500">({property.reviews})</span></div>
                <div className="text-xs text-green-600 font-semibold mt-1">Coup de cœur voyageurs</div>
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
const PropertyDetailModal = ({ property, onClose, onReserve }: { property: HotelProperty; onClose: () => void; onReserve: () => void }) => {
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
                <div className="text-sm text-gray-500">Hôtel de luxe · {property.beds} chambres · {property.beds} lits · {property.baths} sdb</div>
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
                  <div className="text-gray-600">Un des hôtels préférés des voyageurs au Bénin</div>
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
                  {property.superhost && <div className="flex items-center gap-1 text-[#00c9a7]"><Award className="w-4 h-4"/>Superhôte · {property.hostSince}</div>}
                  <div className="text-sm text-gray-600">Taux de réponse {property.responseRate}% · Répond {property.responseTime}</div>
                </div>
              </div>

              <div><p className="text-gray-700 leading-relaxed">{property.description}</p>{property.longDescription && <p className="text-gray-700 mt-3 leading-relaxed">{property.longDescription}</p>}</div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-xl text-[#0F2940]">Équipements premium</h3>
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
                          src={testimonials[currentTestimonial].avatar || `https://ui-avatars.com/api/?background=00c9a7&color=fff&name=${testimonials[currentTestimonial].name.charAt(0)}`} 
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
                  <h3 className="font-semibold text-lg text-[#0F2940]">2 nuits à {property.location}</h3>
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

// ==================== PAGE PRINCIPALE HOTELS ====================
interface HotelsPageProps {
  onNavigate?: (route: Route) => void;
}

export default function Hotels({ onNavigate }: HotelsPageProps) {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState("Tous");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<HotelProperty | null>(hotelsProperties[0]);
  const [detailProperty, setDetailProperty] = useState<HotelProperty | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState<any>(null);

  const handleSelectProperty = (property: HotelProperty) => {
    setSelectedProperty(property);
    setDetailProperty(property);
  };

  const handleReserve = (property: HotelProperty) => {
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

  const filterProperties = (properties: HotelProperty[]) => {
    const filtered = [...properties];
    switch (selectedFilter) {
      case "Prix croissant":
        return filtered.sort((a, b) => a.priceNumber - b.priceNumber);
      case "Prix décroissant":
        return filtered.sort((a, b) => b.priceNumber - a.priceNumber);
      case "Mieux notés":
        return filtered.sort((a, b) => b.rating - a.rating);
      default:
        return filtered;
    }
  };

  const displayedProperties = filterProperties(hotelsProperties);
  const mapQuery = selectedProperty ? selectedProperty.location : "Cotonou, Bénin";

  return (
    <div className="min-h-screen bg-white">
      {/* En-tête */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => handleNavigate({ name: 'home' })} className="p-2 rounded-full hover:bg-gray-100 transition-all hover:scale-110">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-[#0F2940]">De superbes hôtels pour votre prochain voyage</h1>
            <p className="text-sm text-gray-500">Hôtels de qualité supérieure au Bénin.</p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="border-b border-gray-200 bg-white sticky top-[73px] z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="relative inline-block">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 hover:border-[#00c9a7] transition-colors"
            >
              <Filter className="w-4 h-4 text-[#00c9a7]" />
              <span className="text-sm">Trier par : {selectedFilter}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilterDropdown ? "rotate-180" : ""}`} />
            </button>
            {showFilterDropdown && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50 py-2">
                {filters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      setSelectedFilter(filter);
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-[#00c9a7]/10 transition-colors ${selectedFilter === filter ? "text-[#00c9a7] font-medium" : "text-gray-700"}`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenu : 2 colonnes (hôtels à gauche / carte à droite) */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)]">
        {/* Colonne gauche : grille 2x2 */}
        <div className="lg:w-1/2 overflow-y-auto p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {displayedProperties.map((property) => (
              <div
                key={property.id}
                className="flex flex-col gap-3 p-4 border border-gray-200 rounded-2xl hover:shadow-xl transition-all duration-300 cursor-pointer bg-white group hover:border-[#00c9a7] hover:scale-[1.02]"
                onClick={() => handleSelectProperty(property)}
              >
                <div className="relative overflow-hidden rounded-xl">
                  <img src={property.images?.[0] || property.image || '/placeholder.jpg'} alt={property.title} className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.jpg'; }} />
                  <div className="absolute top-3 right-3 bg-[#00c9a7] text-white text-xs font-bold px-2 py-1 rounded-full">Coup de cœur</div>
                </div>
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-[#0F2940] text-lg">{property.title}</h3>
                      <p className="text-sm text-gray-500">{property.location}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                      <Star className="w-3 h-3 fill-current text-[#00c9a7]" />
                      <span className="text-sm font-medium">{property.rating}</span>
                      <span className="text-xs text-gray-500">({property.reviews})</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{property.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1"><Bed className="w-4 h-4"/><span>{property.beds} lits</span></div>
                    <div className="flex items-center gap-1"><Bath className="w-4 h-4"/><span>{property.baths} sdb</span></div>
                  </div>
                  <div className="mt-3 flex justify-between items-center">
                    <p className="font-bold text-[#0F2940] text-lg">{property.price}</p>
                    <button className="p-2 rounded-full hover:bg-gray-100 transition-colors"><Heart className="w-5 h-5 text-gray-500 hover:text-[#00c9a7]" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Colonne droite : Carte Google Maps */}
        <div className="lg:w-1/2 h-96 lg:h-auto bg-gray-100 relative">
          <iframe
            title="Carte des hôtels"
            src={getMapUrl(mapQuery)}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full"
          />
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg px-3 py-1 text-xs shadow">
            📍 {selectedProperty?.location || "Cotonou"}
          </div>
        </div>
      </div>

      {/* Modals */}
      {detailProperty && (
        <PropertyDetailModal
          property={detailProperty}
          onClose={() => setDetailProperty(null)}
          onReserve={() => handleReserve(detailProperty)}
        />
      )}
      {showCheckout && checkoutData && (
        <CheckoutModal {...checkoutData} onClose={() => setShowCheckout(false)} />
      )}
    </div>
  );
}