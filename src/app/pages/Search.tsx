import { useState } from "react";
import { useNavigate } from "react-router";
import { Star, Globe, Home as HomeIcon, Building2, Sparkles, Search as SearchIcon, Calendar, Users, X, ChevronLeft, ChevronRight, ArrowRight, MapPin, Heart, Bath, Bed, Filter, ChevronDown } from "lucide-react";

// Données des cartes héros
const heroCards = [
  {
    icon: Sparkles,
    title: "Expériences béninoises",
    description: "Découvrez des séjours surprenants et des activités locales au Bénin.",
  },
  {
    icon: Globe,
    title: "Voyages sûrs au Bénin",
    description: "Réservations fiables avec support et paiement sécurisé pour le Bénin.",
  },
  {
    icon: HomeIcon,
    title: "Hébergements vérifiés",
    description: "Logements authentiques sélectionnés pour votre séjour béninois.",
  },
];

// ---- DONNÉES ENRICHIES (inchangées) ----
const formatPrice = (price: number) => `${price.toLocaleString()} FCFA / nuit`;

// Logements populaires (8)
const popularProperties = [
  { id: 1, title: "Villa luxueuse avec piscine", location: "Fidjrossè, Cotonou", price: 125000, priceDisplay: formatPrice(125000), rating: 4.9, reviews: 128, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80", beds: 4, baths: 3, type: "Villa", category: "popular", city: "Fidjrossè", description: "Magnifique villa avec piscine privée, jardin tropical et vue imprenable." },
  { id: 2, title: "Appartement moderne vue mer", location: "Haie Vive, Cotonou", price: 85000, priceDisplay: formatPrice(85000), rating: 4.8, reviews: 94, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80", beds: 2, baths: 2, type: "Appartement", category: "popular", city: "Cotonou", description: "Appartement chic avec vue sur l'océan, terrasse privée." },
  { id: 3, title: "Studio cosy centre ville", location: "Cocotiers, Cotonou", price: 35000, priceDisplay: formatPrice(35000), rating: 4.7, reviews: 56, image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80", beds: 1, baths: 1, type: "Studio", category: "popular", city: "Cotonou", description: "Studio confortable en plein cœur de Cotonou." },
  { id: 101, title: "Loft design avec rooftop", location: "Ganhi, Cotonou", price: 95000, priceDisplay: formatPrice(95000), rating: 4.9, reviews: 42, image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80", beds: 2, baths: 2, type: "Loft", category: "popular", city: "Cotonou", description: "Loft lumineux avec terrasse privée sur le toit." },
  { id: 102, title: "Maison de ville traditionnelle", location: "Akpakpa, Cotonou", price: 55000, priceDisplay: formatPrice(55000), rating: 4.6, reviews: 67, image: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80", beds: 3, baths: 2, type: "Maison", category: "popular", city: "Akpakpa", description: "Maison authentique avec cour intérieure." },
  { id: 103, title: "Duplex moderne", location: "Patte d'Oie, Cotonou", price: 110000, priceDisplay: formatPrice(110000), rating: 4.8, reviews: 33, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80", beds: 3, baths: 3, type: "Duplex", category: "popular", city: "Cotonou", description: "Duplex contemporain avec grande terrasse." },
  { id: 104, title: "Villa de charme", location: "Fidjrossè, Cotonou", price: 135000, priceDisplay: formatPrice(135000), rating: 4.9, reviews: 78, image: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=80", beds: 4, baths: 3, type: "Villa", category: "popular", city: "Fidjrossè", description: "Villa raffinée avec piscine à débordement." },
  { id: 105, title: "Studio design", location: "Haie Vive, Cotonou", price: 45000, priceDisplay: formatPrice(45000), rating: 4.7, reviews: 44, image: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=1200&q=80", beds: 1, baths: 1, type: "Studio", category: "popular", city: "Cotonou", description: "Studio moderne, entièrement équipé." }
];

// Hôtels superbes (8)
const hotelsProperties = [
  { id: 4, title: "Hôtel Golden Tulip", location: "Cotonou", price: 150000, priceDisplay: formatPrice(150000), rating: 4.9, reviews: 342, image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80", beds: 2, baths: 2, type: "Hôtel", category: "hotels", city: "Cotonou", description: "Hôtel 5 étoiles avec spa, piscine et restaurant gastronomique." },
  { id: 5, title: "Novotel Cotonou", location: "Cotonou", price: 120000, priceDisplay: formatPrice(120000), rating: 4.8, reviews: 267, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80", beds: 2, baths: 2, type: "Hôtel", category: "hotels", city: "Cotonou", description: "Hôtel d'affaires avec vue sur le lagon." },
  { id: 6, title: "Azalaï Hôtel", location: "Cotonou", price: 95000, priceDisplay: formatPrice(95000), rating: 4.7, reviews: 189, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80", beds: 2, baths: 1, type: "Hôtel", category: "hotels", city: "Cotonou", description: "Hôtel confortable avec piscine et restaurant." },
  { id: 106, title: "Radisson Blu", location: "Cotonou", price: 170000, priceDisplay: formatPrice(170000), rating: 4.9, reviews: 210, image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=80", beds: 2, baths: 2, type: "Hôtel", category: "hotels", city: "Cotonou", description: "Luxe moderne, piscine extérieure, fitness." },
  { id: 107, title: "Sunset Beach Resort", location: "Grand-Popo", price: 185000, priceDisplay: formatPrice(185000), rating: 4.8, reviews: 156, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80", beds: 2, baths: 2, type: "Resort", category: "hotels", city: "Grand-Popo", description: "Resort de bord de mer, plage privée." },
  { id: 108, title: "Hotel du Lac", location: "Cotonou", price: 105000, priceDisplay: formatPrice(105000), rating: 4.6, reviews: 98, image: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80", beds: 2, baths: 1, type: "Hôtel", category: "hotels", city: "Cotonou", description: "Hôtel au bord du lac." },
  { id: 109, title: "Oasis Hotel", location: "Porto-Novo", price: 80000, priceDisplay: formatPrice(80000), rating: 4.5, reviews: 74, image: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=1200&q=80", beds: 1, baths: 1, type: "Hôtel", category: "hotels", city: "Porto-Novo", description: "Hôtel confortable proche du centre." },
  { id: 110, title: "Royal Palm", location: "Cotonou", price: 200000, priceDisplay: formatPrice(200000), rating: 4.9, reviews: 287, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80", beds: 2, baths: 2, type: "Hôtel", category: "hotels", city: "Cotonou", description: "Hôtel de luxe, suites présidentielles." }
];

// Porto-Novo (8)
const portonovoProperties = [
  { id: 7, title: "Maison traditionnelle", location: "Porto-Novo", price: 45000, priceDisplay: formatPrice(45000), rating: 4.6, reviews: 45, image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80", beds: 3, baths: 2, type: "Maison", category: "portonovo", city: "Porto-Novo", description: "Authentique maison traditionnelle." },
  { id: 8, title: "Appartement moderne", location: "Porto-Novo", price: 55000, priceDisplay: formatPrice(55000), rating: 4.7, reviews: 38, image: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=1200&q=80", beds: 2, baths: 1, type: "Appartement", category: "portonovo", city: "Porto-Novo", description: "Appartement moderne avec vue sur la ville." },
  { id: 111, title: "Villa fleurie", location: "Porto-Novo", price: 75000, priceDisplay: formatPrice(75000), rating: 4.8, reviews: 22, image: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=80", beds: 3, baths: 2, type: "Villa", category: "portonovo", city: "Porto-Novo", description: "Villa avec jardin tropical." },
  { id: 112, title: "Studio cosy", location: "Porto-Novo", price: 30000, priceDisplay: formatPrice(30000), rating: 4.4, reviews: 31, image: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=1200&q=80", beds: 1, baths: 1, type: "Studio", category: "portonovo", city: "Porto-Novo", description: "Petit studio fonctionnel." },
  { id: 113, title: "Duplex familial", location: "Porto-Novo", price: 85000, priceDisplay: formatPrice(85000), rating: 4.7, reviews: 19, image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80", beds: 4, baths: 2, type: "Duplex", category: "portonovo", city: "Porto-Novo", description: "Duplex spacieux." },
  { id: 114, title: "Maison de ville", location: "Porto-Novo", price: 60000, priceDisplay: formatPrice(60000), rating: 4.6, reviews: 27, image: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80", beds: 3, baths: 2, type: "Maison", category: "portonovo", city: "Porto-Novo", description: "Maison de ville avec patio." },
  { id: 115, title: "Loft contemporary", location: "Porto-Novo", price: 68000, priceDisplay: formatPrice(68000), rating: 4.8, reviews: 24, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80", beds: 2, baths: 1, type: "Loft", category: "portonovo", city: "Porto-Novo", description: "Loft design." },
  { id: 116, title: "Appartement terrasse", location: "Porto-Novo", price: 50000, priceDisplay: formatPrice(50000), rating: 4.5, reviews: 18, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80", beds: 2, baths: 1, type: "Appartement", category: "portonovo", city: "Porto-Novo", description: "Appartement lumineux avec terrasse." }
];

// Abomey-Calavi (8)
const abomeycalaviProperties = [
  { id: 9, title: "Villa calme", location: "Abomey-Calavi", price: 65000, priceDisplay: formatPrice(65000), rating: 4.8, reviews: 52, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80", beds: 3, baths: 2, type: "Villa", category: "abomeycalavi", city: "Abomey-Calavi", description: "Villa paisible." },
  { id: 121, title: "Appartement moderne", location: "Abomey-Calavi", price: 40000, priceDisplay: formatPrice(40000), rating: 4.5, reviews: 33, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80", beds: 2, baths: 1, type: "Appartement", category: "abomeycalavi", city: "Abomey-Calavi", description: "Appartement fonctionnel." },
  { id: 122, title: "Studio économique", location: "Abomey-Calavi", price: 25000, priceDisplay: formatPrice(25000), rating: 4.3, reviews: 44, image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80", beds: 1, baths: 1, type: "Studio", category: "abomeycalavi", city: "Abomey-Calavi", description: "Petit studio idéal." },
  { id: 123, title: "Maison familiale", location: "Abomey-Calavi", price: 80000, priceDisplay: formatPrice(80000), rating: 4.7, reviews: 28, image: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80", beds: 4, baths: 3, type: "Maison", category: "abomeycalavi", city: "Abomey-Calavi", description: "Grande maison avec jardin." },
  { id: 124, title: "Villa avec piscine", location: "Abomey-Calavi", price: 120000, priceDisplay: formatPrice(120000), rating: 4.9, reviews: 17, image: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=80", beds: 4, baths: 3, type: "Villa", category: "abomeycalavi", city: "Abomey-Calavi", description: "Villa de luxe avec piscine." },
  { id: 125, title: "Loft moderne", location: "Abomey-Calavi", price: 55000, priceDisplay: formatPrice(55000), rating: 4.6, reviews: 22, image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80", beds: 2, baths: 1, type: "Loft", category: "abomeycalavi", city: "Abomey-Calavi", description: "Loft contemporain." },
  { id: 126, title: "Duplex avec terrasse", location: "Abomey-Calavi", price: 70000, priceDisplay: formatPrice(70000), rating: 4.7, reviews: 19, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80", beds: 3, baths: 2, type: "Duplex", category: "abomeycalavi", city: "Abomey-Calavi", description: "Duplex tout confort." },
  { id: 127, title: "Studio design", location: "Abomey-Calavi", price: 30000, priceDisplay: formatPrice(30000), rating: 4.4, reviews: 31, image: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=1200&q=80", beds: 1, baths: 1, type: "Studio", category: "abomeycalavi", city: "Abomey-Calavi", description: "Studio moderne." }
];

// Akpakpa (8)
const akpakpaProperties = [
  { id: 10, title: "Studio économique", location: "Akpakpa, Cotonou", price: 25000, priceDisplay: formatPrice(25000), rating: 4.5, reviews: 67, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80", beds: 1, baths: 1, type: "Studio", category: "akpakpa", city: "Akpakpa", description: "Studio économique bien situé." },
  { id: 131, title: "Appartement confort", location: "Akpakpa, Cotonou", price: 40000, priceDisplay: formatPrice(40000), rating: 4.6, reviews: 43, image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80", beds: 2, baths: 1, type: "Appartement", category: "akpakpa", city: "Akpakpa", description: "Appartement calme." },
  { id: 132, title: "Villa moderne", location: "Akpakpa, Cotonou", price: 85000, priceDisplay: formatPrice(85000), rating: 4.7, reviews: 28, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80", beds: 3, baths: 2, type: "Villa", category: "akpakpa", city: "Akpakpa", description: "Villa contemporaine." },
  { id: 133, title: "Duplex lumineux", location: "Akpakpa, Cotonou", price: 60000, priceDisplay: formatPrice(60000), rating: 4.5, reviews: 34, image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80", beds: 2, baths: 2, type: "Duplex", category: "akpakpa", city: "Akpakpa", description: "Duplex traversant." },
  { id: 134, title: "Maison traditionnelle", location: "Akpakpa, Cotonou", price: 50000, priceDisplay: formatPrice(50000), rating: 4.4, reviews: 39, image: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80", beds: 3, baths: 2, type: "Maison", category: "akpakpa", city: "Akpakpa", description: "Maison de caractère." },
  { id: 135, title: "Studio moderne", location: "Akpakpa, Cotonou", price: 30000, priceDisplay: formatPrice(30000), rating: 4.5, reviews: 51, image: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=1200&q=80", beds: 1, baths: 1, type: "Studio", category: "akpakpa", city: "Akpakpa", description: "Studio rénové." },
  { id: 136, title: "Appartement vue mer", location: "Akpakpa, Cotonou", price: 70000, priceDisplay: formatPrice(70000), rating: 4.8, reviews: 23, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80", beds: 2, baths: 1, type: "Appartement", category: "akpakpa", city: "Akpakpa", description: "Appartement avec vue sur l'océan." },
  { id: 137, title: "Loft industriel", location: "Akpakpa, Cotonou", price: 65000, priceDisplay: formatPrice(65000), rating: 4.7, reviews: 27, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80", beds: 2, baths: 1, type: "Loft", category: "akpakpa", city: "Akpakpa", description: "Loft industriel chic." }
];

// Menontin (8)
const menontinProperties = [
  { id: 11, title: "Appartement confort", location: "Menontin, Cotonou", price: 40000, priceDisplay: formatPrice(40000), rating: 4.6, reviews: 43, image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80", beds: 2, baths: 1, type: "Appartement", category: "menontin", city: "Menontin", description: "Appartement confortable." },
  { id: 141, title: "Studio cosy", location: "Menontin, Cotonou", price: 28000, priceDisplay: formatPrice(28000), rating: 4.4, reviews: 52, image: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=1200&q=80", beds: 1, baths: 1, type: "Studio", category: "menontin", city: "Menontin", description: "Petit studio bien agencé." },
  { id: 142, title: "Villa avec jardin", location: "Menontin, Cotonou", price: 85000, priceDisplay: formatPrice(85000), rating: 4.8, reviews: 31, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80", beds: 3, baths: 2, type: "Villa", category: "menontin", city: "Menontin", description: "Villa spacieuse, jardin arboré." },
  { id: 143, title: "Duplex familial", location: "Menontin, Cotonou", price: 65000, priceDisplay: formatPrice(65000), rating: 4.6, reviews: 28, image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80", beds: 4, baths: 2, type: "Duplex", category: "menontin", city: "Menontin", description: "Duplex avec deux chambres." },
  { id: 144, title: "Maison de charme", location: "Menontin, Cotonou", price: 50000, priceDisplay: formatPrice(50000), rating: 4.5, reviews: 36, image: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80", beds: 3, baths: 2, type: "Maison", category: "menontin", city: "Menontin", description: "Maison de ville rénovée." },
  { id: 145, title: "Appartement moderne", location: "Menontin, Cotonou", price: 45000, priceDisplay: formatPrice(45000), rating: 4.7, reviews: 41, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80", beds: 2, baths: 1, type: "Appartement", category: "menontin", city: "Menontin", description: "Appartement entièrement meublé." },
  { id: 146, title: "Loft design", location: "Menontin, Cotonou", price: 58000, priceDisplay: formatPrice(58000), rating: 4.8, reviews: 22, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80", beds: 2, baths: 1, type: "Loft", category: "menontin", city: "Menontin", description: "Loft décoré avec goût." },
  { id: 147, title: "Studio dernier étage", location: "Menontin, Cotonou", price: 33000, priceDisplay: formatPrice(33000), rating: 4.5, reviews: 29, image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80", beds: 1, baths: 1, type: "Studio", category: "menontin", city: "Menontin", description: "Studio sous toit." }
];

// Fidjrossè (8)
const fidjrosseProperties = [
  { id: 1, title: "Villa luxueuse avec piscine", location: "Fidjrossè, Cotonou", price: 125000, priceDisplay: formatPrice(125000), rating: 4.9, reviews: 128, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80", beds: 4, baths: 3, type: "Villa", category: "fidjrosse", city: "Fidjrossè", description: "Magnifique villa." },
  { id: 151, title: "Appartement vue mer", location: "Fidjrossè, Cotonou", price: 85000, priceDisplay: formatPrice(85000), rating: 4.8, reviews: 67, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80", beds: 2, baths: 2, type: "Appartement", category: "fidjrosse", city: "Fidjrossè", description: "Appartement avec vue sur l'océan." },
  { id: 152, title: "Studio bord de mer", location: "Fidjrossè, Cotonou", price: 45000, priceDisplay: formatPrice(45000), rating: 4.5, reviews: 44, image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80", beds: 1, baths: 1, type: "Studio", category: "fidjrosse", city: "Fidjrossè", description: "Studio à 200m de la plage." },
  { id: 153, title: "Villa avec piscine", location: "Fidjrossè, Cotonou", price: 145000, priceDisplay: formatPrice(145000), rating: 4.9, reviews: 52, image: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=80", beds: 5, baths: 4, type: "Villa", category: "fidjrosse", city: "Fidjrossè", description: "Grande villa avec piscine." },
  { id: 154, title: "Duplex moderne", location: "Fidjrossè, Cotonou", price: 95000, priceDisplay: formatPrice(95000), rating: 4.7, reviews: 38, image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80", beds: 3, baths: 2, type: "Duplex", category: "fidjrosse", city: "Fidjrossè", description: "Duplex contemporain." },
  { id: 155, title: "Loft chic", location: "Fidjrossè, Cotonou", price: 70000, priceDisplay: formatPrice(70000), rating: 4.8, reviews: 29, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80", beds: 2, baths: 1, type: "Loft", category: "fidjrosse", city: "Fidjrossè", description: "Loft design." },
  { id: 156, title: "Maison de plage", location: "Fidjrossè, Cotonou", price: 110000, priceDisplay: formatPrice(110000), rating: 4.8, reviews: 41, image: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80", beds: 3, baths: 3, type: "Maison", category: "fidjrosse", city: "Fidjrossè", description: "Maison de plage avec accès direct à la mer." },
  { id: 157, title: "Studio cosy", location: "Fidjrossè, Cotonou", price: 35000, priceDisplay: formatPrice(35000), rating: 4.4, reviews: 63, image: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=1200&q=80", beds: 1, baths: 1, type: "Studio", category: "fidjrosse", city: "Fidjrossè", description: "Petit studio bien situé." }
];

// Abomey (8)
const abomeyProperties = [
  { id: 12, title: "Villa Abomey", location: "Abomey", price: 70000, priceDisplay: formatPrice(70000), rating: 4.7, reviews: 34, image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80", beds: 3, baths: 2, type: "Villa", category: "abomey", city: "Abomey", description: "Villa historique." },
  { id: 161, title: "Maison traditionnelle", location: "Abomey", price: 45000, priceDisplay: formatPrice(45000), rating: 4.5, reviews: 28, image: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80", beds: 3, baths: 2, type: "Maison", category: "abomey", city: "Abomey", description: "Maison ancienne rénovée." },
  { id: 162, title: "Appartement centre", location: "Abomey", price: 35000, priceDisplay: formatPrice(35000), rating: 4.4, reviews: 33, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80", beds: 2, baths: 1, type: "Appartement", category: "abomey", city: "Abomey", description: "Appartement en centre-ville." },
  { id: 163, title: "Studio confort", location: "Abomey", price: 25000, priceDisplay: formatPrice(25000), rating: 4.3, reviews: 41, image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80", beds: 1, baths: 1, type: "Studio", category: "abomey", city: "Abomey", description: "Studio fonctionnel." },
  { id: 164, title: "Villa avec jardin", location: "Abomey", price: 80000, priceDisplay: formatPrice(80000), rating: 4.8, reviews: 22, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80", beds: 4, baths: 3, type: "Villa", category: "abomey", city: "Abomey", description: "Villa spacieuse." },
  { id: 165, title: "Loft moderne", location: "Abomey", price: 52000, priceDisplay: formatPrice(52000), rating: 4.6, reviews: 19, image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80", beds: 2, baths: 1, type: "Loft", category: "abomey", city: "Abomey", description: "Loft contemporain." },
  { id: 166, title: "Duplex famille", location: "Abomey", price: 65000, priceDisplay: formatPrice(65000), rating: 4.7, reviews: 27, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80", beds: 3, baths: 2, type: "Duplex", category: "abomey", city: "Abomey", description: "Duplex lumineux." },
  { id: 167, title: "Maison de ville", location: "Abomey", price: 48000, priceDisplay: formatPrice(48000), rating: 4.5, reviews: 31, image: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=1200&q=80", beds: 3, baths: 2, type: "Maison", category: "abomey", city: "Abomey", description: "Maison de ville avec parking." }
];

// Parakou (8)
const parakouProperties = [
  { id: 13, title: "Parakou Lodge", location: "Parakou", price: 60000, priceDisplay: formatPrice(60000), rating: 4.5, reviews: 28, image: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=1200&q=80", beds: 2, baths: 2, type: "Lodge", category: "parakou", city: "Parakou", description: "Lodge confortable." },
  { id: 171, title: "Appartement moderne", location: "Parakou", price: 45000, priceDisplay: formatPrice(45000), rating: 4.4, reviews: 35, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80", beds: 2, baths: 1, type: "Appartement", category: "parakou", city: "Parakou", description: "Appartement neuf." },
  { id: 172, title: "Villa calme", location: "Parakou", price: 75000, priceDisplay: formatPrice(75000), rating: 4.7, reviews: 22, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80", beds: 3, baths: 2, type: "Villa", category: "parakou", city: "Parakou", description: "Villa au calme." },
  { id: 173, title: "Studio cosy", location: "Parakou", price: 28000, priceDisplay: formatPrice(28000), rating: 4.3, reviews: 44, image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80", beds: 1, baths: 1, type: "Studio", category: "parakou", city: "Parakou", description: "Petit studio économique." },
  { id: 174, title: "Duplex moderne", location: "Parakou", price: 68000, priceDisplay: formatPrice(68000), rating: 4.6, reviews: 19, image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80", beds: 3, baths: 2, type: "Duplex", category: "parakou", city: "Parakou", description: "Duplex lumineux." },
  { id: 175, title: "Maison familiale", location: "Parakou", price: 55000, priceDisplay: formatPrice(55000), rating: 4.5, reviews: 27, image: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80", beds: 3, baths: 2, type: "Maison", category: "parakou", city: "Parakou", description: "Grande maison." },
  { id: 176, title: "Loft design", location: "Parakou", price: 50000, priceDisplay: formatPrice(50000), rating: 4.7, reviews: 18, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80", beds: 2, baths: 1, type: "Loft", category: "parakou", city: "Parakou", description: "Loft tout équipé." },
  { id: 177, title: "Appartement avec terrasse", location: "Parakou", price: 49000, priceDisplay: formatPrice(49000), rating: 4.5, reviews: 24, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80", beds: 2, baths: 1, type: "Appartement", category: "parakou", city: "Parakou", description: "Appartement avec terrasse." }
];

// Dassa-Zoumè (8)
const dassaProperties = [
  { id: 14, title: "Dassa Resort", location: "Dassa-Zoumè", price: 50000, priceDisplay: formatPrice(50000), rating: 4.6, reviews: 41, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80", beds: 2, baths: 1, type: "Resort", category: "dassa", city: "Dassa-Zoumè", description: "Resort avec vue sur les collines." },
  { id: 181, title: "Villa avec piscine", location: "Dassa-Zoumè", price: 85000, priceDisplay: formatPrice(85000), rating: 4.8, reviews: 27, image: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=80", beds: 3, baths: 2, type: "Villa", category: "dassa", city: "Dassa-Zoumè", description: "Villa privée avec piscine." },
  { id: 182, title: "Appartement vue montagne", location: "Dassa-Zoumè", price: 35000, priceDisplay: formatPrice(35000), rating: 4.4, reviews: 33, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80", beds: 2, baths: 1, type: "Appartement", category: "dassa", city: "Dassa-Zoumè", description: "Appartement avec vue montagne." },
  { id: 183, title: "Studio paisible", location: "Dassa-Zoumè", price: 25000, priceDisplay: formatPrice(25000), rating: 4.3, reviews: 38, image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80", beds: 1, baths: 1, type: "Studio", category: "dassa", city: "Dassa-Zoumè", description: "Studio calme." },
  { id: 184, title: "Maison de charme", location: "Dassa-Zoumè", price: 48000, priceDisplay: formatPrice(48000), rating: 4.5, reviews: 29, image: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80", beds: 3, baths: 2, type: "Maison", category: "dassa", city: "Dassa-Zoumè", description: "Maison traditionnelle rénovée." },
  { id: 185, title: "Duplex moderne", location: "Dassa-Zoumè", price: 62000, priceDisplay: formatPrice(62000), rating: 4.6, reviews: 22, image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80", beds: 3, baths: 2, type: "Duplex", category: "dassa", city: "Dassa-Zoumè", description: "Duplex spacieux." },
  { id: 186, title: "Loft nature", location: "Dassa-Zoumè", price: 55000, priceDisplay: formatPrice(55000), rating: 4.7, reviews: 19, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80", beds: 2, baths: 1, type: "Loft", category: "dassa", city: "Dassa-Zoumè", description: "Loft au milieu de la nature." },
  { id: 187, title: "Studio cosy", location: "Dassa-Zoumè", price: 28000, priceDisplay: formatPrice(28000), rating: 4.4, reviews: 31, image: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=1200&q=80", beds: 1, baths: 1, type: "Studio", category: "dassa", city: "Dassa-Zoumè", description: "Studio fonctionnel." }
];

// Ouidah (8)
const ouidahProperties = [
  { id: 15, title: "Ouidah Beach House", location: "Ouidah", price: 55000, priceDisplay: formatPrice(55000), rating: 4.7, reviews: 56, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80", beds: 3, baths: 2, type: "Maison", category: "ouidah", city: "Ouidah", description: "Maison de plage avec accès direct à la mer." },
  { id: 191, title: "Villa bord de mer", location: "Ouidah", price: 95000, priceDisplay: formatPrice(95000), rating: 4.9, reviews: 43, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80", beds: 4, baths: 3, type: "Villa", category: "ouidah", city: "Ouidah", description: "Villa de luxe avec piscine, plage privée." },
  { id: 192, title: "Studio vue mer", location: "Ouidah", price: 40000, priceDisplay: formatPrice(40000), rating: 4.5, reviews: 39, image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80", beds: 1, baths: 1, type: "Studio", category: "ouidah", city: "Ouidah", description: "Studio avec terrasse vue mer." },
  { id: 193, title: "Appartement confort", location: "Ouidah", price: 48000, priceDisplay: formatPrice(48000), rating: 4.6, reviews: 34, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80", beds: 2, baths: 1, type: "Appartement", category: "ouidah", city: "Ouidah", description: "Appartement moderne." },
  { id: 194, title: "Maison traditionnelle", location: "Ouidah", price: 50000, priceDisplay: formatPrice(50000), rating: 4.5, reviews: 41, image: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80", beds: 3, baths: 2, type: "Maison", category: "ouidah", city: "Ouidah", description: "Maison authentique." },
  { id: 195, title: "Duplex familiale", location: "Ouidah", price: 70000, priceDisplay: formatPrice(70000), rating: 4.7, reviews: 28, image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80", beds: 4, baths: 2, type: "Duplex", category: "ouidah", city: "Ouidah", description: "Grand duplex pour famille." },
  { id: 196, title: "Loft vue océan", location: "Ouidah", price: 65000, priceDisplay: formatPrice(65000), rating: 4.8, reviews: 23, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80", beds: 2, baths: 1, type: "Loft", category: "ouidah", city: "Ouidah", description: "Loft avec vue imprenable." },
  { id: 197, title: "Studio cosy", location: "Ouidah", price: 30000, priceDisplay: formatPrice(30000), rating: 4.4, reviews: 47, image: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=1200&q=80", beds: 1, baths: 1, type: "Studio", category: "ouidah", city: "Ouidah", description: "Petit studio bien équipé." }
];

// Grand-Popo (8)
const grandpopoProperties = [
  { id: 16, title: "Grand-Popo Paradise", location: "Grand-Popo", price: 80000, priceDisplay: formatPrice(80000), rating: 4.9, reviews: 89, image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80", beds: 4, baths: 3, type: "Villa", category: "grandpopo", city: "Grand-Popo", description: "Paradis tropical en bord de mer." },
  { id: 201, title: "Villa bord de plage", location: "Grand-Popo", price: 120000, priceDisplay: formatPrice(120000), rating: 4.9, reviews: 67, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80", beds: 4, baths: 3, type: "Villa", category: "grandpopo", city: "Grand-Popo", description: "Villa de luxe avec accès direct à la plage." },
  { id: 202, title: "Bungalow de charme", location: "Grand-Popo", price: 65000, priceDisplay: formatPrice(65000), rating: 4.7, reviews: 53, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80", beds: 2, baths: 1, type: "Bungalow", category: "grandpopo", city: "Grand-Popo", description: "Bungalow typique." },
  { id: 203, title: "Appartement vue mer", location: "Grand-Popo", price: 55000, priceDisplay: formatPrice(55000), rating: 4.6, reviews: 44, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80", beds: 2, baths: 1, type: "Appartement", category: "grandpopo", city: "Grand-Popo", description: "Appartement avec terrasse vue mer." },
  { id: 204, title: "Maison de pêcheur", location: "Grand-Popo", price: 40000, priceDisplay: formatPrice(40000), rating: 4.5, reviews: 58, image: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80", beds: 3, baths: 2, type: "Maison", category: "grandpopo", city: "Grand-Popo", description: "Maison authentique." },
  { id: 205, title: "Studio face mer", location: "Grand-Popo", price: 35000, priceDisplay: formatPrice(35000), rating: 4.4, reviews: 39, image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80", beds: 1, baths: 1, type: "Studio", category: "grandpopo", city: "Grand-Popo", description: "Petit studio pieds dans l'eau." },
  { id: 206, title: "Duplex familial", location: "Grand-Popo", price: 85000, priceDisplay: formatPrice(85000), rating: 4.8, reviews: 32, image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80", beds: 4, baths: 2, type: "Duplex", category: "grandpopo", city: "Grand-Popo", description: "Duplex spacieux." },
  { id: 207, title: "Loft tropical", location: "Grand-Popo", price: 70000, priceDisplay: formatPrice(70000), rating: 4.7, reviews: 28, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80", beds: 2, baths: 1, type: "Loft", category: "grandpopo", city: "Grand-Popo", description: "Loft design en bord de plage." }
];

// Assemblage pour le compteur
const allProperties = [
  ...popularProperties, ...hotelsProperties, ...portonovoProperties,
  ...abomeycalaviProperties, ...akpakpaProperties, ...menontinProperties,
  ...fidjrosseProperties, ...abomeyProperties, ...parakouProperties,
  ...dassaProperties, ...ouidahProperties, ...grandpopoProperties
];

const filters = ["Tous", "Prix croissant", "Prix décroissant", "Mieux notés", "Nouveautés"];

// --- Liste exhaustive de toutes les villes et communes du Bénin (plus de 70 entrées) ---
const destinationsList = [
  "Abomey", "Abomey-Calavi", "Adjarra", "Adja-Ouèrè", "Agbangnizoun", "Aglangandan", "Ahomey", "Akpro-Missérété",
  "Allada", "Athiémé", "Avrankou", "Bantè", "Bassila", "Bembéréké", "Bétérou", "Bohicon", "Bonou", "Bopa",
  "Cotonou", "Cové", "Dassa-Zoumè", "Djakotomey", "Dogbo", "Fidjrossè", "Ganhi", "Ganvié", "Glazoué",
  "Godomey", "Grand-Popo", "Guilmaro", "Hinvi", "Hounvè", "Ifangni", "Kandi", "Kérou", "Kétou", "Kouandé",
  "Lalo", "Lokossa", "Malanville", "Massi", "Matéri", "Ménontin", "Monomitenga", "Natitingou", "N'Dali",
  "Nikki", "Ouidah", "Ouèssè", "Pahou", "Parakou", "Péhunco", "Pobè", "Porto-Novo", "Sakété", "Savalou",
  "Savè", "Ségbana", "Sèmè-Kpodji", "Sinendé", "So-Ava", "Tanguiéta", "Tanvè", "Tchaourou", "Toffo", "Tori-Bossito",
  "Toucountouna", "Zagnanado", "Zè", "Zogbodomey"
];

export default function Search() {
  const navigate = useNavigate();
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guestCounts, setGuestCounts] = useState({ adults: 0, children: 0, babies: 0, pets: 0 });
  const [activeTab, setActiveTab] = useState<"destination" | "dates" | "guests" | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedFilter, setSelectedFilter] = useState("Tous");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  // État pour la recherche (destination effective)
  const [searchDestination, setSearchDestination] = useState("");

  const guestLabel = () => {
    const totalGuests = guestCounts.adults + guestCounts.children;
    const parts = [];
    if (totalGuests > 0) parts.push(`${totalGuests} voyageur${totalGuests > 1 ? 's' : ''}`);
    if (guestCounts.babies > 0) parts.push(`${guestCounts.babies} bébé${guestCounts.babies > 1 ? 's' : ''}`);
    if (guestCounts.pets > 0) parts.push(`${guestCounts.pets} animal${guestCounts.pets > 1 ? 's' : ''}`);
    return parts.length > 0 ? parts.join(" · ") : "Ajouter des voyageurs";
  };

  // Fonctions calendrier (inchangées)
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    return days;
  };

  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  const isDateSelected = (date: Date) => {
    if (!checkIn && !checkOut) return false;
    const dateStr = date.toDateString();
    if (checkIn && dateStr === new Date(checkIn).toDateString()) return true;
    if (checkOut && dateStr === new Date(checkOut).toDateString()) return true;
    return false;
  };

  const isInRange = (date: Date) => {
    if (!checkIn || !checkOut) return false;
    const dateTime = date.getTime();
    const checkInTime = new Date(checkIn).getTime();
    const checkOutTime = new Date(checkOut).getTime();
    return dateTime > checkInTime && dateTime < checkOutTime;
  };

  const handleDateSelect = (date: Date) => {
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(date.toISOString().split('T')[0]);
      setCheckOut("");
    } else if (checkIn && !checkOut) {
      if (date < new Date(checkIn)) {
        setCheckOut(checkIn);
        setCheckIn(date.toISOString().split('T')[0]);
      } else {
        setCheckOut(date.toISOString().split('T')[0]);
      }
    }
  };

  const changeMonth = (delta: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1));
  };

  const days = getDaysInMonth(currentMonth);

  // Filtrage par destination (insensible à la casse)
  const filterByDestination = (properties: any[]) => {
    if (!searchDestination) return properties;
    const lowerDest = searchDestination.toLowerCase();
    return properties.filter(prop =>
      prop.location.toLowerCase().includes(lowerDest) ||
      prop.city.toLowerCase().includes(lowerDest)
    );
  };

  const applyFilters = (properties: any[]) => {
    let filtered = filterByDestination(properties);
    switch (selectedFilter) {
      case "Prix croissant":
        return filtered.sort((a, b) => a.price - b.price);
      case "Prix décroissant":
        return filtered.sort((a, b) => b.price - a.price);
      case "Mieux notés":
        return filtered.sort((a, b) => b.rating - a.rating);
      default:
        return filtered;
    }
  };

  // Données filtrées
  const popularFiltered = applyFilters(popularProperties);
  const hotelsFiltered = applyFilters(hotelsProperties);
  const cityCategories = [
    { title: "Porto-Novo", key: "portonovo", properties: applyFilters(portonovoProperties) },
    { title: "Abomey-Calavi", key: "abomeycalavi", properties: applyFilters(abomeycalaviProperties) },
    { title: "Akpakpa", key: "akpakpa", properties: applyFilters(akpakpaProperties) },
    { title: "Menontin", key: "menontin", properties: applyFilters(menontinProperties) },
    { title: "Fidjrossè", key: "fidjrosse", properties: applyFilters(fidjrosseProperties) },
    { title: "Abomey", key: "abomey", properties: applyFilters(abomeyProperties) },
    { title: "Parakou", key: "parakou", properties: applyFilters(parakouProperties) },
    { title: "Dassa-Zoumè", key: "dassa", properties: applyFilters(dassaProperties) },
    { title: "Ouidah", key: "ouidah", properties: applyFilters(ouidahProperties) },
    { title: "Grand-Popo", key: "grandpopo", properties: applyFilters(grandpopoProperties) }
  ].filter(cat => cat.properties.length > 0);

  const performSearch = () => {
    setSearchDestination(destination);
  };

  const PropertyCard = ({ property, showDescription = false }: { property: any; showDescription?: boolean }) => (
    <div className="group cursor-pointer" onClick={() => navigate(`/annonce/${property.id}`)}>
      <div className="relative overflow-hidden rounded-2xl">
        <img
          src={property.images?.[0] || property.image || '/placeholder.jpg'}
          alt={property.title}
          className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.jpg'; }}
        />
        <button className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white transition-colors">
          <Heart className="w-5 h-5" />
        </button>
      </div>
      <div className="mt-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-[#0F2940]">{property.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{property.location}</p>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-current text-[#00c9a7]" />
            <span className="text-sm font-medium">{property.rating}</span>
            <span className="text-sm text-gray-500">({property.reviews})</span>
          </div>
        </div>
        {showDescription && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{property.description}</p>}
        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
          <div className="flex items-center gap-1"><Bed className="w-4 h-4" /><span>{property.beds} lits</span></div>
          <div className="flex items-center gap-1"><Bath className="w-4 h-4" /><span>{property.baths} sdb</span></div>
        </div>
        <p className="mt-2 font-semibold text-[#0F2940]">{property.priceDisplay}</p>
      </div>
    </div>
  );

  return (
    <div className="bg-white">
      {/* Hero Section avec barre de recherche (inchangée) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#00c9a7]/5 to-[#0F2940]/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-10 md:pt-28 md:pb-10">
          <div className="text-center mb-4 md:mb-5">
            <h1 className="text-3xl md:text-4xl font-semibold text-[#0F2940] mb-3">
              Trouvez votre prochain séjour au Bénin
            </h1>
            <p className="text-base text-gray-600">
              Des logements premium et des expériences authentiques au Bénin
            </p>
          </div>

          {/* Barre de recherche (inchangée, mais le bouton déclenche performSearch) */}
          <div className="h-20" />
          <div className="fixed inset-x-0 top-[80px] z-40 px-4">
            <div className="mx-auto w-full max-w-5xl">
              <div className="bg-white rounded-full shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 p-2">
                  {/* Destination */}
                  <div className="relative flex-[1.5]">
                    <button
                      onClick={() => setActiveTab(activeTab === "destination" ? null : "destination")}
                      className={`w-full text-left px-5 sm:px-7 py-3.5 rounded-full transition-all ${
                        activeTab === "destination" ? "bg-gray-50 shadow-inner" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="text-xs font-medium text-gray-700">Destination</div>
                      <div className="text-sm text-gray-900 truncate">
                        {destination || "Rechercher une destination"}
                      </div>
                    </button>
                    {activeTab === "destination" && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setActiveTab(null)}></div>
                        <div className="absolute top-full left-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50">
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold">Où souhaitez-vous aller ?</h3>
                              <button onClick={() => setActiveTab(null)} className="p-1 rounded-full hover:bg-gray-100">
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                            <input
                              type="text"
                              placeholder="Rechercher une destination au Bénin"
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c9a7]"
                              value={destination}
                              onChange={(e) => setDestination(e.target.value)}
                            />
                            <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                              <div className="font-semibold text-sm text-gray-500 mb-2">Villes du Bénin</div>
                              {destinationsList.map((place) => (
                                <button
                                  key={place}
                                  onClick={() => { setDestination(place); setActiveTab(null); }}
                                  className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                  <div className="font-medium">{place}</div>
                                  <div className="text-sm text-gray-500">Bénin</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="hidden sm:block w-px h-8 bg-gray-200"></div>
                  <div className="sm:hidden h-px w-full bg-gray-200"></div>

                  {/* Dates */}
                  <div className="relative flex-1">
                    <button
                      onClick={() => setActiveTab(activeTab === "dates" ? null : "dates")}
                      className={`w-full text-left px-5 sm:px-7 py-3.5 rounded-full transition-all ${
                        activeTab === "dates" ? "bg-gray-50 shadow-inner" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="text-xs font-medium text-gray-700">Dates</div>
                      <div className="text-sm text-gray-900">
                        {checkIn && checkOut 
                          ? `${new Date(checkIn).toLocaleDateString('fr-BJ', { day: 'numeric', month: 'short' })} - ${new Date(checkOut).toLocaleDateString('fr-BJ', { day: 'numeric', month: 'short' })}`
                          : "Quand ?"}
                      </div>
                    </button>
                    {activeTab === "dates" && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setActiveTab(null)}></div>
                        <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 w-full sm:w-[640px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50">
                          <div className="p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold">Sélectionnez vos dates</h3>
                              <button onClick={() => setActiveTab(null)} className="p-1 rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="flex items-center justify-between mb-6">
                              <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeft className="w-5 h-5" /></button>
                              <span className="font-semibold">{currentMonth.toLocaleDateString('fr-BJ', { month: 'long', year: 'numeric' })}</span>
                              <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-100"><ChevronRight className="w-5 h-5" /></button>
                            </div>
                            <div className="grid grid-cols-7 gap-1 mb-2">
                              {weekDays.map(day => (<div key={day} className="text-center text-xs sm:text-sm font-medium text-gray-500 py-2">{day}</div>))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                              {days.map((day, index) => {
                                const isSelected = isDateSelected(day.date);
                                const inRange = isInRange(day.date);
                                const isToday = day.date.toDateString() === new Date().toDateString();
                                return (
                                  <button
                                    key={index}
                                    onClick={() => handleDateSelect(day.date)}
                                    disabled={!day.isCurrentMonth}
                                    className={`relative aspect-square rounded-full text-sm transition-all
                                      ${!day.isCurrentMonth && 'text-gray-300 cursor-not-allowed'}
                                      ${isSelected && 'bg-[#00c9a7] text-white hover:bg-[#00b892]'}
                                      ${inRange && !isSelected && 'bg-[#00c9a7]/10'}
                                      ${isToday && !isSelected && 'border-2 border-[#00c9a7]'}
                                      ${!isSelected && !inRange && day.isCurrentMonth && 'hover:bg-gray-100'}`}
                                  >
                                    {day.date.getDate()}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                              <button onClick={() => setActiveTab(null)} className="px-6 py-2 bg-[#00c9a7] text-[#0F2940] rounded-lg font-semibold">Fermer</button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="hidden sm:block w-px h-8 bg-gray-200"></div>
                  <div className="sm:hidden h-px w-full bg-gray-200"></div>

                  {/* Voyageurs */}
                  <div className="relative flex-1">
                    <button
                      onClick={() => setActiveTab(activeTab === "guests" ? null : "guests")}
                      className={`w-full text-left px-5 sm:px-7 py-3.5 rounded-full transition-all ${
                        activeTab === "guests" ? "bg-gray-50 shadow-inner" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="text-xs font-medium text-gray-700">Voyageurs</div>
                      <div className="text-sm text-gray-900 truncate">{guestLabel()}</div>
                    </button>
                    {activeTab === "guests" && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setActiveTab(null)}></div>
                        <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50">
                          <div className="p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold">Voyageurs</h3>
                              <button onClick={() => setActiveTab(null)} className="p-1 rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="space-y-6">
                              {[
                                { label: "Adultes", description: "13 ans et plus", key: "adults" },
                                { label: "Enfants", description: "De 2 à 12 ans", key: "children" },
                                { label: "Bébés", description: "Moins de 2 ans", key: "babies" },
                                { label: "Animaux domestiques", description: "Vous voyagez avec un animal ?", key: "pets" },
                              ].map(({ label, description, key }) => (
                                <div key={key} className="flex items-center justify-between">
                                  <div><p className="font-semibold text-[#0F2940]">{label}</p><p className="text-sm text-gray-500">{description}</p></div>
                                  <div className="flex items-center gap-4">
                                    <button onClick={() => setGuestCounts(prev => ({ ...prev, [key]: Math.max(0, (prev[key as keyof typeof prev] as number) - 1) }))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400">-</button>
                                    <span className="w-6 text-center text-[#0F2940]">{guestCounts[key as keyof typeof guestCounts]}</span>
                                    <button onClick={() => setGuestCounts(prev => ({ ...prev, [key]: (prev[key as keyof typeof prev] as number) + 1 }))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400">+</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-6 pt-4 border-t border-gray-200">
                              <button onClick={() => setActiveTab(null)} className="w-full bg-[#00c9a7] text-[#0F2940] py-3 rounded-lg font-semibold">Fermer</button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Bouton recherche avec appel à performSearch */}
                  <button onClick={() => { performSearch(); navigate("/s/logements"); }} className="bg-[#00c9a7] text-[#0F2940] rounded-full p-4 hover:bg-[#00b892] transition-colors ml-0 sm:ml-2 mt-2 sm:mt-0">
                    <SearchIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Cartes héros */}
          <div className="grid gap-4 sm:grid-cols-3 mt-6 md:mt-8 px-4">
            {heroCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div key={index} className="rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-sm border border-gray-100">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00c9a7]/10 mb-4">
                    <Icon className="w-6 h-6 text-[#00c9a7]" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#0F2940]">{card.title}</h2>
                  <p className="mt-2 text-sm text-gray-600">{card.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section Filtres */}
      <div className="border-b border-gray-200 sticky top-0 bg-white z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 overflow-x-auto pb-2">
              <div className="relative">
                <button onClick={() => setShowFilterDropdown(!showFilterDropdown)} className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 hover:border-gray-400 transition-colors">
                  <Filter className="w-4 h-4" />
                  <span className="text-sm">Filtres</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showFilterDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowFilterDropdown(false)}></div>
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50 py-2">
                      {filters.map(filter => (
                        <button key={filter} onClick={() => { setSelectedFilter(filter); setShowFilterDropdown(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${selectedFilter === filter ? 'text-[#00c9a7] font-medium' : 'text-gray-700'}`}>
                          {filter}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="text-sm text-gray-600">{allProperties.length} logements disponibles</div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Logements populaires */}
        {popularFiltered.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <button onClick={() => navigate("/popular")} className="flex items-center gap-2 text-2xl font-semibold text-[#0F2940] hover:text-[#00c9a7] transition-colors group">
                  Logements populaires · Bénin
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-gray-600 mt-1">Les plus réservés par nos voyageurs</p>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {popularFiltered.map(property => <PropertyCard key={property.id} property={property} showDescription={true} />)}
            </div>
          </div>
        )}

        {/* De superbes hôtels */}
        {hotelsFiltered.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <button onClick={() => navigate("/hotels")} className="flex items-center gap-2 text-2xl font-semibold text-[#0F2940] hover:text-[#00c9a7] transition-colors group">
                  De superbes hôtels pour votre prochain voyage
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-gray-600 mt-1">Hôtels de qualité supérieure</p>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {hotelsFiltered.map(property => <PropertyCard key={property.id} property={property} showDescription={true} />)}
            </div>
          </div>
        )}

        {/* Logements par ville */}
        {cityCategories.map(category => (
          <div key={category.key} className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <button onClick={() => navigate(`/city/${category.key}`)} className="flex items-center gap-2 text-2xl font-semibold text-[#0F2940] hover:text-[#00c9a7] transition-colors group">
                  Logements {category.title}
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-gray-600 mt-1">Découvrez les meilleurs logements à {category.title}</p>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {category.properties.map(property => <PropertyCard key={property.id} property={property} />)}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}