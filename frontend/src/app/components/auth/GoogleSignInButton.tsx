// Bouton officiel « Se connecter avec Google » (Google Identity Services).
//
// Google fournit un jeton d'identité signé (« credential ») que le backend
// vérifie lui-même — voir backend/app/Services/GoogleIdToken.php. Seul le
// Client ID public est nécessaire : VITE_GOOGLE_CLIENT_ID.
import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google?: any;
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

let scriptPromise: Promise<void> | null = null;
function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Impossible de charger le service de connexion Google.'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

// Google n'autorise qu'un seul callback actif : on route vers le dernier
// bouton monté.
let activeHandler: ((credential: string) => void) | null = null;
let initializedFor: string | null = null;

export function GoogleSignInButton({
  onCredential,
  text = 'continue_with',
  disabled = false,
}: {
  onCredential: (credential: string) => void;
  /** Libellé officiel Google : « Continuer avec Google » ou « Se connecter avec Google ». */
  text?: 'continue_with' | 'signin_with' | 'signup_with';
  disabled?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    activeHandler = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        if (initializedFor !== CLIENT_ID) {
          window.google.accounts.id.initialize({
            client_id: CLIENT_ID,
            callback: (response: { credential?: string }) => {
              if (response.credential) activeHandler?.(response.credential);
            },
            ux_mode: 'popup',
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          initializedFor = CLIENT_ID;
        }
        const width = Math.min(Math.max(containerRef.current.offsetWidth, 200), 400);
        containerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text,
          logo_alignment: 'center',
          locale: 'fr',
          width,
        });
      })
      .catch((e) => !cancelled && setError(e.message));

    return () => {
      cancelled = true;
    };
  }, [text]);

  if (!CLIENT_ID) {
    // En production, sans Client ID, on n'affiche simplement pas le bouton.
    return import.meta.env.DEV ? (
      <p className="text-xs text-center text-amber-700 bg-amber-50 rounded-xl py-2 px-3">
        Connexion Google non configurée : renseignez VITE_GOOGLE_CLIENT_ID.
      </p>
    ) : null;
  }

  return (
    <div className={disabled ? 'pointer-events-none opacity-50' : ''}>
      <div ref={containerRef} className="flex justify-center min-h-[44px]" />
      {error && <p className="text-xs text-center text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export const isGoogleSignInConfigured = Boolean(CLIENT_ID);
