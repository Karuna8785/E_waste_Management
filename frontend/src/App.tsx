import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { IdentifyPage } from './pages/IdentifyPage';
import { SchedulePage } from './pages/SchedulePage';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { CollectorPortal } from './pages/CollectorPortal';
import { PartnerPortal } from './pages/PartnerPortal';
import { OrganizationPortal } from './pages/OrganizationPortal';
import { MarketplacePage } from './pages/MarketplacePage';
import { ImpactPage } from './pages/ImpactPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthPage } from './pages/AuthPage';

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

  // If not logged in, show AuthPage first!
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
        {/* Only show Navbar and Footer when logged in */}
        {user && <Navbar />}
        <main className="flex-1">
          <Routes>
            {/* If not logged in, root and all main pages are gated behind AuthPage */}
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
            <Route path="/register" element={user ? <Navigate to="/" replace /> : <AuthPage />} />

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

            <Route path="/dashboard" element={
              <AuthGateway>
                <CitizenDashboard />
              </AuthGateway>
            } />

            <Route path="/collector" element={
              <AuthGateway>
                <CollectorPortal />
              </AuthGateway>
            } />

            <Route path="/partner" element={
              <AuthGateway>
                <PartnerPortal />
              </AuthGateway>
            } />

            <Route path="/organization" element={
              <AuthGateway>
                <OrganizationPortal />
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

            <Route path="/admin" element={
              <AuthGateway>
                <AdminDashboard />
              </AuthGateway>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
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
