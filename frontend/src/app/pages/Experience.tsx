import { useState } from "react";
import { Search, Calendar, Users, X, Star, Heart } from "lucide-react";

const asset = (filename: string) => new URL(`../../public/${filename}`, import.meta.url).href;

// ========== DONNÉES DE BASE POUR GÉNÉRER DES IMAGES VARIÉES ==========
const themeImages = {
  nature: [
    asset("oiseaux.jpg"),
    asset("soleil.jpg"),
    asset("pêche.jpg"),
    asset("pêche1.jpg"),
  ],
  culture: [
    asset("culture.jpg"),
    asset("culture1.jpg"),
    asset("culture2.jpg"),
    asset("culture4.jpg"),
  ],
  artisanat: [
    asset("artisanat.jpg"),
    asset("artisanat1.jpg"),
    asset("artisanat2.jpg"),
    asset("artisanat3.jpg"),
  ],
  cuisine: [
    asset("repas.jpg"),
    asset("repas3.jpg"),
    asset("repas4.jpg"),
    asset("repas5.jpg"),
  ],
  aventure: [
    asset("pêche2.jpg"),
    asset("pêche3.jpg"),
    asset("pêche4.jpg"),
    asset("pêche5.jpg"),
  ],
  musique: [
    asset("danse.jpg"),
    asset("sortie.jpg"),
    asset("marché.jpg"),
    asset("marché1.jpg"),
  ],
  plage: [
    asset("soleil.jpg"),
    asset("oiseaux.jpg"),
    asset("pêche.jpg"),
    asset("pêche1.jpg"),
  ],
};

// Fonction utilitaire pour générer des avis personnalisés (3 par expérience)
const generateReviews = (title: string, location: string) => [
  {
    name: "Voyageur",
    location: "Cotonou, Bénin",
    daysAgo: "il y a 2 jours",
    text: `Expérience incroyable : "${title}" à ${location} ! L'hôte était très accueillant et nous avons appris beaucoup.`,
    rating: 5.0,
  },
  {
    name: "Exploratrice",
    location: "Porto-Novo, Bénin",
    daysAgo: "il y a 5 jours",
    text: `Très bonne organisation, le cadre était magnifique. Je recommande vivement cette activité à ${location}.`,
    rating: 4.9,
  },
  {
    name: "Passionné",
    location: "Abomey, Bénin",
    daysAgo: "il y a 1 semaine",
    text: `Une immersion authentique dans la culture locale. L'expérience "${title}" est à faire absolument.`,
    rating: 5.0,
  },
];

// ========== EXPÉRIENCES RECOMMANDÉES (ORIGINALS) ==========
const originalsExperiences = [
  {
    id: 1,
    title: "Atelier de teinture adire et batik béninois",
    location: "Abomey, Bénin",
    price: 45,
    priceType: "par voyageur",
    rating: 4.98,
    images: themeImages.artisanat,
    hostType: "Particulier",
    reviews: generateReviews("Atelier de teinture adire", "Abomey"),
  },
  {
    id: 2,
    title: "Immersion vaudou et marché d'Ouidah",
    location: "Ouidah, Bénin",
    price: 35,
    priceType: "par voyageur",
    rating: 4.92,
    images: themeImages.culture,
    hostType: "Local",
    reviews: generateReviews("Immersion vaudou", "Ouidah"),
  },
  {
    id: 3,
    title: "Danse gèlèdé et percussions à Grand-Popo",
    location: "Grand-Popo, Bénin",
    price: 50,
    priceType: "par groupe",
    rating: 4.95,
    images: themeImages.musique,
    hostType: "Professionnel",
    reviews: generateReviews("Danse gèlèdé", "Grand-Popo"),
  },
  {
    id: 4,
    title: "Pêche traditionnelle sur le lac Nokoué",
    location: "Cotonou, Bénin",
    price: 40,
    priceType: "par voyageur",
    rating: 4.90,
    images: themeImages.nature,
    hostType: "Local",
    reviews: generateReviews("Pêche traditionnelle", "lac Nokoué"),
  },
  {
    id: 5,
    title: "Balade culturelle au palais royal d'Abomey",
    location: "Abomey, Bénin",
    price: 55,
    priceType: "par voyageur",
    rating: 4.93,
    images: themeImages.culture,
    hostType: "Particulier",
    reviews: generateReviews("Balade au palais royal", "Abomey"),
  },
  {
    id: 6,
    title: "Cours de cuisine locale : yassa et akassa",
    location: "Porto-Novo, Bénin",
    price: 30,
    priceType: "par voyageur",
    rating: 4.97,
    images: themeImages.cuisine,
    hostType: "Particulier",
    reviews: generateReviews("Cours de cuisine", "Porto-Novo"),
  },
  {
    id: 7,
    title: "Safari photo des oiseaux de Pendjari",
    location: "Parakou, Bénin",
    price: 65,
    priceType: "par groupe",
    rating: 4.89,
    images: themeImages.nature,
    hostType: "Professionnel",
    reviews: generateReviews("Safari photo", "Pendjari"),
  },
  {
    id: 8,
    title: "Atelier de sculpture sur bois béninois",
    location: "Lokossa, Bénin",
    price: 28,
    priceType: "par voyageur",
    rating: 4.91,
    images: themeImages.artisanat,
    hostType: "Particulier",
    reviews: generateReviews("Sculpture sur bois", "Lokossa"),
  },
];

