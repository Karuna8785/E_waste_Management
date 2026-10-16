import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth, getDashboardRoute } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { RoleRoute } from './components/auth/RoleRoute';
import { AccessDenied } from './components/auth/AccessDenied';

// Public & Shared Pages
import { HomePage } from './pages/HomePage';
import { IdentifyPage } from './pages/IdentifyPage';
import { SchedulePage } from './pages/SchedulePage';
import { MarketplacePage } from './pages/MarketplacePage';
import { ImpactPage } from './pages/ImpactPage';
import { AuthPage } from './pages/AuthPage';

// 5 Dedicated Role Dashboards
import { CitizenDashboard } from './pages/CitizenDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { CollectorDashboard } from './pages/CollectorDashboard';
import { RecyclerDashboard } from './pages/RecyclerDashboard';
import { CampusDashboard } from './pages/CampusDashboard';

// Protected Route Gateway Wrapper
const AuthGateway: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbfbfa] dark:bg-[#090d16]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Initializing EcoCycle Authentication...
          </span>
        </div>
      </div>
    );
  }

  // If not logged in, gate behind AuthPage
  if (!user) {
    return <AuthPage />;
  }

  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#fbfbfa] dark:bg-[#090d16] text-gray-900 dark:text-gray-100 transition-colors duration-300">
        {/* Navigation bar visible when logged in */}
        {user && <Navbar />}
        <main className="flex-1">
          <Routes>
            {/* Auth Page & Role-Aware Post-Login Redirect */}
            <Route 
              path="/login" 
              element={user ? <Navigate to={getDashboardRoute(user.role)} replace /> : <AuthPage />} 
            />
            <Route 
              path="/register" 
              element={user ? <Navigate to={getDashboardRoute(user.role)} replace /> : <AuthPage />} 
            />

            {/* Public Showcase & Feature Routes */}
            <Route path="/" element={
              <AuthGateway>
                <HomePage />
              </AuthGateway>
            } />
            <Route path="/home" element={
              <AuthGateway>
                <HomePage />
              </AuthGateway>
            } />
            <Route path="/identify" element={
              <AuthGateway>
                <IdentifyPage />
              </AuthGateway>
            } />
            <Route path="/schedule" element={
              <AuthGateway>
                <SchedulePage />
              </AuthGateway>
            } />
            <Route path="/marketplace" element={
              <AuthGateway>
                <MarketplacePage />
              </AuthGateway>
            } />
            <Route path="/impact" element={
              <AuthGateway>
                <ImpactPage />
              </AuthGateway>
            } />

            {/* Access Denied Route */}
            <Route path="/access-denied" element={<AccessDenied />} />

            {/* 1. CITIZEN DASHBOARD */}
            <Route 
              path="/citizen/dashboard" 
              element={
                <RoleRoute allowedRoles={['individual']}>
                  <CitizenDashboard />
                </RoleRoute>
              } 
            />

            {/* 2. ADMIN OPS DASHBOARD */}
            <Route 
              path="/admin/dashboard" 
              element={
                <RoleRoute allowedRoles={['admin', 'super_admin']}>
                  <AdminDashboard />
                </RoleRoute>
              } 
            />

            {/* 3. COLLECTOR DASHBOARD */}
            <Route 
              path="/collector/dashboard" 
              element={
                <RoleRoute allowedRoles={['collector']}>
                  <CollectorDashboard />
                </RoleRoute>
              } 
            />

            {/* 4. RECYCLER DASHBOARD */}
            <Route 
              path="/recycler/dashboard" 
              element={
                <RoleRoute allowedRoles={['partner']}>
                  <RecyclerDashboard />
                </RoleRoute>
              } 
            />

            {/* 5. CAMPUS — CBIT DASHBOARD */}
            <Route 
              path="/campus/dashboard" 
              element={
                <RoleRoute allowedRoles={['organization_manager']}>
                  <CampusDashboard />
                </RoleRoute>
              } 
            />

            {/* Backward-Compatibility Alias Routes */}
            <Route path="/dashboard" element={<Navigate to="/citizen/dashboard" replace />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/collector" element={<Navigate to="/collector/dashboard" replace />} />
            <Route path="/partner" element={<Navigate to="/recycler/dashboard" replace />} />
            <Route path="/organization" element={<Navigate to="/campus/dashboard" replace />} />

            {/* Universal Fallback */}
            <Route path="*" element={<Navigate to={user ? getDashboardRoute(user.role) : "/login"} replace />} />
          </Routes>
        </main>
        {user && <Footer />}
      </div>
    </Router>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
