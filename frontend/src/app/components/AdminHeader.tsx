import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { LogOut, User, Bell, Settings, Moon, Sun, Search, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export function AdminHeader() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.history.pushState({}, '', '/admin-login');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <header className="bg-white dark:bg-slate-800/90 backdrop-blur-sm shadow-lg px-4 sm:px-6 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-200 dark:border-slate-700/50 transition-colors duration-300 sticky top-0 z-50">
      {/* Logo et titre */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <span className="text-white font-bold text-sm">B</span>
        </div>
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white transition-colors">
            Administration
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 hidden sm:block transition-colors">
            Bluefin-Immo Dashboard
          </p>
        </div>
      </div>

      {/* Actions et profil */}
      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
        <button className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700/50 hover:bg-gray-200 dark:hover:bg-slate-600/50 transition border border-gray-200 dark:border-slate-600/50 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white">
          <Search className="w-4 h-4" />
        </button>

        <button className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700/50 hover:bg-gray-200 dark:hover:bg-slate-600/50 transition border border-gray-200 dark:border-slate-600/50 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white relative">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold shadow-lg shadow-red-500/30">
            3
          </span>
        </button>

        <div className="w-px h-8 bg-gray-200 dark:bg-slate-700/50 hidden sm:block transition-colors"></div>

        {/* Profil utilisateur */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700/30 rounded-lg px-3 py-1.5 border border-gray-200 dark:border-slate-600/50 hover:bg-gray-200 dark:hover:bg-slate-600/50 transition"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-gray-700 dark:text-white transition-colors">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-slate-400 transition-colors">Administrateur</p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 dark:text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700/50 py-1 z-50 overflow-hidden transition-colors">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-700/50">
                <p className="text-xs text-gray-500 dark:text-slate-400">Connecté en tant que</p>
                <p className="text-sm font-medium text-gray-700 dark:text-white truncate">
                  {user?.email}
                </p>
              </div>
              
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
              >
                {isDark ? (
                  <>
                    <Sun className="w-4 h-4 text-yellow-500" />
                    <span>Mode clair</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-500" />
                    <span>Mode sombre</span>
                  </>
                )}
              </button>
              
              <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                <Settings className="w-4 h-4" />
                <span>Paramètres</span>
              </button>
              
              <div className="border-t border-gray-100 dark:border-slate-700/50"></div>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {isDropdownOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
      )}
    </header>
  );
}