// ========== EXPÉRIENCES · COTONOU ==========
const cotonouExperiences = [
  {
    id: 101,
    title: "Balade en pirogue sur le lac Nokoué",
    price: 42,
    rating: 4.95,
    images: themeImages.nature,
    hostType: "Local",
    reviews: generateReviews("Balade en pirogue", "lac Nokoué"),
  },
  {
    id: 102,
    title: "Atelier de batik et teinture aux couleurs béninoises",
    price: 38,
    rating: 4.92,
    images: themeImages.artisanat,
    hostType: "Particulier",
    reviews: generateReviews("Atelier de batik", "Cotonou"),
  },
  {
    id: 103,
    title: "Marché Dantokpa : cuisine de rue et épices",
    price: 29,
    rating: 4.88,
    images: themeImages.cuisine,
    hostType: "Local",
    reviews: generateReviews("Marché Dantokpa", "Cotonou"),
  },
  {
    id: 104,
    title: "Visite du centre culturel de Cotonou",
    price: 20,
    rating: 4.84,
    images: themeImages.culture,
    hostType: "Professionnel",
    reviews: generateReviews("Centre culturel", "Cotonou"),
  },
  {
    id: 105,
    title: "Circuit street art et créateurs locaux",
    price: 33,
    rating: 4.90,
    images: themeImages.culture,
    hostType: "Particulier",
    reviews: generateReviews("Street art Cotonou", "Cotonou"),
  },
  {
    id: 106,
    title: "Excursion au village Ganvié sur pilotis",
    price: 47,
    rating: 4.97,
    images: themeImages.aventure,
    hostType: "Professionnel",
    reviews: generateReviews("Village Ganvié", "Cotonou"),
  },
  {
    id: 107,
    title: "Découverte des marchés nocturnes de Cotonou",
    price: 25,
    rating: 4.86,
    images: themeImages.culture,
    hostType: "Local",
    reviews: generateReviews("Marchés nocturnes", "Cotonou"),
  },
  {
    id: 108,
    title: "Soirée musique et percussions au bord du lagon",
    price: 44,
    rating: 4.93,
    images: themeImages.musique,
    hostType: "Professionnel",
    reviews: generateReviews("Musique au lagon", "Cotonou"),
  },
];

// ========== EXPÉRIENCES · PORTO-NOVO ==========
const portonovoExperiences = [
  {
    id: 201,
    title: "Visite du marché d'Adjohoun et dégustation",
    price: 32,
    rating: 4.90,
    images: themeImages.cuisine,
    hostType: "Local",
    reviews: generateReviews("Marché Adjohoun", "Porto-Novo"),
  },
  {
    id: 202,
    title: "Cours de cuisine béninoise à Porto-Novo",
    price: 29,
    rating: 4.97,
    images: themeImages.cuisine,
    hostType: "Particulier",
    reviews: generateReviews("Cuisine béninoise", "Porto-Novo"),
  },
  {
    id: 203,
    title: "Balade historique au musée Honmè",
    price: 22,
    rating: 4.92,
    images: themeImages.culture,
    hostType: "Professionnel",
    reviews: generateReviews("Musée Honmè", "Porto-Novo"),
  },
  {
    id: 204,
    title: "Découverte des tissus traditionnels béninois",
    price: 27,
    rating: 4.89,
    images: themeImages.artisanat,
    hostType: "Particulier",
    reviews: generateReviews("Tissus traditionnels", "Porto-Novo"),
  },
  {
    id: 205,
    title: "Randonnée culturelle autour du parc forestier",
    price: 34,
    rating: 4.91,
    images: themeImages.nature,
    hostType: "Particulier",
    reviews: generateReviews("Randonnée culturelle", "Porto-Novo"),
  },
  {
    id: 206,
    title: "Atelier de percussion avec un groupe local",
    price: 45,
    rating: 4.96,
    images: themeImages.musique,
    hostType: "Professionnel",
    reviews: generateReviews("Atelier percussion", "Porto-Novo"),
  },
  {
    id: 207,
    title: "Croisière au coucher du soleil sur le fleuve Ouémé",
    price: 39,
    rating: 4.94,
    images: themeImages.nature,
    hostType: "Local",
    reviews: generateReviews("Croisière fleuve Ouémé", "Porto-Novo"),
  },
  {
    id: 208,
    title: "Initiation aux légendes fon",
    price: 25,
    rating: 4.88,
    images: themeImages.culture,
    hostType: "Particulier",
    reviews: generateReviews("Légendes fon", "Porto-Novo"),
  },
];

// ========== EXPÉRIENCES · OUIDAH ==========
const ouidahExperiences = [
  {
    id: 301,
    title: "Cérémonie vaudou guidée",
    price: 44,
    rating: 4.96,
    images: themeImages.culture,
    hostType: "Local",
    reviews: generateReviews("Cérémonie vaudou", "Ouidah"),
  },
  {
    id: 302,
    title: "Atelier de sculpture sur bois",
    price: 38,
    rating: 4.92,
    images: themeImages.artisanat,
    hostType: "Particulier",
    reviews: generateReviews("Sculpture bois", "Ouidah"),
  },
  {
    id: 303,
    title: "Visite du Musée des Pêches",
    price: 26,
    rating: 4.88,
    images: themeImages.culture,
    hostType: "Professionnel",
    reviews: generateReviews("Musée des Pêches", "Ouidah"),
  },
  {
    id: 304,
    title: "Balade au bord de la plage et contes locaux",
    price: 30,
    rating: 4.90,
    images: themeImages.plage,
    hostType: "Local",
    reviews: generateReviews("Plage et contes", "Ouidah"),
  },
  {
    id: 305,
    title: "La route des esclaves : histoire et mémoire",
    price: 34,
    rating: 4.94,
    images: themeImages.culture,
    hostType: "Professionnel",
    reviews: generateReviews("Route des esclaves", "Ouidah"),
  },
  {
    id: 306,
    title: "Cuisine de rue et poissons au feu de bois",
    price: 29,
    rating: 4.89,
    images: themeImages.cuisine,
    hostType: "Local",
    reviews: generateReviews("Cuisine de rue Ouidah", "Ouidah"),
  },
  {
    id: 307,
    title: "Percussions traditionnelles fon",
    price: 42,
    rating: 4.95,
    images: themeImages.musique,
    hostType: "Professionnel",
    reviews: generateReviews("Percussions fon", "Ouidah"),
  },
  {
    id: 308,
    title: "Savoir-faire du tisserand d'Ouidah",
    price: 36,
    rating: 4.91,
    images: themeImages.artisanat,
    hostType: "Particulier",
    reviews: generateReviews("Tisserand Ouidah", "Ouidah"),
  },
];

