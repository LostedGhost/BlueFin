// HostOnlyAuthPage.tsx
import { useState } from 'react';
import { ArrowLeft, Mail, Lock, User, Phone, Eye, EyeOff, CheckCircle } from 'lucide-react';
import authService from '../../services/auth.service';

interface HostOnlyAuthPageProps {
  onNavigate?: (page: { name: string; params?: any }) => void;
  onAuthSuccess?: (user: any) => void;
  hideBackButton?: boolean;
  forceHostRole?: boolean;
}

export function HostOnlyAuthPage({ 
  onNavigate, 
  onAuthSuccess, 
  hideBackButton = false,
  forceHostRole = true 
}: HostOnlyAuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [tempUserData, setTempUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Utiliser le service d'auth avec le type 'host'
      const response = await authService.login(loginEmail, loginPassword, 'host');
      
      if (response && response.user) {
        if (onAuthSuccess) {
          onAuthSuccess(response.user);
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      alert(error.message || 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerData.password !== registerData.password_confirmation) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Inscription avec le type 'host'
      const response = await authService.register({
        name: registerData.name,
        email: registerData.email,
        phone: registerData.phone,
        password: registerData.password,
        password_confirmation: registerData.password_confirmation
      }, 'host');
      
      if (response && response.user) {
        setTempUserData(response.user);
        setShowVerification(true);
        
        // Envoyer le code de vérification
        await authService.sendVerificationCode(registerData.email, 'host');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      alert(error.message || 'Erreur lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await authService.verifyEmail(tempUserData?.email, verificationCode, 'host');
      
      if (response && response.success) {
        if (onAuthSuccess) {
          onAuthSuccess(tempUserData);
        }
      } else {
        alert('Code de vérification incorrect');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      alert(error.message || 'Erreur lors de la vérification');
    } finally {
      setIsLoading(false);
    }
  };

  if (showVerification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-[#f4fffe] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#00c9a7]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-[#00c9a7]" />
            </div>
            <h2 className="text-2xl font-bold text-[#0F2940] mb-2">Vérifiez votre email</h2>
            <p className="text-gray-600 text-sm">
              Nous avons envoyé un code de vérification à <br />
              <span className="font-semibold">{tempUserData?.email}</span>
            </p>
          </div>
          
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code de vérification
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Entrez le code à 6 chiffres"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00c9a7] focus:border-transparent text-center text-2xl tracking-widest"
                maxLength={6}
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#00c9a7] to-[#0f2940] text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50"
            >
              {isLoading ? 'Vérification...' : 'Vérifier'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-[#f4fffe] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {!hideBackButton && (
          <button
            onClick={() => onNavigate?.({ name: 'become-host' })}
            className="absolute top-4 left-4 z-10 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}
        
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-4 text-center font-semibold transition-all duration-300 ${
              isLogin
                ? 'text-[#00c9a7] border-b-2 border-[#00c9a7]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Connexion
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-4 text-center font-semibold transition-all duration-300 ${
              !isLogin
                ? 'text-[#00c9a7] border-b-2 border-[#00c9a7]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Inscription
          </button>
        </div>
        
        <div className="p-8">
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00c9a7] focus:border-transparent"
                    placeholder="votre@email.com"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00c9a7] focus:border-transparent"
                    placeholder="Votre mot de passe"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                  </button>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#00c9a7] to-[#0f2940] text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50"
              >
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00c9a7] focus:border-transparent"
                    placeholder="Jean Dupont"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00c9a7] focus:border-transparent"
                    placeholder="votre@email.com"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00c9a7] focus:border-transparent"
                    placeholder="+229 XX XXX XXX"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00c9a7] focus:border-transparent"
                    placeholder="Minimum 8 caractères"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={registerData.password_confirmation}
                    onChange={(e) => setRegisterData({ ...registerData, password_confirmation: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00c9a7] focus:border-transparent"
                    placeholder="Confirmez votre mot de passe"
                    required
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#00c9a7] to-[#0f2940] text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50"
              >
                {isLoading ? 'Inscription...' : 'S\'inscrire'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}