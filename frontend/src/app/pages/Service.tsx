import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Search, Calendar, Users, X, Star, Heart, ChevronLeft, ChevronRight } from "lucide-react";

const asset = (filename: string) => new URL(`../../public/${filename}`, import.meta.url).href;

// ========== DONNÉES DES SERVICES AVEC IMAGES MULTIPLES ET AVIS ==========

// Thèmes d'images pour varier l'affichage
const themeImages = {
  transport: [
    asset("marché.jpg"),
    asset("marché1.jpg"),
    asset("marché2.jpg"),
    asset("marché3.jpg"),
  ],
  guide: [
    asset("culture.jpg"),
    asset("culture1.jpg"),
    asset("culture2.jpg"),
    asset("culture4.jpg"),
  ],
  maintenance: [
    asset("artisanat.jpg"),
    asset("artisanat1.jpg"),
    asset("artisanat2.jpg"),
    asset("artisanat3.jpg"),
  ],
  bienetre: [
    asset("repas.jpg"),
    asset("repas3.jpg"),
    asset("repas4.jpg"),
    asset("repas5.jpg"),
  ],
  cuisine: [
    asset("formation cuisine.jpg"),
    asset("formation cuisine1.jpg"),
    asset("repas6.jpg"),
    asset("repas7.jpg"),
  ],
  urgence: [
    asset("scrupture.jpg"),
    asset("scrupture1.jpg"),
    asset("pagne.jpg"),
    asset("pagne1.jpg"),
  ],
  exclusive: [
    asset("tiserande.jpg"),
    asset("yaourt.jpg"),
    asset("pepas1.jpg"),
    asset("repa13.jpg"),
  ],
};

// Fonction pour générer des avis
const generateServiceReviews = (title: string, location: string) => [
  { name: "Jean-Marc", location: "Cotonou", daysAgo: "il y a 3 jours", text: `Excellent service "${title}" à ${location}. Ponctuel et professionnel.`, rating: 5.0 },
  { name: "Fatima", location: "Porto-Novo", daysAgo: "il y a 1 semaine", text: `Très satisfaite, je recommande vivement ce service.`, rating: 4.9 },
  { name: "Lucien", location: "Abomey-Calavi", daysAgo: "il y a 2 jours", text: `Service impeccable, prix correct, équipe sympathique.`, rating: 5.0 },
];

// Services aux voyageurs
const travelServices = [
  { id: 1, title: "Transfert aéroport privé (Cotonou - toute la ville)", category: "Services aux voyageurs", sousCategorie: "Transport", location: "Cotonou, Bénin", price: 25, priceType: "par trajet", rating: 4.9, reviews: 128, duration: "30-60 min", images: themeImages.transport, hostType: "Professionnel", description: "Prise en charge à l'aéroport de Cotonou vers n'importe quelle destination de la ville. Chauffeur professionnel, climatisé.", longDescription: "Service premium avec véhicule climatisé, chauffeur parlant français et anglais. Inclus : bouteille d'eau, wifi à bord, assistance bagages. Disponible 24h/24 sur réservation." },
  { id: 2, title: "Guide touristique privé - Visite de Cotonou", category: "Services aux voyageurs", sousCategorie: "Visite guidée", location: "Cotonou, Bénin", price: 45, priceType: "par personne", rating: 4.95, reviews: 87, duration: "4 heures", images: themeImages.guide, hostType: "Local", description: "Découvrez les secrets de Cotonou avec un guide passionné : marché Dantokpa, Fondation Zinsou, plage de Fidjrossè.", longDescription: "Visite personnalisée de Cotonou. Découvrez l'histoire de la ville, ses quartiers, sa culture et sa gastronomie. Guide local diplômé." },
  { id: 3, title: "Location de véhicule 4x4 avec chauffeur", category: "Services aux voyageurs", sousCategorie: "Transport", location: "Bénin (national)", price: 85, priceType: "par jour", rating: 4.88, reviews: 56, duration: "Journée", images: themeImages.transport, hostType: "Professionnel", description: "Véhicule tout-terrain avec chauffeur expérimenté pour explorer tout le Bénin.", longDescription: "Idéal pour Parakou, Pendjari, Abomey. Véhicule neuf, chauffeur guide, carburant inclus." },
  { id: 4, title: "Service de conciergerie 24/7", category: "Services aux voyageurs", sousCategorie: "Assistance", location: "Cotonou, Bénin", price: 15, priceType: "par jour", rating: 4.92, reviews: 203, duration: "24h/24", images: themeImages.exclusive, hostType: "Professionnel", description: "Assistance personnalisée : réservations, informations, urgences, traduction.", longDescription: "Disponible 7j/7. Une équipe dédiée pour répondre à toutes vos demandes." },
  { id: 5, title: "Cours de langue fon / français", category: "Services aux voyageurs", sousCategorie: "Formation", location: "Cotonou, Bénin", price: 20, priceType: "par heure", rating: 4.85, reviews: 45, duration: "1-2 heures", images: themeImages.exclusive, hostType: "Particulier", description: "Apprenez les bases du fon ou perfectionnez votre français avec un professeur local.", longDescription: "Cours particuliers à domicile ou en ligne, matériel pédagogique fourni." },
  { id: 6, title: "Nettoyage et repassage en urgence", category: "Services aux voyageurs", sousCategorie: "Entretien", location: "Cotonou, Bénin", price: 10, priceType: "par service", rating: 4.78, reviews: 67, duration: "2-3 heures", images: themeImages.maintenance, hostType: "Local", description: "Service de nettoyage de vêtements et repassage livré à votre domicile.", longDescription: "Prise en charge rapide, livraison dans la journée." },
  { id: 7, title: "Baby-sitting certifié", category: "Services aux voyageurs", sousCategorie: "Garde d'enfants", location: "Cotonou, Bénin", price: 8, priceType: "par heure", rating: 4.82, reviews: 34, duration: "À la demande", images: themeImages.exclusive, hostType: "Particulier", description: "Garderie à domicile par des professionnels formés aux premiers secours.", longDescription: "Garde d'enfants de 0 à 12 ans, jeux éducatifs, sorties encadrées." },
  { id: 8, title: "Aide administrative et traduction", category: "Services aux voyageurs", sousCategorie: "Administratif", location: "Cotonou, Bénin", price: 30, priceType: "par dossier", rating: 4.9, reviews: 28, duration: "24-48h", images: themeImages.urgence, hostType: "Professionnel", description: "Traduction anglais/français, assistance pour visas, permis.", longDescription: "Service fiable et rapide pour vos démarches administratives." },
];