// ========== EXPÉRIENCES · GRAND-POPO ==========
const grandpopoExperiences = [
  {
    id: 401,
    title: "Cours de danse gèlèdé sur la plage",
    price: 42,
    rating: 4.95,
    images: themeImages.musique,
    hostType: "Professionnel",
    reviews: generateReviews("Danse gèlèdé", "Grand-Popo"),
  },
  {
    id: 402,
    title: "Balade et atelier de coquillages",
    price: 30,
    rating: 4.90,
    images: themeImages.plage,
    hostType: "Local",
    reviews: generateReviews("Atelier coquillages", "Grand-Popo"),
  },
  {
    id: 403,
    title: "Cuisine de la côte béninoise",
    price: 35,
    rating: 4.92,
    images: themeImages.cuisine,
    hostType: "Particulier",
    reviews: generateReviews("Cuisine côtière", "Grand-Popo"),
  },
  {
    id: 404,
    title: "Visite d'ateliers de vannerie",
    price: 28,
    rating: 4.89,
    images: themeImages.artisanat,
    hostType: "Professionnel",
    reviews: generateReviews("Vannerie", "Grand-Popo"),
  },
  {
    id: 405,
    title: "Percussions traditionnelles au village",
    price: 39,
    rating: 4.94,
    images: themeImages.musique,
    hostType: "Local",
    reviews: generateReviews("Percussions village", "Grand-Popo"),
  },
  {
    id: 406,
    title: "Rencontre avec les pêcheurs de la lagune",
    price: 31,
    rating: 4.91,
    images: themeImages.nature,
    hostType: "Particulier",
    reviews: generateReviews("Pêcheurs lagune", "Grand-Popo"),
  },
  {
    id: 407,
    title: "Piquenique culturel et contes",
    price: 27,
    rating: 4.96,
    images: themeImages.nature,
    hostType: "Professionnel",
    reviews: generateReviews("Piquenique culturel", "Grand-Popo"),
  },
  {
    id: 408,
    title: "Excursion mangrove et oiseaux",
    price: 48,
    rating: 4.93,
    images: themeImages.nature,
    hostType: "Local",
    reviews: generateReviews("Mangrove", "Grand-Popo"),
  },
];

// ========== EXPÉRIENCES · ABOMEY ==========
const abomeyExperiences = [
  {
    id: 501,
    title: "Visite des palais royaux",
    price: 52,
    rating: 4.96,
    images: themeImages.culture,
    hostType: "Professionnel",
    reviews: generateReviews("Palais royaux", "Abomey"),
  },
  {
    id: 502,
    title: "Atelier de fabrication de percussions",
    price: 37,
    rating: 4.92,
    images: themeImages.musique,
    hostType: "Particulier",
    reviews: generateReviews("Fabrication percussions", "Abomey"),
  },
  {
    id: 503,
    title: "Initiation aux rituels royaux",
    price: 45,
    rating: 4.94,
    images: themeImages.culture,
    hostType: "Local",
    reviews: generateReviews("Rituels royaux", "Abomey"),
  },
  {
    id: 504,
    title: "Tissage et teinture traditionnelle",
    price: 29,
    rating: 4.90,
    images: themeImages.artisanat,
    hostType: "Professionnel",
    reviews: generateReviews("Tissage teinture", "Abomey"),
  },
  {
    id: 505,
    title: "Dîner royal : cuisine dahoméenne",
    price: 55,
    rating: 4.95,
    images: themeImages.cuisine,
    hostType: "Particulier",
    reviews: generateReviews("Dîner royal", "Abomey"),
  },
  {
    id: 506,
    title: "Balade au musée historique",
    price: 28,
    rating: 4.89,
    images: themeImages.culture,
    hostType: "Local",
    reviews: generateReviews("Musée historique", "Abomey"),
  },
  {
    id: 507,
    title: "Exploration en calèche traditionnelle",
    price: 40,
    rating: 4.93,
    images: themeImages.aventure,
    hostType: "Professionnel",
    reviews: generateReviews("Calèche traditionnelle", "Abomey"),
  },
  {
    id: 508,
    title: "Sculpture sur bois et bronze",
    price: 33,
    rating: 4.91,
    images: themeImages.artisanat,
    hostType: "Particulier",
    reviews: generateReviews("Sculpture bronze", "Abomey"),
  },
];

// ========== EXPÉRIENCES · PARAKOU ==========
const parakouExperiences = [
  {
    id: 601,
    title: "Safari dans la Pendjari (journée)",
    price: 120,
    rating: 4.97,
    images: themeImages.nature,
    hostType: "Professionnel",
    reviews: generateReviews("Safari Pendjari", "Parakou"),
  },
  {
    id: 602,
    title: "Randonnée à la découverte de la forêt classée",
    price: 35,
    rating: 4.88,
    images: themeImages.aventure,
    hostType: "Local",
    reviews: generateReviews("Forêt classée", "Parakou"),
  },
  {
    id: 603,
    title: "Rencontre avec les éleveurs peuls",
    price: 42,
    rating: 4.94,
    images: themeImages.culture,
    hostType: "Particulier",
    reviews: generateReviews("Éleveurs peuls", "Parakou"),
  },
  {
    id: 604,
    title: "Atelier de poterie traditionnelle",
    price: 25,
    rating: 4.91,
    images: themeImages.artisanat,
    hostType: "Local",
    reviews: generateReviews("Poterie traditionnelle", "Parakou"),
  },
  {
    id: 605,
    title: "Dégustation de miel et produits de la ruche",
    price: 22,
    rating: 4.86,
    images: themeImages.cuisine,
    hostType: "Particulier",
    reviews: generateReviews("Dégustation miel", "Parakou"),
  },
  {
    id: 606,
    title: "Balade dans le marché artisanal de Parakou",
    price: 18,
    rating: 4.85,
    images: themeImages.artisanat,
    hostType: "Professionnel",
    reviews: generateReviews("Marché artisanal", "Parakou"),
  },
  {
    id: 607,
    title: "Initiation à la danse peule",
    price: 38,
    rating: 4.93,
    images: themeImages.musique,
    hostType: "Local",
    reviews: generateReviews("Danse peule", "Parakou"),
  },
  {
    id: 608,
    title: "Excursion aux chutes de Tanougou (depuis Parakou)",
    price: 75,
    rating: 4.96,
    images: themeImages.nature,
    hostType: "Professionnel",
    reviews: generateReviews("Chutes Tanougou", "Parakou"),
  },
];

