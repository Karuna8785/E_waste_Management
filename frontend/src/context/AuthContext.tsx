import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

export const getDashboardRoute = (role?: UserRole): string => {
  switch (role) {
    case 'collector':
      return '/collector/dashboard';
    case 'partner':
      return '/recycler/dashboard';
    case 'organization_manager':
      return '/campus/dashboard';
    case 'admin':
    case 'super_admin':
      return '/admin/dashboard';
    case 'individual':
    default:
      return '/citizen/dashboard';
  }
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => void;
  switchRoleDemo: (role: UserRole) => Promise<User | null>;
  getDashboardRoute: (role?: UserRole) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_CREDENTIALS: Record<UserRole, { email: string; pass: string; label: string }> = {
  individual: { email: 'user@ecocycle.org', pass: 'password123', label: 'Citizen (Ananya Sharma)' },
  collector: { email: 'collector@ecocycle.org', pass: 'password123', label: 'Collector (Ramesh Kumar)' },
  partner: { email: 'partner@ecocycle.org', pass: 'password123', label: 'Recycler (Dr. V. Satyanarayana)' },
  organization_manager: { email: 'org@cbit.ac.in', pass: 'password123', label: 'Campus CBIT (Prof. Venkatesh)' },
  admin: { email: 'admin@ecocycle.org', pass: 'password123', label: 'Admin Ops (Pooja Reddy)' },
  super_admin: { email: 'admin@ecocycle.org', pass: 'password123', label: 'Admin Ops (Pooja Reddy)' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ecocycle_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async (authToken: string) => {
    try {
      const res = await fetch('/api/v1/auth/me', {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        logout();
      }
    } catch {
      // offline or server starting
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile(token);
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('ecocycle_token', data.access_token);
        setToken(data.access_token);
        setUser(data.user);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('ecocycle_token', data.access_token);
        setToken(data.access_token);
        setUser(data.user);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('ecocycle_token');
    setToken(null);
    setUser(null);
  };

  const switchRoleDemo = async (role: UserRole): Promise<User | null> => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/v1/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('ecocycle_token', data.access_token);
        setToken(data.access_token);
        setUser(data.user);
        return data.user as User;
      }
    } catch (err) {
      console.warn('Demo login API fallback to credentials', err);
    } finally {
      setIsLoading(false);
    }

    // Fallback using direct credentials
    const cred = DEMO_CREDENTIALS[role];
    if (cred) {
      const ok = await login(cred.email, cred.pass);
      if (ok) return user;
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, switchRoleDemo, getDashboardRoute }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
