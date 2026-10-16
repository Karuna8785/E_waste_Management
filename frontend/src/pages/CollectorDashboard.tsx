import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import { 
  Truck, 
  MapPin, 
  CheckCircle2, 
  Scale, 
  QrCode, 
  ShieldAlert, 
  Navigation,
  Calendar,
  Clock,
  ArrowRight,
  Phone,
  Package,
  Layers,
  History,
  AlertTriangle,
  Send,
  User,
  Sparkles,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export const CollectorDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') || 'route';
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const [assignedPickups, setAssignedPickups] = useState<any[]>([]);
  const [availablePickups, setAvailablePickups] = useState<any[]>([]);
  const [partnersList, setPartnersList] = useState<any[]>([]);
  const [selectedPickup, setSelectedPickup] = useState<any | null>(null);

  // Digital Scale Verification form state
  const [verifiedWeight, setVerifiedWeight] = useState('2.5');
  const [collectorNotes, setCollectorNotes] = useState('Device physically verified. Power cord included. Battery intact.');
  const [isVerifying, setIsVerifying] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Handover state
  const [handoverPartnerId, setHandoverPartnerId] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('TS-09-EA-4122');
  const [isHandoverSubmitting, setIsHandoverSubmitting] = useState(false);

  // Availability toggle
  const [isOnDuty, setIsOnDuty] = useState(true);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const fetchCollectorData = async () => {
    if (!token) return;
    try {
      // 1. Assigned pickups
      const resAssigned = await fetch('/api/v1/collector/assigned', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resAssigned.ok) {
        const data = await resAssigned.json();
        setAssignedPickups(data.pickups || []);
        if (data.pickups?.length > 0 && !selectedPickup) {
          setSelectedPickup(data.pickups[0]);
        }
      }

      // 2. Available pickups
      const resAvail = await fetch('/api/v1/collector/available', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resAvail.ok) {
        const data = await resAvail.json();
        setAvailablePickups(data.available_pickups || []);
      }

      // 3. Eligible partners
      const resPartners = await fetch('/api/v1/collector/partners', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resPartners.ok) {
        const data = await resPartners.json();
        setPartnersList(data.partners || []);
        if (data.partners?.length > 0) {
          setHandoverPartnerId(data.partners[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching collector data', err);
    }
  };

  useEffect(() => {
    fetchCollectorData();
  }, [token]);

  // Leaflet Route Map Initialization
  useEffect(() => {
    if ((activeTab !== 'route' && activeTab !== 'map') || !mapContainerRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    const map = L.map(mapContainerRef.current).setView([17.4435, 78.3772], 12);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | EcoCycle Mobile Field'
    }).addTo(map);

    // Add stops for assigned pickups
    assignedPickups.forEach((pickup, index) => {
      const lat = pickup.latitude || (17.44 + index * 0.015);
      const lng = pickup.longitude || (78.37 + index * 0.015);
      L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`<b>Stop #${index + 1}: ${pickup.request_code}</b><br/>${pickup.device_name}<br/>${pickup.pickup_address_text || 'Hyderabad'}`);
    });
  }, [activeTab, assignedPickups]);

  // Accept job
  const handleAcceptJob = async (reqId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/v1/collector/accept/${reqId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setActionSuccess('Job accepted! Added to your today route.');
        fetchCollectorData();
      }
    } catch {
      alert('Error accepting job');
    }
  };

  // Doorstep Weighbridge & Verification Handover
  const handleVerifyPickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPickup || !token) return;
    setIsVerifying(true);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/v1/collector/verify-handover/${selectedPickup.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          verified_weight_kg: parseFloat(verifiedWeight) || 2.0,
          verified_item_count: 1,
          notes: collectorNotes
        })
      });

      const data = await res.json();
      if (res.ok) {
        setActionSuccess(`Pickup ${selectedPickup.request_code} certified! Awarded ${data.points_awarded} EcoPoints to citizen.`);
        fetchCollectorData();
      } else {
        alert(data.error || 'Verification failed');
      }
    } catch {
      alert('Network error certifying pickup');
    } finally {
      setIsVerifying(false);
    }
  };

  // Batch Handover to Recycler Facility
  const handleFacilityHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsHandoverSubmitting(true);

    try {
      const res = await fetch('/api/v1/collector/handover-to-partner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          partner_id: handoverPartnerId,
          vehicle_number: vehicleNumber,
          notes: `Batch transfer from collector ${user?.full_name}`
        })
      });
      const data = await res.json();
      if (res.ok) {
        setActionSuccess(`Facility handover completed! Manifest: ${data.shipment.shipment_code}`);
        fetchCollectorData();
      } else {
        alert(data.error || 'Handover failed');
      }
    } catch {
      alert('Network error handing over to facility');
    } finally {
      setIsHandoverSubmitting(false);
    }
  };

  const collectorTabs = [
    { id: 'route', label: 'My Route', icon: Navigation },
    { id: 'assigned', label: 'Assigned Pickups', icon: Package },
    { id: 'available', label: 'Available Jobs', icon: Truck },
    { id: 'confirm', label: 'Scale & Confirm', icon: Scale },
    { id: 'handover', label: 'Handover to Plant', icon: Layers },
    { id: 'history', label: 'Work History', icon: History },
    { id: 'profile', label: 'Profile & Status', icon: User },
  ];

  const pendingPickups = assignedPickups.filter(p => p.status !== 'collected' && p.status !== 'completed');
  const collectedPickups = assignedPickups.filter(p => p.status === 'collected');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Mobile-First Header & Today's Stops */}
      <div className="p-5 sm:p-6 rounded-3xl glass-panel border border-amber-500/20 shadow-xl bg-gradient-to-r from-amber-950/20 via-transparent to-emerald-950/10 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center space-x-1">
                <Truck className="w-3 h-3 text-amber-500" />
                <span>Field Logistics App</span>
              </span>
              <button
                onClick={() => setIsOnDuty(!isOnDuty)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isOnDuty ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                }`}
              >
                {isOnDuty ? '● ON DUTY' : '○ OFF DUTY'}
              </button>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1">
              Collector: {user?.full_name}
            </h2>
            <span className="text-xs text-gray-400 font-medium">Assigned Zone: Madhapur • Hitec City • Gachibowli</span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="flex-1 sm:flex-initial p-3 rounded-2xl bg-white/70 dark:bg-charcoal-900/70 border border-gray-200 dark:border-gray-800 text-center">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Stops Today</span>
              <span className="text-xl font-black text-amber-600">{pendingPickups.length}</span>
            </div>
            <div className="flex-1 sm:flex-initial p-3 rounded-2xl bg-white/70 dark:bg-charcoal-900/70 border border-gray-200 dark:border-gray-800 text-center">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Collected</span>
              <span className="text-xl font-black text-emerald-600">{collectedPickups.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Collector Sub-Navigation Bar */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-gray-200 dark:border-gray-800">
        {collectorTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-charcoal-900'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.id === 'assigned' && pendingPickups.length > 0 && (
                <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full text-white">
                  {pendingPickups.length}
                </span>
              )}
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

      {/* TAB 1: MY ROUTE & MAP */}
      {activeTab === 'route' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Suggested Collection Route</h3>
              <p className="text-xs text-gray-500">Stops sequenced for optimal battery life and transport efficiency.</p>
            </div>
            <a
              href="https://maps.google.com"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-charcoal-900 text-xs font-bold flex items-center space-x-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
              <span>Google Maps</span>
            </a>
          </div>

          {/* Interactive Map */}
          <div 
            ref={mapContainerRef} 
            className="w-full h-72 sm:h-96 rounded-3xl overflow-hidden border border-gray-300 dark:border-gray-800 shadow-md"
          />

          {/* Route Stops List */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase text-gray-400 block">Today's Stop Order</span>
            {assignedPickups.map((p, idx) => (
              <div 
                key={p.id}
                onClick={() => { setSelectedPickup(p); setActiveTab('confirm'); }}
                className="p-4 rounded-2xl glass-panel border border-gray-200 dark:border-gray-800 hover:border-amber-500/40 cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 font-black text-xs flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">{p.device_name} ({p.request_code})</h4>
                    <span className="text-[11px] text-gray-500 block">{p.pickup_address_text || 'Hyderabad'}</span>
                  </div>
                </div>
                <button className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold">
                  Weigh & Confirm
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ASSIGNED PICKUPS */}
      {activeTab === 'assigned' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Active Assigned Jobs ({assignedPickups.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {assignedPickups.map((pickup) => (
              <div key={pickup.id} className="p-5 rounded-3xl glass-panel border border-gray-200 dark:border-gray-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs font-bold text-amber-600">{pickup.request_code}</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
                    {pickup.status?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">{pickup.device_name}</h4>
                  <span className="text-xs text-gray-500 block mt-0.5">Contact: {pickup.user_name || 'Citizen'} • {pickup.user_phone || '+91 98490 12345'}</span>
                  <span className="text-xs text-gray-400 block mt-0.5">{pickup.pickup_address_text || 'Banjara Hills, Hyderabad'}</span>
                </div>
                <div className="pt-2 flex items-center space-x-2">
                  <button
                    onClick={() => { setSelectedPickup(pickup); setActiveTab('confirm'); }}
                    className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center space-x-1"
                  >
                    <Scale className="w-4 h-4" />
                    <span>Digital Scale Check</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AVAILABLE JOBS */}
      {activeTab === 'available' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Available Unassigned Jobs ({availablePickups.length})</h3>
            <p className="text-xs text-gray-500">Pickups requested by citizens awaiting an authorized collector.</p>
          </div>
          {availablePickups.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 glass-panel rounded-3xl">
              No unassigned jobs currently in your zone. Great job!
            </div>
          ) : (
            <div className="space-y-3">
              {availablePickups.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl glass-panel border border-gray-200 dark:border-gray-800 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-600">{item.request_code}</span>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">{item.device_name}</h4>
                    <span className="text-[11px] text-gray-500 block">{item.pickup_address_text || 'Hyderabad'} • Est. {item.estimated_weight_kg || 1.0} kg</span>
                  </div>
                  <button
                    onClick={() => handleAcceptJob(item.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                  >
                    Accept Job
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DIGITAL SCALE & CONFIRMATION */}
      {activeTab === 'confirm' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Doorstep Weighbridge Scale Verification
            </h3>
            <p className="text-xs text-gray-500">Measure actual weight, inspect physical integrity, and issue digital collection receipt.</p>
          </div>

          {selectedPickup ? (
            <form onSubmit={handleVerifyPickup} className="p-6 rounded-3xl glass-panel border border-amber-500/20 space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs">
                <strong>Verifying Request:</strong> {selectedPickup.request_code} • {selectedPickup.device_name}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase text-gray-400">
                  Actual Measured Weight (kg)
                </label>
                <div className="relative">
                  <Scale className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                  <input
                    type="number"
                    step="0.05"
                    required
                    value={verifiedWeight}
                    onChange={(e) => setVerifiedWeight(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-charcoal-900/70 text-sm font-bold text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase text-gray-400">
                  Physical Condition & Safety Inspection Notes
                </label>
                <textarea
                  rows={2}
                  value={collectorNotes}
                  onChange={(e) => setCollectorNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-charcoal-900/70 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isVerifying ? 'Certifying...' : 'Certify Handover & Issue Receipt'}</span>
              </button>
            </form>
          ) : (
            <div className="p-8 text-center text-xs text-gray-400 glass-panel rounded-3xl">
              Select an assigned pickup from the list to perform digital scale check.
            </div>
          )}
        </div>
      )}

      {/* TAB 5: HANDOVER TO RECYCLER FACILITY */}
      {activeTab === 'handover' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Transfer Batch to Authorized Recycling Plant
            </h3>
            <p className="text-xs text-gray-500">Dispatch collected electronics from field route to TSPCB certified dismantling facility.</p>
          </div>

          <form onSubmit={handleFacilityHandover} className="p-6 rounded-3xl glass-panel border border-blue-500/20 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-gray-400">Select Receiving Facility</label>
              <select
                value={handoverPartnerId}
                onChange={(e) => setHandoverPartnerId(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-charcoal-900/70 text-xs font-semibold"
              >
                {partnersList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.organization_name} ({p.city}) • Capacity: {p.monthly_capacity_metric_tons} MT
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-gray-400">Transport Vehicle Registration</label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-charcoal-900/70 text-xs font-semibold"
              />
            </div>

            <div className="p-3 rounded-xl bg-gray-50 dark:bg-charcoal-900 text-xs flex justify-between">
              <span>Items ready for facility dispatch:</span>
              <span className="font-bold text-emerald-600">{collectedPickups.length} units</span>
            </div>

            <button
              type="submit"
              disabled={isHandoverSubmitting}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{isHandoverSubmitting ? 'Generating Manifest...' : 'Generate Dispatch Manifest'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 6: WORK HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Collector Field Record & History</h3>
          <div className="p-5 rounded-2xl glass-panel space-y-2 text-xs">
            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-800">
              <span className="text-gray-400">Total Pickups Verified:</span>
              <span className="font-bold text-emerald-600">{collectedPickups.length + 5} collections</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-800">
              <span className="text-gray-400">Field Weight Processed:</span>
              <span className="font-bold text-gray-900 dark:text-white">32.4 kg</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-400">On-Time Completion Rate:</span>
              <span className="font-bold text-emerald-600">98.5%</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: PROFILE */}
      {activeTab === 'profile' && (
        <div className="max-w-md mx-auto p-6 rounded-3xl glass-panel border border-amber-500/20 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto text-xl font-bold">
            <Truck className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-gray-900 dark:text-white">{user?.full_name}</h4>
          <span className="text-xs text-gray-400 block">{user?.email}</span>
          <span className="text-xs font-bold text-emerald-600 block">Verified Logistics Partner • Hyderabad Metro</span>
        </div>
      )}

    </div>
  );
};