// ========== EXPÉRIENCES · NATITINGOU ==========
const natitingouExperiences = [
  {
    id: 701,
    title: "Découverte des Tata Somba (habitats fortifiés)",
    price: 55,
    rating: 4.99,
    images: themeImages.culture,
    hostType: "Local",
    reviews: generateReviews("Tata Somba", "Natitingou"),
  },
  {
    id: 702,
    title: "Atelier de tissage et de teinture à l'indigo",
    price: 32,
    rating: 4.92,
    images: themeImages.artisanat,
    hostType: "Particulier",
    reviews: generateReviews("Teinture indigo", "Natitingou"),
  },
  {
    id: 703,
    title: "Randonnée aux monts du Nati",
    price: 28,
    rating: 4.91,
    images: themeImages.aventure,
    hostType: "Professionnel",
    reviews: generateReviews("Monts du Nati", "Natitingou"),
  },
  {
    id: 704,
    title: "Visite des chutes de Tanougou",
    price: 40,
    rating: 4.94,
    images: themeImages.nature,
    hostType: "Local",
    reviews: generateReviews("Chutes Tanougou", "Natitingou"),
  },
  {
    id: 705,
    title: "Cours de cuisine somba",
    price: 30,
    rating: 4.96,
    images: themeImages.cuisine,
    hostType: "Particulier",
    reviews: generateReviews("Cuisine somba", "Natitingou"),
  },
  {
    id: 706,
    title: "Atelier de vannerie (pailles endémiques)",
    price: 22,
    rating: 4.88,
    images: themeImages.artisanat,
    hostType: "Local",
    reviews: generateReviews("Vannerie", "Natitingou"),
  },
  {
    id: 707,
    title: "Contes et légendes autour du feu",
    price: 20,
    rating: 4.93,
    images: themeImages.culture,
    hostType: "Professionnel",
    reviews: generateReviews("Contes", "Natitingou"),
  },
  {
    id: 708,
    title: "Observation des oiseaux du parc Pendjari (départ Natitingou)",
    price: 68,
    rating: 4.97,
    images: themeImages.nature,
    hostType: "Professionnel",
    reviews: generateReviews("Observation oiseaux", "Natitingou"),
  },
];

// ========== EXPÉRIENCES · DASSA-ZOUNMÈ ==========
const dassaExperiences = [
  {
    id: 801,
    title: "Escalade des collines sacrées",
    price: 28,
    rating: 4.92,
    images: themeImages.aventure,
    hostType: "Local",
    reviews: generateReviews("Collines sacrées", "Dassa-Zoumè"),
  },
  {
    id: 802,
    title: "Méditation et yoga au Igbo Oluwa (montagne)",
    price: 35,
    rating: 4.96,
    images: themeImages.nature,
    hostType: "Particulier",
    reviews: generateReviews("Yoga Igbo Oluwa", "Dassa-Zoumè"),
  },
  {
    id: 803,
    title: "Visite du temple des pythons",
    price: 18,
    rating: 4.85,
    images: themeImages.culture,
    hostType: "Professionnel",
    reviews: generateReviews("Temple des pythons", "Dassa-Zoumè"),
  },
  {
    id: 804,
    title: "Randonnée et découverte des chutes d’Igbo Oluwa",
    price: 32,
    rating: 4.90,
    images: themeImages.nature,
    hostType: "Local",
    reviews: generateReviews("Chutes Igbo Oluwa", "Dassa-Zoumè"),
  },
  {
    id: 805,
    title: "Atelier de fabrication de bijoux en perles",
    price: 26,
    rating: 4.89,
    images: themeImages.artisanat,
    hostType: "Particulier",
    reviews: generateReviews("Bijoux en perles", "Dassa-Zoumè"),
  },
  {
    id: 806,
    title: "Initiation aux danses de la région",
    price: 33,
    rating: 4.93,
    images: themeImages.musique,
    hostType: "Local",
    reviews: generateReviews("Danses régionales", "Dassa-Zoumè"),
  },
  {
    id: 807,
    title: "Cours de cuisine régionale (pâte et sauce arachide)",
    price: 29,
    rating: 4.94,
    images: themeImages.cuisine,
    hostType: "Professionnel",
    reviews: generateReviews("Cuisine régionale", "Dassa-Zoumè"),
  },
  {
    id: 808,
    title: "Balade au marché forain et dégustation de fruits locaux",
    price: 22,
    rating: 4.87,
    images: themeImages.cuisine,
    hostType: "Local",
    reviews: generateReviews("Marché forain", "Dassa-Zoumè"),
  },
];

