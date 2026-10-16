import React, { useEffect, useState } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { 
  Building2, 
  Cpu, 
  Layers, 
  Award, 
  CheckCircle2, 
  RefreshCcw, 
  FileDown, 
  Sparkles,
  ArrowRight,
  Truck,
  Scale,
  Package,
  Activity,
  ShieldCheck,
  Search,
  Check,
  X,
  FileText,
  AlertTriangle,
  Flame,
  Printer
} from 'lucide-react';

export const RecyclerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') || 'overview';
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const [shipments, setShipments] = useState<any[]>([]);
  const [facilityRequests, setFacilityRequests] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);

  // Selected shipment for intake & reconciliation
  const [selectedShipment, setSelectedShipment] = useState<any | null>(null);
  const [intakeWeight, setIntakeWeight] = useState('');
  const [intakeNotes, setIntakeNotes] = useState('Weighbridge scale verified. Intake bay #2.');
  const [isReceiving, setIsReceiving] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Inspection & Smelting form
  const [selectedReqForProcess, setSelectedReqForProcess] = useState<any | null>(null);
  const [processOutcome, setProcessOutcome] = useState('recycled');
  const [materialType, setMaterialType] = useState('copper');
  const [recoveredQty, setRecoveredQty] = useState('1.8');
  const [isProcessing, setIsProcessing] = useState(false);

  // Printable Certificate Modal
  const [viewingCertificate, setViewingCertificate] = useState<any | null>(null);

  const fetchRecyclerData = async () => {
    if (!token) return;
    try {
      // 1. Shipments
      const resShip = await fetch('/api/v1/partner/shipments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resShip.ok) {
        const sData = await resShip.json();
        setShipments(sData.shipments || []);
        if (sData.shipments?.length > 0 && !selectedShipment) {
          setSelectedShipment(sData.shipments[0]);
          setIntakeWeight(String(sData.shipments[0].total_declared_weight_kg || '10.5'));
        }
      }

      // 2. Facility requests
      const resReq = await fetch('/api/v1/partner/requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resReq.ok) {
        const rData = await resReq.json();
        setFacilityRequests(rData.requests || []);
      }

      // 3. Certificates
      const resCert = await fetch('/api/v1/partner/certificates', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resCert.ok) {
        const cData = await resCert.json();
        setCertificates(cData.certificates || []);
      }

      // 4. Stats
      const resStats = await fetch('/api/v1/partner/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resStats.ok) {
        const stData = await resStats.json();
        setStats(stData.stats);
      }
    } catch (err) {
      console.error('Recycler data fetch error', err);
    }
  };

  useEffect(() => {
    fetchRecyclerData();
  }, [token]);

  // Handle Shipment Intake & Reconciliation
  const handleReceiveShipment = async (status: 'received' | 'rejected') => {
    if (!selectedShipment || !token) return;
    setIsReceiving(true);
    try {
      const res = await fetch(`/api/v1/partner/shipments/${selectedShipment.id}/receive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status,
          actual_received_weight_kg: parseFloat(intakeWeight) || selectedShipment.total_declared_weight_kg,
          receiving_notes: intakeNotes
        })
      });
      if (res.ok) {
        setActionSuccess(`Shipment ${selectedShipment.shipment_code} updated to ${status.toUpperCase()}!`);
        fetchRecyclerData();
      }
    } catch {
      alert('Error updating shipment status');
    } finally {
      setIsReceiving(false);
    }
  };

  // Handle Inspection Triage & Smelting
  const handleProcessDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReqForProcess || !token) return;
    setIsProcessing(true);

    try {
      const res = await fetch(`/api/v1/partner/process-request/${selectedReqForProcess.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          outcome: processOutcome,
          material_recoveries: [
            { material_type: materialType, quantity: parseFloat(recoveredQty) || 1.0, unit: 'kg' }
          ]
        })
      });
      const data = await res.json();
      if (res.ok) {
        setActionSuccess(`Device ${selectedReqForProcess.request_code} processed (${processOutcome}). Certification generated!`);
        setSelectedReqForProcess(null);
        fetchRecyclerData();
      } else {
        alert(data.error || 'Failed to record processing');
      }
    } catch {
      alert('Network error recording processing');
    } finally {
      setIsProcessing(false);
    }
  };

  // Issue Certificate
  const handleIssueCert = async (reqId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/v1/partner/issue-certificate/${reqId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setViewingCertificate(data.certificate);
        fetchRecyclerData();
      }
    } catch {
      alert('Certificate issue error');
    }
  };

  const recyclerTabs = [
    { id: 'overview', label: 'Facility Overview', icon: Building2 },
    { id: 'shipments', label: 'Incoming Shipments', icon: Truck },
    { id: 'reconciliation', label: 'Weighbridge Intake', icon: Scale },
    { id: 'inspection', label: 'Inspection Workbench', icon: Activity },
    { id: 'refurbishment', label: 'Refurbishment Hub', icon: RefreshCcw },
    { id: 'processing', label: 'Smelting & Recovery', icon: Flame },
    { id: 'certificates', label: 'Destruction Certificates', icon: Award },
    { id: 'profile', label: 'Facility License & CPCB', icon: ShieldCheck },
  ];

  const pendingInspection = facilityRequests.filter(r => r.status !== 'completed');
  const completedDevices = facilityRequests.filter(r => r.status === 'completed');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Industrial Facility Banner */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-blue-500/20 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden bg-gradient-to-r from-blue-950/20 via-transparent to-cyan-950/10">
        <div className="space-y-1 z-10">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center space-x-1">
              <Cpu className="w-3 h-3 text-blue-500" />
              <span>Certified Recycling Plant Facility</span>
            </span>
            <span className="text-xs text-gray-400 font-mono">CPCB / TSPCB Registered Facility</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
            Telangana Green E-Waste Dismantling & Refining Facility
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xl">
            Cherlapally IDA Industrial Facility • Heavy e-waste sorting, hydrometallurgical leaching, circuit board smelting, and circular refurbishment workbench.
          </p>
        </div>

        {/* Live Facility KPI Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto z-10">
          <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-charcoal-900/60 border border-blue-500/20 text-center">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Monthly Capacity</span>
            <span className="text-xl font-black text-blue-600">120 MT</span>
            <span className="text-[10px] text-gray-400 block">Authorized Limit</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-charcoal-900/60 border border-blue-500/20 text-center">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Processed Weight</span>
            <span className="text-xl font-black text-emerald-600">{stats?.total_weight_processed_kg || '14.5'} kg</span>
            <span className="text-[10px] text-gray-400 block">Certified Neutralized</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-charcoal-900/60 border border-blue-500/20 text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Certificates</span>
            <span className="text-xl font-black text-purple-600">{certificates.length || 1}</span>
            <span className="text-[10px] text-gray-400 block">SHA-256 Verified</span>
          </div>
        </div>
      </div>

      {/* Recycler Sub-Navigation Bar */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-gray-200 dark:border-gray-800">
        {recyclerTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-charcoal-900'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)}>✕</button>
        </div>
      )}

      {/* TAB 1: FACILITY OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl glass-panel border border-gray-200 dark:border-gray-800">
              <span className="text-xs text-gray-400 uppercase font-bold block">Incoming Shipments</span>
              <span className="text-2xl font-black text-gray-900 dark:text-white mt-1 block">{shipments.length}</span>
              <span className="text-[11px] text-blue-600 font-semibold">Active Collector Manifests</span>
            </div>
            <div className="p-5 rounded-2xl glass-panel border border-amber-500/20">
              <span className="text-xs text-amber-500 uppercase font-bold block">Awaiting Triage</span>
              <span className="text-2xl font-black text-amber-600 mt-1 block">{pendingInspection.length}</span>
              <span className="text-[11px] text-gray-400">At Quarantine Bay</span>
            </div>
            <div className="p-5 rounded-2xl glass-panel border border-emerald-500/20">
              <span className="text-xs text-emerald-500 uppercase font-bold block">Material Yield Rate</span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">94.8%</span>
              <span className="text-[11px] text-gray-400">Recovered vs Residue Slag</span>
            </div>
            <div className="p-5 rounded-2xl glass-panel border border-gray-200 dark:border-gray-800">
              <span className="text-xs text-gray-400 uppercase font-bold block">TSPCB License</span>
              <span className="text-2xl font-black text-purple-600 mt-1 block">Valid</span>
              <span className="text-[11px] text-gray-400">Expires March 2029</span>
            </div>
          </div>

          {/* Quick Shipments and Triage Queues */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl glass-panel border border-gray-200 dark:border-gray-800 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-blue-500" />
                  <span>Recent Intake Manifests</span>
                </h3>
                <button onClick={() => setActiveTab('shipments')} className="text-xs text-blue-600 hover:underline">
                  View All
                </button>
              </div>
              <div className="space-y-2">
                {shipments.map(s => (
                  <div key={s.id} className="p-3 rounded-xl bg-gray-50 dark:bg-charcoal-900 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-mono font-bold text-blue-600">{s.shipment_code}</span>
                      <span className="text-gray-400 block text-[11px]">{s.vehicle_number} • {s.total_declared_weight_kg} kg declared</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full uppercase text-[10px] font-bold bg-blue-500/10 text-blue-600">
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-3xl glass-panel border border-gray-200 dark:border-gray-800 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span>Devices in Facility Queue</span>
                </h3>
                <button onClick={() => setActiveTab('inspection')} className="text-xs text-emerald-600 hover:underline">
                  Launch Workbench
                </button>
              </div>
              <div className="space-y-2">
                {facilityRequests.map(r => (
                  <div key={r.id} className="p-3 rounded-xl bg-gray-50 dark:bg-charcoal-900 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white">{r.device_name}</span>
                      <span className="text-gray-400 block text-[11px]">{r.request_code} • {r.actual_weight_kg || 1.0} kg</span>
                    </div>
                    <button
                      onClick={() => { setSelectedReqForProcess(r); setActiveTab('inspection'); }}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-bold"
                    >
                      Inspect
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INCOMING SHIPMENTS */}
      {activeTab === 'shipments' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Collector Transport Manifests ({shipments.length})</h3>
          <div className="rounded-3xl glass-panel border border-gray-200 dark:border-gray-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 dark:bg-charcoal-900 uppercase text-[10px] text-gray-400 font-bold">
                <tr>
                  <th className="px-4 py-3">Manifest #</th>
                  <th className="px-4 py-3">Vehicle #</th>
                  <th className="px-4 py-3">Declared Weight</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {shipments.map(s => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">{s.shipment_code}</td>
                    <td className="px-4 py-3 font-semibold">{s.vehicle_number}</td>
                    <td className="px-4 py-3">{s.total_declared_weight_kg} kg</td>
                    <td className="px-4 py-3">{s.total_items_count} units</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full uppercase text-[10px] font-bold bg-blue-500/10 text-blue-600">
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => { setSelectedShipment(s); setActiveTab('reconciliation'); }}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-[11px]"
                      >
                        Weighbridge Check
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: RECEIVING & RECONCILIATION */}
      {activeTab === 'reconciliation' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Weighbridge Intake & Reconciliation
            </h3>
            <p className="text-xs text-gray-500">Reconcile declared collector weight against physical facility weighbridge scales before inventory admission.</p>
          </div>

          {selectedShipment ? (
            <div className="p-6 rounded-3xl glass-panel border border-blue-500/20 space-y-4">
              <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-900 dark:text-blue-200 text-xs">
                <strong>Manifest:</strong> {selectedShipment.shipment_code} • Vehicle: {selectedShipment.vehicle_number}
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-charcoal-900">
                  <span className="text-gray-400 block">Declared Collector Weight:</span>
                  <span className="text-base font-bold text-gray-900 dark:text-white">{selectedShipment.total_declared_weight_kg} kg</span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-charcoal-900">
                  <span className="text-gray-400 block">Batch Items Count:</span>
                  <span className="text-base font-bold text-gray-900 dark:text-white">{selectedShipment.total_items_count} units</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase text-gray-400">
                  Facility Weighbridge Measured Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={intakeWeight}
                  onChange={(e) => setIntakeWeight(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-charcoal-900/70 text-sm font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase text-gray-400">Intake Bay & Condition Notes</label>
                <textarea
                  rows={2}
                  value={intakeNotes}
                  onChange={(e) => setIntakeNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-charcoal-900/70 text-xs"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleReceiveShipment('rejected')}
                  className="flex-1 py-3 rounded-xl border border-red-500/30 text-red-600 font-bold text-xs"
                >
                  Flag Discrepancy / Reject
                </button>
                <button
                  type="button"
                  onClick={() => handleReceiveShipment('received')}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20"
                >
                  Accept & Admit to Quarantine
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-gray-400 glass-panel rounded-3xl">
              Select a manifest to reconcile weighbridge figures.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: INSPECTION WORKBENCH */}
      {activeTab === 'inspection' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Device Diagnostic & Triage Workbench</h3>
            <p className="text-xs text-gray-500">Inspect device batches, assess motherboard condition, and designate circular route.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 space-y-2">
              <span className="text-xs font-bold uppercase text-gray-400 block mb-2">Awaiting Triage ({facilityRequests.length})</span>
              {facilityRequests.map(req => (
                <div
                  key={req.id}
                  onClick={() => setSelectedReqForProcess(req)}
                  className={`p-3.5 rounded-2xl border cursor-pointer text-xs transition-all ${
                    selectedReqForProcess?.id === req.id
                      ? 'border-blue-500 bg-blue-500/10 font-bold'
                      : 'glass-panel border-gray-200 dark:border-gray-800 hover:border-blue-500/30'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-blue-600">{req.request_code}</span>
                    <span className="capitalize text-gray-500">{req.status?.replace(/_/g, ' ')}</span>
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white mt-0.5">{req.device_name}</h4>
                </div>
              ))}
            </div>

            <div className="lg:col-span-7">
              {selectedReqForProcess ? (
                <form onSubmit={handleProcessDevice} className="p-6 rounded-3xl glass-panel border border-blue-500/20 space-y-4">
                  <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-900 dark:text-blue-200 text-xs">
                    <strong>Inspecting:</strong> {selectedReqForProcess.request_code} • {selectedReqForProcess.device_name}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase text-gray-400">Designated Outcome</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {['recycled', 'repaired', 'reused', 'haz_neutralized'].map((out) => (
                        <button
                          type="button"
                          key={out}
                          onClick={() => setProcessOutcome(out)}
                          className={`p-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                            processOutcome === out
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                              : 'bg-gray-50 dark:bg-charcoal-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-800'
                          }`}
                        >
                          {out.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase text-gray-400">Primary Material Yield</label>
                      <select
                        value={materialType}
                        onChange={(e) => setMaterialType(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-charcoal-900 text-xs font-semibold"
                      >
                        <option value="copper">Refined Copper (Cu)</option>
                        <option value="gold">Precious Gold (Au)</option>
                        <option value="palladium">Palladium (Pd)</option>
                        <option value="aluminum">Aluminum (Al)</option>
                        <option value="lithium">Lithium Carbonate</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase text-gray-400">Recovered Yield (kg/g)</label>
                      <input
                        type="number"
                        step="0.05"
                        value={recoveredQty}
                        onChange={(e) => setRecoveredQty(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-charcoal-900 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center space-x-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isProcessing ? 'Processing...' : 'Complete Triage & Issue Certificate'}</span>
                  </button>
                </form>
              ) : (
                <div className="p-8 text-center text-xs text-gray-400 glass-panel rounded-3xl">
                  Select a device from the left queue to begin diagnostic triage.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: REFURBISHMENT HUB */}
      {activeTab === 'refurbishment' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Circular Refurbishment & Component Repair</h3>
          <p className="text-xs text-gray-500">Laptops, monitors, and system units undergoing component replacement for eco-marketplace listing.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl glass-panel space-y-2">
              <span className="text-xs font-bold text-blue-600">REFURB-TEST-01</span>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">Dell Latitude 5420 Laptop</h4>
              <p className="text-xs text-gray-400">Battery pack replaced with certified OEM cell. Passed 24-hr diagnostic burn-in.</p>
              <div className="pt-2 flex justify-between items-center text-xs">
                <span className="text-emerald-600 font-bold">Tested & Functional</span>
                <span className="font-semibold text-gray-500">Ready for Marketplace</span>
              </div>
            </div>
            <div className="p-5 rounded-2xl glass-panel space-y-2">
              <span className="text-xs font-bold text-amber-600">REFURB-TEST-02</span>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">LG 24-inch IPS LED Monitor</h4>
              <p className="text-xs text-gray-400">Power supply electrolytic capacitors replaced. Color accuracy calibrated.</p>
              <div className="pt-2 flex justify-between items-center text-xs">
                <span className="text-amber-600 font-bold">Burn-in 12 hrs</span>
                <span className="font-semibold text-gray-500">Pending Safety Tag</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SMELTING & RECOVERY */}
      {activeTab === 'processing' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Hydrometallurgical Refining & Precious Metal Yields</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl glass-panel text-center">
              <span className="text-xs text-gray-400 uppercase font-bold block">Refined Copper (Cu)</span>
              <span className="text-3xl font-black text-amber-600 mt-1 block">14.2 kg</span>
              <span className="text-[11px] text-gray-500">Smelted to 99.8% industrial purity</span>
            </div>
            <div className="p-5 rounded-2xl glass-panel text-center">
              <span className="text-xs text-gray-400 uppercase font-bold block">Gold Recovered (Au)</span>
              <span className="text-3xl font-black text-amber-500 mt-1 block">8.4 g</span>
              <span className="text-[11px] text-gray-500">PCB edge connector chemical leaching</span>
            </div>
            <div className="p-5 rounded-2xl glass-panel text-center">
              <span className="text-xs text-gray-400 uppercase font-bold block">Residual Slag Diverted</span>
              <span className="text-3xl font-black text-emerald-600 mt-1 block">99.2%</span>
              <span className="text-[11px] text-gray-500">Zero toxic landfill runoff</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: CERTIFICATES & REPORTS */}
      {activeTab === 'certificates' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Official E-Waste Destruction & Recycling Certificates ({certificates.length})
          </h3>
          <div className="rounded-3xl glass-panel border border-gray-200 dark:border-gray-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 dark:bg-charcoal-900 uppercase text-[10px] text-gray-400 font-bold">
                <tr>
                  <th className="px-4 py-3">Certificate #</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Certified Weight</th>
                  <th className="px-4 py-3">Digital Verification Hash</th>
                  <th className="px-4 py-3 text-right">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {certificates.map(cert => (
                  <tr key={cert.id}>
                    <td className="px-4 py-3 font-mono font-bold text-purple-600">{cert.certificate_number}</td>
                    <td className="px-4 py-3 font-semibold">{cert.processing_method}</td>
                    <td className="px-4 py-3">{cert.total_weight_kg} kg</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-gray-400 truncate max-w-xs">{cert.digital_signature_hash}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setViewingCertificate(cert)}
                        className="px-2.5 py-1.5 rounded-lg bg-purple-600 text-white font-bold text-[11px] flex items-center space-x-1 ml-auto"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>View PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable Certificate Modal */}
      {viewingCertificate && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white dark:bg-charcoal-950 rounded-3xl p-8 border border-purple-500/30 shadow-2xl space-y-6 text-gray-900 dark:text-white">
            <div className="text-center space-y-2 border-b pb-4 border-gray-200 dark:border-gray-800">
              <Award className="w-12 h-12 text-purple-600 mx-auto" />
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 block">Government of Telangana Pollution Control Board (TSPCB)</span>
              <h3 className="text-xl font-black">Official Certificate of E-Waste Recycling</h3>
              <span className="font-mono text-xs font-bold text-gray-500">{viewingCertificate.certificate_number}</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b pb-2 border-gray-100 dark:border-gray-800">
                <span className="text-gray-400">Certified Facility:</span>
                <span className="font-bold">Telangana Green Dismantling & Refining Facility</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-gray-100 dark:border-gray-800">
                <span className="text-gray-400">Total Net Weight:</span>
                <span className="font-bold">{viewingCertificate.total_weight_kg} kg</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-gray-100 dark:border-gray-800">
                <span className="text-gray-400">Destruction Method:</span>
                <span className="font-bold">{viewingCertificate.processing_method}</span>
              </div>
              <div className="space-y-1 pt-1">
                <span className="text-gray-400 block text-[10px]">Cryptographic SHA-256 Ledger Hash:</span>
                <span className="font-mono text-[9px] bg-gray-100 dark:bg-charcoal-900 p-2 rounded-lg block break-all text-gray-600 dark:text-gray-400">
                  {viewingCertificate.digital_signature_hash}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setViewingCertificate(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold flex items-center space-x-1"
              >
                <Printer className="w-4 h-4" />
                <span>Print Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: PROFILE */}
      {activeTab === 'profile' && (
        <div className="max-w-xl mx-auto p-6 rounded-3xl glass-panel border border-blue-500/20 space-y-4">
          <div className="flex items-center space-x-3">
            <Building2 className="w-10 h-10 text-blue-500" />
            <div>
              <h4 className="text-base font-bold text-gray-900 dark:text-white">Facility Compliance Record</h4>
              <span className="text-xs text-gray-400">Cherlapally IDA Industrial Estate, Hyderabad</span>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-charcoal-900">
              <span className="text-gray-400">CPCB/TSPCB Registration:</span>
              <span className="font-mono font-bold text-emerald-600">TSPCB-EW-RO-HYD-2026-0814</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-charcoal-900">
              <span className="text-gray-400">Monthly Permitted Capacity:</span>
              <span className="font-bold">120.0 Metric Tons</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
