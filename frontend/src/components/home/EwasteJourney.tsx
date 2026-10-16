import React, { useState } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { Cpu, Truck, Wrench, RefreshCw, CheckCircle2 } from 'lucide-react';

export const EwasteJourney: React.FC = () => {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      title: t.step1_title,
      desc: t.step1_desc,
      icon: Cpu,
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=700&q=80',
      badge: 'Step 1: Diagnostics'
    },
    {
      title: t.step2_title,
      desc: t.step2_desc,
      icon: Truck,
      image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=700&q=80',
      badge: 'Step 2: Logistics'
    },
    {
      title: t.step3_title,
      desc: t.step3_desc,
      icon: Wrench,
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=700&q=80',
      badge: 'Step 3: Refurbishment'
    },
    {
      title: t.step4_title,
      desc: t.step4_desc,
      icon: RefreshCw,
      image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=700&q=80',
      badge: 'Step 4: Smelting & Recovery'
    }
  ];

  return (
    <section className="py-20 relative bg-emerald-500/5 dark:bg-charcoal-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Circular Integrity Protocol
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mt-1">
            {t.journey_title}
          </h2>
          <p className="text-base text-gray-600 dark:text-gray-400 mt-2">
            {t.journey_subtitle}
          </p>
        </div>

        {/* Step Selector Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = activeStep === idx;
            return (
              <button
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`p-4 rounded-2xl text-left transition-all border ${
                  isSelected
                    ? 'glass-panel-accent border-emerald-500 shadow-md scale-102 font-bold'
                    : 'glass-panel border-gray-200 dark:border-gray-800 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-center space-x-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-1">
                  <Icon className="w-4 h-4" />
                  <span>{step.badge}</span>
                </div>
                <div className="text-sm font-extrabold text-gray-900 dark:text-white truncate">
                  {step.title.split('. ')[1] || step.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Step Feature Box */}
        <div className="rounded-3xl glass-panel border border-emerald-500/30 overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-10">
          
          <div className="lg:col-span-7 space-y-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {steps[activeStep].badge}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
              {steps[activeStep].title}
            </h3>
            <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              {steps[activeStep].desc}
            </p>

            <div className="pt-4 grid grid-cols-2 gap-3 text-xs text-gray-700 dark:text-gray-300 font-medium">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>100% Traceable Chain-of-Custody</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Serialized Audit Checkpoints</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Digital Handover Certificates</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Zero Hazardous Leakage Policy</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative h-72 sm:h-80 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
            <img
              src={steps[activeStep].image}
              alt={steps[activeStep].title}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-4 text-white text-xs font-semibold">
              Certified Operations Facility
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
