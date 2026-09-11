import { ArrowLeft, Smartphone, CreditCard, Shield } from 'lucide-react';

type PageProps = {
  onNavigate?: (route: any) => void;
};

export function FooterPage({ onNavigate }: PageProps) {
  const sections = [
    {
      title: "Navigation",
      links: [
        { label: "Accueil", action: () => onNavigate?.({ name: 'home' }) },
        { label: "Logements populaires", action: () => onNavigate?.({ name: 'popular' }) },
        { label: "Devenir hôte", action: () => onNavigate?.({ name: 'become-host' }) },
        { label: "Aide", action: () => onNavigate?.({ name: 'help' }) }
      ]
    },
    {
      title: "Légal",
      links: [
        { label: "Politique de confidentialité", action: () => onNavigate?.({ name: 'terms', type: 'privacy' }) },
        { label: "Conditions générales", action: () => onNavigate?.({ name: 'terms', type: 'cgu' }) },
        { label: "Mentions légales", action: () => onNavigate?.({ name: 'terms' }) }
      ]
    },
    {
      title: "Suivez-nous",
      links: [
        { label: "Facebook", url: "https://facebook.com/blufinimmo" },
        { label: "Instagram", url: "https://instagram.com/blufinimmo" },
        { label: "LinkedIn", url: "https://linkedin.com/company/blufinimmo" },
        { label: "Twitter", url: "https://twitter.com/blufinimmo" }
      ]
    }
  ];

  const paymentMethods = [
    { name: "Mobile Money", icon: Smartphone },
    { name: "Visa/Mastercard", icon: CreditCard },
    { name: "FedaPay", icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-5 py-4">
        <button onClick={() => onNavigate?.({ name: 'home' })} className="text-sm text-gray-500 mb-4 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <h1 className="text-2xl text-[#0F2940]">Pied de page du site</h1>
      </div>

      <div className="max-w-7xl mx-auto px-5 py-8">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Logo et description */}
          <div>
            <div className="w-12 h-12 bg-[#00c9a7] rounded-xl flex items-center justify-center mb-4">
              <span className="text-xl font-bold text-white">B</span>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Blufin-Immo est la première plateforme de location de logements courte durée au Bénin et en Afrique de l'Ouest.
            </p>
            <p className="text-xs text-gray-400">© 2026 Blufin-Immo SARL</p>
          </div>

          {/* Liens de navigation */}
          {sections.map((section, idx) => (
            <div key={idx}>
              <h3 className="font-semibold text-[#0F2940] mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link, linkIdx) => (
                  <li key={linkIdx}>
                    {link.action ? (
                      <button onClick={link.action} className="text-gray-500 hover:text-[#00c9a7] text-sm transition">
                        {link.label}
                      </button>
                    ) : (
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#00c9a7] text-sm transition">
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Moyens de paiement */}
        <div className="border-t border-gray-200 pt-8 mb-8">
          <h3 className="text-center font-semibold text-[#0F2940] mb-4">Moyens de paiement acceptés</h3>
          <div className="flex justify-center gap-8">
            {paymentMethods.map((method, idx) => {
              const Icon = method.icon;
              return (
                <div key={idx} className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-[#00c9a7]" />
                  <span className="text-sm text-gray-600">{method.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Newsletter */}
        <div className="bg-[#f4fffe] rounded-2xl p-6 text-center">
          <h3 className="font-semibold text-[#0F2940] mb-2">Restez informé</h3>
          <p className="text-gray-500 text-sm mb-4">Recevez nos offres spéciales et actualités</p>
          <div className="flex max-w-md mx-auto gap-2">
            <input 
              type="email" 
              placeholder="Votre email" 
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00c9a7]"
            />
            <button className="bg-[#00c9a7] text-[#0F2940] px-6 py-2 rounded-lg font-semibold hover:bg-[#00b892] transition">
              S'inscrire
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}