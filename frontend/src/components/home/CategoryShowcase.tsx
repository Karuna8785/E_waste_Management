import React from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldAlert, Cpu } from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  name_te: string;
  desc: string;
  hazard: 'low' | 'medium' | 'high' | 'critical';
  recoveryHighlights: string;
  image: string;
}

const CATEGORIES: CategoryItem[] = [
  {
    id: 'mobile',
    name: 'Smartphones & Mobile Devices',
    name_te: 'మొబైల్ ఫోన్లు & స్మార్ట్‌ఫోన్లు',
    desc: 'Touchscreens, feature phones, PDAs, and lithium-polymer assemblies.',
    hazard: 'medium',
    recoveryHighlights: 'Gold (24g/100kg), Copper (13kg), Aluminum',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'laptop',
    name: 'Laptops & Workstations',
    name_te: 'ల్యాప్‌టాప్‌లు & కంప్యూటర్లు',
    desc: 'Notebooks, MacBooks, business laptops with lithium packs and RAM modules.',
    hazard: 'medium',
    recoveryHighlights: 'Aluminum alloys (22kg), Pure Copper, Motherboard gold',
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'pcb',
    name: 'Electronic Circuit Boards (PCB)',
    name_te: 'ఎలక్ట్రానిక్ సర్క్యూట్ బోర్డులు (PCB)',
    desc: 'Motherboards, GPU cards, telecom routing backplanes, RAM modules.',
    hazard: 'high',
    recoveryHighlights: 'High-grade Gold (85g/100kg), Silver (120g), Copper (22kg)',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'battery',
    name: 'Lithium-Ion Batteries & UPS',
    name_te: 'లిథియం-అయాన్ బ్యాటరీలు & UPS',
    desc: 'Phone batteries, laptop packs, external power banks, inverter cells.',
    hazard: 'critical',
    recoveryHighlights: 'Cobalt, Lithium Carbonate, Nickel, Copper foils',
    image: 'https://images.unsplash.com/photo-1619725002198-6a689b72f41d?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'display',
    name: 'Monitors & LED Televisions',
    name_te: 'మానిటర్లు & LED టెలివిజన్లు',
    desc: 'IPS panels, gaming monitors, CRT retro displays, smart televisions.',
    hazard: 'high',
    recoveryHighlights: 'Optic grade glass, Structural steel, Driver chips',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'accessories',
    name: 'Cables, Chargers & Accessories',
    name_te: 'కేబుల్స్, ఛార్జర్లు & ఉపకరణాలు',
    desc: 'Copper charging cords, power bricks, keyboards, mice, adapters.',
    hazard: 'low',
    recoveryHighlights: 'High-grade Copper wiring (45%), Thermoplastic polymers',
    image: 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?auto=format&fit=crop&w=600&q=80'
  }
];

export const CategoryShowcase: React.FC = () => {
  const { language } = useTranslation();
  const navigate = useNavigate();

  const getHazardBadge = (hazard: string) => {
    switch (hazard) {
      case 'critical':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-500/30';
      case 'high':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-500/30';
      case 'medium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-500/30';
      default:
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-500/30';
    }
  };

  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Acceptance Spectrum
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mt-1">
            Supported Electronic Waste Streams
          </h2>
          <p className="text-base text-gray-600 dark:text-gray-400 mt-2">
            Every device category requires specialized handling. We deploy certified neutralization and recovery workflows for every stream.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="rounded-3xl glass-panel overflow-hidden border border-gray-200/80 dark:border-gray-800/80 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col group hover:-translate-y-1"
            >
              {/* Image with Overlay */}
              <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-charcoal-900">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                {/* Hazard Level Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-sm ${getHazardBadge(cat.hazard)}`}>
                    {cat.hazard} Risk
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-xs font-medium text-emerald-300 block">
                    {language === 'te' ? cat.name_te : cat.name}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">
                    {cat.desc}
                  </p>
                  
                  {/* Recovery Metric */}
                  <div className="mt-4 p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 text-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block mb-0.5">
                      Recoverable Yield:
                    </span>
                    <span className="text-gray-700 dark:text-gray-300 font-semibold">
                      {cat.recoveryHighlights}
                    </span>
                  </div>
                </div>

                {/* Diagnose CTA */}
                <button
                  onClick={() => navigate('/identify', { state: { preselectedCategory: cat.name } })}
                  className="mt-5 w-full py-2.5 rounded-xl border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Diagnose This Item</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
