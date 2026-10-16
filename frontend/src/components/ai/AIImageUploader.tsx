import React, { useState, useRef } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { UploadCloud, CheckCircle2, AlertTriangle, Cpu, Sparkles, RefreshCw, Layers } from 'lucide-react';

interface AIImageUploaderProps {
  onAnalysisComplete: (result: any) => void;
}

export const AIImageUploader: React.FC<AIImageUploaderProps> = ({ onAnalysisComplete }) => {
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (file: File) => {
    setSelectedImage(file);
    setErrorMessage(null);
    setAnalysisResult(null);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setImagePreview(uploadEvent.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const runAnalysis = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('image', selectedImage);

    try {
      const response = await fetch('/api/v1/ai/analyze-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Computer Vision analysis failed.');
      }

      setAnalysisResult(data);
      onAnalysisComplete(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to connect to EcoCycle AI service.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl glass-panel p-6 sm:p-8 shadow-xl border border-emerald-500/20">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>EcoCycle-Vision Neural Engine v1.4</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
          {t.ai_title}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {t.ai_subtitle}
        </p>
      </div>

      {/* Upload Box / Drag & Drop */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
          imagePreview 
            ? 'border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/20' 
            : 'border-gray-300 dark:border-gray-700 hover:border-cyan-500 hover:bg-gray-50/50 dark:hover:bg-charcoal-900/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        {imagePreview ? (
          <div className="flex flex-col items-center">
            <div className="relative group max-h-72 overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <img
                src={imagePreview}
                alt="Uploaded device preview"
                className="max-h-64 object-contain mx-auto rounded-xl"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                Click to change image
              </div>
            </div>
            <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Image loaded successfully ({selectedImage?.name})</span>
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
              <UploadCloud className="w-8 h-8" />
            </div>
            <span className="text-base font-semibold text-gray-800 dark:text-gray-200">
              {t.ai_upload_prompt}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
              {t.ai_upload_hint}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {selectedImage && !analysisResult && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-forest-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center space-x-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{t.ai_analyzing}</span>
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4" />
                <span>Analyze Device Now</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Real-time Diagnostics Output */}
      {analysisResult && (
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Category & Confidence Card */}
            <div className="rounded-2xl p-5 bg-white dark:bg-charcoal-900 border border-gray-200 dark:border-gray-800 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t.ai_detected_category}
              </span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-black text-gray-900 dark:text-white">
                  {analysisResult.prediction.predicted_category}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {Math.round(analysisResult.prediction.confidence * 100)}% Match
                </span>
              </div>

              {/* Confidence Bar */}
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 mt-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round(analysisResult.prediction.confidence * 100)}%` }}
                />
              </div>

              {/* Secondary Predictions */}
              {analysisResult.prediction.secondary_predictions?.length > 0 && (
                <div className="mt-4 space-y-1.5 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-[11px] font-semibold text-gray-400 block">Class Probabilities</span>
                  {analysisResult.prediction.secondary_predictions.slice(0, 3).map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>{item.category}</span>
                      <span>{Math.round(item.probability * 100)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Visual Condition Flags */}
            <div className="rounded-2xl p-5 bg-white dark:bg-charcoal-900 border border-gray-200 dark:border-gray-800 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t.ai_visual_flags}
              </span>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 dark:text-gray-300">{t.ai_flag_screen}</span>
                  <span className={`px-2 py-0.5 rounded font-semibold ${
                    analysisResult.prediction.visual_flags.has_cracked_screen 
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' 
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}>
                    {analysisResult.prediction.visual_flags.has_cracked_screen ? 'Detected' : 'Intact'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 dark:text-gray-300">{t.ai_flag_battery}</span>
                  <span className={`px-2 py-0.5 rounded font-semibold ${
                    analysisResult.prediction.visual_flags.has_swollen_battery 
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-pulse' 
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}>
                    {analysisResult.prediction.visual_flags.has_swollen_battery ? 'Hazard Detected' : 'Normal'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 dark:text-gray-300">{t.ai_flag_casing}</span>
                  <span className={`px-2 py-0.5 rounded font-semibold ${
                    analysisResult.prediction.visual_flags.has_missing_casing 
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' 
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}>
                    {analysisResult.prediction.visual_flags.has_missing_casing ? 'Missing' : 'Enclosed'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 dark:text-gray-300">{t.ai_flag_burn}</span>
                  <span className={`px-2 py-0.5 rounded font-semibold ${
                    analysisResult.prediction.visual_flags.has_burn_or_corrosion 
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' 
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}>
                    {analysisResult.prediction.visual_flags.has_burn_or_corrosion ? 'Signs Found' : 'Clean'}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Benchmark Recoverable Minerals */}
          {analysisResult.prediction.benchmark_materials && (
            <div className="rounded-2xl p-5 bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center space-x-2 mb-3">
                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  {t.ai_estimated_metals}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                {Object.entries(analysisResult.prediction.benchmark_materials).map(([key, val]: any) => (
                  <div key={key} className="p-3 rounded-xl bg-white/80 dark:bg-charcoal-900/80 border border-gray-200/50 dark:border-gray-800/50">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {val} {key.includes('grams') ? 'g' : 'kg'}
                    </span>
                    <span className="block text-[11px] text-gray-500 dark:text-gray-400 capitalize mt-0.5">
                      {key.replace('_grams', '').replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