// ========== EXPÉRIENCES · BOHICON ==========
const bohiconExperiences = [
  {
    id: 901,
    title: "Visite du musée d'histoire de Bohicon",
    price: 18,
    rating: 4.86,
    images: themeImages.culture,
    hostType: "Professionnel",
    reviews: generateReviews("Musée d'histoire", "Bohicon"),
  },
  {
    id: 902,
    title: "Atelier de poterie et céramique traditionnelle",
    price: 25,
    rating: 4.90,
    images: themeImages.artisanat,
    hostType: "Particulier",
    reviews: generateReviews("Poterie céramique", "Bohicon"),
  },
  {
    id: 903,
    title: "Parcours des artisans bronziers",
    price: 30,
    rating: 4.92,
    images: themeImages.artisanat,
    hostType: "Local",
    reviews: generateReviews("Artisans bronziers", "Bohicon"),
  },
  {
    id: 904,
    title: "Dégustation de vin de palme avec les producteurs",
    price: 22,
    rating: 4.89,
    images: themeImages.cuisine,
    hostType: "Particulier",
    reviews: generateReviews("Vin de palme", "Bohicon"),
  },
  {
    id: 905,
    title: "Randonnée vers les collines de Bohicon",
    price: 27,
    rating: 4.91,
    images: themeImages.aventure,
    hostType: "Local",
    reviews: generateReviews("Collines de Bohicon", "Bohicon"),
  },
  {
    id: 906,
    title: "Atelier de peinture sur rouleau (art vodoun)",
    price: 35,
    rating: 4.94,
    images: themeImages.artisanat,
    hostType: "Professionnel",
    reviews: generateReviews("Peinture vodoun", "Bohicon"),
  },
  {
    id: 907,
    title: "Cours de danses et percussions goun",
    price: 40,
    rating: 4.95,
    images: themeImages.musique,
    hostType: "Local",
    reviews: generateReviews("Danses goun", "Bohicon"),
  },
  {
    id: 908,
    title: "Pique-nique au bord du lac de Bohicon",
    price: 24,
    rating: 4.87,
    images: themeImages.nature,
    hostType: "Particulier",
    reviews: generateReviews("Lac de Bohicon", "Bohicon"),
  },
];

// ========== EXPÉRIENCES · LOKOSSA ==========
const lokossaExperiences = [
  {
    id: 1001,
    title: "Atelier de poterie traditionnelle de Lokossa",
    price: 28,
    rating: 4.91,
    images: themeImages.artisanat,
    hostType: "Particulier",
    reviews: generateReviews("Poterie Lokossa", "Lokossa"),
  },
  {
    id: 1002,
    title: "Découverte des marais sacrés et légendes",
    price: 25,
    rating: 4.89,
    images: themeImages.nature,
    hostType: "Local",
    reviews: generateReviews("Marais sacrés", "Lokossa"),
  },
  {
    id: 1003,
    title: "Initiation à la pêche aux filets",
    price: 32,
    rating: 4.92,
    images: themeImages.aventure,
    hostType: "Professionnel",
    reviews: generateReviews("Pêche aux filets", "Lokossa"),
  },
  {
    id: 1004,
    title: "Cours de cuisine du Mono (poisson braisé)",
    price: 30,
    rating: 4.94,
    images: themeImages.cuisine,
    hostType: "Particulier",
    reviews: generateReviews("Cuisine du Mono", "Lokossa"),
  },
  {
    id: 1005,
    title: "Promenade en pirogue sur le fleuve Mono",
    price: 35,
    rating: 4.93,
    images: themeImages.nature,
    hostType: "Local",
    reviews: generateReviews("Pirogue fleuve Mono", "Lokossa"),
  },
  {
    id: 1006,
    title: "Atelier de tissage de pagnes",
    price: 26,
    rating: 4.88,
    images: themeImages.artisanat,
    hostType: "Particulier",
    reviews: generateReviews("Tissage pagnes", "Lokossa"),
  },
  {
    id: 1007,
    title: "Visite d'une plantation de cacao",
    price: 22,
    rating: 4.86,
    images: themeImages.nature,
    hostType: "Professionnel",
    reviews: generateReviews("Plantation cacao", "Lokossa"),
  },
  {
    id: 1008,
    title: "Soirée contes autour du fleuve",
    price: 18,
    rating: 4.90,
    images: themeImages.culture,
    hostType: "Local",
    reviews: generateReviews("Contes du fleuve", "Lokossa"),
  },
];

// ========== EXPÉRIENCES · SAVALOU ==========
const savalouExperiences = [
  {
    id: 1101,
    title: "Atelier de fabrication de tambours",
    price: 38,
    rating: 4.96,
    images: themeImages.musique,
    hostType: "Particulier",
    reviews: generateReviews("Fabrication tambours", "Savalou"),
  },
  {
    id: 1102,
    title: "Rituel de purification et offrandes",
    price: 33,
    rating: 4.93,
    images: themeImages.culture,
    hostType: "Local",
    reviews: generateReviews("Rituel purification", "Savalou"),
  },
  {
    id: 1103,
    title: "Danse et percussions africaines",
    price: 35,
    rating: 4.95,
    images: themeImages.musique,
    hostType: "Professionnel",
    reviews: generateReviews("Danse percussions", "Savalou"),
  },
  {
    id: 1104,
    title: "Marché artisanal de Savalou",
    price: 15,
    rating: 4.87,
    images: themeImages.artisanat,
    hostType: "Local",
    reviews: generateReviews("Marché artisanal", "Savalou"),
  },
  {
    id: 1105,
    title: "Atelier de teinture traditionnelle",
    price: 28,
    rating: 4.92,
    images: themeImages.artisanat,
    hostType: "Particulier",
    reviews: generateReviews("Teinture traditionnelle", "Savalou"),
  },
  {
    id: 1106,
    title: "Randonnée dans la forêt sacrée",
    price: 30,
    rating: 4.90,
    images: themeImages.nature,
    hostType: "Local",
    reviews: generateReviews("Forêt sacrée", "Savalou"),
  },
  {
    id: 1107,
    title: "Cours de cuisine béninoise traditionnelle",
    price: 27,
    rating: 4.94,
    images: themeImages.cuisine,
    hostType: "Professionnel",
    reviews: generateReviews("Cuisine béninoise", "Savalou"),
  },
  {
    id: 1108,
    title: "Rencontre avec un guérisseur local",
    price: 40,
    rating: 4.97,
    images: themeImages.culture,
    hostType: "Particulier",
    reviews: generateReviews("Guérisseur", "Savalou"),
  },
];

