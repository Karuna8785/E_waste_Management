import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { 
  Recycle, 
  Sun, 
  Moon, 
  Languages, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  X, 
  Cpu, 
  Truck, 
  Building2, 
  ShieldCheck, 
  ShoppingBag,
  Sparkles
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { t, language, toggleLanguage } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout, switchRoleDemo } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const roleLabels: Record<UserRole, { label: string; icon: any; color: string }> = {
    individual: { label: 'Citizen', icon: UserIcon, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
    collector: { label: 'Collector', icon: Truck, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
    partner: { label: 'Recycler Plant', icon: Cpu, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
    organization_manager: { label: 'Campus/Office', icon: Building2, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
    admin: { label: 'Admin Ops', icon: ShieldCheck, color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
    super_admin: { label: 'Super Admin', icon: ShieldCheck, color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
  };

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-gray-200/80 dark:border-gray-800/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 via-forest-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Recycle className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 via-forest-700 to-cyan-600 dark:from-emerald-400 dark:via-forest-300 dark:to-cyan-400 bg-clip-text text-transparent">
                {t.brand}
              </span>
              <span className="block text-[10px] tracking-widest uppercase font-semibold text-gray-500 dark:text-gray-400">
                Circular Electronics
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center space-x-1">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/') 
                  ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 font-semibold' 
                  : 'text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400'
              }`}
            >
              {t.nav_home}
            </Link>

            <Link
              to="/identify"
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-all ${
                isActive('/identify') 
                  ? 'text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 font-semibold' 
                  : 'text-gray-600 hover:text-cyan-600 dark:text-gray-300 dark:hover:text-cyan-400'
              }`}
            >
              <Cpu className="w-4 h-4 text-cyan-500" />
              <span>{t.nav_identify}</span>
            </Link>

            <Link
              to="/schedule"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/schedule') 
                  ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 font-semibold' 
                  : 'text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400'
              }`}
            >
              {t.nav_schedule}
            </Link>

            <Link
              to="/marketplace"
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1 transition-all ${
                isActive('/marketplace') 
                  ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 font-semibold' 
                  : 'text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t.nav_marketplace}</span>
            </Link>

            <Link
              to="/impact"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/impact') 
                  ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 font-semibold' 
                  : 'text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400'
              }`}
            >
              {t.nav_impact}
            </Link>

            {/* Role specific dashboard link */}
            {user && (
              <Link
                to={
                  user.role === 'collector' ? '/collector' :
                  user.role === 'partner' ? '/partner' :
                  user.role === 'organization_manager' ? '/organization' :
                  user.role === 'admin' ? '/admin' : '/dashboard'
                }
                className="px-3 py-2 rounded-lg text-sm font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-900/40 hover:bg-emerald-200/60 transition-colors flex items-center space-x-1"
              >
                <span>
                  {user.role === 'collector' ? t.nav_collector_portal :
                   user.role === 'partner' ? t.nav_partner_portal :
                   user.role === 'organization_manager' ? t.nav_org_portal :
                   user.role === 'admin' ? t.nav_admin : t.nav_citizen_portal}
                </span>
              </Link>
            )}
          </div>

          {/* Right Action Icons: Language, Theme, Role Switcher, Auth */}
          <div className="hidden sm:flex items-center space-x-3">
            
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors"
              title="Toggle Telugu / English"
            >
              <Languages className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'en' ? 'తెలుగు' : 'English'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
            </button>

            {/* Quick Role Switcher Dropdown (for evaluation and demo) */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/30 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/50 transition-colors shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                <span>{user ? roleLabels[user.role]?.label || user.role : t.quick_demo_login}</span>
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-xl glass-panel p-2 z-50 border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-200 dark:border-gray-800">
                    Switch Test Persona
                  </div>
                  {(['individual', 'collector', 'partner', 'organization_manager', 'admin'] as UserRole[]).map((r) => {
                    const info = roleLabels[r];
                    const Icon = info.icon;
                    return (
                      <button
                        key={r}
                        onClick={async () => {
                          await switchRoleDemo(r);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 my-0.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors ${
                          user?.role === r ? 'bg-emerald-500/10 text-emerald-600 font-bold' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{info.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* User Profile / Auth State */}
            {user ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={logout}
                  className="p-2 rounded-lg border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => switchRoleDemo('individual')}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
                >
                  {t.nav_login}
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center space-x-2">
            <button
              onClick={toggleLanguage}
              className="px-2 py-1 text-xs font-bold border rounded border-gray-300 dark:border-gray-700"
            >
              {language === 'en' ? 'తెలుగు' : 'EN'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-charcoal-950/95 px-4 pt-3 pb-6 space-y-2 backdrop-blur-lg">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          >
            {t.nav_home}
          </Link>
          <Link
            to="/identify"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-cyan-600 dark:text-cyan-400"
          >
            {t.nav_identify}
          </Link>
          <Link
            to="/schedule"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-emerald-600 dark:text-emerald-400"
          >
            {t.nav_schedule}
          </Link>
          <Link
            to="/marketplace"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 dark:text-gray-200"
          >
            {t.nav_marketplace}
          </Link>
          <Link
            to="/impact"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 dark:text-gray-200"
          >
            {t.nav_impact}
          </Link>

          {user && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-800 space-y-1">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-emerald-600"
              >
                {t.nav_citizen_portal}
              </Link>
              <Link
                to="/collector"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-amber-600"
              >
                {t.nav_collector_portal}
              </Link>
              <Link
                to="/partner"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-blue-600"
              >
                {t.nav_partner_portal}
              </Link>
              <Link
                to="/organization"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-purple-600"
              >
                {t.nav_org_portal}
              </Link>
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-rose-600"
              >
                {t.nav_admin}
              </Link>
            </div>
          )}

          <div className="pt-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={toggleTheme}
              className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            {user ? (
              <button
                onClick={logout}
                className="text-xs font-semibold text-red-600 dark:text-red-400"
              >
                {t.nav_logout}
              </button>
            ) : (
              <button
                onClick={() => switchRoleDemo('individual')}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400"
              >
                {t.nav_login}
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