// Services aux hôtes
const hostServices = [
  { id: 101, title: "Ménage professionnel après chaque départ", category: "Services aux hôtes", sousCategorie: "Entretien", location: "Cotonou, Bénin", price: 25, priceType: "par intervention", rating: 4.95, reviews: 156, duration: "2-3 heures", images: themeImages.maintenance, hostType: "Professionnel", description: "Nettoyage complet de votre logement après chaque location.", longDescription: "Linge de maison fourni, produits écologiques, équipe formée." },
  { id: 102, title: "Photo professionnelle pour annonces", category: "Services aux hôtes", sousCategorie: "Marketing", location: "Cotonou, Bénin", price: 50, priceType: "par séance", rating: 4.98, reviews: 89, duration: "2 heures", images: themeImages.exclusive, hostType: "Professionnel", description: "Shooting photo avec retouche pour valoriser votre bien.", longDescription: "Photos haute définition, retouche professionnelle, droits d'usage inclus." },
  { id: 103, title: "Gestion locative complète", category: "Services aux hôtes", sousCategorie: "Gestion", location: "Cotonou, Bénin", price: 15, priceType: "% du loyer", rating: 4.92, reviews: 112, duration: "Mensuel", images: themeImages.exclusive, hostType: "Agence", description: "Gestion des réservations, accueil, ménage, maintenance.", longDescription: "Commission 15% sur les loyers. Service clé en main." },
  { id: 104, title: "Dépannage plomberie/électricité 24/7", category: "Services aux hôtes", sousCategorie: "Maintenance", location: "Cotonou, Bénin", price: 35, priceType: "par intervention", rating: 4.85, reviews: 67, duration: "1-2 heures", images: themeImages.maintenance, hostType: "Professionnel", description: "Intervention rapide pour tout problème technique.", longDescription: "Artisans qualifiés, intervention dans l'heure, devis gratuit." },
  { id: 105, title: "Accueil personnalisé des voyageurs", category: "Services aux hôtes", sousCategorie: "Accueil", location: "Cotonou, Bénin", price: 20, priceType: "par arrivée", rating: 4.97, reviews: 203, duration: "30-60 min", images: themeImages.guide, hostType: "Local", description: "Remise des clés, présentation du logement, conseils.", longDescription: "Accueil chaleureux et professionnel pour vos voyageurs." },
  { id: 106, title: "Équipement de logement", category: "Services aux hôtes", sousCategorie: "Aménagement", location: "Cotonou, Bénin", price: 150, priceType: "forfait", rating: 4.9, reviews: 45, duration: "1-2 jours", images: themeImages.exclusive, hostType: "Professionnel", description: "Fourniture et installation de literie, électroménager.", longDescription: "Pack complet pour équiper votre logement de location." },
  { id: 107, title: "Blanchisserie pour draps et serviettes", category: "Services aux hôtes", sousCategorie: "Entretien", location: "Cotonou, Bénin", price: 12, priceType: "par lot", rating: 4.88, reviews: 78, duration: "24h", images: themeImages.maintenance, hostType: "Local", description: "Nettoyage et repassage du linge de maison.", longDescription: "Livraison à domicile, linge de qualité hôtelière." },
  { id: 108, title: "Copywriting pour annonces", category: "Services aux hôtes", sousCategorie: "Marketing", location: "Cotonou, Bénin", price: 30, priceType: "par annonce", rating: 4.95, reviews: 34, duration: "24-48h", images: themeImages.exclusive, hostType: "Professionnel", description: "Rédaction professionnelle de description en français/anglais.", longDescription: "Textes optimisés pour maximiser vos réservations." },
];

