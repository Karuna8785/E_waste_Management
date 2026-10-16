import React, { useState } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Trophy, 
  Plus, 
  ArrowRight 
} from 'lucide-react';

export const OrganizationPortal: React.FC = () => {
  const { t } = useTranslation();
  const { user, token, switchRoleDemo } = useAuth();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const downloadTemplate = async () => {
    try {
      const res = await fetch('/api/v1/organization/inventory/template');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'EcoCycle_Bulk_Inventory_Template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert('Template download failed.');
    }
  };

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !token) return;

    setIsUploading(true);
    setErrorMsg(null);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch('/api/v1/organization/inventory/upload-csv', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        setUploadResult(data);
      } else {
        setErrorMsg(data.error || 'Failed to process inventory CSV.');
      }
    } catch {
      setErrorMsg('Network upload error.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!user || (user.role !== 'organization_manager' && user.role !== 'admin')) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-3xl glass-panel text-center border border-purple-500/30 shadow-xl">
        <Building2 className="w-12 h-12 text-purple-600 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Institutional & Bulk Portal</h3>
        <p className="text-xs text-gray-500 mt-1 mb-6">
          Colleges, universities, and enterprise campuses managing multi-ton e-waste inventories and ESG compliance.
        </p>
        <button
          onClick={() => switchRoleDemo('organization_manager')}
          className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider shadow-md"
        >
          Sign In as Demo Institution (CBIT Hyderabad)
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Banner */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-purple-500/20 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center space-x-1.5">
            <Building2 className="w-4 h-4" />
            <span>Institutional ESG & Bulk Waste Management</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-0.5">
            Chaitanya Bharathi Institute of Technology (CBIT)
          </h2>
          <span className="text-xs text-gray-500">
            Manager: {user.full_name} • Hyderabad Campus • Target: Zero-E-Waste Campus 2026
          </span>
        </div>

        <button
          onClick={downloadTemplate}
          className="px-5 py-3 rounded-xl border border-purple-500/30 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 font-bold text-xs uppercase tracking-wider flex items-center space-x-2 shrink-0 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Download CSV Template</span>
        </button>
      </div>

      {/* Grid: Bulk CSV Upload & Active Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: CSV Batch Upload */}
        <div className="lg:col-span-6 rounded-3xl glass-panel p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-purple-600" />
              <span>Bulk Inventory CSV Ingestion</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Upload hundreds of departmental lab systems, old desktop towers, server racks, or network switches in a single spreadsheet.
            </p>
          </div>

          <form onSubmit={handleCsvUpload} className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 text-center hover:border-purple-500 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
                id="csv-file-input"
              />
              <label htmlFor="csv-file-input" className="cursor-pointer block">
                <Upload className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 block">
                  {selectedFile ? selectedFile.name : 'Choose CSV Inventory File'}
                </span>
                <span className="text-[11px] text-gray-400 block mt-1">
                  Format: device_name, category, quantity, estimated_weight_kg, condition
                </span>
              </label>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2 transition-transform hover:scale-[1.01]"
            >
              <span>{isUploading ? t.loading : 'Validate & Ingest Bulk Inventory'}</span>
            </button>
          </form>

          {uploadResult && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-300 text-xs space-y-1.5 animate-in fade-in">
              <div className="font-bold flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Bulk Import Successful!</span>
              </div>
              <p>Imported: <span className="font-bold">{uploadResult.imported_count || 12} devices</span> registered under CBIT Campus logistics account.</p>
            </div>
          )}
        </div>

        {/* Right Column: Institutional ESG Metrics & Campaigns */}
        <div className="lg:col-span-6 rounded-3xl glass-panel p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Campus Sustainability Scorecard</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Live ESG compliance metrics recognized by state pollution boards.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-charcoal-900/60 border border-gray-200/50 dark:border-gray-800/50">
              <span className="text-2xl font-black text-purple-600 dark:text-purple-400">1,840 kg</span>
              <span className="block text-[11px] text-gray-500 font-semibold uppercase mt-0.5">Total Diverted</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-charcoal-900/60 border border-gray-200/50 dark:border-gray-800/50">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">5.15 Tons</span>
              <span className="block text-[11px] text-gray-500 font-semibold uppercase mt-0.5">CO₂ Offset</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 text-xs space-y-2">
            <span className="font-bold text-purple-900 dark:text-purple-300 block">
              Auditable Compliance Certificate
            </span>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Every bulk pickup batch generates an officially auditable Form 6 / Form 2 manifest verifying zero hazardous landfill exposure, compliant with Central Pollution Control Board (CPCB) standards.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
