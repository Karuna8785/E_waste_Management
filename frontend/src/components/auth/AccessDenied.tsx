import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { ShieldAlert, ArrowLeft, LogOut, Sparkles, CheckCircle2 } from 'lucide-react';

interface AccessDeniedProps {
  requiredRole?: string;
  allowedRoles?: UserRole[];
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ requiredRole, allowedRoles }) => {
  const { user, logout, switchRoleDemo, getDashboardRoute } = useAuth();
  const navigate = useNavigate();

  const roleDisplayNames: Record<string, string> = {
    individual: 'Citizen (Individual)',
    collector: 'Field Collector',
    partner: 'Recycling & Refurbishment Facility',
    organization_manager: 'Campus CBIT Administrator',
    admin: 'Admin Operations',
    super_admin: 'Super Admin Operations'
  };

  const userRoleName = user ? roleDisplayNames[user.role] || user.role : 'Unauthenticated';

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full glass-panel rounded-3xl p-8 border border-red-500/30 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Warning Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
            HTTP 403 Forbidden — Access Denied
          </span>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">
            Unauthorized Workspace
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            You do not have the required operational permissions to access this role-specific dashboard.
          </p>
        </div>

        {/* Role Comparison Card */}
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-charcoal-900/60 border border-gray-200 dark:border-gray-800 text-left space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium">Your Active Persona:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{userRoleName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium">Required Clearance:</span>
            <span className="font-bold text-rose-600 dark:text-rose-400">
              {requiredRole || (allowedRoles && allowedRoles.map(r => roleDisplayNames[r] || r).join(' or ')) || 'Restricted Role'}
            </span>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="space-y-2.5">
          {user && (
            <button
              onClick={() => navigate(getDashboardRoute(user.role))}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-forest-700 hover:from-emerald-500 hover:to-forest-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-transform hover:scale-[1.01]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Your Authorized Dashboard</span>
            </button>
          )}

          {/* Quick Demo Switcher if user wants to evaluate the requested role */}
          {allowedRoles && allowedRoles.length > 0 && (
            <button
              onClick={async () => {
                const target = allowedRoles[0];
                await switchRoleDemo(target);
                navigate(getDashboardRoute(target));
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/50 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Switch to Demo {roleDisplayNames[allowedRoles[0]]} Persona</span>
            </button>
          )}

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full py-2.5 px-4 rounded-xl text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out from EcoCycle</span>
          </button>
        </div>

      </div>
    </div>
  );
};
