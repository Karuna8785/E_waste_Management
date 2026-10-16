import React, { useEffect, useState } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { 
  Building2, 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Trophy, 
  Plus, 
  ArrowRight,
  Package,
  Calendar,
  Layers,
  Sparkles,
  Leaf,
  Users,
  Clock,
  FileText,
  TrendingUp,
  MapPin,
  Check,
  Send
} from 'lucide-react';

export const CampusDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') || 'overview';
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const [departments, setDepartments] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  // Bulk CSV Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Bulk Pickup Scheduling State
  const [pickupDate, setPickupDate] = useState('');
  const [pickupSlot, setPickupSlot] = useState('10:00 - 13:00');
  const [selectedDept, setSelectedDept] = useState('Computer Science & Engineering (CSE)');
  const [instructions, setInstructions] = useState('Obsolete CRT monitors and Intel Core 2 Duo systems from Lab 3.');
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);

  const fetchCampusData = async () => {
    if (!token) return;
    try {
      // 1. Departments
      const resDept = await fetch('/api/v1/organization/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resDept.ok) {
        const dData = await resDept.json();
        setDepartments(dData.departments || []);
      }

      // 2. Inventory
      const resInv = await fetch('/api/v1/organization/inventory', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resInv.ok) {
        const iData = await resInv.json();
        setInventory(iData.inventory || []);
      }

      // 3. Campaigns
      const resCamp = await fetch('/api/v1/organization/campaigns', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resCamp.ok) {
        const cData = await resCamp.json();
        setCampaigns(cData.campaigns || []);
      }
    } catch (err) {
      console.error('Campus data fetch error', err);
    }
  };

  useEffect(() => {
    fetchCampusData();
  }, [token]);

  // CSV Template Download
  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch('/api/v1/organization/bulk-template');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'CBIT_Bulk_Ewaste_Inventory_Template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert('Template download failed');
    }
  };

  // CSV Upload
  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !token) return;
    setIsUploading(true);
    setUploadError(null);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch('/api/v1/organization/bulk-upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setUploadResult(data);
        fetchCampusData();
      } else {
        setUploadError(data.error || 'Failed to parse CSV file');
      }
    } catch {
      setUploadError('Network error uploading CSV');
    } finally {
      setIsUploading(false);
    }
  };

  // Bulk Pickup Schedule
  const handleBulkPickupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsScheduling(true);
    setScheduleSuccess(null);

    try {
      const res = await fetch('/api/v1/organization/schedule-bulk-pickup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          pickup_date: pickupDate,
          time_slot: pickupSlot,
          department: selectedDept,
          special_instructions: instructions,
          estimated_weight_kg: 240.0
        })
      });
      const data = await res.json();
      if (res.ok) {
        setScheduleSuccess(`Bulk pickup scheduled! Collector dispatch notified for ${pickupDate}.`);
        fetchCampusData();
      } else {
        alert(data.error || 'Failed to schedule');
      }
    } catch {
      alert('Network error scheduling bulk pickup');
    } finally {
      setIsScheduling(false);
    }
  };

  const campusTabs = [
    { id: 'overview', label: 'Campus Overview', icon: Building2 },
    { id: 'departments', label: 'Department Submissions', icon: Users },
    { id: 'inventory', label: 'E-Waste Asset Ledger', icon: Package },
    { id: 'csv-upload', label: 'Bulk CSV Ingestion', icon: FileSpreadsheet },
    { id: 'campaigns', label: 'Collection Drives', icon: Trophy },
    { id: 'bulk-pickup', label: 'Schedule Bulk Pickup', icon: Calendar },
    { id: 'sustainability', label: 'ESG Sustainability', icon: Leaf },
    { id: 'settings', label: 'Institution Settings', icon: Building2 },
  ];

  const totalDeptKg = departments.reduce((acc, d) => acc + (d.submitted_kg || 0), 0);
  const totalAssets = departments.reduce((acc, d) => acc + (d.active_assets || 0), 0);
  const co2OffsetKg = Math.round(totalDeptKg * 2.8 * 10) / 10;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* CBIT Institutional Header */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-purple-500/20 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden bg-gradient-to-r from-purple-950/20 via-transparent to-emerald-950/10">
        <div className="space-y-1 z-10">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center space-x-1">
              <Building2 className="w-3 h-3 text-purple-500" />
              <span>Higher Education Institution Portal</span>
            </span>
            <span className="text-xs text-gray-400 font-mono">Reg: CBIT-HYD-TS-1979</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
            Chaitanya Bharathi Institute of Technology (CBIT)
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xl">
            Gandipet, Hyderabad • Institutional E-Waste Governance, Departmental Laboratories Clearance, Student Circular Economy Hackathons & NAAC/NIRF ESG Scorecards.
          </p>
        </div>

        {/* Live ESG Aggregate Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto z-10">
          <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-charcoal-900/60 border border-purple-500/20 text-center">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Campus E-Waste</span>
            <span className="text-xl font-black text-purple-600">{totalDeptKg.toFixed(1)} kg</span>
            <span className="text-[10px] text-gray-400 block">{totalAssets} Logged Assets</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-charcoal-900/60 border border-purple-500/20 text-center">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">CO2e Diverted</span>
            <span className="text-xl font-black text-emerald-600">{co2OffsetKg} kg</span>
            <span className="text-[10px] text-gray-400 block">Certified Net Zero</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-charcoal-900/60 border border-purple-500/20 text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Departments</span>
            <span className="text-xl font-black text-cyan-600">{departments.length || 6}</span>
            <span className="text-[10px] text-gray-400 block">Active Co-ordinators</span>
          </div>
        </div>
      </div>

      {/* Campus Sub-Navigation Bar */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-gray-200 dark:border-gray-800">
        {campusTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-charcoal-900'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: CAMPUS OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl glass-panel border border-purple-500/20 space-y-1">
              <span className="text-xs text-gray-400 uppercase font-bold">Participating Laboratories</span>
              <span className="text-2xl font-black text-gray-900 dark:text-white block">18 Labs Active</span>
              <span className="text-[11px] text-purple-600">CSE, ECE, IT, Robotics, Central Library</span>
            </div>

            <div className="p-5 rounded-2xl glass-panel border border-emerald-500/20 space-y-1">
              <span className="text-xs text-gray-400 uppercase font-bold">Collection Drives Run</span>
              <span className="text-2xl font-black text-emerald-600 block">4 Campus Campaigns</span>
              <span className="text-[11px] text-gray-500">Upcoming: CBIT GreenTech Drive 2026</span>
            </div>

            <div className="p-5 rounded-2xl glass-panel border border-cyan-500/20 space-y-1">
              <span className="text-xs text-gray-400 uppercase font-bold">Authorized Refiner</span>
              <span className="text-2xl font-black text-cyan-600 block">Telangana Green</span>
              <span className="text-[11px] text-gray-500">TSPCB Licensed Cherlapally Facility</span>
            </div>
          </div>

          {/* Department Leaderboard */}
          <div className="p-6 rounded-3xl glass-panel border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>Departmental Sustainability Leaderboard</span>
              </h3>
              <button onClick={() => setActiveTab('departments')} className="text-xs text-purple-600 hover:underline">
                Manage Departments
              </button>
            </div>

            <div className="space-y-2">
              {departments.map((dept, index) => (
                <div key={dept.id} className="p-4 rounded-2xl bg-gray-50 dark:bg-charcoal-900/60 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-purple-500/10 text-purple-600 font-bold flex items-center justify-center">
                      #{index + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">{dept.name}</h4>
                      <span className="text-gray-400 text-[11px]">Coordinator: {dept.coordinator}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600 block text-sm">{dept.submitted_kg} kg</span>
                    <span className="text-gray-400 text-[10px]">{dept.active_assets} units logged</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DEPARTMENT MANAGEMENT */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Participating Departments & Coordinators</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departments.map(dept => (
              <div key={dept.id} className="p-5 rounded-3xl glass-panel border border-purple-500/20 space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">{dept.name}</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                    Active
                  </span>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Coordinator: <strong>{dept.coordinator}</strong></div>
                  <div>Logged Inventory: <strong>{dept.active_assets} units</strong></div>
                  <div>Total Submitted: <strong>{dept.submitted_kg} kg</strong></div>
                  <div>Drives Participated: <strong>{dept.drives_participated}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: E-WASTE ASSET LEDGER */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Campus Institutional Asset Register ({inventory.length})</h3>
              <p className="text-xs text-gray-500">Laboratory computer systems, projectors, laser printers, and network switches.</p>
            </div>
            <button
              onClick={() => setActiveTab('csv-upload')}
              className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center space-x-1"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Bulk Ingest CSV</span>
            </button>
          </div>

          <div className="rounded-3xl glass-panel border border-gray-200 dark:border-gray-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 dark:bg-charcoal-900 uppercase text-[10px] text-gray-400 font-bold">
                <tr>
                  <th className="px-4 py-3">Asset Code</th>
                  <th className="px-4 py-3">Device / Equipment</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Est. Weight</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {inventory.map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-mono font-bold text-purple-600">{item.request_code}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900 dark:text-white">{item.device_name}</div>
                      <div className="text-[11px] text-gray-400 truncate max-w-xs">{item.device_description}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold">{item.quantity} units</td>
                    <td className="px-4 py-3">{item.estimated_weight_kg} kg</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full uppercase text-[10px] font-bold bg-gray-100 dark:bg-charcoal-900">
                        {item.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-600 uppercase">{item.recommendation || 'Recycle'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: BULK CSV INGESTION */}
      {activeTab === 'csv-upload' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Bulk Laboratory Inventory CSV Ingestion</h3>
            <p className="text-xs text-gray-500">Upload multiple department assets simultaneously using our standardized format.</p>
          </div>

          <div className="p-6 rounded-3xl glass-panel border border-purple-500/20 space-y-4">
            <div className="flex justify-between items-center p-3.5 rounded-2xl bg-purple-500/10 text-xs">
              <span className="text-purple-900 dark:text-purple-200">Download the official CBIT Asset CSV Template first:</span>
              <button
                onClick={handleDownloadTemplate}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Template CSV</span>
              </button>
            </div>

            {uploadResult && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs">
                <p className="font-bold">{uploadResult.message}</p>
                <span className="text-[11px] block mt-1">Total batches created: {uploadResult.total_requests_created} (~{uploadResult.total_weight_kg} kg)</span>
              </div>
            )}

            {uploadError && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleCsvUpload} className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 text-center space-y-2">
                <Upload className="w-8 h-8 text-purple-500 mx-auto" />
                <span className="text-xs text-gray-500 block">Select a .csv spreadsheet containing device category, condition, and asset tags</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
              </div>

              <button
                type="submit"
                disabled={!selectedFile || isUploading}
                className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{isUploading ? 'Validating & Ingesting...' : 'Upload & Register Laboratory Batch'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: COLLECTION CAMPAIGNS */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Active Campus Collection Drives</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 rounded-3xl glass-panel border border-emerald-500/20 space-y-3">
              <div className="flex justify-between items-start">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600">
                  Active Drive
                </span>
                <span className="text-xs text-gray-400">Target: 500 kg</span>
              </div>
              <h4 className="text-base font-bold text-gray-900 dark:text-white">CBIT GreenTech Drive 2026</h4>
              <p className="text-xs text-gray-500">Campus-wide student & faculty electronic waste dropoff at Main Auditorium and CSE Block.</p>
              <div className="pt-2 flex justify-between items-center text-xs">
                <span>Progress: <strong>320 kg (64%)</strong></span>
                <span className="text-purple-600 font-bold">Ends Oct 31</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SCHEDULE BULK PICKUP */}
      {activeTab === 'bulk-pickup' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Schedule Campus Logistics Truck Collection</h3>
            <p className="text-xs text-gray-500">Request dedicated truck dispatch for departmental computer lab clearances.</p>
          </div>

          <form onSubmit={handleBulkPickupSubmit} className="p-6 rounded-3xl glass-panel border border-purple-500/20 space-y-4">
            {scheduleSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{scheduleSuccess}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-gray-400">Department Lab</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-charcoal-900 text-xs font-semibold"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase text-gray-400">Pickup Date</label>
                <input
                  type="date"
                  required
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-charcoal-900 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase text-gray-400">Time Window</label>
                <select
                  value={pickupSlot}
                  onChange={(e) => setPickupSlot(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-charcoal-900 text-xs font-semibold"
                >
                  <option value="10:00 - 13:00">Morning (10:00 - 13:00)</option>
                  <option value="14:00 - 17:00">Afternoon (14:00 - 17:00)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-gray-400">Special Handling Notes</label>
              <textarea
                rows={2}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-charcoal-900 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isScheduling}
              className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{isScheduling ? 'Dispatching...' : 'Confirm Campus Bulk Pickup'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 7: ESG SUSTAINABILITY */}
      {activeTab === 'sustainability' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Institutional ESG & Sustainability Ledger</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl glass-panel text-center">
              <span className="text-xs text-gray-400 uppercase font-bold block">Certified CO2e Mitigated</span>
              <span className="text-3xl font-black text-emerald-600 mt-1 block">{co2OffsetKg} kg</span>
              <span className="text-[11px] text-gray-500">2.8 kg CO2e / kg verified e-waste</span>
            </div>
            <div className="p-5 rounded-2xl glass-panel text-center">
              <span className="text-xs text-gray-400 uppercase font-bold block">Toxic Metals Neutralized</span>
              <span className="text-3xl font-black text-purple-600 mt-1 block">18.6 kg</span>
              <span className="text-[11px] text-gray-500">Lead, cadmium & mercury contained</span>
            </div>
            <div className="p-5 rounded-2xl glass-panel text-center">
              <span className="text-xs text-gray-400 uppercase font-bold block">NAAC / NIRF Criteria 7.1</span>
              <span className="text-3xl font-black text-cyan-600 mt-1 block">100%</span>
              <span className="text-[11px] text-gray-500">Audit-ready documentation</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: INSTITUTION SETTINGS */}
      {activeTab === 'settings' && (
        <div className="max-w-xl mx-auto p-6 rounded-3xl glass-panel border border-purple-500/20 space-y-3 text-xs">
          <div className="flex items-center space-x-3 pb-3 border-b border-gray-200 dark:border-gray-800">
            <Building2 className="w-8 h-8 text-purple-500" />
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">CBIT Green Campus Committee</h4>
              <span className="text-gray-400">Prof. K. Venkatesh Rao (Lead Coordinator)</span>
            </div>
          </div>
          <div>Institution Name: <strong>Chaitanya Bharathi Institute of Technology (CBIT)</strong></div>
          <div>Campus Address: <strong>Gandipet, Hyderabad, Telangana - 500075</strong></div>
          <div>Contact: <strong>green-campus@cbit.ac.in • +91 40 2419 3276</strong></div>
        </div>
      )}

    </div>
  );
};
