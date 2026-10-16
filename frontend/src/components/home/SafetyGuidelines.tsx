import React from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { ShieldCheck, AlertOctagon, Check, X, BatteryCharging, Lock, Flame } from 'lucide-react';

export const SafetyGuidelines: React.FC = () => {
  const { language } = useTranslation();

  const dos = [
    {
      title: 'Tape Battery Terminals',
      title_te: 'బ్యాటరీ చివరలను టేప్‌తో మూయండి',
      desc: 'Use electrical tape over exposed lithium battery contacts to prevent accidental short circuits or sparking.',
      desc_te: 'షార్ట్ సర్క్యూట్‌లను నివారించడానికి బ్యాటరీ టెర్మినల్స్‌పై టేప్ అతికించండి.'
    },
    {
      title: 'Factory Reset Personal Data',
      title_te: 'వ్యక్తిగత డేటాను తొలగించండి',
      desc: 'Log out of cloud accounts and factory reset phones/laptops. Our partners also perform certified DoD data wiping.',
      desc_te: 'మీ ఫోన్ లేదా ల్యాప్‌టాప్‌ను ఫ్యాక్టరీ రీసెట్ చేసి క్లౌడ్ ఖాతాలను తొలగించండి.'
    },
    {
      title: 'Bundle Power Adapters',
      title_te: 'ఛార్జర్లు మరియు కేబుల్స్ కలిపి ఉంచండి',
      desc: 'Keep power bricks and charging cables alongside their parent device to maximize reuse and resale value.',
      desc_te: 'పరికరాన్ని ఛార్జర్లతో కలిపి అందజేయడం వల్ల దాని విలువ పెరుగుతుంది.'
    }
  ];

  const donts = [
    {
      title: 'Never Puncture or Crush Batteries',
      title_te: 'బ్యాటరీలను గుచ్చవద్దు లేదా విరవవద్దు',
      desc: 'Puncturing a lithium-ion cell causes rapid thermal runaway, toxic gas release, and intense fire.',
      desc_te: 'లిథియం బ్యాటరీలను పొడిస్తే లేదా విరిస్తే పేలుడు సంభవించే ప్రమాదం ఉంది.'
    },
    {
      title: 'Do Not Burn Electronics',
      title_te: 'ఎలక్ట్రానిక్స్ వస్తువులను కాల్చవద్దు',
      desc: 'Open burning of circuit boards releases cancer-causing dioxins, furans, and vaporized mercury into the air.',
      desc_te: 'ఎలక్ట్రానిక్స్ కాల్చడం వల్ల అత్యంత ప్రమాదకరమైన విషవాయువులు విడుదలవుతాయి.'
    },
    {
      title: 'Do Not Mix with Wet Household Trash',
      title_te: 'తడి చెత్తతో కలిపి పారవేయవద్దు',
      desc: 'E-waste in standard dumpsters leaches heavy metals directly into municipal groundwater tables.',
      desc_te: 'సాధారణ చెత్తతో కలపడం వల్ల భూగర్భ జలాలు కలుషితమవుతాయి.'
    }
  ];

  return (
    <section className="py-20 relative bg-emerald-500/5 dark:bg-charcoal-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Citizen Safety Protocol
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mt-1">
            Safe Handling & Household Preparation
          </h2>
          <p className="text-base text-gray-600 dark:text-gray-400 mt-2">
            Electronics contain both valuable metals and volatile chemicals. Follow these simple principles before collection.
          </p>
        </div>

        {/* Dos and Don'ts Split Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Safe Do's Card */}
          <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-emerald-500/30 shadow-xl space-y-5">
            <div className="flex items-center space-x-3 text-emerald-600 dark:text-emerald-400">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Recommended Actions
              </h3>
            </div>

            <div className="space-y-4 pt-2">
              {dos.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20">
                  <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
                    {language === 'te' ? item.title_te : item.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                    {language === 'te' ? item.desc_te : item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Don'ts Card */}
          <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-rose-500/30 shadow-xl space-y-5">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <X className="w-6 h-6 stroke-[3]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Critical Hazards to Avoid
              </h3>
            </div>

            <div className="space-y-4 pt-2">
              {donts.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/20">
                  <h4 className="text-sm font-bold text-rose-900 dark:text-rose-300">
                    {language === 'te' ? item.title_te : item.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                    {language === 'te' ? item.desc_te : item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