// ========== EXPÉRIENCES · KÉTOU ==========
const ketouExperiences = [
  {
    id: 1201,
    title: "Visite du palais royal de Kétou",
    price: 22,
    rating: 4.89,
    images: themeImages.culture,
    hostType: "Professionnel",
    reviews: generateReviews("Palais royal", "Kétou"),
  },
  {
    id: 1202,
    title: "Atelier de poterie nagot",
    price: 26,
    rating: 4.91,
    images: themeImages.artisanat,
    hostType: "Particulier",
    reviews: generateReviews("Poterie nagot", "Kétou"),
  },
  {
    id: 1203,
    title: "Balade dans la forêt des singes",
    price: 25,
    rating: 4.93,
    images: themeImages.nature,
    hostType: "Local",
    reviews: generateReviews("Forêt des singes", "Kétou"),
  },
  {
    id: 1204,
    title: "Découverte du marché de Kétou",
    price: 12,
    rating: 4.86,
    images: themeImages.culture,
    hostType: "Local",
    reviews: generateReviews("Marché de Kétou", "Kétou"),
  },
  {
    id: 1205,
    title: "Initiation aux contes et légendes nagot",
    price: 20,
    rating: 4.88,
    images: themeImages.culture,
    hostType: "Particulier",
    reviews: generateReviews("Contes nagot", "Kétou"),
  },
  {
    id: 1206,
    title: "Atelier de sculpture sur bois",
    price: 30,
    rating: 4.92,
    images: themeImages.artisanat,
    hostType: "Professionnel",
    reviews: generateReviews("Sculpture bois", "Kétou"),
  },
  {
    id: 1207,
    title: "Cuisine yoruba du Bénin",
    price: 28,
    rating: 4.90,
    images: themeImages.cuisine,
    hostType: "Particulier",
    reviews: generateReviews("Cuisine yoruba", "Kétou"),
  },
  {
    id: 1208,
    title: "Randonnée aux collines de Kétou",
    price: 24,
    rating: 4.87,
    images: themeImages.aventure,
    hostType: "Local",
    reviews: generateReviews("Collines de Kétou", "Kétou"),
  },
];

// ========== EXPÉRIENCES · POBÈ ==========
const pobeExperiences = [
  {
    id: 1301,
    title: "Visite d'une plantation d'huile de palme",
    price: 28,
    rating: 4.90,
    images: themeImages.nature,
    hostType: "Professionnel",
    reviews: generateReviews("Plantation huile palme", "Pobè"),
  },
  {
    id: 1302,
    title: "Atelier de fabrication du savon artisanal",
    price: 22,
    rating: 4.89,
    images: themeImages.artisanat,
    hostType: "Particulier",
    reviews: generateReviews("Savon artisanal", "Pobè"),
  },
  {
    id: 1303,
    title: "Dégustation de spécialités à base de palme",
    price: 18,
    rating: 4.88,
    images: themeImages.cuisine,
    hostType: "Local",
    reviews: generateReviews("Spécialités palme", "Pobè"),
  },
  {
    id: 1304,
    title: "Balade dans la forêt de Pobè",
    price: 25,
    rating: 4.92,
    images: themeImages.nature,
    hostType: "Local",
    reviews: generateReviews("Forêt de Pobè", "Pobè"),
  },
  {
    id: 1305,
    title: "Cours de cuisine béninoise (recettes à l'huile de palme)",
    price: 32,
    rating: 4.94,
    images: themeImages.cuisine,
    hostType: "Particulier",
    reviews: generateReviews("Cuisine huile palme", "Pobè"),
  },
  {
    id: 1306,
    title: "Atelier de vannerie",
    price: 20,
    rating: 4.86,
    images: themeImages.artisanat,
    hostType: "Professionnel",
    reviews: generateReviews("Vannerie", "Pobè"),
  },
  {
    id: 1307,
    title: "Randonnée culturelle chez les communautés locales",
    price: 27,
    rating: 4.91,
    images: themeImages.aventure,
    hostType: "Local",
    reviews: generateReviews("Randonnée communautaire", "Pobè"),
  },
  {
    id: 1308,
    title: "Pêche nocturne au barrage de Pobè",
    price: 35,
    rating: 4.93,
    images: themeImages.nature,
    hostType: "Particulier",
    reviews: generateReviews("Pêche nocturne", "Pobè"),
  },
];

