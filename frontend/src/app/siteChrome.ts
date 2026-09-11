// En-tête et pied de page du site : une page peut demander à les masquer
// (formulaires de connexion / d'inscription, voulus épurés par le client).
import { createContext, useContext, useEffect } from 'react';

export const SiteChromeContext = createContext<(hidden: boolean) => void>(() => {});

/** Masque l'en-tête et le pied de page du site tant que `hidden` est vrai. */
export function useHideSiteChrome(hidden: boolean) {
  const setHidden = useContext(SiteChromeContext);
  useEffect(() => {
    setHidden(hidden);
    return () => setHidden(false);
  }, [hidden, setHidden]);
}