// Services professionnels
const professionalServices = [
  { id: 201, title: "Espace de coworking avec wifi haut débit", category: "Services professionnels", sousCategorie: "Bureau", location: "Cotonou, Bénin", price: 10, priceType: "par jour", rating: 4.92, reviews: 156, duration: "À la demande", images: themeImages.exclusive, hostType: "Professionnel", description: "Espace de travail partagé, climatisé, imprimante, café/thé.", longDescription: "Accès 24h/24, casiers sécurisés, salles de réunion disponibles." },
  { id: 202, title: "Salle de réunion équipée", category: "Services professionnels", sousCategorie: "Bureau", location: "Cotonou, Bénin", price: 50, priceType: "par demi-journée", rating: 4.95, reviews: 67, duration: "4 heures", images: themeImages.exclusive, hostType: "Agence", description: "Salle avec vidéoprojecteur, tableau blanc, wifi haut débit.", longDescription: "Capacité 20 personnes, catering possible sur demande." },
  { id: 203, title: "Service de coursier à moto", category: "Services professionnels", sousCategorie: "Logistique", location: "Cotonou, Bénin", price: 5, priceType: "par course", rating: 4.85, reviews: 234, duration: "15-30 min", images: themeImages.transport, hostType: "Local", description: "Livraison rapide de colis et documents dans Cotonou.", longDescription: "Service fiable, suivi en temps réel." },
  { id: 204, title: "Assistant virtuel personnel", category: "Services professionnels", sousCategorie: "Assistance", location: "Télétravail", price: 12, priceType: "par heure", rating: 4.9, reviews: 89, duration: "À la demande", images: themeImages.exclusive, hostType: "Professionnel", description: "Assistance administrative, prise de rendez-vous, gestion d'emails.", longDescription: "Service disponible en français et anglais." },
  { id: 205, title: "Conseil juridique et fiscal", category: "Services professionnels", sousCategorie: "Juridique", location: "Cotonou, Bénin", price: 75, priceType: "par consultation", rating: 4.98, reviews: 45, duration: "1 heure", images: themeImages.exclusive, hostType: "Cabinet", description: "Conseils sur fiscalité, visas, contrats, formalités.", longDescription: "Cabinet d'avocats spécialisé droit des affaires et droit des étrangers." },
  { id: 206, title: "Interprétariat français/anglais/fon", category: "Services professionnels", sousCategorie: "Traduction", location: "Cotonou, Bénin", price: 40, priceType: "par heure", rating: 4.92, reviews: 34, duration: "1-3 heures", images: themeImages.guide, hostType: "Professionnel", description: "Interprète professionnel pour réunions, conférences, visites.", longDescription: "Interprètes diplômés, disponibles en urgence." },
  { id: 207, title: "Coiffeur et esthéticienne à domicile", category: "Services professionnels", sousCategorie: "Bien-être", location: "Cotonou, Bénin", price: 25, priceType: "par prestation", rating: 4.87, reviews: 78, duration: "1-2 heures", images: themeImages.bienetre, hostType: "Particulier", description: "Coiffure, manucure, soins esthétiques à votre domicile.", longDescription: "Produits professionnels, service à domicile." },
  { id: 208, title: "Coach sportif personnel", category: "Services professionnels", sousCategorie: "Sport", location: "Cotonou, Bénin", price: 20, priceType: "par séance", rating: 4.95, reviews: 56, duration: "1 heure", images: themeImages.bienetre, hostType: "Professionnel", description: "Séances de coaching personnalisées à domicile ou en extérieur.", longDescription: "Coach diplômé, programme adapté à vos objectifs." },
];

