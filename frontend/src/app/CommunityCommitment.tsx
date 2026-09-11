// CommunityCommitment.tsx
import { useState } from 'react';
import { CheckCircle, Shield, Users, Heart, ArrowLeft, Clock, Award, Star } from 'lucide-react';

interface CommunityCommitmentProps {
  onAccept: () => void;
  onBack: () => void;
}

export function CommunityCommitment({ onAccept, onBack }: CommunityCommitmentProps) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedCode, setAcceptedCode] = useState(false);
  const [acceptedSafety, setAcceptedSafety] = useState(false);

  const allAccepted = acceptedTerms && acceptedCode && acceptedSafety;

  const commitments = [
    {
      id: 'terms',
      title: 'Conditions d\'hébergement',
      description: 'Je m\'engage à fournir un logement propre, sécurisé et conforme à la description de mon annonce.',
      icon: CheckCircle,
      accepted: acceptedTerms,
      setAccepted: setAcceptedTerms
    },
    {
      id: 'code',
      title: 'Code de conduite',
      description: 'Je respecte les règles de bonne conduite, je traite les voyageurs avec courtoisie et professionnalisme.',
      icon: Users,
      accepted: acceptedCode,
      setAccepted: setAcceptedCode
    },
    {
      id: 'safety',
      title: 'Sécurité et assurance',
      description: 'Je comprends ma responsabilité en matière de sécurité et je dispose des assurances nécessaires.',
      icon: Shield,
      accepted: acceptedSafety,
      setAccepted: setAcceptedSafety
    }
  ];

  const benefits = [
    {
      icon: Award,
      title: 'Superhôte',
      description: 'Devenez éligible au statut Superhôte',
      color: 'text-yellow-500'
    },
    {
      icon: Shield,
      title: 'Protection',
      description: 'Assurance responsabilité civile incluse',
      color: 'text-green-500'
    },
    {
      icon: Clock,
      title: 'Support 24/7',
      description: 'Assistance prioritaire',
      color: 'text-blue-500'
    },
    {
      icon: Heart,
      title: 'Communauté',
      description: 'Rejoignez une communauté mondiale',
      color: 'text-red-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-[#f4fffe]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 sm:px-5 py-4">
        <button 
          onClick={onBack} 
          className="text-sm text-gray-500 mb-3 flex items-center gap-2 hover:text-[#00c9a7] transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
          Retour
        </button>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#0F2940]">Engagements communautaires</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">Devenir hôte, c'est rejoindre une communauté responsable</p>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#00c9a7]/10 mb-4">
            <Heart className="w-8 h-8 text-[#00c9a7]" />
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#0F2940] mb-3">
            Bienvenue dans la communauté
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
            En tant qu'hôte, vous vous engagez à offrir une expérience exceptionnelle 
            à vos voyageurs tout en respectant nos valeurs communautaires.
          </p>
        </div>

        {/* Avantages */}
        <div className="mb-8 sm:mb-12">
          <h3 className="text-lg sm:text-xl font-semibold text-[#0F2940] mb-4 text-center">
            Ce que la communauté vous offre
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={index} className="bg-white rounded-xl p-3 sm:p-4 text-center border border-slate-100 shadow-sm">
                  <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${benefit.color} mx-auto mb-2`} />
                  <h4 className="text-xs sm:text-sm font-semibold text-[#0F2940] mb-1">{benefit.title}</h4>
                  <p className="text-[10px] sm:text-xs text-gray-500">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Engagements */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-[#0f2940] to-[#1a3a52] px-4 sm:px-6 py-4">
            <h3 className="text-white font-semibold text-base sm:text-lg">
              Vos engagements en tant qu'hôte
            </h3>
            <p className="text-white/70 text-xs sm:text-sm mt-1">
              Veuillez accepter ces engagements pour continuer
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {commitments.map((commitment) => {
              const Icon = commitment.icon;
              return (
                <div key={commitment.id} className="p-4 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => commitment.setAccepted(!commitment.accepted)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                          commitment.accepted
                            ? 'bg-[#00c9a7] border-[#00c9a7]'
                            : 'border-gray-300 hover:border-[#00c9a7]'
                        }`}
                      >
                        {commitment.accepted && <CheckCircle className="w-4 h-4 text-white" />}
                      </button>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-5 h-5 text-[#00c9a7]" />
                        <h4 className="font-semibold text-[#0F2940] text-sm sm:text-base">
                          {commitment.title}
                        </h4>
                      </div>
                      <p className="text-gray-600 text-xs sm:text-sm">
                        {commitment.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Résumé */}
          <div className="bg-slate-50 px-4 sm:px-6 py-4 border-t border-slate-100">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="text-xs sm:text-sm text-gray-600">
                {allAccepted ? (
                  <span className="text-green-600 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Tous les engagements acceptés
                  </span>
                ) : (
                  <span>
                    {commitments.filter(c => c.accepted).length} / {commitments.length} engagements acceptés
                  </span>
                )}
              </div>
              
              <button
                onClick={onAccept}
                disabled={!allAccepted}
                className={`px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-300 ${
                  allAccepted
                    ? 'bg-gradient-to-r from-[#00c9a7] to-[#0f2940] text-white shadow-lg hover:shadow-xl active:scale-95'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Je m'engage et je continue
              </button>
            </div>
          </div>
        </div>

        {/* Note légale */}
        <div className="text-center text-xs text-gray-400">
          <p>
            En acceptant ces engagements, vous confirmez avoir lu et compris les{' '}
            <a href="#" className="text-[#00c9a7] hover:underline">conditions générales</a>
            {' '}et la{' '}
            <a href="#" className="text-[#00c9a7] hover:underline">politique de confidentialité</a>.
          </p>
        </div>
      </div>
    </div>
  );
}