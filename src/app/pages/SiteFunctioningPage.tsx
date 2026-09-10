import { ArrowLeft, Search, CreditCard, MessageCircle, Star, Shield, Calendar, Users, Award, CheckCircle } from 'lucide-react';

type PageProps = {
  onNavigate?: (route: any) => void;
};

export function SiteFunctioningPage({ onNavigate }: PageProps) {
  const steps = [
    {
      number: "01",
      title: "Recherchez votre logement",
      description: "Utilisez notre moteur de recherche pour trouver le logement idéal selon votre destination, vos dates et votre budget.",
      icon: Search,
      color: "bg-blue-50"
    },
    {
      number: "02",
      title: "Réservez en toute sécurité",
      description: "Choisissez votre logement, sélectionnez vos dates et procédez au paiement sécurisé via Mobile Money ou carte bancaire.",
      icon: CreditCard,
      color: "bg-green-50"
    },
    {
      number: "03",
      title: "Communiquez avec l'hôte",
      description: "Échangez avec votre hôte pour organiser votre arrivée, poser vos questions et préparer votre séjour.",
      icon: MessageCircle,
      color: "bg-purple-50"
    },
    {
      number: "04",
      title: "Profitez de votre séjour",
      description: "Une fois sur place, profitez de votre logement et n'hésitez pas à laisser un avis après votre départ.",
      icon: Star,
      color: "bg-yellow-50"
    }
  ];

  const features = [
    { icon: Shield, title: "Paiement sécurisé", desc: "Vos transactions sont protégées" },
    { icon: Calendar, title: "Annulation flexible", desc: "Selon les politiques des hôtes" },
    { icon: Users, title: "Support 24/7", desc: "Une équipe toujours disponible" },
    { icon: Award, title: "Hôtes vérifiés", desc: "Des professionnels de confiance" }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-5 py-4">
        <button onClick={() => onNavigate?.({ name: 'home' })} className="text-sm text-gray-500 mb-4 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <h1 className="text-2xl text-[#0F2940]">Fonctionnement du site</h1>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-r from-[#0F2940] to-[#1a3f5c] py-12 text-white">
        <div className="max-w-4xl mx-auto px-5 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Comment ça fonctionne ?</h2>
          <p className="text-white/80">Une plateforme simple et intuitive pour trouver votre logement idéal</p>
        </div>
      </section>

      {/* Étapes pour voyageurs */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-5">
          <h2 className="text-3xl font-bold text-[#0F2940] text-center mb-4">Pour les voyageurs</h2>
          <p className="text-gray-600 text-center mb-10">Réservez votre prochain séjour en quelques clics</p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className={`${step.color} rounded-2xl p-6 relative overflow-hidden`}>
                  <div className="text-6xl font-bold text-gray-300/30 absolute top-4 right-4">{step.number}</div>
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-4">
                    <Icon className="w-7 h-7 text-[#00c9a7]" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#0F2940] mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comment devenir hôte */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#0F2940] mb-4">Pour les hôtes</h2>
            <p className="text-gray-600">Gagnez de l'argent en partageant votre logement</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-[#00c9a7]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[#00c9a7]">1</span>
              </div>
              <h3 className="font-semibold text-[#0F2940] mb-2">Créez votre annonce</h3>
              <p className="text-gray-500 text-sm">Décrivez votre logement, ajoutez des photos et fixez vos tarifs</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-[#00c9a7]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[#00c9a7]">2</span>
              </div>
              <h3 className="font-semibold text-[#0F2940] mb-2">Recevez des réservations</h3>
              <p className="text-gray-500 text-sm">Les voyageurs réservent votre logement directement</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-[#00c9a7]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[#00c9a7]">3</span>
              </div>
              <h3 className="font-semibold text-[#0F2940] mb-2">Recevez vos paiements</h3>
              <p className="text-gray-500 text-sm">Virements vers Mobile Money ou compte bancaire</p>
            </div>
          </div>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-5">
          <h2 className="text-3xl font-bold text-[#0F2940] text-center mb-10">Pourquoi choisir Blufin-Immo ?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="text-center p-4">
                  <div className="w-14 h-14 bg-[#00c9a7]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-7 h-7 text-[#00c9a7]" />
                  </div>
                  <h3 className="font-semibold text-[#0F2940] mb-1">{feature.title}</h3>
                  <p className="text-gray-500 text-sm">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}