// Urgence et assistance
const emergencyServices = [
  { id: 301, title: "Assistance médicale 24/7", category: "Urgence & Assistance", sousCategorie: "Urgence", location: "Cotonou, Bénin", price: 50, priceType: "par consultation", rating: 4.99, reviews: 203, duration: "24h/24", images: themeImages.urgence, hostType: "Professionnel", description: "Médecin généraliste disponible 24h/24, déplacement à domicile.", longDescription: "Téléconsultation possible, médecin francophone." },
  { id: 302, title: "Serrurier d'urgence (24h/24)", category: "Urgence & Assistance", sousCategorie: "Urgence", location: "Cotonou, Bénin", price: 30, priceType: "par intervention", rating: 4.92, reviews: 134, duration: "15-30 min", images: themeImages.urgence, hostType: "Professionnel", description: "Déblocage de portes, changement de serrures, intervention rapide.", longDescription: "Intervention dans les 30 minutes, devis gratuit." },
  { id: 303, title: "Dépannage informatique à domicile", category: "Urgence & Assistance", sousCategorie: "Informatique", location: "Cotonou, Bénin", price: 25, priceType: "par heure", rating: 4.88, reviews: 89, duration: "1-2 heures", images: themeImages.exclusive, hostType: "Professionnel", description: "Réparation d'ordinateurs, installation de logiciels.", longDescription: "Technicien qualifié, pièces de rechange disponibles." },
  { id: 304, title: "Taxi sécurisé avec application", category: "Urgence & Assistance", sousCategorie: "Transport", location: "Cotonou, Bénin", price: 3, priceType: "par course", rating: 4.85, reviews: 456, duration: "Variable", images: themeImages.transport, hostType: "Professionnel", description: "Application mobile pour commander un taxi sécurisé.", longDescription: "Suivi GPS, paiement en ligne, chauffeurs formés." },
  { id: 305, title: "Assistance juridique d'urgence", category: "Urgence & Assistance", sousCategorie: "Juridique", location: "Cotonou, Bénin", price: 60, priceType: "par consultation", rating: 4.95, reviews: 45, duration: "1 heure", images: themeImages.urgence, hostType: "Cabinet", description: "Consultation juridique urgente pour expatriés.", longDescription: "Avocat disponible 7j/7, assistance policière et consulaire." },
  { id: 306, title: "Rapatriement sanitaire (ambulance)", category: "Urgence & Assistance", sousCategorie: "Urgence", location: "National", price: 150, priceType: "par trajet", rating: 4.99, reviews: 28, duration: "Urgence", images: themeImages.urgence, hostType: "Professionnel", description: "Ambulance médicalisée pour transfert vers hôpital.", longDescription: "Disponible 24h/24, équipe médicale à bord." },
  { id: 307, title: "Assistance consulaire (expatriés)", category: "Urgence & Assistance", sousCategorie: "Administratif", location: "Cotonou, Bénin", price: 40, priceType: "par service", rating: 4.92, reviews: 34, duration: "2-3h", images: themeImages.urgence, hostType: "Cabinet", description: "Aide pour démarches consulaires, perte de passeport.", longDescription: "Assistance 24h/24 pour expatriés en difficulté." },
  { id: 308, title: "Dépannage plomberie", category: "Urgence & Assistance", sousCategorie: "Maintenance", location: "Cotonou, Bénin", price: 35, priceType: "par intervention", rating: 4.87, reviews: 78, duration: "1-2h", images: themeImages.maintenance, hostType: "Professionnel", description: "Intervention rapide pour fuites d'eau, canalisations.", longDescription: "Artisan agréé, garantie sur les travaux." },
];

