import React from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Cpu, 
  Calendar, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  Scale, 
  Flame 
} from 'lucide-react';
import { ImpactMetrics } from '../../types';

interface HeroSectionProps {
  metrics: ImpactMetrics | null;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ metrics }) => {
  const { t } = useTranslation();

  const divertedKg = metrics?.metrics?.total_weight_diverted_kg || 1890.0;
  const co2eKg = metrics?.metrics?.carbon_offset_co2e_kg || 5292.0;
  const devicesCount = metrics?.metrics?.total_devices_collected || 142;
  const groundwaterLiters = metrics?.metrics?.groundwater_protected_liters || 26460000;

  return (
    <section className="relative overflow-hidden pt-6 pb-16 lg:pt-12 lg:pb-24">
      {/* Subtle Background Glows */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left z-10">
            
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold tracking-wide uppercase shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span>{t.hero_badge}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.12]">
              {t.hero_title}
            </h1>

            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              {t.hero_subtitle}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                to="/identify"
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-forest-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-sm uppercase tracking-wider shadow-xl shadow-emerald-500/25 flex items-center justify-center space-x-2.5 transition-all transform hover:-translate-y-0.5"
              >
                <Cpu className="w-4 h-4" />
                <span>{t.btn_identify}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>

              <Link
                to="/schedule"
                className="w-full sm:w-auto px-7 py-4 rounded-2xl glass-panel hover:bg-white/90 dark:hover:bg-charcoal-900 text-gray-900 dark:text-white font-bold text-sm uppercase tracking-wider border border-gray-200 dark:border-gray-800 shadow-md flex items-center justify-center space-x-2 transition-all hover:-translate-y-0.5"
              >
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{t.btn_schedule}</span>
              </Link>
            </div>

            {/* Verified Certifications Pill */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Certified CPCB/SPCB Recyclers</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-500" />
                <span>Zero-Landfill Guarantee</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>NIST 800-88 Data Sanitization</span>
              </div>
            </div>

          </div>

          {/* Right Column: Layered Visual Graphic (Replacing 3D Earth) */}
          <div className="lg:col-span-5 relative w-full flex items-center justify-center">
            <div className="relative w-full max-w-lg">
              
              {/* Primary Visual Card with Real E-Waste Sorting Facility Photo */}
              <div className="rounded-3xl glass-panel p-3 border border-emerald-500/30 shadow-2xl overflow-hidden group">
                <div className="relative h-72 sm:h-80 rounded-2xl overflow-hidden bg-gray-900">
                  <img
                    src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80"
                    alt="Electronic recycling technicians sorting circuit boards"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  
                  {/* Status Banner */}
                  <div className="absolute top-4 left-4 flex items-center space-x-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>AI Triage Active</span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">
                      Certified Closed-Loop Recovery
                    </span>
                    <h3 className="text-lg font-extrabold mt-0.5">
                      Responsible Electronics Treatment
                    </h3>
                  </div>
                </div>

                {/* Sub-card details */}
                <div className="p-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                    <div className="flex items-center space-x-1 font-bold">
                      <Scale className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Certified Weights</span>
                    </div>
                    <span className="text-[11px] opacity-80 block mt-0.5">100% Weighbridge Audited</span>
                  </div>

                  <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-800 dark:text-cyan-300">
                    <div className="flex items-center space-x-1 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />
                      <span>Zero Hazardous Waste</span>
                    </div>
                    <span className="text-[11px] opacity-80 block mt-0.5">Safe Lead/Mercury Extraction</span>
                  </div>
                </div>
              </div>

              {/* Floating Badge 1 (Top Right) */}
              <div className="hidden sm:flex absolute -top-5 -right-5 p-3.5 rounded-2xl glass-panel border border-emerald-500/40 shadow-xl items-center space-x-3 bg-white/95 dark:bg-charcoal-900/95 animate-bounce-slow">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Verified Compliance</span>
                  <span className="text-xs font-black text-gray-900 dark:text-white">CPCB Manifest Form 6</span>
                </div>
              </div>

              {/* Floating Badge 2 (Bottom Left) */}
              <div className="hidden sm:flex absolute -bottom-5 -left-5 p-3.5 rounded-2xl glass-panel border border-cyan-500/40 shadow-xl items-center space-x-3 bg-white/95 dark:bg-charcoal-900/95">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-600 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Circular Yield</span>
                  <span className="text-xs font-black text-gray-900 dark:text-white">85g Gold / 100kg PCB</span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Live Metrics Ribbon */}
        <div className="mt-14 p-6 sm:p-8 rounded-3xl glass-panel border border-emerald-500/20 shadow-xl grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <span className="text-2xl sm:text-4xl font-black bg-gradient-to-r from-emerald-600 to-forest-600 dark:from-emerald-400 dark:to-forest-300 bg-clip-text text-transparent">
              {divertedKg.toLocaleString()} kg
            </span>
            <span className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mt-1 uppercase tracking-wider">
              {t.stat_collected}
            </span>
          </div>

          <div>
            <span className="text-2xl sm:text-4xl font-black bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-300 bg-clip-text text-transparent">
              {co2eKg.toLocaleString()} kg
            </span>
            <span className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mt-1 uppercase tracking-wider">
              {t.stat_co2}
            </span>
          </div>

          <div>
            <span className="text-2xl sm:text-4xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
              {devicesCount}
            </span>
            <span className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mt-1 uppercase tracking-wider">
              {t.stat_devices}
            </span>
          </div>

          <div>
            <span className="text-2xl sm:text-4xl font-black bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-300 bg-clip-text text-transparent">
              {(groundwaterLiters / 1000000).toFixed(1)}M L
            </span>
            <span className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mt-1 uppercase tracking-wider">
              {t.stat_groundwater}
            </span>
          </div>
        </div>

      </div>
    </section>
  );
};
