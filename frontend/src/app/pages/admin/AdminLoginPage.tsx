// src/app/pages/admin/AdminLoginPage.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react';
import type { Route } from '../../router';

interface AdminLoginPageProps {
  onNavigate?: (route: Route) => void;
}

export function AdminLoginPage({ onNavigate }: AdminLoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, user, isAuthenticated } = useAuth();

  // Redirection automatique quand l'utilisateur devient admin
  useEffect(() => {
    console.log('🔍 AdminLoginPage - user:', user, 'isAuthenticated:', isAuthenticated);
    if (isAuthenticated && user?.user_type === 'admin') {
      console.log('✅ Admin détecté, redirection vers dashboard admin');
      // Rediriger vers le dashboard admin
      onNavigate?.({ name: 'admin-dashboard' });
    }
  }, [user, isAuthenticated, onNavigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Spécifier le type 'admin' pour la connexion
      const response = await login(email, password, 'admin');
      console.log('📦 Response login admin:', response);
      
      // La redirection se fera via l'useEffect ci-dessus
      // Pas besoin de rediriger ici immédiatement
      
    } catch (err: any) {
      console.error('Erreur login admin:', err);
      
      // Afficher un message d'erreur plus précis
      if (err?.response?.status === 401) {
        setError('Email ou mot de passe incorrect');
      } else if (err?.response?.status === 403) {
        setError('Accès non autorisé. Veuillez contacter l\'administrateur.');
      } else {
        setError('Identifiants invalides ou compte non autorisé');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f4fffe] to-[#e8fffb] p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-[#e2f5f2]">
          {/* Logo et titre */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#00c9a7] to-[#0f2940] rounded-2xl flex items-center justify-center shadow-lg animate-pulse-slow">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[#0f2940] mt-4">Administration</h1>
            <p className="text-sm text-[#6b7280] mt-2">Espace réservé aux administrateurs</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm animate-shake">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#0f2940] mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00c9a7]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-[#e2f5f2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c9a7] focus:border-transparent transition-all bg-white/70"
                  placeholder="admin@bluefin-immo.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0f2940] mb-1">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00c9a7]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-[#e2f5f2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c9a7] focus:border-transparent transition-all bg-white/70"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#00c9a7] to-[#0f2940] text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connexion...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-[#6b7280]">
            Accès restreint · Bluefin-Immo
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.02); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out; }
        .animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
        .animate-shake { animation: shake 0.3s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
}