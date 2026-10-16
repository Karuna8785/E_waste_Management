import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  Sparkles,
  LayoutDashboard,
  Calendar,
  Leaf,
  Activity,
  Package,
  Layers,
  Award,
  Navigation,
  Scale
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { t, language, toggleLanguage } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout, switchRoleDemo, getDashboardRoute } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const roleLabels: Record<UserRole, { label: string; icon: any; color: string; badge: string; route: string }> = {
    individual: { 
      label: 'Citizen (Ananya Sharma)', 
      icon: UserIcon, 
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      badge: 'Citizen',
      route: '/citizen/dashboard'
    },
    collector: { 
      label: 'Collector (Ramesh Kumar)', 
      icon: Truck, 
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      badge: 'Field Collector',
      route: '/collector/dashboard'
    },
    partner: { 
      label: 'Recycler (Dr. Satyanarayana)', 
      icon: Cpu, 
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      badge: 'Recycling Plant',
      route: '/recycler/dashboard'
    },
    organization_manager: { 
      label: 'Campus (Prof. Venkatesh / CBIT)', 
      icon: Building2, 
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      badge: 'College / CBIT',
      route: '/campus/dashboard'
    },
    admin: { 
      label: 'Admin Ops (Pooja Reddy)', 
      icon: ShieldCheck, 
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      badge: 'Admin Ops',
      route: '/admin/dashboard'
    },
    super_admin: { 
      label: 'Super Admin Ops', 
      icon: ShieldCheck, 
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      badge: 'Super Admin',
      route: '/admin/dashboard'
    },
  };

  const currentRole = user?.role || 'individual';
  const roleInfo = roleLabels[currentRole] || roleLabels.individual;

  // Role-Specific Navigation items
  const renderRoleNavLinks = () => {
    switch (currentRole) {
      case 'admin':
      case 'super_admin':
        return [
          { label: 'Operations Overview', path: '/admin/dashboard?tab=overview', icon: Activity },
          { label: 'Request Control', path: '/admin/dashboard?tab=requests', icon: Package },
          { label: 'Collectors', path: '/admin/dashboard?tab=collectors', icon: Truck },
          { label: 'Recyclers', path: '/admin/dashboard?tab=recyclers', icon: Cpu },
          { label: 'Campus Mgmt', path: '/admin/dashboard?tab=campus', icon: Building2 },
          { label: 'Operations Map', path: '/admin/dashboard?tab=map', icon: Activity },
          { label: 'Analytics', path: '/admin/dashboard?tab=analytics', icon: Activity },
          { label: 'Audit Logs', path: '/admin/dashboard?tab=audit', icon: ShieldCheck },
        ];
      case 'collector':
        return [
          { label: 'My Route', path: '/collector/dashboard?tab=route', icon: Navigation },
          { label: 'Assigned Pickups', path: '/collector/dashboard?tab=assigned', icon: Package },
          { label: 'Available Jobs', path: '/collector/dashboard?tab=available', icon: Truck },
          { label: 'Scale & Confirm', path: '/collector/dashboard?tab=confirm', icon: Scale },
          { label: 'Plant Handover', path: '/collector/dashboard?tab=handover', icon: Layers },
          { label: 'Work History', path: '/collector/dashboard?tab=history', icon: Activity },
        ];
      case 'partner':
        return [
          { label: 'Facility Overview', path: '/recycler/dashboard?tab=overview', icon: Building2 },
          { label: 'Incoming Manifests', path: '/recycler/dashboard?tab=shipments', icon: Truck },
          { label: 'Weighbridge Intake', path: '/recycler/dashboard?tab=reconciliation', icon: Scale },
          { label: 'Triage Workbench', path: '/recycler/dashboard?tab=inspection', icon: Activity },
          { label: 'Smelting & Yields', path: '/recycler/dashboard?tab=processing', icon: Cpu },
          { label: 'Certificates', path: '/recycler/dashboard?tab=certificates', icon: Award },
        ];
      case 'organization_manager':
        return [
          { label: 'Campus Overview', path: '/campus/dashboard?tab=overview', icon: Building2 },
          { label: 'Departments', path: '/campus/dashboard?tab=departments', icon: Building2 },
          { label: 'Asset Inventory', path: '/campus/dashboard?tab=inventory', icon: Package },
          { label: 'Bulk CSV Ingestion', path: '/campus/dashboard?tab=csv-upload', icon: Layers },
          { label: 'Collection Drives', path: '/campus/dashboard?tab=campaigns', icon: Award },
          { label: 'Bulk Pickup', path: '/campus/dashboard?tab=bulk-pickup', icon: Calendar },
          { label: 'ESG Sustainability', path: '/campus/dashboard?tab=sustainability', icon: Leaf },
        ];
      case 'individual':
      default:
        return [
          { label: 'Citizen Dashboard', path: '/citizen/dashboard', icon: LayoutDashboard },
          { label: 'AI Scanner', path: '/identify', icon: Cpu },
          { label: 'Schedule Pickup', path: '/schedule', icon: Calendar },
          { label: 'My Requests', path: '/citizen/dashboard?tab=overview', icon: Package },
          { label: 'Marketplace', path: '/marketplace', icon: ShoppingBag },
          { label: 'My Eco-Impact', path: '/impact', icon: Leaf },
          { label: 'Rewards', path: '/citizen/dashboard?tab=rewards', icon: Award },
        ];
    }
  };

  const navLinks = renderRoleNavLinks();

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-gray-200/80 dark:border-gray-800/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <Link to={getDashboardRoute(currentRole)} className="flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 via-forest-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Recycle className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 via-forest-700 to-cyan-600 dark:from-emerald-400 dark:via-forest-300 dark:to-cyan-400 bg-clip-text text-transparent">
                {t.brand}
              </span>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] tracking-widest uppercase font-semibold text-gray-500 dark:text-gray-400">
                  Circular Tech
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${roleInfo.color}`}>
                  {roleInfo.badge}
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Distinct Role Navigation Links */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.slice(0, 6).map((item) => {
              const Icon = item.icon;
              const active = location.pathname + location.search === item.path || (item.path.split('?')[0] === location.pathname && !location.search);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    active
                      ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 font-bold shadow-sm'
                      : 'text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-charcoal-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Action Icons: Language, Theme, Role Switcher, Sign Out */}
          <div className="hidden sm:flex items-center space-x-3">
            
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors"
              title="Toggle Telugu / English"
            >
              <Languages className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'en' ? 'తెలుగు' : 'EN'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
            </button>

            {/* Quick Demo Persona Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-sm transition-colors ${roleInfo.color}`}
              >
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>{roleInfo.badge}</span>
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl glass-panel p-2 z-50 border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-200 dark:border-gray-800">
                    Switch Active Role Workspace
                  </div>
                  {(['individual', 'admin', 'collector', 'partner', 'organization_manager'] as UserRole[]).map((r) => {
                    const info = roleLabels[r];
                    const Icon = info.icon;
                    return (
                      <button
                        key={r}
                        onClick={async () => {
                          const loggedIn = await switchRoleDemo(r);
                          setRoleDropdownOpen(false);
                          navigate(getDashboardRoute(loggedIn?.role || r));
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 my-0.5 transition-colors ${
                          currentRole === r ? 'bg-emerald-500/10 text-emerald-600 font-bold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-charcoal-900'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{info.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sign Out Button */}
            {user && (
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center space-x-2">
            <button
              onClick={toggleLanguage}
              className="px-2 py-1 text-xs font-bold border rounded-lg border-gray-300 dark:border-gray-700"
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
          <div className="px-3 py-1 text-[10px] uppercase font-bold text-gray-400">
            {roleInfo.badge} Workspace Navigation
          </div>
          {navLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-charcoal-900"
            >
              {item.label}
            </Link>
          ))}

          <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <button
              onClick={toggleTheme}
              className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
                navigate('/login');
              }}
              className="text-xs font-bold text-red-600"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
