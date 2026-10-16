import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { 
  Recycle, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  Building2, 
  ShieldCheck, 
  Truck, 
  Cpu, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, register, switchRoleDemo, getDashboardRoute, isLoading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [selectedRole, setSelectedRole] = useState<UserRole>('individual');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [orgName, setOrgName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const rolesList: Array<{ role: UserRole; title: string; subtitle: string; icon: any; color: string }> = [
    {
      role: 'individual',
      title: 'Individual Citizen',
      subtitle: 'Dispose home electronics, book pickups, earn rewards',
      icon: User,
      color: 'border-emerald-500 text-emerald-600 bg-emerald-500/10'
    },
    {
      role: 'collector',
      title: 'Authorized Collector',
      subtitle: 'Field logistics, weighbridge scale & doorstep verification',
      icon: Truck,
      color: 'border-amber-500 text-amber-600 bg-amber-500/10'
    },
    {
      role: 'partner',
      title: 'Recycling & Refurbishment Facility',
      subtitle: 'Intake manifests, material smelting & recovery certificates',
      icon: Cpu,
      color: 'border-blue-500 text-blue-600 bg-blue-500/10'
    },
    {
      role: 'organization_manager',
      title: 'College / Corporate Campus (CBIT)',
      subtitle: 'Bulk inventory CSV, campus drives & ESG compliance',
      icon: Building2,
      color: 'border-purple-500 text-purple-600 bg-purple-500/10'
    },
    {
      role: 'admin',
      title: 'Operations & Administrator',
      subtitle: 'Platform oversight, regional telemetry & audit trail',
      icon: ShieldCheck,
      color: 'border-rose-500 text-rose-600 bg-rose-500/10'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (mode === 'signin') {
      const ok = await login(email, password);
      if (ok) {
        // Fetch current token user or retrieve from storage
        const token = localStorage.getItem('ecocycle_token');
        if (token) {
          try {
            const res = await fetch('/api/v1/auth/me', {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
              const data = await res.json();
              navigate(getDashboardRoute(data.user?.role));
              return;
            }
          } catch {
            // fallback
          }
        }
        navigate('/citizen/dashboard');
      } else {
        setErrorMessage('Invalid email or password. Please verify your credentials or use a 1-click demo login below.');
      }
    } else {
      if (!fullName.trim()) {
        setErrorMessage('Full name is required.');
        return;
      }
      const ok = await register({
        email,
        password,
        full_name: fullName,
        phone,
        role: selectedRole,
        organization_name: (selectedRole === 'organization_manager' || selectedRole === 'partner') ? orgName : undefined
      });
      if (ok) {
        navigate(getDashboardRoute(selectedRole));
      } else {
        setErrorMessage('Registration failed. The email may already be in use.');
      }
    }
  };

  const handleDemoSignIn = async (role: UserRole) => {
    setErrorMessage(null);
    const loggedInUser = await switchRoleDemo(role);
    const targetRoute = getDashboardRoute(loggedInUser?.role || role);
    navigate(targetRoute);
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center relative overflow-hidden bg-gradient-to-b from-emerald-50/50 via-[#fbfbfa] to-emerald-50/30 dark:from-charcoal-950 dark:via-charcoal-900 dark:to-charcoal-950">
      
      {/* Decorative ambient blurred backdrops */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-xl mx-auto space-y-6 z-10">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-forest-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 mx-auto">
            <Recycle className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            {t.brand}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium max-w-sm mx-auto">
            Intelligent E-Waste Management, Diagnostics & Verified Circular Supply Chain Platform
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-emerald-500/20 shadow-2xl space-y-6">
          
          {/* Sign In vs Sign Up Tab Switcher */}
          <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-gray-100 dark:bg-charcoal-900 border border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={() => { setMode('signin'); setErrorMessage(null); }}
              className={`py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                mode === 'signin'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMessage(null); }}
              className={`py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                mode === 'signup'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Role Selector (visible during Sign Up) */}
          {mode === 'signup' && (
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Select Your Role / Account Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {rolesList.map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedRole === item.role;
                  return (
                    <div
                      key={item.role}
                      onClick={() => setSelectedRole(item.role)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start space-x-2.5 ${
                        isSelected
                          ? `${item.color} shadow-sm ring-1 ring-emerald-500`
                          : 'border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-charcoal-900/50 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-xs font-bold block">{item.title}</span>
                        <span className="text-[10px] text-gray-400 block line-clamp-1">{item.subtitle}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Sharma"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-charcoal-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-charcoal-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-charcoal-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && (selectedRole === 'organization_manager' || selectedRole === 'partner') && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Institution or Facility Name
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. CBIT Campus Sustainability Cell"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-charcoal-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-charcoal-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-forest-700 hover:from-emerald-500 hover:to-forest-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-transform hover:scale-[1.01]"
            >
              <span>{isLoading ? 'Authenticating...' : mode === 'signin' ? 'Sign In to EcoCycle' : 'Complete Registration'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo 1-Click Login Section */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-400">
              <span className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>One-Click Role Demonstration</span>
              </span>
              <span>Test Credentials</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoSignIn('individual')}
                className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/30 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/50 transition-colors flex items-center justify-center space-x-1.5"
              >
                <User className="w-3.5 h-3.5 text-emerald-500" />
                <span>Citizen</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSignIn('admin')}
                className="p-2.5 rounded-xl border border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/30 text-xs font-semibold text-rose-800 dark:text-rose-300 hover:bg-rose-100/50 transition-colors flex items-center justify-center space-x-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
                <span>Admin Ops</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSignIn('collector')}
                className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/30 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-100/50 transition-colors flex items-center justify-center space-x-1.5"
              >
                <Truck className="w-3.5 h-3.5 text-amber-500" />
                <span>Collector</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSignIn('partner')}
                className="p-2.5 rounded-xl border border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/30 text-xs font-semibold text-blue-800 dark:text-blue-300 hover:bg-blue-100/50 transition-colors flex items-center justify-center space-x-1.5"
              >
                <Cpu className="w-3.5 h-3.5 text-blue-500" />
                <span>Recycler</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSignIn('organization_manager')}
                className="p-2.5 rounded-xl border border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/30 text-xs font-semibold text-purple-800 dark:text-purple-300 hover:bg-purple-100/50 transition-colors flex items-center justify-center space-x-1.5 col-span-2 sm:col-span-2"
              >
                <Building2 className="w-3.5 h-3.5 text-purple-500" />
                <span>College / Campus (CBIT)</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
