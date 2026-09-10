import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { 
  Star, Bed, Bath, Heart, Filter, ChevronDown, ArrowLeft, 
  ArrowRight, MapPin, Crown, Sparkles, Award, Check, X, Calendar
} from "lucide-react";

// ==================== DONNÉES DES VILLES ====================
const formatPrice = (price: number) => `${price.toLocaleString()} FCFA / nuit`;

// Porto-Novo
const portonovoProperties = [
  { id: 7, title: "Maison traditionnelle", location: "Porto-Novo", price: 45000, priceDisplay: formatPrice(45000), rating: 4.6, reviews: 45, image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80", beds: 3, baths: 2, type: "Maison", city: "Porto-Novo", description: "Authentique maison traditionnelle." },
  { id: 8, title: "Appartement moderne", location: "Porto-Novo", price: 55000, priceDisplay: formatPrice(55000), rating: 4.7, reviews: 38, image: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=1200&q=80", beds: 2, baths: 1, type: "Appartement", city: "Porto-Novo", description: "Appartement moderne avec vue sur la ville." },
  { id: 111, title: "Villa fleurie", location: "Porto-Novo", price: 75000, priceDisplay: formatPrice(75000), rating: 4.8, reviews: 22, image: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=80", beds: 3, baths: 2, type: "Villa", city: "Porto-Novo", description: "Villa avec jardin tropical." },
  { id: 112, title: "Studio cosy", location: "Porto-Novo", price: 30000, priceDisplay: formatPrice(30000), rating: 4.4, reviews: 31, image: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=1200&q=80", beds: 1, baths: 1, type: "Studio", city: "Porto-Novo", description: "Petit studio fonctionnel." },
  { id: 113, title: "Duplex familial", location: "Porto-Novo", price: 85000, priceDisplay: formatPrice(85000), rating: 4.7, reviews: 19, image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80", beds: 4, baths: 2, type: "Duplex", city: "Porto-Novo", description: "Duplex spacieux." },
  { id: 114, title: "Maison de ville", location: "Porto-Novo", price: 60000, priceDisplay: formatPrice(60000), rating: 4.6, reviews: 27, image: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80", beds: 3, baths: 2, type: "Maison", city: "Porto-Novo", description: "Maison de ville avec patio." },
  { id: 115, title: "Loft contemporary", location: "Porto-Novo", price: 68000, priceDisplay: formatPrice(68000), rating: 4.8, reviews: 24, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80", beds: 2, baths: 1, type: "Loft", city: "Porto-Novo", description: "Loft design." },
  { id: 116, title: "Appartement terrasse", location: "Porto-Novo", price: 50000, priceDisplay: formatPrice(50000), rating: 4.5, reviews: 18, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80", beds: 2, baths: 1, type: "Appartement", city: "Porto-Novo", description: "Appartement lumineux avec terrasse." }
];

// Abomey-Calavi
const abomeycalaviProperties = [
  { id: 9, title: "Villa calme", location: "Abomey-Calavi", price: 65000, priceDisplay: formatPrice(65000), rating: 4.8, reviews: 52, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80", beds: 3, baths: 2, type: "Villa", city: "Abomey-Calavi", description: "Villa paisible." },
  { id: 121, title: "Appartement moderne", location: "Abomey-Calavi", price: 40000, priceDisplay: formatPrice(40000), rating: 4.5, reviews: 33, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80", beds: 2, baths: 1, type: "Appartement", city: "Abomey-Calavi", description: "Appartement fonctionnel." },
  { id: 122, title: "Studio économique", location: "Abomey-Calavi", price: 25000, priceDisplay: formatPrice(25000), rating: 4.3, reviews: 44, image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80", beds: 1, baths: 1, type: "Studio", city: "Abomey-Calavi", description: "Petit studio idéal." },
  { id: 123, title: "Maison familiale", location: "Abomey-Calavi", price: 80000, priceDisplay: formatPrice(80000), rating: 4.7, reviews: 28, image: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80", beds: 4, baths: 3, type: "Maison", city: "Abomey-Calavi", description: "Grande maison avec jardin." },
  { id: 124, title: "Villa avec piscine", location: "Abomey-Calavi", price: 120000, priceDisplay: formatPrice(120000), rating: 4.9, reviews: 17, image: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=80", beds: 4, baths: 3, type: "Villa", city: "Abomey-Calavi", description: "Villa de luxe avec piscine." },
  { id: 125, title: "Loft moderne", location: "Abomey-Calavi", price: 55000, priceDisplay: formatPrice(55000), rating: 4.6, reviews: 22, image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80", beds: 2, baths: 1, type: "Loft", city: "Abomey-Calavi", description: "Loft contemporain." },
  { id: 126, title: "Duplex avec terrasse", location: "Abomey-Calavi", price: 70000, priceDisplay: formatPrice(70000), rating: 4.7, reviews: 19, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80", beds: 3, baths: 2, type: "Duplex", city: "Abomey-Calavi", description: "Duplex tout confort." },
  { id: 127, title: "Studio design", location: "Abomey-Calavi", price: 30000, priceDisplay: formatPrice(30000), rating: 4.4, reviews: 31, image: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=1200&q=80", beds: 1, baths: 1, type: "Studio", city: "Abomey-Calavi", description: "Studio moderne." }
];

// Akpakpa
const akpakpaProperties = [
  { id: 10, title: "Studio économique", location: "Akpakpa, Cotonou", price: 25000, priceDisplay: formatPrice(25000), rating: 4.5, reviews: 67, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80", beds: 1, baths: 1, type: "Studio", city: "Akpakpa", description: "Studio économique bien situé." },
  { id: 131, title: "Appartement confort", location: "Akpakpa, Cotonou", price: 40000, priceDisplay: formatPrice(40000), rating: 4.6, reviews: 43, image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80", beds: 2, baths: 1, type: "Appartement", city: "Akpakpa", description: "Appartement calme." },
  { id: 132, title: "Villa moderne", location: "Akpakpa, Cotonou", price: 85000, priceDisplay: formatPrice(85000), rating: 4.7, reviews: 28, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80", beds: 3, baths: 2, type: "Villa", city: "Akpakpa", description: "Villa contemporaine." },
  { id: 133, title: "Duplex lumineux", location: "Akpakpa, Cotonou", price: 60000, priceDisplay: formatPrice(60000), rating: 4.5, reviews: 34, image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80", beds: 2, baths: 2, type: "Duplex", city: "Akpakpa", description: "Duplex traversant." },
  { id: 134, title: "Maison traditionnelle", location: "Akpakpa, Cotonou", price: 50000, priceDisplay: formatPrice(50000), rating: 4.4, reviews: 39, image: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80", beds: 3, baths: 2, type: "Maison", city: "Akpakpa", description: "Maison de caractère." },
  { id: 135, title: "Studio moderne", location: "Akpakpa, Cotonou", price: 30000, priceDisplay: formatPrice(30000), rating: 4.5, reviews: 51, image: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=1200&q=80", beds: 1, baths: 1, type: "Studio", city: "Akpakpa", description: "Studio rénové." },
  { id: 136, title: "Appartement vue mer", location: "Akpakpa, Cotonou", price: 70000, priceDisplay: formatPrice(70000), rating: 4.8, reviews: 23, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80", beds: 2, baths: 1, type: "Appartement", city: "Akpakpa", description: "Appartement avec vue sur l'océan." },
  { id: 137, title: "Loft industriel", location: "Akpakpa, Cotonou", price: 65000, priceDisplay: formatPrice(65000), rating: 4.7, reviews: 27, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80", beds: 2, baths: 1, type: "Loft", city: "Akpakpa", description: "Loft industriel chic." }
];

// Menontin
const menontinProperties = [
  { id: 11, title: "Appartement confort", location: "Menontin, Cotonou", price: 40000, priceDisplay: formatPrice(40000), rating: 4.6, reviews: 43, image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80", beds: 2, baths: 1, type: "Appartement", city: "Menontin", description: "Appartement confortable." },
  { id: 141, title: "Studio cosy", location: "Menontin, Cotonou", price: 28000, priceDisplay: formatPrice(28000), rating: 4.4, reviews: 52, image: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=1200&q=80", beds: 1, baths: 1, type: "Studio", city: "Menontin", description: "Petit studio bien agencé." },
  { id: 142, title: "Villa avec jardin", location: "Menontin, Cotonou", price: 85000, priceDisplay: formatPrice(85000), rating: 4.8, reviews: 31, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80", beds: 3, baths: 2, type: "Villa", city: "Menontin", description: "Villa spacieuse, jardin arboré." },
  { id: 143, title: "Duplex familial", location: "Menontin, Cotonou", price: 65000, priceDisplay: formatPrice(65000), rating: 4.6, reviews: 28, image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80", beds: 4, baths: 2, type: "Duplex", city: "Menontin", description: "Duplex avec deux chambres." },
  { id: 144, title: "Maison de charme", location: "Menontin, Cotonou", price: 50000, priceDisplay: formatPrice(50000), rating: 4.5, reviews: 36, image: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80", beds: 3, baths: 2, type: "Maison", city: "Menontin", description: "Maison de ville rénovée." },
  { id: 145, title: "Appartement moderne", location: "Menontin, Cotonou", price: 45000, priceDisplay: formatPrice(45000), rating: 4.7, reviews: 41, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80", beds: 2, baths: 1, type: "Appartement", city: "Menontin", description: "Appartement entièrement meublé." },
  { id: 146, title: "Loft design", location: "Menontin, Cotonou", price: 58000, priceDisplay: formatPrice(58000), rating: 4.8, reviews: 22, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80", beds: 2, baths: 1, type: "Loft", city: "Menontin", description: "Loft décoré avec goût." },
  { id: 147, title: "Studio dernier étage", location: "Menontin, Cotonou", price: 33000, priceDisplay: formatPrice(33000), rating: 4.5, reviews: 29, image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80", beds: 1, baths: 1, type: "Studio", city: "Menontin", description: "Studio sous toit." }
];

// Fidjrossè
const fidjrosseProperties = [
  { id: 151, title: "Appartement vue mer", location: "Fidjrossè, Cotonou", price: 85000, priceDisplay: formatPrice(85000), rating: 4.8, reviews: 67, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80", beds: 2, baths: 2, type: "Appartement", city: "Fidjrossè", description: "Appartement avec vue sur l'océan." },
  { id: 152, title: "Studio bord de mer", location: "Fidjrossè, Cotonou", price: 45000, priceDisplay: formatPrice(45000), rating: 4.5, reviews: 44, image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80", beds: 1, baths: 1, type: "Studio", city: "Fidjrossè", description: "Studio à 200m de la plage." },
  { id: 153, title: "Villa avec piscine", location: "Fidjrossè, Cotonou", price: 145000, priceDisplay: formatPrice(145000), rating: 4.9, reviews: 52, image: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=80", beds: 5, baths: 4, type: "Villa", city: "Fidjrossè", description: "Grande villa avec piscine." },
  { id: 154, title: "Duplex moderne", location: "Fidjrossè, Cotonou", price: 95000, priceDisplay: formatPrice(95000), rating: 4.7, reviews: 38, image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80", beds: 3, baths: 2, type: "Duplex", city: "Fidjrossè", description: "Duplex contemporain." },
  { id: 155, title: "Loft chic", location: "Fidjrossè, Cotonou", price: 70000, priceDisplay: formatPrice(70000), rating: 4.8, reviews: 29, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80", beds: 2, baths: 1, type: "Loft", city: "Fidjrossè", description: "Loft design." },
  { id: 156, title: "Maison de plage", location: "Fidjrossè, Cotonou", price: 110000, priceDisplay: formatPrice(110000), rating: 4.8, reviews: 41, image: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80", beds: 3, baths: 3, type: "Maison", city: "Fidjrossè", description: "Maison de plage avec accès direct à la mer." },
  { id: 157, title: "Studio cosy", location: "Fidjrossè, Cotonou", price: 35000, priceDisplay: formatPrice(35000), rating: 4.4, reviews: 63, image: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=1200&q=80", beds: 1, baths: 1, type: "Studio", city: "Fidjrossè", description: "Petit studio bien situé." }
];

// Abomey
const abomeyProperties = [
  { id: 12, title: "Villa Abomey", location: "Abomey", price: 70000, priceDisplay: formatPrice(70000), rating: 4.7, reviews: 34, image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80", beds: 3, baths: 2, type: "Villa", city: "Abomey", description: "Villa historique." },
  { id: 161, title: "Maison traditionnelle", location: "Abomey", price: 45000, priceDisplay: formatPrice(45000), rating: 4.5, reviews: 28, image: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80", beds: 3, baths: 2, type: "Maison", city: "Abomey", description: "Maison ancienne rénovée." },
  { id: 162, title: "Appartement centre", location: "Abomey", price: 35000, priceDisplay: formatPrice(35000), rating: 4.4, reviews: 33, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80", beds: 2, baths: 1, type: "Appartement", city: "Abomey", description: "Appartement en centre-ville." },
  { id: 163, title: "Studio confort", location: "Abomey", price: 25000, priceDisplay: formatPrice(25000), rating: 4.3, reviews: 41, image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80", beds: 1, baths: 1, type: "Studio", city: "Abomey", description: "Studio fonctionnel." },
  { id: 164, title: "Villa avec jardin", location: "Abomey", price: 80000, priceDisplay: formatPrice(80000), rating: 4.8, reviews: 22, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80", beds: 4, baths: 3, type: "Villa", city: "Abomey", description: "Villa spacieuse." },
  { id: 165, title: "Loft moderne", location: "Abomey", price: 52000, priceDisplay: formatPrice(52000), rating: 4.6, reviews: 19, image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80", beds: 2, baths: 1, type: "Loft", city: "Abomey", description: "Loft contemporain." },
  { id: 166, title: "Duplex famille", location: "Abomey", price: 65000, priceDisplay: formatPrice(65000), rating: 4.7, reviews: 27, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80", beds: 3, baths: 2, type: "Duplex", city: "Abomey", description: "Duplex lumineux." },
  { id: 167, title: "Maison de ville", location: "Abomey", price: 48000, priceDisplay: formatPrice(48000), rating: 4.5, reviews: 31, image: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=1200&q=80", beds: 3, baths: 2, type: "Maison", city: "Abomey", description: "Maison de ville avec parking." }
];

// Parakou
const parakouProperties = [
  { id: 13, title: "Parakou Lodge", location: "Parakou", price: 60000, priceDisplay: formatPrice(60000), rating: 4.5, reviews: 28, image: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=1200&q=80", beds: 2, baths: 2, type: "Lodge", city: "Parakou", description: "Lodge confortable." },
  { id: 171, title: "Appartement moderne", location: "Parakou", price: 45000, priceDisplay: formatPrice(45000), rating: 4.4, reviews: 35, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80", beds: 2, baths: 1, type: "Appartement", city: "Parakou", description: "Appartement neuf." },
  { id: 172, title: "Villa calme", location: "Parakou", price: 75000, priceDisplay: formatPrice(75000), rating: 4.7, reviews: 22, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80", beds: 3, baths: 2, type: "Villa", city: "Parakou", description: "Villa au calme." },
  { id: 173, title: "Studio cosy", location: "Parakou", price: 28000, priceDisplay: formatPrice(28000), rating: 4.3, reviews: 44, image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80", beds: 1, baths: 1, type: "Studio", city: "Parakou", description: "Petit studio économique." },
  { id: 174, title: "Duplex moderne", location: "Parakou", price: 68000, priceDisplay: formatPrice(68000), rating: 4.6, reviews: 19, image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80", beds: 3, baths: 2, type: "Duplex", city: "Parakou", description: "Duplex lumineux." },
  { id: 175, title: "Maison familiale", location: "Parakou", price: 55000, priceDisplay: formatPrice(55000), rating: 4.5, reviews: 27, image: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80", beds: 3, baths: 2, type: "Maison", city: "Parakou", description: "Grande maison." },
  { id: 176, title: "Loft design", location: "Parakou", price: 50000, priceDisplay: formatPrice(50000), rating: 4.7, reviews: 18, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80", beds: 2, baths: 1, type: "Loft", city: "Parakou", description: "Loft tout équipé." },
  { id: 177, title: "Appartement avec terrasse", location: "Parakou", price: 49000, priceDisplay: formatPrice(49000), rating: 4.5, reviews: 24, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80", beds: 2, baths: 1, type: "Appartement", city: "Parakou", description: "Appartement avec terrasse." }
];

// Dassa-Zoumè
const dassaProperties = [
  { id: 14, title: "Dassa Resort", location: "Dassa-Zoumè", price: 50000, priceDisplay: formatPrice(50000), rating: 4.6, reviews: 41, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80", beds: 2, baths: 1, type: "Resort", city: "Dassa-Zoumè", description: "Resort avec vue sur les collines." },
  { id: 181, title: "Villa avec piscine", location: "Dassa-Zoumè", price: 85000, priceDisplay: formatPrice(85000), rating: 4.8, reviews: 27, image: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=80", beds: 3, baths: 2, type: "Villa", city: "Dassa-Zoumè", description: "Villa privée avec piscine." },
  { id: 182, title: "Appartement vue montagne", location: "Dassa-Zoumè", price: 35000, priceDisplay: formatPrice(35000), rating: 4.4, reviews: 33, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80", beds: 2, baths: 1, type: "Appartement", city: "Dassa-Zoumè", description: "Appartement avec vue montagne." },
  { id: 183, title: "Studio paisible", location: "Dassa-Zoumè", price: 25000, priceDisplay: formatPrice(25000), rating: 4.3, reviews: 38, image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80", beds: 1, baths: 1, type: "Studio", city: "Dassa-Zoumè", description: "Studio calme." },
  { id: 184, title: "Maison de charme", location: "Dassa-Zoumè", price: 48000, priceDisplay: formatPrice(48000), rating: 4.5, reviews: 29, image: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80", beds: 3, baths: 2, type: "Maison", city: "Dassa-Zoumè", description: "Maison traditionnelle rénovée." },
  { id: 185, title: "Duplex moderne", location: "Dassa-Zoumè", price: 62000, priceDisplay: formatPrice(62000), rating: 4.6, reviews: 22, image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80", beds: 3, baths: 2, type: "Duplex", city: "Dassa-Zoumè", description: "Duplex spacieux." },
  { id: 186, title: "Loft nature", location: "Dassa-Zoumè", price: 55000, priceDisplay: formatPrice(55000), rating: 4.7, reviews: 19, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80", beds: 2, baths: 1, type: "Loft", city: "Dassa-Zoumè", description: "Loft au milieu de la nature." },
  { id: 187, title: "Studio cosy", location: "Dassa-Zoumè", price: 28000, priceDisplay: formatPrice(28000), rating: 4.4, reviews: 31, image: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=1200&q=80", beds: 1, baths: 1, type: "Studio", city: "Dassa-Zoumè", description: "Studio fonctionnel." }
];

// Ouidah
const ouidahProperties = [
  { id: 15, title: "Ouidah Beach House", location: "Ouidah", price: 55000, priceDisplay: formatPrice(55000), rating: 4.7, reviews: 56, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80", beds: 3, baths: 2, type: "Maison", city: "Ouidah", description: "Maison de plage avec accès direct à la mer." },
  { id: 191, title: "Villa bord de mer", location: "Ouidah", price: 95000, priceDisplay: formatPrice(95000), rating: 4.9, reviews: 43, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80", beds: 4, baths: 3, type: "Villa", city: "Ouidah", description: "Villa de luxe avec piscine, plage privée." },
  { id: 192, title: "Studio vue mer", location: "Ouidah", price: 40000, priceDisplay: formatPrice(40000), rating: 4.5, reviews: 39, image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80", beds: 1, baths: 1, type: "Studio", city: "Ouidah", description: "Studio avec terrasse vue mer." },
  { id: 193, title: "Appartement confort", location: "Ouidah", price: 48000, priceDisplay: formatPrice(48000), rating: 4.6, reviews: 34, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80", beds: 2, baths: 1, type: "Appartement", city: "Ouidah", description: "Appartement moderne." },
  { id: 194, title: "Maison traditionnelle", location: "Ouidah", price: 50000, priceDisplay: formatPrice(50000), rating: 4.5, reviews: 41, image: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80", beds: 3, baths: 2, type: "Maison", city: "Ouidah", description: "Maison authentique." },
  { id: 195, title: "Duplex familiale", location: "Ouidah", price: 70000, priceDisplay: formatPrice(70000), rating: 4.7, reviews: 28, image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80", beds: 4, baths: 2, type: "Duplex", city: "Ouidah", description: "Grand duplex pour famille." },
  { id: 196, title: "Loft vue océan", location: "Ouidah", price: 65000, priceDisplay: formatPrice(65000), rating: 4.8, reviews: 23, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80", beds: 2, baths: 1, type: "Loft", city: "Ouidah", description: "Loft avec vue imprenable." },
  { id: 197, title: "Studio cosy", location: "Ouidah", price: 30000, priceDisplay: formatPrice(30000), rating: 4.4, reviews: 47, image: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=1200&q=80", beds: 1, baths: 1, type: "Studio", city: "Ouidah", description: "Petit studio bien équipé." }
];

// Grand-Popo
const grandpopoProperties = [
  { id: 16, title: "Grand-Popo Paradise", location: "Grand-Popo", price: 80000, priceDisplay: formatPrice(80000), rating: 4.9, reviews: 89, image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80", beds: 4, baths: 3, type: "Villa", city: "Grand-Popo", description: "Paradis tropical en bord de mer." },
  { id: 201, title: "Villa bord de plage", location: "Grand-Popo", price: 120000, priceDisplay: formatPrice(120000), rating: 4.9, reviews: 67, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80", beds: 4, baths: 3, type: "Villa", city: "Grand-Popo", description: "Villa de luxe avec accès direct à la plage." },
  { id: 202, title: "Bungalow de charme", location: "Grand-Popo", price: 65000, priceDisplay: formatPrice(65000), rating: 4.7, reviews: 53, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80", beds: 2, baths: 1, type: "Bungalow", city: "Grand-Popo", description: "Bungalow typique." },
  { id: 203, title: "Appartement vue mer", location: "Grand-Popo", price: 55000, priceDisplay: formatPrice(55000), rating: 4.6, reviews: 44, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80", beds: 2, baths: 1, type: "Appartement", city: "Grand-Popo", description: "Appartement avec terrasse vue mer." },
  { id: 204, title: "Maison de pêcheur", location: "Grand-Popo", price: 40000, priceDisplay: formatPrice(40000), rating: 4.5, reviews: 58, image: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80", beds: 3, baths: 2, type: "Maison", city: "Grand-Popo", description: "Maison authentique." },
  { id: 205, title: "Studio face mer", location: "Grand-Popo", price: 35000, priceDisplay: formatPrice(35000), rating: 4.4, reviews: 39, image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80", beds: 1, baths: 1, type: "Studio", city: "Grand-Popo", description: "Petit studio pieds dans l'eau." },
  { id: 206, title: "Duplex familial", location: "Grand-Popo", price: 85000, priceDisplay: formatPrice(85000), rating: 4.8, reviews: 32, image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80", beds: 4, baths: 2, type: "Duplex", city: "Grand-Popo", description: "Duplex spacieux." },
  { id: 207, title: "Loft tropical", location: "Grand-Popo", price: 70000, priceDisplay: formatPrice(70000), rating: 4.7, reviews: 28, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80", beds: 2, baths: 1, type: "Loft", city: "Grand-Popo", description: "Loft design en bord de plage." }
];

// Mapping des catégories de villes
const cityCategories: Record<string, { title: string; properties: any[] }> = {
  'portonovo': { title: 'Porto-Novo', properties: portonovoProperties },
  'abomeycalavi': { title: 'Abomey-Calavi', properties: abomeycalaviProperties },
  'akpakpa': { title: 'Akpakpa', properties: akpakpaProperties },
  'menontin': { title: 'Menontin', properties: menontinProperties },
  'fidjrosse': { title: 'Fidjrossè', properties: fidjrosseProperties },
  'abomey': { title: 'Abomey', properties: abomeyProperties },
  'parakou': { title: 'Parakou', properties: parakouProperties },
  'dassa': { title: 'Dassa-Zoumè', properties: dassaProperties },
  'ouidah': { title: 'Ouidah', properties: ouidahProperties },
  'grandpopo': { title: 'Grand-Popo', properties: grandpopoProperties }
};

const filters = ["Tous", "Prix croissant", "Prix décroissant", "Mieux notés"];

const PropertyCard = ({ property, showDescription = false, onNavigate }: any) => (
  <div className="group cursor-pointer" onClick={() => onNavigate?.({ name: 'listing', id: property.id.toString() })}>
    <div className="relative overflow-hidden rounded-2xl">
      <img
        src={property.images?.[0] || property.image || '/placeholder.jpg'}
        alt={property.title}
        className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.jpg'; }}
      />
      <button className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white transition-colors z-10">
        <Heart className="w-5 h-5" />
      </button>
    </div>
    <div className="mt-3">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h3 className="font-semibold text-[#0F2940]">{property.title}</h3>
          <p className="text-sm text-gray-500 mt-1">{property.location}</p>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Star className="w-4 h-4 text-[#00c9a7] fill-current" />
          <span className="font-medium text-[#0F2940]">{property.rating}</span>
          <span>({property.reviews})</span>
        </div>
      </div>
      {showDescription && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{property.description}</p>}
      <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-500">
        <div className="flex items-center gap-1"><Bed className="w-4 h-4" /><span>{property.beds} lits</span></div>
        <div className="flex items-center gap-1"><Bath className="w-4 h-4" /><span>{property.baths} sdb</span></div>
      </div>
      <p className="mt-3 font-semibold text-[#0F2940]">{property.priceDisplay}</p>
    </div>
  </div>
);

export default function City({ onNavigate }: { onNavigate?: (route: any) => void }) {
  const navigate = useNavigate();
  const { cityKey } = useParams<{ cityKey: string }>();
  const [selectedFilter, setSelectedFilter] = useState("Tous");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const category = cityKey ? cityCategories[cityKey] : null;

  const getFilteredProperties = () => {
    if (!category) return [];
    let filtered = [...category.properties];
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

  const filteredProperties = getFilteredProperties();

  const handleNavigate = (route: any) => {
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

  if (!category) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-xl text-center p-8">
          <h1 className="text-2xl font-semibold text-[#222222]">Ville introuvable</h1>
          <p className="mt-4 text-gray-600">La ville demandée n'existe pas.</p>
          <button onClick={() => navigate(-1)} className="mt-6 rounded-full bg-[#00c9a7] text-[#0F2940] px-6 py-3 font-semibold hover:bg-[#00b892] transition-colors shadow-md">
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-[#00c9a7]/10 to-[#0f2940]/10 pt-8 pb-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => handleNavigate({ name: 'home' })}
            className="text-[#00c9a7] hover:text-[#00b396] transition-colors mb-4 inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
          </button>
          <div className="flex items-center gap-3 mb-3">
            <MapPin className="w-8 h-8 text-[#00c9a7]" />
            <h1 className="text-3xl sm:text-4xl font-bold text-[#0f2940]">Logements à {category.title}</h1>
          </div>
          <p className="text-gray-600 text-lg">Découvrez les meilleurs hébergements à {category.title}, Bénin</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="border-b border-gray-200 sticky top-0 bg-white z-30">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
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
            <div className="text-sm text-gray-500">{filteredProperties.length} logements disponibles</div>
          </div>
        </div>
      </div>

      {/* Grille des logements */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProperties.map(property => (
            <PropertyCard key={property.id} property={property} showDescription={true} onNavigate={handleNavigate} />
          ))}
        </div>
      </main>
    </div>
  );
}