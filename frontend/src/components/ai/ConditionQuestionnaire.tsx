import React, { useState } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { Check, X, AlertTriangle, ArrowRight, Sparkles, RefreshCcw, ShieldCheck, HeartHandshake, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ConditionQuestionnaireProps {
  category: string;
  visualFlags?: any;
  aiRecord?: any;
}

export const ConditionQuestionnaire: React.FC<ConditionQuestionnaireProps> = ({ 
  category, 
  visualFlags = {},
  aiRecord
}) => {
  const { t, language } = useTranslation();
  const navigate = useNavigate();

  const [answers, setAnswers] = useState({
    powers_on: true,
    screen_damaged: false,
    components_missing: false,
    battery_swollen: false,
    physically_broken: false,
    suitable_for_reuse: true,
  });

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [recommendationResult, setRecommendationResult] = useState<any | null>(null);

  const toggleAnswer = (key: keyof typeof answers) => {
    setAnswers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const calculateRecommendation = async () => {
    setIsEvaluating(true);
    try {
      const res = await fetch('/api/v1/ai/recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          questionnaire: answers,
          visual_flags: visualFlags
        })
      });

      const data = await res.json();
      setRecommendationResult(data);
    } catch {
      // Fallback local rules engine
      let rec = 'recycle';
      if (answers.battery_swollen) {
        rec = 'manual_inspection';
      } else if (answers.powers_on && !answers.screen_damaged && answers.suitable_for_reuse) {
        rec = 'reuse';
      } else if (answers.powers_on) {
        rec = 'repair';
      }
      setRecommendationResult({
        recommendation: rec,
        safety_flag: answers.battery_swollen,
        reasoning_en: "Assessed based on power state and physical integrity.",
        reasoning_te: "పవర్ మరియు భౌతిక సమగ్రత ఆధారంగా విశ్లేషించబడింది."
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const getRecBadge = (rec: string) => {
    switch (rec) {
      case 'reuse':
        return {
          title: t.rec_reuse,
          icon: HeartHandshake,
          color: 'from-emerald-500 to-teal-600',
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
        };
      case 'repair':
        return {
          title: t.rec_repair,
          icon: Wrench,
          color: 'from-blue-500 to-indigo-600',
          bg: 'bg-blue-500/10 border-blue-500/30 text-blue-800 dark:text-blue-300'
        };
      case 'manual_inspection':
        return {
          title: t.rec_inspection,
          icon: AlertTriangle,
          color: 'from-rose-500 to-amber-600',
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
        };
      default:
        return {
          title: t.rec_recycle,
          icon: RefreshCcw,
          color: 'from-emerald-600 to-forest-700',
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
        };
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl glass-panel p-6 sm:p-8 shadow-xl border border-emerald-500/20 mt-8">
      
      {/* Title */}
      <div className="mb-6">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          {t.questionnaire_title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {t.questionnaire_subtitle}
        </p>
      </div>

      {/* Questions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { key: 'powers_on', text: t.q_powers_on, positive: true },
          { key: 'screen_damaged', text: t.q_screen_damaged, positive: false },
          { key: 'components_missing', text: t.q_components_missing, positive: false },
          { key: 'battery_swollen', text: t.q_battery_swollen, positive: false, hazard: true },
          { key: 'physically_broken', text: t.q_physically_broken, positive: false },
          { key: 'suitable_for_reuse', text: t.q_suitable_for_reuse, positive: true },
        ].map((item) => {
          const isYes = answers[item.key as keyof typeof answers];
          return (
            <div
              key={item.key}
              onClick={() => toggleAnswer(item.key as keyof typeof answers)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between select-none ${
                isYes
                  ? item.hazard 
                    ? 'border-rose-500/40 bg-rose-500/10'
                    : 'border-emerald-500/40 bg-emerald-500/10'
                  : 'border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-charcoal-900/50 hover:border-gray-300'
              }`}
            >
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200 pr-3">
                {item.text}
              </span>
              <div
                className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors shrink-0 ${
                  isYes 
                    ? item.hazard ? 'bg-rose-500' : 'bg-emerald-600' 
                    : 'bg-gray-300 dark:bg-gray-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    isYes ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Calculate Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={calculateRecommendation}
          disabled={isEvaluating}
          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-all flex items-center space-x-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isEvaluating ? t.loading : t.btn_get_recommendation}</span>
        </button>
      </div>

      {/* Recommendation Card */}
      {recommendationResult && (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {recommendationResult.safety_flag && (
            <div className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{t.rec_safety_warning}</span>
            </div>
          )}

          {(() => {
            const badge = getRecBadge(recommendationResult.recommendation);
            const Icon = badge.icon;
            return (
              <div className={`p-6 rounded-2xl border ${badge.bg} flex flex-col md:flex-row items-center justify-between gap-6`}>
                <div className="flex items-center space-x-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${badge.color} text-white flex items-center justify-center shadow-lg shrink-0`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider block opacity-75">
                      Suggested Pathway
                    </span>
                    <h4 className="text-xl font-extrabold mt-0.5">
                      {badge.title}
                    </h4>
                    <p className="text-xs mt-1 leading-relaxed opacity-90 max-w-xl">
                      {language === 'te' 
                        ? (recommendationResult.reasoning_te || recommendationResult.reasoning_en)
                        : recommendationResult.reasoning_en}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    navigate('/schedule', { 
                      state: { 
                        category, 
                        recommendation: recommendationResult.recommendation,
                        aiRecord: aiRecord || null,
                        answers
                      } 
                    });
                  }}
                  className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center space-x-2 shrink-0 transition-transform hover:scale-105"
                >
                  <span>{t.btn_schedule}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })()}

        </div>
      )}

    </div>
  );
};
