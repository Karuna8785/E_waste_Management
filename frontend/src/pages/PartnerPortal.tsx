import React, { useEffect, useState } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  Cpu, 
  Layers, 
  Award, 
  CheckCircle2, 
  RefreshCcw, 
  FileDown, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const PartnerPortal: React.FC = () => {
  const { t } = useTranslation();
  const { user, token, switchRoleDemo } = useAuth();

  const [shipments, setShipments] = useState<any[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<any | null>(null);
  const [outcome, setOutcome] = useState('recycled');
  const [materialType, setMaterialType] = useState('copper');
  const [materialQty, setMaterialQty] = useState('14.2');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  const fetchShipments = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/v1/partner/shipments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setShipments(data.shipments || []);
        if (data.shipments?.length > 0 && !selectedShipment) {
          setSelectedShipment(data.shipments[0]);
        }
      }
    } catch {
      // handled
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [token]);

  const handleRecordOutcome = async () => {
    if (!selectedShipment || !token) return;
    setIsProcessing(true);
    setSuccessNote(null);

    try {
      // Log processing outcome
      const res = await fetch(`/api/v1/partner/shipments/${selectedShipment.id}/record-processing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          outcome,
          recovered_materials: [
            { material_type: materialType, quantity: parseFloat(materialQty) || 10.0, unit: 'kg' }
          ]
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessNote(`Shipment ${selectedShipment.manifest_number} successfully processed and certificate issued.`);
        fetchShipments();
      } else {
        alert(data.error || 'Failed to record processing.');
      }
    } catch {
      alert('Network error.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user || (user.role !== 'partner' && user.role !== 'admin')) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-3xl glass-panel text-center border border-blue-500/30 shadow-xl">
        <Building2 className="w-12 h-12 text-blue-600 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Authorized Partner Portal</h3>
        <p className="text-xs text-gray-500 mt-1 mb-6">
          Access facility intake manifests, material recovery ledgers, and digital processing certificates.
        </p>
        <button
          onClick={() => switchRoleDemo('partner')}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-md"
        >
          Sign In as Recycler Partner (TS Recyclers)
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Banner */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-blue-500/20 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center space-x-1.5">
            <Building2 className="w-4 h-4" />
            <span>Authorized Treatment & Refurbishment Facility</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-0.5">
            Telangana State E-Waste Recyclers Hub
          </h2>
          <span className="text-xs text-gray-500">
            CPCB Registration: TS-PCB-EW-2026-081 • Facility Capacity: 4,500 Metric Tons/Year
          </span>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">Pending Inflow</span>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{shipments.length} Batches</span>
        </div>
      </div>

      {successNote && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successNote}</span>
        </div>
      )}

      {/* Grid: Left Shipments Intake, Right Inspection & Recovery Logging */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Intake Batches */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Incoming Logistics Shipments ({shipments.length})
          </h3>

          {shipments.length === 0 ? (
            <div className="p-8 rounded-3xl glass-panel text-center text-xs text-gray-400 border border-gray-200 dark:border-gray-800">
              No pending intake batches awaiting processing.
            </div>
          ) : (
            <div className="space-y-3">
              {shipments.map((s) => {
                const isSelected = selectedShipment?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedShipment(s)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10 shadow-md ring-2 ring-blue-500/20'
                        : 'glass-panel border-gray-200 dark:border-gray-800 hover:border-blue-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400">
                        {s.manifest_number}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        {s.status}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                      Dispatched Weight: <span className="font-bold">{s.total_weight_kg} kg</span> • {s.total_quantity} Devices
                    </div>

                    <div className="mt-2 text-[11px] text-gray-400">
                      Origin Hub: {s.origin_hub_name || 'Hyderabad West Logistics Depot'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Processing & Material Recovery */}
        <div className="lg:col-span-7 space-y-6">
          {selectedShipment && (
            <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-blue-500/30 shadow-xl space-y-6 animate-in fade-in duration-200">
              
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Intake Processing Verification</span>
                  <h4 className="text-xl font-black text-gray-900 dark:text-white">
                    Manifest: {selectedShipment.manifest_number}
                  </h4>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
              </div>

              {/* Pathway Decision */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                  Technical Disposition Pathway
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'recycled', label: 'Material Smelting' },
                    { key: 'repaired', label: 'Refurbishment' },
                    { key: 'reused', label: 'Direct Secondary Market' }
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setOutcome(item.key)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                        outcome === item.key
                          ? 'border-blue-500 bg-blue-500/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Material Recovery Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Primary Extracted Fraction
                  </label>
                  <select
                    value={materialType}
                    onChange={(e) => setMaterialType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-charcoal-900 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="copper">Refined Copper (Grade A)</option>
                    <option value="aluminum">Aluminum Extrusion</option>
                    <option value="plastics">Polymer ABS/PC Regrind</option>
                    <option value="gold_grams">Gold / Precious Traces</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Verified Recovered Quantity (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={materialQty}
                    onChange={(e) => setMaterialQty(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-charcoal-900 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleRecordOutcome}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center space-x-2 transition-transform hover:scale-[1.01]"
              >
                <Award className="w-4 h-4" />
                <span>{isProcessing ? t.loading : 'Issue Certified Recovery Certificate & Update Metrics'}</span>
              </button>

            </div>
          )}
        </div>

      </div>

    </div>
  );
};
