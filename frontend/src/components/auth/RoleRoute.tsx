import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { AccessDenied } from './AccessDenied';

interface RoleRouteProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles, children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Validating EcoCycle Credentials & Role Clearance...
          </span>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if role is authorized (Super Admin has universal access)
  const isAuthorized = user.role === 'super_admin' || allowedRoles.includes(user.role);

  if (!isAuthorized) {
    return <AccessDenied allowedRoles={allowedRoles} />;
  }

  return <>{children}</>;
};
