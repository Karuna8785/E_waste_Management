import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
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

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen flex flex-col bg-[#fbfbfa] dark:bg-[#090d16] text-gray-900 dark:text-gray-100 transition-colors duration-300">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/identify" element={<IdentifyPage />} />
                  <Route path="/schedule" element={<SchedulePage />} />
                  <Route path="/dashboard" element={<CitizenDashboard />} />
                  <Route path="/collector" element={<CollectorPortal />} />
                  <Route path="/partner" element={<PartnerPortal />} />
                  <Route path="/organization" element={<OrganizationPortal />} />
                  <Route path="/marketplace" element={<MarketplacePage />} />
                  <Route path="/impact" element={<ImpactPage />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
