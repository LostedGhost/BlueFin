// Inscription en étapes (parcours défini avec le client) :
//   1. Méthode         — e-mail, ou Google
//   2. Infos perso     — prénom et nom (pré-remplis par Google, modifiables) + téléphone
//   3. Sécurité        — mot de passe (inscription par e-mail uniquement)
//   4. Validation      — récapitulatif, acceptation des conditions, création
//
// Avec Google, si un compte existe déjà pour cette adresse, le visiteur est
// connecté directement dès l'étape 1.
import { useState } from 'react';
import { ArrowLeft, Check, Eye, EyeOff, Lock, Mail, Phone, User, Loader2 } from 'lucide-react';
import { useAuth, type User as AuthUser } from '../../../contexts/AuthContext';
import { GoogleSignInButton } from './GoogleSignInButton';

type Step = 'method' | 'profile' | 'security' | 'review';
type Method = 'password' | 'google';

export interface PendingGoogleSignup {
  credential: string;
  profile: { email: string; first_name: string; last_name: string };
}

const STEP_LABELS: Record<Step, string> = {
  method: 'Méthode',
  profile: 'Infos perso',
  security: 'Sécurité',
  review: 'Validation',
};

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const PHONE_RE = /^\+?[0-9 ]{8,20}$/;

const errorFromServer = (e: any): { field?: string; message: string } => {
  const errors = e?.response?.data?.errors;
  if (errors) {
    const [field, messages] = Object.entries(errors)[0] as [string, string[]];
    return { field, message: Array.isArray(messages) ? messages[0] : String(messages) };
  }
  return { message: e?.response?.data?.message || e?.message || 'Une erreur est survenue. Réessayez.' };
};

