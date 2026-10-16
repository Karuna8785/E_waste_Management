import React, { useState } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { useLocation } from 'react-router-dom';
import { AIImageUploader } from '../components/ai/AIImageUploader';
import { ConditionQuestionnaire } from '../components/ai/ConditionQuestionnaire';
import { Cpu, Sparkles, HelpCircle } from 'lucide-react';

export const IdentifyPage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    (location.state as any)?.preselectedCategory || 'Mobile Phone'
  );

  const handleAnalysisComplete = (data: any) => {
    setAiAnalysis(data);
    if (data.prediction?.predicted_category) {
      setSelectedCategory(data.prediction.predicted_category);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      {/* Page Title */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Automated Vision Diagnostics</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">
          Show Us Your Old Electronics
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          Upload a clear photograph of your device. Our neural model identifies the category, detects hazards like swollen batteries or cracked screens, and estimates potential metal recovery.
        </p>
      </div>

      {/* AI Image Uploader */}
      <AIImageUploader onAnalysisComplete={handleAnalysisComplete} />

      {/* Condition Questionnaire Section */}
      <div className="pt-4">
        <ConditionQuestionnaire 
          category={selectedCategory}
          visualFlags={aiAnalysis?.prediction?.visual_flags}
          aiRecord={aiAnalysis}
        />
      </div>

    </div>
  );
};
