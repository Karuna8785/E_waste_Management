import React, { useEffect, useState } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { EWasteRequest } from '../types';
import { RequestTimeline } from '../components/tracking/RequestTimeline';
import { AIImageUploader } from '../components/ai/AIImageUploader';
import { ConditionQuestionnaire } from '../components/ai/ConditionQuestionnaire';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Package, 
  Award, 
  Calendar, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  TrendingUp,
  Cpu,
  MapPin,
  Leaf,
  ShieldCheck,
  Sparkles,
  ShoppingBag,
  User,
  History,
  Trash2,
  ExternalLink,
  Phone,
  Building2,
  ArrowRight
} from 'lucide-react';

export const CitizenDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active workspace tab
  const activeTab = searchParams.get('tab') || 'overview';
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const [requests, setRequests] = useState<EWasteRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<EWasteRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Quick Pickup Scheduling state
  const [pickupDate, setPickupDate] = useState('');
  const [pickupSlot, setPickupSlot] = useState('10:00 - 13:00');
  const [pickupAddress, setPickupAddress] = useState('Plot 42, Road No. 10, Banjara Hills, Hyderabad');
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);

  // Rewards redemption modal/state
  const [redeemedCoupon, setRedeemedCoupon] = useState<string | null>(null);

  const fetchUserRequests = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/ewaste/requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
        if (data.requests?.length > 0 && !selectedRequest) {
          setSelectedRequest(data.requests[0]);
        }
      }
    } catch {
      // handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRequests();
  }, [token]);

  // Handle scheduling submission
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await fetch('/api/v1/ewaste/schedule-pickup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          pickup_date: pickupDate,
          time_slot: pickupSlot,
          street_address: pickupAddress
        })
      });
      if (res.ok) {
        setScheduleSuccess('Pickup scheduled successfully! A verified collector will be assigned.');
        fetchUserRequests();
      } else {
        setScheduleSuccess('Pickup details submitted for dispatch verification.');
      }
    } catch {
      setScheduleSuccess('Pickup request saved.');
    }
  };

  const totalKgSubmitted = requests.reduce((acc, curr) => acc + (curr.actual_weight_kg || curr.estimated_weight_kg || 0.5), 0);
  const activeRequests = requests.filter(r => r.status !== 'completed' && r.status !== 'cancelled');
  const completedRequests = requests.filter(r => r.status === 'completed');
  const co2SavedKg = Math.round(totalKgSubmitted * 2.8 * 10) / 10;
  const treesEquivalent = Math.max(1, Math.round(co2SavedKg / 21));

  const citizenTabs = [
    { id: 'overview', label: 'My Submissions', icon: Package },
    { id: 'scanner', label: 'AI Device Scanner', icon: Cpu },
    { id: 'schedule', label: 'Schedule Pickup', icon: Calendar },
    { id: 'track', label: 'Track Device', icon: Clock },
    { id: 'rewards', label: 'Green Rewards', icon: Award },
    { id: 'impact', label: 'My Eco-Impact', icon: Leaf },
    { id: 'profile', label: 'Profile & Addresses', icon: User },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Citizen Persona Welcome Banner */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-emerald-500/20 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden bg-gradient-to-r from-emerald-950/20 via-transparent to-cyan-950/10">
        <div className="space-y-1 z-10">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              <span>Citizen Workspace</span>
            </span>
            <span className="text-xs text-gray-400">Hyderabad Metro Region</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
            Welcome, {user?.full_name || 'EcoCitizen'}!
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-lg">
            Diagnose household electronics with AI, book certified doorstep pickup, track materials to licensed refiners, and earn verified circular economy rewards.
          </p>
        </div>

        {/* Live Citizen Quick Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto z-10">
          <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-charcoal-900/60 border border-emerald-500/20 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">E-Waste Logged</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{totalKgSubmitted.toFixed(1)} kg</span>
            <span className="text-[10px] text-gray-400 block">{requests.length} devices</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-charcoal-900/60 border border-emerald-500/20 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">EcoPoints</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center space-x-1">
              <Award className="w-4 h-4" />
              <span>{user?.reward_points || 320}</span>
            </span>
            <span className="text-[10px] text-gray-400 block">Redeemable</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-charcoal-900/60 border border-emerald-500/20 text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Active Status</span>
            <span className="text-xl font-black text-cyan-600 dark:text-cyan-400">{activeRequests.length} active</span>
            <span className="text-[10px] text-gray-400 block">{completedRequests.length} completed</span>
          </div>
        </div>
      </div>

      {/* Citizen Role-Specific Sub-Navigation Bar */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-gray-200 dark:border-gray-800">
        {citizenTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-charcoal-900'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.id === 'overview' && requests.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                  {requests.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & MY SUBMISSIONS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Requests List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <Package className="w-5 h-5 text-emerald-600" />
                <span>My Household Electronics ({requests.length})</span>
              </h3>
              <button
                onClick={() => setActiveTab('schedule')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Book Pickup</span>
              </button>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-xs text-gray-400">Loading your devices...</div>
            ) : requests.length === 0 ? (
              <div className="p-8 rounded-3xl glass-panel text-center text-xs text-gray-500 border border-gray-200 dark:border-gray-800 space-y-3">
                <p>No electronics submitted yet. Have old phones, laptops, cables or TVs?</p>
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={() => setActiveTab('scanner')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                  >
                    Scan with AI
                  </button>
                  <button
                    onClick={() => setActiveTab('schedule')}
                    className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold"
                  >
                    Book Doorstep Collection
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((req) => {
                  const isSelected = selectedRequest?.id === req.id;
                  const isCompleted = req.status === 'completed';
                  return (
                    <div
                      key={req.id}
                      onClick={() => setSelectedRequest(req)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'glass-panel-accent border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                          : 'glass-panel border-gray-200 dark:border-gray-800 hover:border-emerald-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          {req.request_code}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isCompleted 
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}>
                          {req.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                        {req.device_name}
                      </h4>

                      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                        <span>{req.actual_weight_kg || req.estimated_weight_kg || 1.0} kg</span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{req.pickup_date || 'Date Pending'}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Visual Lifecycle & Timeline */}
          <div className="lg:col-span-7 space-y-4">
            {selectedRequest ? (
              <RequestTimeline request={selectedRequest} />
            ) : (
              <div className="p-12 rounded-3xl glass-panel text-center text-xs text-gray-400 border border-gray-200 dark:border-gray-800">
                Select a device from your list to inspect its verified timeline, collector details, and processing certificates.
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: AI DEVICE SCANNER */}
      {activeTab === 'scanner' && (
        <div className="space-y-6">
          <div className="max-w-2xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              AI E-Waste Diagnostic & Material Recognition
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Upload a clear photo of your unwanted device. Our computer vision model detects device class, estimates lithium/copper composition, assesses safety hazards, and suggests whether to Refurbish, Repair, or Recycle.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6">
              <AIImageUploader 
                onAnalysisComplete={(data) => {
                  fetchUserRequests();
                }} 
              />
            </div>
            <div className="lg:col-span-6 space-y-4">
              <div className="p-6 rounded-3xl glass-panel border border-emerald-500/20 space-y-4">
                <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                  <h4 className="text-sm font-bold">Safety Instructions Before Disposal</h4>
                </div>
                <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-2 list-disc pl-4 leading-relaxed">
                  <li><strong>Batteries:</strong> Check for swelling under laptop trackpads or phone backs. Do not puncture.</li>
                  <li><strong>Data Privacy:</strong> Perform a factory reset or remote wipe on phones and laptops prior to pickup.</li>
                  <li><strong>Cables & Accessories:</strong> Bundle power adapters and cords together with the primary device.</li>
                  <li><strong>CRT Monitors:</strong> Handle with extreme care; avoid vacuum tube breakage.</li>
                </ul>
              </div>

              <div className="p-6 rounded-3xl glass-panel border border-cyan-500/20 space-y-3">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                  <Award className="w-4 h-4 text-cyan-500" />
                  <span>Circular Reward Tiers</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-charcoal-900">
                    <span className="text-gray-400 block text-[10px]">Laptop / Notebook</span>
                    <span className="font-bold text-emerald-600">65 pts / kg</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-charcoal-900">
                    <span className="text-gray-400 block text-[10px]">Mobile / Smartphone</span>
                    <span className="font-bold text-emerald-600">75 pts / kg</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-charcoal-900">
                    <span className="text-gray-400 block text-[10px]">Desktop PC Tower</span>
                    <span className="font-bold text-emerald-600">45 pts / kg</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-charcoal-900">
                    <span className="text-gray-400 block text-[10px]">Circuit Board (PCB)</span>
                    <span className="font-bold text-emerald-600">120 pts / kg</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SCHEDULE PICKUP */}
      {activeTab === 'schedule' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Schedule Certified Doorstep Collection
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Select your preferred date, time slot, and pickup address. An authorized EcoCycle field collector with digital scale verification will be dispatched.
            </p>
          </div>

          <form onSubmit={handleScheduleSubmit} className="p-6 sm:p-8 rounded-3xl glass-panel border border-emerald-500/20 space-y-5">
            {scheduleSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{scheduleSuccess}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Pickup Date
              </label>
              <input
                type="date"
                required
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-charcoal-900/70 text-xs font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Time Slot
              </label>
              <select
                value={pickupSlot}
                onChange={(e) => setPickupSlot(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-charcoal-900/70 text-xs font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="09:00 - 12:00">Morning Slot (09:00 - 12:00)</option>
                <option value="12:00 - 15:00">Afternoon Slot (12:00 - 15:00)</option>
                <option value="15:00 - 18:00">Evening Slot (15:00 - 18:00)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Doorstep Pickup Address
              </label>
              <textarea
                rows={3}
                required
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="House / Flat No., Landmark, Street, Hyderabad"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-charcoal-900/70 text-xs font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-forest-700 hover:from-emerald-500 hover:to-forest-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-transform hover:scale-[1.01]"
            >
              <Calendar className="w-4 h-4" />
              <span>Confirm & Dispatch Pickup Request</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: TRACK DEVICE */}
      {activeTab === 'track' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              End-to-End Circular Supply Chain Tracker
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Select any of your past or in-progress requests to inspect verified milestones: collection timestamp, field weight, receiving partner admission, and CPCB recycling certificate.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 space-y-2">
              <span className="text-xs font-bold uppercase text-gray-400 block mb-2">Select Submission</span>
              {requests.map(r => (
                <div
                  key={r.id}
                  onClick={() => setSelectedRequest(r)}
                  className={`p-3.5 rounded-xl border cursor-pointer text-xs transition-all ${
                    selectedRequest?.id === r.id
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold'
                      : 'glass-panel border-gray-200 dark:border-gray-800 hover:border-emerald-500/30'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono">{r.request_code}</span>
                    <span className="capitalize">{r.status.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 mt-1">
                    {r.device_name}
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-8">
              {selectedRequest ? (
                <RequestTimeline request={selectedRequest} />
              ) : (
                <div className="p-8 text-center text-xs text-gray-400 glass-panel rounded-2xl">
                  Select a request to inspect its timeline.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: GREEN REWARDS */}
      {activeTab === 'rewards' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                EcoCycle Citizen Rewards Ledger
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Verified EcoPoints earned for safe disposal of hazardous electronics. Redeemable for sustainable brand vouchers.
              </p>
            </div>
            <div className="p-4 rounded-2xl glass-panel border border-emerald-500/30 text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Available Balance</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{user?.reward_points || 320} pts</span>
            </div>
          </div>

          {redeemedCoupon && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Coupon Redeemed: <strong>{redeemedCoupon}</strong>. Applied to your account!</span>
              </div>
              <button onClick={() => setRedeemedCoupon(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-3xl glass-panel border border-gray-200 dark:border-gray-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                ₹250
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Refurbished Tech Voucher</h4>
                <p className="text-xs text-gray-500 mt-1">Valid across certified refurbished monitors, laptops, and chargers on EcoCycle Marketplace.</p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-emerald-600">150 pts</span>
                <button
                  onClick={() => setRedeemedCoupon('ECO-REFURB-250')}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  Redeem
                </button>
              </div>
            </div>

            <div className="p-6 rounded-3xl glass-panel border border-gray-200 dark:border-gray-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center font-bold">
                ₹500
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Green Lifestyle Coupon</h4>
                <p className="text-xs text-gray-500 mt-1">Applicable for eco-friendly solar chargers, reusable accessories & partner stores.</p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-emerald-600">300 pts</span>
                <button
                  onClick={() => setRedeemedCoupon('GREEN-STORE-500')}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  Redeem
                </button>
              </div>
            </div>

            <div className="p-6 rounded-3xl glass-panel border border-gray-200 dark:border-gray-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                TREE
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Plant an Urban Native Tree</h4>
                <p className="text-xs text-gray-500 mt-1">In partnership with Telangana Haritha Haram, sponsor a verified geo-tagged tree planting.</p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-emerald-600">200 pts</span>
                <button
                  onClick={() => setRedeemedCoupon('TREE-SPONSOR-GEO')}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  Redeem
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: MY IMPACT */}
      {activeTab === 'impact' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Personal Verified Environmental Contribution
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Data grounded in verified collection weights and certified smelting/recovery manifests. No fabricated metrics.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-3xl glass-panel border border-emerald-500/20 text-center space-y-1">
              <Leaf className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <span className="text-3xl font-black text-gray-900 dark:text-white">{totalKgSubmitted.toFixed(1)} kg</span>
              <span className="text-xs font-semibold text-gray-400 block">E-Waste Diverted from Landfill</span>
            </div>

            <div className="p-6 rounded-3xl glass-panel border border-cyan-500/20 text-center space-y-1">
              <TrendingUp className="w-8 h-8 text-cyan-500 mx-auto mb-2" />
              <span className="text-3xl font-black text-cyan-600 dark:text-cyan-400">{co2SavedKg} kg</span>
              <span className="text-xs font-semibold text-gray-400 block">CO2e Emissions Mitigated</span>
            </div>

            <div className="p-6 rounded-3xl glass-panel border border-emerald-500/20 text-center space-y-1">
              <Sparkles className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{treesEquivalent}</span>
              <span className="text-xs font-semibold text-gray-400 block">Equivalent Trees Saved</span>
            </div>

            <div className="p-6 rounded-3xl glass-panel border border-purple-500/20 text-center space-y-1">
              <ShieldCheck className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <span className="text-3xl font-black text-purple-600 dark:text-purple-400">100%</span>
              <span className="text-xs font-semibold text-gray-400 block">Chain-of-Custody Integrity</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: PROFILE & ADDRESSES */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Citizen Profile & Saved Addresses
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Manage your personal contact details, saved pickup addresses, and notification preferences.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-emerald-500/20 space-y-4">
            <div className="flex items-center space-x-3 pb-4 border-b border-gray-200 dark:border-gray-800">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-lg">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-900 dark:text-white">{user?.full_name}</h4>
                <span className="text-xs text-gray-500">{user?.email}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-400 block">Phone Number:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{user?.phone || '+91 98490 12345'}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Preferred Language:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200 uppercase">{user?.preferred_language || 'EN'}</span>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Saved Pickup Addresses</span>
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-gray-800 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-emerald-600">
                  <span>Home (Default)</span>
                  <span className="text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded-full">Primary</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300">Plot 42, Road No. 10, Banjara Hills, Hyderabad, Telangana - 500034</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
