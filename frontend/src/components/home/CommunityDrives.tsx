import React, { useState } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { Trophy, Calendar, Users, Target, ArrowRight, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CommunityDrives: React.FC = () => {
  const { language } = useTranslation();
  const navigate = useNavigate();

  const [activeDrives, setActiveDrives] = useState([
    {
      id: '1',
      title: 'CBIT Hyderabad Zero-E-Waste Campus Drive',
      title_te: 'సి.బి.ఐ.టి హైదరాబాద్ జీరో-ఇ-వేస్ట్ క్యాంపస్ డ్రైవ్',
      org: 'Chaitanya Bharathi Institute of Technology',
      target_kg: 2500,
      collected_kg: 1840,
      participants: 412,
      end_date: '31 Oct 2026',
      badge: 'Gold Tier Campus'
    },
    {
      id: '2',
      title: 'JNTUH College of Engineering Electronics Drive',
      title_te: 'జేఎన్‌టీయూహెచ్ కాలేజ్ ఆఫ్ ఇంజనీరింగ్ కలెక్షన్ డ్రైవ్',
      org: 'Jawaharlal Nehru Technological University',
      target_kg: 3000,
      collected_kg: 2190,
      participants: 580,
      end_date: '15 Nov 2026',
      badge: 'Regional Leader'
    },
    {
      id: '3',
      title: 'Madhapur Resident Welfare Circular Initiative',
      title_te: 'మాదాపూర్ రెసిడెంట్స్ సర్క్యులర్ చొరవ',
      org: 'Madhapur RWA & Cyberabad EcoClub',
      target_kg: 1500,
      collected_kg: 920,
      participants: 230,
      end_date: '05 Nov 2026',
      badge: 'Community Hub'
    }
  ]);

  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5">
              <Trophy className="w-4 h-4" />
              <span>Campus & Community Collective Impact</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mt-1">
              Active Collection Campaigns & Leaderboards
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 max-w-2xl">
              Institutions and residential communities competing to divert maximum e-waste from landfills.
            </p>
          </div>

          <button
            onClick={() => navigate('/organization')}
            className="mt-4 md:mt-0 px-5 py-2.5 rounded-xl border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 self-start md:self-auto"
          >
            <span>Launch Campus Drive</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Drives Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {activeDrives.map((drive) => {
            const percent = Math.min(100, Math.round((drive.collected_kg / drive.target_kg) * 100));
            return (
              <div
                key={drive.id}
                className="rounded-3xl glass-panel p-6 border border-gray-200/80 dark:border-gray-800/80 shadow-lg flex flex-col justify-between hover:border-emerald-500/50 transition-all hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      {drive.badge}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{drive.end_date}</span>
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug">
                    {language === 'te' ? drive.title_te : drive.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {drive.org}
                  </p>

                  {/* Progress Bar */}
                  <div className="mt-5 space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {drive.collected_kg.toLocaleString()} kg collected
                      </span>
                      <span className="text-gray-400">
                        Target: {drive.target_kg.toLocaleString()} kg
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <span className="flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      <span>{drive.participants} contributors</span>
                    </span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">
                      {percent}% Reached
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/schedule', { state: { campaign: drive.title } })}
                  className="mt-6 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-colors flex items-center justify-center space-x-1"
                >
                  <span>Contribute Device to Drive</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