// Services exclusifs
const exclusiveServices = [
  { id: 401, title: "Masseur à domicile (spa privé)", category: "Services exclusifs", sousCategorie: "Bien-être", location: "Cotonou, Bénin", price: 45, priceType: "par séance", rating: 4.99, reviews: 123, duration: "1 heure", images: themeImages.bienetre, hostType: "Professionnel", description: "Massage relaxant ou thérapeutique à votre domicile.", longDescription: "Masseur diplômé, matériel fourni, huiles essentielles." },
  { id: 402, title: "Chef privé pour dîner romantique", category: "Services exclusifs", sousCategorie: "Restauration", location: "Cotonou, Bénin", price: 120, priceType: "par repas", rating: 4.98, reviews: 67, duration: "3-4 heures", images: themeImages.cuisine, hostType: "Particulier", description: "Chef à domicile : cuisine béninoise, française ou fusion.", longDescription: "Menu personnalisé, dressage de table, service à l'assiette." },
  { id: 403, title: "Safari photo (parc Pendjari)", category: "Services exclusifs", sousCategorie: "Aventure", location: "Pendjari, Bénin", price: 150, priceType: "par jour", rating: 4.97, reviews: 89, duration: "Journée", images: themeImages.exclusive, hostType: "Professionnel", description: "Excursion privée dans le parc national de la Pendjari.", longDescription: "Guide spécialisé, véhicule 4x4, repas inclus." },
  { id: 404, title: "Hélicoptère tourisme (survol de Cotonou)", category: "Services exclusifs", sousCategorie: "Tourisme", location: "Cotonou, Bénin", price: 250, priceType: "par personne", rating: 4.99, reviews: 45, duration: "30 min", images: themeImages.exclusive, hostType: "Agence", description: "Survol de Cotonou et de la côte en hélicoptère.", longDescription: "Pilote expérimenté, vue imprenable sur la lagune." },
  { id: 405, title: "Voyage sur mesure (circuit Bénin)", category: "Services exclusifs", sousCategorie: "Tourisme", location: "Bénin (national)", price: 500, priceType: "par séjour", rating: 4.96, reviews: 78, duration: "7 jours", images: themeImages.exclusive, hostType: "Agence", description: "Organisation complète de votre voyage au Bénin.", longDescription: "Circuit personnalisé, hébergement, transport, guides." },
  { id: 406, title: "Photographe professionnel pour événements", category: "Services exclusifs", sousCategorie: "Photographie", location: "Cotonou, Bénin", price: 100, priceType: "par heure", rating: 4.98, reviews: 156, duration: "2-3h", images: themeImages.exclusive, hostType: "Professionnel", description: "Shooting photo pour mariages, anniversaires, séances pro.", longDescription: "Photos haute définition, retouche, album numérique." },
  { id: 407, title: "Location de yacht privé (lac Nokoué)", category: "Services exclusifs", sousCategorie: "Transport", location: "Cotonou, Bénin", price: 200, priceType: "par heure", rating: 4.95, reviews: 34, duration: "1-3 heures", images: themeImages.exclusive, hostType: "Agence", description: "Croisière privée sur le lac Nokoué avec champagne.", longDescription: "Capitaine à bord, service de restauration possible." },
  { id: 408, title: "Cours de cuisine béninoise (chef privé)", category: "Services exclusifs", sousCategorie: "Cuisine", location: "Cotonou, Bénin", price: 60, priceType: "par personne", rating: 4.99, reviews: 89, duration: "3 heures", images: themeImages.cuisine, hostType: "Particulier", description: "Atelier de cuisine béninoise traditionnelle.", longDescription: "Préparation de pâte, sauce arachide, akassa, etc." },
];

const serviceCategories = [
  "Tous",
  "Services aux voyageurs",
  "Services aux hôtes",
  "Services professionnels",
  "Urgence & Assistance",
  "Services exclusifs"
];