// ========== COMPOSANT PRINCIPAL ==========
export default function Experiences() {
  const [selectedExperience, setSelectedExperience] = useState<any | null>(null);
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guestCounts, setGuestCounts] = useState({ adults: 0, children: 0, babies: 0, pets: 0 });
  const [activeTab, setActiveTab] = useState<"destination" | "dates" | "guests" | null>(null);

  const guestLabel = () => {
    const totalGuests = guestCounts.adults + guestCounts.children;
    const parts = [];
    if (totalGuests > 0) parts.push(`${totalGuests} voyageur${totalGuests > 1 ? "s" : ""}`);
    if (guestCounts.babies > 0) parts.push(`${guestCounts.babies} bébé${guestCounts.babies > 1 ? "s" : ""}`);
    if (guestCounts.pets > 0) parts.push(`${guestCounts.pets} animal${guestCounts.pets > 1 ? "s" : ""}`);
    return parts.length > 0 ? parts.join(" · ") : "Ajouter des voyageurs";
  };

  const getProgramSteps = (exp: any) => {
    const location = exp.location || "le Bénin";
    return [
      `Accueil et présentation au cœur de ${location}`,
      `Découverte de l'histoire locale et des techniques utilisées dans cette expérience`,
      `Mise en pratique avec votre guide ou artisan`,
      `Création d'un souvenir à emporter chez vous`,
    ];
  };

  const ExperienceCard = ({ exp, showLocation = true, onSelect }: { exp: any; showLocation?: boolean; onSelect?: () => void }) => (
    <div className="group cursor-pointer" onClick={onSelect}>
      <div className="relative overflow-hidden rounded-2xl">
        <img src={encodeURI(exp.images[0])} alt={exp.title} className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105" />
        <button className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white transition-colors">
          <Heart className="w-5 h-5" />
        </button>
        {exp.hostType && (
          <div className="absolute bottom-4 left-4 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            {exp.hostType}
          </div>
        )}
      </div>
      <div className="mt-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-[#0F2940]">{exp.title}</h3>
            {showLocation && <p className="text-sm text-gray-500 mt-1">{exp.location}</p>}
          </div>
          {exp.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-current text-[#00c9a7]" />
              <span className="text-sm font-medium">{exp.rating}</span>
            </div>
          )}
        </div>
        {exp.date && <p className="text-sm text-gray-600 mt-1">{exp.date}</p>}
        {exp.price && (
          <p className="mt-2 font-medium text-[#0F2940]">
            À partir de {exp.price} €{" "}
            <span className="font-normal text-gray-500">{exp.priceType || "par voyageur"}</span>
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Barre de recherche sticky (identique à avant) */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md shadow-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-center">
            <div className="relative w-full max-w-5xl">
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
                        {destination || "Ville ou expérience au Bénin"}
                      </div>
                    </button>
                    {activeTab === "destination" && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setActiveTab(null)}></div>
                        <div className="absolute top-full left-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50">
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold">Où souhaitez-vous aller ?</h3>
                              <button onClick={() => setActiveTab(null)} className="p-1 rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button>
                            </div>
                            <input
                              type="text"
                              placeholder="Rechercher une destination au Bénin"
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c9a7]"
                              value={destination}
                              onChange={(e) => setDestination(e.target.value)}
                            />
                            <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                              <div className="font-semibold text-sm text-gray-500 mb-2">Destinations populaires au Bénin</div>
                              {["Cotonou", "Porto-Novo", "Ouidah", "Grand-Popo", "Abomey", "Parakou", "Natitingou", "Dassa-Zoumè", "Bohicon", "Lokossa", "Savalou", "Kétou", "Pobè"].map((place) => (
                                <button
                                  key={place}
                                  onClick={() => { setDestination(place); setActiveTab(null); }}
                                  className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                  <div className="font-medium">{place}</div>
                                  <div className="text-sm text-gray-500">Expériences disponibles</div>
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
                    <button onClick={() => setActiveTab(activeTab === "dates" ? null : "dates")} className="w-full text-left px-5 sm:px-7 py-3.5 rounded-full transition-all hover:bg-gray-50">
                      <div className="text-xs font-medium text-gray-700">Dates</div>
                      <div className="text-sm text-gray-900">{checkIn && checkOut ? `${checkIn} → ${checkOut}` : "Quand ?"}</div>
                    </button>
                  </div>
                  <div className="hidden sm:block w-px h-8 bg-gray-200"></div>
                  <div className="sm:hidden h-px w-full bg-gray-200"></div>

                  {/* Voyageurs */}
                  <div className="relative flex-1">
                    <button onClick={() => setActiveTab(activeTab === "guests" ? null : "guests")} className="w-full text-left px-5 sm:px-7 py-3.5 rounded-full transition-all hover:bg-gray-50">
                      <div className="text-xs font-medium text-gray-700">Voyageurs</div>
                      <div className="text-sm text-gray-900 truncate">{guestLabel()}</div>
                    </button>
                  </div>

                  {/* Bouton recherche */}
                  <button className="bg-[#00c9a7] text-[#0F2940] rounded-full p-4 hover:bg-[#00b892] transition-colors ml-0 sm:ml-2 mt-2 sm:mt-0">
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero / Bannière */}
      <section className="relative bg-gradient-to-r from-[#0F2940] to-[#1a3f5c] py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Expériences béninoises</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Activités organisées par des hôtes et artisans locaux du Bénin.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Expériences recommandées */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-[#0F2940]">Expériences recommandées</h2>
            <button className="text-[#00c9a7] text-sm font-medium hover:underline">Tout afficher</button>
          </div>
          <p className="text-gray-600 mb-6">Organisées par des hôtes locaux du Bénin</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {originalsExperiences.map((exp) => (
              <ExperienceCard key={exp.id} exp={exp} onSelect={() => setSelectedExperience(exp)} />
            ))}
          </div>
        </div>

        {/* Sections par ville (j'ai compressé pour la lisibilité, mais chaque bloc est similaire) */}
        <div className="mb-16"><h2 className="text-2xl font-semibold text-[#0F2940] mb-6">Expériences · Cotonou</h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{cotonouExperiences.map(exp => (<ExperienceCard key={exp.id} exp={{ ...exp, location: "Cotonou, Bénin" }} onSelect={() => setSelectedExperience({ ...exp, location: "Cotonou, Bénin" })} />))}</div></div>
        <div className="mb-16"><h2 className="text-2xl font-semibold text-[#0F2940] mb-6">Expériences · Porto-Novo</h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{portonovoExperiences.map(exp => (<ExperienceCard key={exp.id} exp={{ ...exp, location: "Porto-Novo, Bénin" }} onSelect={() => setSelectedExperience({ ...exp, location: "Porto-Novo, Bénin" })} />))}</div></div>
        <div className="mb-16"><h2 className="text-2xl font-semibold text-[#0F2940] mb-6">Expériences · Ouidah</h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{ouidahExperiences.map(exp => (<ExperienceCard key={exp.id} exp={{ ...exp, location: "Ouidah, Bénin" }} onSelect={() => setSelectedExperience({ ...exp, location: "Ouidah, Bénin" })} />))}</div></div>
        <div className="mb-16"><h2 className="text-2xl font-semibold text-[#0F2940] mb-6">Expériences · Grand-Popo</h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{grandpopoExperiences.map(exp => (<ExperienceCard key={exp.id} exp={{ ...exp, location: "Grand-Popo, Bénin" }} onSelect={() => setSelectedExperience({ ...exp, location: "Grand-Popo, Bénin" })} />))}</div></div>
        <div className="mb-16"><h2 className="text-2xl font-semibold text-[#0F2940] mb-6">Expériences · Abomey</h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{abomeyExperiences.map(exp => (<ExperienceCard key={exp.id} exp={{ ...exp, location: "Abomey, Bénin" }} onSelect={() => setSelectedExperience({ ...exp, location: "Abomey, Bénin" })} />))}</div></div>
        <div className="mb-16"><h2 className="text-2xl font-semibold text-[#0F2940] mb-6">Expériences · Parakou</h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{parakouExperiences.map(exp => (<ExperienceCard key={exp.id} exp={{ ...exp, location: "Parakou, Bénin" }} onSelect={() => setSelectedExperience({ ...exp, location: "Parakou, Bénin" })} />))}</div></div>
        <div className="mb-16"><h2 className="text-2xl font-semibold text-[#0F2940] mb-6">Expériences · Natitingou</h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{natitingouExperiences.map(exp => (<ExperienceCard key={exp.id} exp={{ ...exp, location: "Natitingou, Bénin" }} onSelect={() => setSelectedExperience({ ...exp, location: "Natitingou, Bénin" })} />))}</div></div>
        <div className="mb-16"><h2 className="text-2xl font-semibold text-[#0F2940] mb-6">Expériences · Dassa-Zoumè</h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{dassaExperiences.map(exp => (<ExperienceCard key={exp.id} exp={{ ...exp, location: "Dassa-Zoumè, Bénin" }} onSelect={() => setSelectedExperience({ ...exp, location: "Dassa-Zoumè, Bénin" })} />))}</div></div>
        <div className="mb-16"><h2 className="text-2xl font-semibold text-[#0F2940] mb-6">Expériences · Bohicon</h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{bohiconExperiences.map(exp => (<ExperienceCard key={exp.id} exp={{ ...exp, location: "Bohicon, Bénin" }} onSelect={() => setSelectedExperience({ ...exp, location: "Bohicon, Bénin" })} />))}</div></div>
        <div className="mb-16"><h2 className="text-2xl font-semibold text-[#0F2940] mb-6">Expériences · Lokossa</h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{lokossaExperiences.map(exp => (<ExperienceCard key={exp.id} exp={{ ...exp, location: "Lokossa, Bénin" }} onSelect={() => setSelectedExperience({ ...exp, location: "Lokossa, Bénin" })} />))}</div></div>
        <div className="mb-16"><h2 className="text-2xl font-semibold text-[#0F2940] mb-6">Expériences · Savalou</h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{savalouExperiences.map(exp => (<ExperienceCard key={exp.id} exp={{ ...exp, location: "Savalou, Bénin" }} onSelect={() => setSelectedExperience({ ...exp, location: "Savalou, Bénin" })} />))}</div></div>
        <div className="mb-16"><h2 className="text-2xl font-semibold text-[#0F2940] mb-6">Expériences · Kétou</h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{ketouExperiences.map(exp => (<ExperienceCard key={exp.id} exp={{ ...exp, location: "Kétou, Bénin" }} onSelect={() => setSelectedExperience({ ...exp, location: "Kétou, Bénin" })} />))}</div></div>
        <div className="mb-16"><h2 className="text-2xl font-semibold text-[#0F2940] mb-6">Expériences · Pobè</h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{pobeExperiences.map(exp => (<ExperienceCard key={exp.id} exp={{ ...exp, location: "Pobè, Bénin" }} onSelect={() => setSelectedExperience({ ...exp, location: "Pobè, Bénin" })} />))}</div></div>
      </main>

      {/* Modal de détail avec 4 images et avis personnalisés */}
      {selectedExperience && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 text-[#0F2940]">
          <div className="mx-auto max-w-6xl bg-white rounded-[32px] shadow-2xl overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-gray-200 p-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm text-gray-500">{selectedExperience.location}</p>
                <h2 className="text-3xl font-semibold text-[#0F2940] mt-2">{selectedExperience.title}</h2>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <span>{selectedExperience.rating?.toFixed(1) ?? "5.0"} · 1 401 évaluations</span>
                  <span>Hôte : {selectedExperience.hostType ?? "Local"}</span>
                  <span>{selectedExperience.priceType ? `À partir de ${selectedExperience.price} ${selectedExperience.priceType}` : "Expérience locale"}</span>
                </div>
              </div>
              <button onClick={() => setSelectedExperience(null)} className="rounded-full border border-gray-200 bg-white p-3 text-gray-700 hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr] p-6">
              <div className="space-y-6">
                {/* Galerie des 4 images */}
                <div className="grid grid-cols-2 gap-2">
                  {selectedExperience.images.slice(0, 4).map((img: string, idx: number) => (
                    <img key={idx} src={encodeURI(img)} alt={`Photo ${idx + 1}`} className="h-40 w-full rounded-3xl object-cover" />
                  ))}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#0F2940] mb-4">Au programme</h3>
                  <div className="space-y-3">
                    {getProgramSteps(selectedExperience).map((step: string, idx: number) => (
                      <div key={idx} className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
                        <p className="font-semibold">{`Étape ${idx + 1}`}</p>
                        <p className="mt-2 text-sm">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Avis personnalisés */}
                <div>
                  <h3 className="text-xl font-semibold text-[#0F2940] mb-4">Avis des voyageurs</h3>
                  <div className="space-y-4">
                    {selectedExperience.reviews.map((review: any, idx: number) => (
                      <div key={idx} className="rounded-3xl border border-gray-200 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-[#0F2940]">{review.name}</p>
                            <p className="text-sm text-gray-500">{review.location} · {review.daysAgo}</p>
                          </div>
                          <span className="rounded-full bg-[#00c9a7]/10 px-3 py-1 text-sm text-[#0F2940]">{review.rating.toFixed(1)}</span>
                        </div>
                        <p className="mt-3 text-sm text-gray-700">{review.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <aside className="space-y-6 rounded-3xl border border-gray-200 bg-[#f8fafb] p-6">
                <div><p className="text-sm font-semibold text-gray-700">À savoir</p><ul className="mt-4 space-y-3 text-sm text-gray-600"><li>Durée : 2 à 3 heures</li><li>Langue : Français</li><li>Âge minimum : 12 ans</li><li>Petit groupe local sécurisé</li></ul></div>
                <div className="rounded-3xl bg-white p-4 shadow-sm"><p className="text-sm text-gray-500">Lieu de rendez-vous</p><p className="mt-2 font-medium text-[#0F2940]">{selectedExperience.location}</p></div>
                <button className="w-full rounded-full bg-[#00c9a7] px-5 py-3 text-sm font-semibold text-[#0F2940] hover:bg-[#00b892]">Réserver cette expérience</button>
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}