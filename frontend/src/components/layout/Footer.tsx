import React from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { Recycle, ShieldCheck, Mail, Phone, MapPin, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-charcoal-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Brand & Mission */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-forest-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
                <Recycle className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent">
                {t.brand}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {t.footer_tagline}
            </p>
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Compliant with E-Waste Management Rules 2022</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-4">
              Platform Modules
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="/identify" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">AI Visual Scanner</a></li>
              <li><a href="/schedule" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Doorstep Collection</a></li>
              <li><a href="/marketplace" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Refurbished Marketplace</a></li>
              <li><a href="/impact" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Verified Impact Analytics</a></li>
              <li><a href="/organization" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Campus & Bulk Generators</a></li>
            </ul>
          </div>

          {/* Electronic Waste Categories */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-4">
              Accepted Categories
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-600 dark:text-gray-400">
              <li>Smartphones & Tablets</li>
              <li>Laptops & Desktop Workstations</li>
              <li>Telecom Routers & Network Switched</li>
              <li>Circuit Boards (PCB) & Gold Pins</li>
              <li>Lithium-Ion Batteries & UPS Packs</li>
              <li>Monitors, LED Displays & Printers</li>
            </ul>
          </div>

          {/* Operations & Hub */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-4">
              Regional Operations Hub
            </h4>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>HITEC City Circular Logistics Center, Hyderabad, Telangana 500081</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>support@ecocycle.ai</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>+91 (040) 4892-ECOS (Toll Free)</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 dark:text-gray-400 space-y-4 sm:space-y-0">
          <p>© 2026 EcoCycle AI Platform. Built with transparency for sustainable circular electronics.</p>
          <div className="flex items-center space-x-1">
            <span>Powered by Computer Vision & Certified Recycler Networks</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