export function SignupWizard({
  userType = 'traveler',
  hostType,
  initialGoogle,
  onSignedIn,
  onSwitchToLogin,
}: {
  userType?: 'traveler' | 'hote';
  hostType?: 'logement' | 'experience' | 'service';
  initialGoogle?: PendingGoogleSignup | null;
  onSignedIn: (user: AuthUser) => void;
  onSwitchToLogin: (email?: string) => void;
}) {
  const { register, googleAuthenticate, googleRegister, checkAvailability } = useAuth();

  const [step, setStep] = useState<Step>(initialGoogle ? 'profile' : 'method');
  const [method, setMethod] = useState<Method | null>(initialGoogle ? 'google' : null);
  const [google, setGoogle] = useState<PendingGoogleSignup | null>(initialGoogle ?? null);
  const [email, setEmail] = useState(initialGoogle?.profile.email ?? '');
  const [firstName, setFirstName] = useState(initialGoogle?.profile.first_name ?? '');
  const [lastName, setLastName] = useState(initialGoogle?.profile.last_name ?? '');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailTaken, setEmailTaken] = useState(false);
  const [busy, setBusy] = useState(false);

  const steps: Step[] = method === 'google' ? ['method', 'profile', 'review'] : ['method', 'profile', 'security', 'review'];
  const currentIndex = steps.indexOf(step);
  const goBack = () => { setErrors({}); setStep(steps[Math.max(0, currentIndex - 1)]); };
  const clearError = (field: string) => errors[field] && setErrors((e) => ({ ...e, [field]: '' }));

  // ---------- Étape 1 : méthode ----------
  const handleGoogle = async (credential: string) => {
    setBusy(true);
    setErrors({});
    try {
      const result = await googleAuthenticate(credential);
      if (result.status === 'logged_in') {
        onSignedIn(result.user); // compte existant : connexion directe
        return;
      }
      setGoogle({ credential, profile: result.profile });
      setMethod('google');
      setEmail(result.profile.email);
      setFirstName((v) => v || result.profile.first_name);
      setLastName((v) => v || result.profile.last_name);
      setStep('profile');
    } catch (e) {
      setErrors({ general: errorFromServer(e).message });
    } finally {
      setBusy(false);
    }
  };

  const submitEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) return setErrors({ email: 'Saisissez une adresse e-mail valide.' });
    setBusy(true);
    try {
      const { email_taken } = await checkAvailability({ email: value });
      setEmailTaken(email_taken);
      if (email_taken) return;
      setEmail(value);
      setMethod('password');
      setGoogle(null);
      setStep('profile');
    } catch (e) {
      setErrors({ email: errorFromServer(e).message });
    } finally {
      setBusy(false);
    }
  };

  // ---------- Étape 2 : infos perso ----------
  const submitProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.first_name = 'Indiquez votre prénom.';
    if (!lastName.trim()) next.last_name = 'Indiquez votre nom.';
    if (!phone.trim()) next.phone = 'Indiquez votre numéro de téléphone.';
    else if (!PHONE_RE.test(phone.trim())) next.phone = 'Numéro invalide. Exemple : +229 01 97 00 00 00';
    if (Object.keys(next).length) return setErrors(next);

    setBusy(true);
    try {
      const { phone_taken } = await checkAvailability({ phone: phone.trim() });
      if (phone_taken) return setErrors({ phone: 'Ce numéro est déjà utilisé par un autre compte.' });
      setErrors({});
      setStep(method === 'google' ? 'review' : 'security');
    } catch (e) {
      setErrors({ phone: errorFromServer(e).message });
    } finally {
      setBusy(false);
    }
  };

  // ---------- Étape 3 : sécurité ----------
  const submitSecurity = (event: React.FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (password.length < 8) next.password = 'Au moins 8 caractères.';
    if (password !== confirm) next.confirm = 'Les deux mots de passe ne correspondent pas.';
    if (Object.keys(next).length) return setErrors(next);
    setErrors({});
    setStep('review');
  };

  // ---------- Étape 4 : validation ----------
  const submitAll = async () => {
    if (!acceptTerms) return setErrors({ terms: 'Acceptez les conditions pour créer votre compte.' });
    setBusy(true);
    setErrors({});
    try {
      if (method === 'google' && google) {
        const response = await googleRegister({
          credential: google.credential,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
          user_type: userType,
          host_type: hostType,
        });
        onSignedIn(response.user);
      } else {
        const response = await register({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: phone.trim().replace(/\s+/g, ''),
          password,
          password_confirmation: confirm,
          host_type: hostType,
        }, userType);
        onSignedIn(response?.user || response?.data?.user);
      }
    } catch (e: any) {
      const { field, message } = errorFromServer(e);
      // On renvoie le visiteur à l'étape où se trouve le champ refusé.
      if (field === 'email') { setStep('method'); setErrors({ email: message }); }
      else if (['first_name', 'last_name', 'phone'].includes(field ?? '')) { setStep('profile'); setErrors({ [field!]: message }); }
      else if (field === 'password') { setStep('security'); setErrors({ password: message }); }
      else if (e?.response?.status === 401 && method === 'google') {
        // Jeton Google expiré (validité d'une heure) : on redemande le clic.
        setGoogle(null); setMethod(null); setStep('method');
        setErrors({ general: message });
      } else setErrors({ general: message });
    } finally {
      setBusy(false);
    }
  };

  const input = (hasError?: string) =>
    `w-full pl-9 pr-3 py-2.5 border rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#12b8c9]/40 ${hasError ? 'border-red-500' : 'border-gray-200'}`;
  const primary = 'w-full bg-gradient-to-r from-[#12b8c9] to-[#0f2940] text-white py-2.5 rounded-xl font-semibold disabled:opacity-50 transition-all hover:shadow-lg inline-flex items-center justify-center gap-2';
  const FieldError = ({ name }: { name: string }) => (errors[name] ? <p className="text-xs text-red-600 mt-1">{errors[name]}</p> : null);

  return (
    <div>
      {/* Progression */}
      <ol className="flex items-center gap-2 mb-6" aria-label="Étapes de l'inscription">
        {steps.map((s, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <li key={s} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
              <span
                className={`h-1.5 w-full rounded-full ${done || active ? 'bg-[#12b8c9]' : 'bg-gray-200'}`}
                aria-hidden="true"
              />
              <span className={`text-[11px] truncate ${active ? 'text-[#0F2940] font-semibold' : 'text-gray-400'}`}
                aria-current={active ? 'step' : undefined}>
                {done && <Check className="inline w-3 h-3 mr-0.5 -mt-0.5" />}{STEP_LABELS[s]}
              </span>
            </li>
          );
        })}
      </ol>

      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{errors.general}</div>
      )}

      {step !== 'method' && (
        <button type="button" onClick={goBack} className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#0F2940]">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
      )}

      {step === 'method' && (
        <div className="space-y-5">
          <GoogleSignInButton text="signup_with" onCredential={handleGoogle} disabled={busy} />

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="h-px flex-1 bg-gray-200" /> ou avec votre e-mail <span className="h-px flex-1 bg-gray-200" />
          </div>

          <form onSubmit={submitEmail} className="space-y-4" noValidate>
            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-1">Adresse e-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input id="signup-email" name="email" type="email" autoComplete="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailTaken(false); clearError('email'); }}
                  placeholder="votre@email.com" className={input(errors.email)} />
              </div>
              <FieldError name="email" />
              {emailTaken && (
                <p className="text-sm text-[#0F2940] mt-2 p-3 bg-[#eefbfd] rounded-xl">
                  Un compte existe déjà avec cette adresse.{' '}
                  <button type="button" onClick={() => onSwitchToLogin(email.trim())} className="font-semibold text-[#0c7f8c] hover:underline">
                    Se connecter
                  </button>
                </p>
              )}
            </div>
            <button type="submit" disabled={busy} className={primary}>
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} Continuer
            </button>
          </form>
        </div>
      )}

      {step === 'profile' && (
        <form onSubmit={submitProfile} className="space-y-4" noValidate>
          <p className="text-sm text-gray-500">
            {method === 'google'
              ? <>Compte Google <strong className="text-[#0F2940]">{email}</strong>. Vérifiez vos nom et prénom, ils restent modifiables.</>
              : <>Inscription avec <strong className="text-[#0F2940]">{email}</strong>.</>}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="signup-first" className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input id="signup-first" name="firstName" autoComplete="given-name" value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); clearError('first_name'); }} className={input(errors.first_name)} />
              </div>
              <FieldError name="first_name" />
            </div>
            <div>
              <label htmlFor="signup-last" className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input id="signup-last" name="lastName" autoComplete="family-name" value={lastName}
                  onChange={(e) => { setLastName(e.target.value); clearError('last_name'); }} className={input(errors.last_name)} />
              </div>
              <FieldError name="last_name" />
            </div>
          </div>
          <div>
            <label htmlFor="signup-phone" className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input id="signup-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" value={phone}
                onChange={(e) => { setPhone(e.target.value); clearError('phone'); }}
                placeholder="+229 01 97 00 00 00" className={input(errors.phone)} />
            </div>
            <FieldError name="phone" />
            {!errors.phone && <p className="text-xs text-gray-400 mt-1">Pour vos confirmations de réservation et le paiement Mobile Money.</p>}
          </div>
          <button type="submit" disabled={busy} className={primary}>
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Continuer
          </button>
        </form>
      )}

      {step === 'security' && (
        <form onSubmit={submitSecurity} className="space-y-4" noValidate>
          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input id="signup-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password"
                value={password} onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
                className={`${input(errors.password)} pr-10`} />
              <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <FieldError name="password" />
            <p className={`text-xs mt-1 ${password.length >= 8 ? 'text-emerald-600' : 'text-gray-400'}`}>
              {password.length >= 8 ? <><Check className="inline w-3 h-3" /> 8 caractères minimum</> : '8 caractères minimum'}
            </p>
          </div>
          <div>
            <label htmlFor="signup-confirm" className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input id="signup-confirm" name="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password"
                value={confirm} onChange={(e) => { setConfirm(e.target.value); clearError('confirm'); }} className={input(errors.confirm)} />
            </div>
            <FieldError name="confirm" />
          </div>
          <button type="submit" className={primary}>Continuer</button>
        </form>
      )}

      {step === 'review' && (
        <div className="space-y-4">
          <dl className="rounded-2xl border border-gray-200 divide-y divide-gray-100 text-sm">
            {[
              ['E-mail', email, 'method'],
              ['Nom', `${firstName.trim()} ${lastName.trim()}`, 'profile'],
              ['Téléphone', phone.trim(), 'profile'],
              ['Connexion', method === 'google' ? 'Avec Google' : 'Mot de passe', method === 'google' ? 'method' : 'security'],
            ].map(([label, value, target]) => (
              <div key={label} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <dt className="text-xs text-gray-400">{label}</dt>
                  <dd className="text-[#0F2940] font-medium truncate">{value}</dd>
                </div>
                {!(method === 'google' && label === 'E-mail') && (
                  <button type="button" onClick={() => setStep(target as Step)} className="text-xs font-medium text-[#0c7f8c] hover:underline shrink-0">
                    Modifier
                  </button>
                )}
              </div>
            ))}
          </dl>

          <label className="flex items-start gap-2.5 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={acceptTerms} onChange={(e) => { setAcceptTerms(e.target.checked); clearError('terms'); }}
              className="mt-0.5 w-4 h-4 accent-[#12b8c9]" />
            <span>
              J’accepte les <a href="/cgu" target="_blank" rel="noreferrer" className="text-[#0c7f8c] underline">conditions générales</a> et la{' '}
              <a href="/confidentialite" target="_blank" rel="noreferrer" className="text-[#0c7f8c] underline">politique de confidentialité</a>.
            </span>
          </label>
          <FieldError name="terms" />

          <button type="button" onClick={submitAll} disabled={busy} className={primary}>
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {userType === 'hote' ? 'Créer mon compte hôte' : 'Créer mon compte'}
          </button>
        </div>
      )}
    </div>
  );
}