export default function Services() {
  const navigate = useNavigate();
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guestCounts, setGuestCounts] = useState({ adults: 0, children: 0, babies: 0, pets: 0 });
  const [activeTab, setActiveTab] = useState<"destination" | "dates" | "guests" | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [selectedServiceType, setSelectedServiceType] = useState("");
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [serviceTypeOpen, setServiceTypeOpen] = useState(false);

  const guestLabel = () => {
    const totalGuests = guestCounts.adults + guestCounts.children;
    const parts = [];
    if (totalGuests > 0) parts.push(`${totalGuests} voyageur${totalGuests > 1 ? "s" : ""}`);
    if (guestCounts.babies > 0) parts.push(`${guestCounts.babies} bébé${guestCounts.babies > 1 ? "s" : ""}`);
    if (guestCounts.pets > 0) parts.push(`${guestCounts.pets} animal${guestCounts.pets > 1 ? "s" : ""}`);
    return parts.length > 0 ? parts.join(" · ") : "Ajouter des voyageurs";
  };

  const travelDestinations = ["Cotonou", "Porto-Novo", "Ouidah", "Grand-Popo", "Abomey", "Parakou", "Natitingou", "Pendjari"];

  const getServicesByCategory = () => {
    if (selectedCategory === "Tous") {
      return [...travelServices, ...hostServices, ...professionalServices, ...emergencyServices, ...exclusiveServices];
    }
    switch (selectedCategory) {
      case "Services aux voyageurs": return travelServices;
      case "Services aux hôtes": return hostServices;
      case "Services professionnels": return professionalServices;
      case "Urgence & Assistance": return emergencyServices;
      case "Services exclusifs": return exclusiveServices;
      default: return [];
    }
  };

  const displayedServices = getServicesByCategory();

  const getProgramSteps = (service: any) => [
    `Prise de contact et confirmation de rendez-vous à ${service.location}`,
    `Déroulement du service selon vos besoins spécifiques`,
    `Réalisation de la prestation par un professionnel qualifié`,
    `Suivi de satisfaction et facturation`,
  ];

  const getServiceReviews = (service: any) => generateServiceReviews(service.title, service.location);

  const ServiceCard = ({ service }: { service: any }) => (
    <div className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1" onClick={() => setSelectedService(service)}>
      <div className="relative h-48 overflow-hidden">
        <img src={encodeURI(service.images[0])} alt={service.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full px-2 py-1 text-xs font-semibold text-[#00c9a7]">{service.sousCategorie}</div>
        <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">{service.location}</div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-[#0F2940] text-base leading-tight line-clamp-2">{service.title}</h3>
          <div className="flex items-center gap-1 ml-2"><Star className="w-3 h-3 fill-current text-[#00c9a7]" /><span className="text-xs font-medium">{service.rating}</span></div>
        </div>
        <p className="text-xs text-gray-500 mb-2">{service.duration}</p>
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{service.description}</p>
        <div className="flex justify-between items-center">
          <div><span className="font-bold text-[#0F2940] text-lg">{service.price} €</span><span className="text-xs text-gray-500"> / {service.priceType}</span></div>
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors"><Heart className="w-4 h-4 text-gray-400" /></button>
        </div>
      </div>
    </div>
  );

  // Modal de détail
  const ServiceDetailModal = ({ service, onClose }: { service: any; onClose: () => void }) => {
    const [currentImage, setCurrentImage] = useState(0);
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
      const interval = setInterval(() => {
        setAnimate(true);
        setTimeout(() => {
          setCurrentImage((prev) => (prev + 1) % service.images.length);
          setAnimate(false);
        }, 300);
      }, 5000);
      return () => clearInterval(interval);
    }, [service.images.length]);

    const nextImage = () => setCurrentImage((prev) => (prev + 1) % service.images.length);
    const prevImage = () => setCurrentImage((prev) => (prev - 1 + service.images.length) % service.images.length);
    const reviews = getServiceReviews(service);
    const programSteps = getProgramSteps(service);

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 text-[#0F2940]">
        <div className="mx-auto max-w-6xl bg-white rounded-[32px] shadow-2xl overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm text-gray-500">{service.location}</p>
              <h2 className="text-3xl font-semibold text-[#0F2940] mt-2">{service.title}</h2>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span>{service.rating} · {service.reviews} évaluations</span>
                <span>Hôte : {service.hostType}</span>
                <span>À partir de {service.price} € {service.priceType}</span>
              </div>
            </div>
            <button onClick={onClose} className="rounded-full border border-gray-200 bg-white p-3 text-gray-700 hover:bg-gray-100"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr] p-6">
            <div className="space-y-6">
              <div className="relative">
                <div className="grid grid-cols-4 gap-2">
                  {service.images.map((img: string, idx: number) => (
                    <img key={idx} src={encodeURI(img)} alt={`Photo ${idx + 1}`} className="h-32 w-full rounded-xl object-cover cursor-pointer" onClick={() => setCurrentImage(idx)} />
                  ))}
                </div>
                <div className="relative mt-2 overflow-hidden rounded-2xl">
                  <img src={encodeURI(service.images[currentImage])} alt={service.title} className="w-full h-96 object-cover transition-all duration-300" />
                  {service.images.length > 1 && (<><button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur rounded-full p-2 hover:bg-white"><ChevronLeft className="w-6 h-6" /></button><button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur rounded-full p-2 hover:bg-white"><ChevronRight className="w-6 h-6" /></button></>)}
                </div>
              </div>
              <div><h3 className="text-xl font-semibold text-[#0F2940] mb-4">Description</h3><p className="text-gray-700 leading-relaxed">{service.longDescription || service.description}</p></div>
              <div><h3 className="text-xl font-semibold text-[#0F2940] mb-4">Déroulement</h3><div className="space-y-3">{programSteps.map((step, idx) => (<div key={idx} className="rounded-3xl border border-gray-200 bg-gray-50 p-4"><p className="font-semibold">{`Étape ${idx + 1}`}</p><p className="mt-2 text-sm">{step}</p></div>))}</div></div>
              <div><h3 className="text-xl font-semibold text-[#0F2940] mb-4">Avis des clients</h3><div className="space-y-4">{reviews.map((review, idx) => (<div key={idx} className="rounded-3xl border border-gray-200 p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold text-[#0F2940]">{review.name}</p><p className="text-sm text-gray-500">{review.location} · {review.daysAgo}</p></div><span className="rounded-full bg-[#00c9a7]/10 px-3 py-1 text-sm text-[#0F2940]">{review.rating.toFixed(1)}</span></div><p className="mt-3 text-sm text-gray-700">{review.text}</p></div>))}</div></div>
            </div>
            <aside className="space-y-6 rounded-3xl border border-gray-200 bg-[#f8fafb] p-6">
              <div><p className="text-sm font-semibold text-gray-700">À savoir</p><ul className="mt-4 space-y-3 text-sm text-gray-600"><li>Durée : {service.duration}</li><li>Langue : Français, Anglais sur demande</li><li>Service professionnel certifié</li><li>Annulation gratuite 24h avant</li></ul></div>
              <div className="rounded-3xl bg-white p-4 shadow-sm"><p className="text-sm text-gray-500">Lieu du service</p><p className="mt-2 font-medium text-[#0F2940]">{service.location}</p></div>
              <button className="w-full rounded-full bg-[#00c9a7] px-5 py-3 text-sm font-semibold text-[#0F2940] hover:bg-[#00b892] transition-colors">Réserver ce service</button>
            </aside>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Barre de recherche sticky (fixe en haut) */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md shadow-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-center">
            <div className="relative w-full max-w-5xl">
              <div className="bg-white rounded-full shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 p-2">
                  {/* Destination */}
                  <div className="relative flex-[1.5]">
                    <button onClick={() => setActiveTab(activeTab === "destination" ? null : "destination")} className={`w-full text-left px-5 sm:px-7 py-3.5 rounded-full transition-all ${activeTab === "destination" ? "bg-gray-50 shadow-inner" : "hover:bg-gray-50"}`}>
                      <div className="text-xs font-medium text-gray-700">Destination</div>
                      <div className="text-sm text-gray-900 truncate">{destination || "Rechercher une destination"}</div>
                    </button>
                    {activeTab === "destination" && (<><div className="fixed inset-0 z-40" onClick={() => setActiveTab(null)}></div><div className="absolute top-full left-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50"><div className="p-4"><div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">Où souhaitez-vous un service ?</h3><button onClick={() => setActiveTab(null)} className="p-1 rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button></div><input type="text" placeholder="Rechercher une ville" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c9a7]" value={destination} onChange={(e) => setDestination(e.target.value)} /><div className="mt-4 space-y-2 max-h-96 overflow-y-auto"><div className="font-semibold text-sm text-gray-500 mb-2">Destinations populaires</div>{travelDestinations.map((place) => (<button key={place} onClick={() => { setDestination(place); setActiveTab(null); }} className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors"><div className="font-medium">{place}</div><div className="text-sm text-gray-500">Bénin</div></button>))}</div></div></div></>)}
                  </div>
                  <div className="hidden sm:block w-px h-8 bg-gray-200"></div><div className="sm:hidden h-px w-full bg-gray-200"></div>
                  {/* Dates */}
                  <div className="relative flex-1"><button onClick={() => setActiveTab(activeTab === "dates" ? null : "dates")} className="w-full text-left px-5 sm:px-7 py-3.5 rounded-full transition-all hover:bg-gray-50"><div className="text-xs font-medium text-gray-700">Dates</div><div className="text-sm text-gray-900">{checkIn && checkOut ? `${checkIn} → ${checkOut}` : "Quand ?"}</div></button></div>
                  <div className="hidden sm:block w-px h-8 bg-gray-200"></div><div className="sm:hidden h-px w-full bg-gray-200"></div>
                  {/* Type de service - SELECTEUR */}
                  <div className="relative flex-1">
                    <button onClick={() => setServiceTypeOpen(!serviceTypeOpen)} className="w-full text-left px-5 sm:px-7 py-3.5 rounded-full transition-all hover:bg-gray-50">
                      <div className="text-xs font-medium text-gray-700">Type de service</div>
                      <div className="text-sm text-gray-900 truncate">{selectedServiceType || "Sélectionner"}</div>
                    </button>
                    {serviceTypeOpen && (<><div className="fixed inset-0 z-40" onClick={() => setServiceTypeOpen(false)}></div><div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50"><div className="p-2"><div className="flex items-center justify-between p-2 border-b"><span className="font-semibold">Choisissez un type</span><button onClick={() => setServiceTypeOpen(false)}><X className="w-4 h-4" /></button></div><div className="py-2">{serviceCategories.filter(c => c !== "Tous").map((cat) => (<button key={cat} onClick={() => { setSelectedServiceType(cat); setSelectedCategory(cat); setServiceTypeOpen(false); }} className="w-full text-left px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors text-sm">{cat}</button>))}</div></div></div></>)}
                  </div>
                  {/* Bouton recherche */}
                  <button className="bg-[#00c9a7] text-[#0F2940] rounded-full p-4 hover:bg-[#00b892] transition-colors ml-0 sm:ml-2 mt-2 sm:mt-0"><Search className="w-5 h-5" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero / Bannière */}
      <section className="relative bg-gradient-to-r from-[#0F2940] to-[#1a3f5c] py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Services au Bénin</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">Tous les services dont vous avez besoin, partout au Bénin. Transport, ménage, assistance, bien-être et plus.</p>
        </div>
      </section>

      {/* Filtres par catégorie */}
      <div className="sticky top-[73px] z-20 bg-white border-b border-gray-200 py-3 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 sm:gap-4">
            {serviceCategories.map((cat) => (<button key={cat} onClick={() => { setSelectedCategory(cat); setSelectedServiceType(cat === "Tous" ? "" : cat); }} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat ? "bg-[#00c9a7] text-[#0F2940] shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>{cat}</button>))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {selectedCategory === "Tous" || selectedCategory === "Services aux voyageurs" ? (<div className="mb-12"><h2 className="text-2xl font-semibold text-[#0F2940] mb-2">Services aux voyageurs</h2><p className="text-gray-600 mb-6">Transferts, visites guidées, assistance, location – tout pour un séjour réussi.</p><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{travelServices.map(service => (<ServiceCard key={service.id} service={service} />))}</div></div>) : null}
        {selectedCategory === "Tous" || selectedCategory === "Services aux hôtes" ? (<div className="mb-12"><h2 className="text-2xl font-semibold text-[#0F2940] mb-2">Services aux hôtes & propriétaires</h2><p className="text-gray-600 mb-6">Gestion locative, ménage, photographie, maintenance – maximisez vos revenus.</p><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{hostServices.map(service => (<ServiceCard key={service.id} service={service} />))}</div></div>) : null}
        {selectedCategory === "Tous" || selectedCategory === "Services professionnels" ? (<div className="mb-12"><h2 className="text-2xl font-semibold text-[#0F2940] mb-2">Services professionnels</h2><p className="text-gray-600 mb-6">Coworking, salles de réunion, assistance virtuelle, conseil juridique.</p><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{professionalServices.map(service => (<ServiceCard key={service.id} service={service} />))}</div></div>) : null}
        {selectedCategory === "Tous" || selectedCategory === "Urgence & Assistance" ? (<div className="mb-12"><h2 className="text-2xl font-semibold text-[#0F2940] mb-2">Urgence & Assistance</h2><p className="text-gray-600 mb-6">Services d'urgence 24h/24 : médical, serrurier, dépannage, assistance consulaire.</p><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{emergencyServices.map(service => (<ServiceCard key={service.id} service={service} />))}</div></div>) : null}
        {selectedCategory === "Tous" || selectedCategory === "Services exclusifs" ? (<div className="mb-12"><h2 className="text-2xl font-semibold text-[#0F2940] mb-2">Services exclusifs</h2><p className="text-gray-600 mb-6">Bien-être, gastronomie, aventure, luxe – pour des moments d'exception.</p><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{exclusiveServices.map(service => (<ServiceCard key={service.id} service={service} />))}</div></div>) : null}
      </main>

      {/* Modal de détail */}
      {selectedService && <ServiceDetailModal service={selectedService} onClose={() => setSelectedService(null)} />}
    </div>
  );
}