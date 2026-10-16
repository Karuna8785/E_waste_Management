import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { EWasteRequest } from '../types';
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
  ArrowRight
} from 'lucide-react';

export const CollectorPortal: React.FC = () => {
  const { t } = useTranslation();
  const { user, token, switchRoleDemo } = useAuth();

  const [assignedPickups, setAssignedPickups] = useState<EWasteRequest[]>([]);
  const [selectedPickup, setSelectedPickup] = useState<EWasteRequest | null>(null);
  const [verifiedWeight, setVerifiedWeight] = useState('2.5');
  const [collectorNotes, setCollectorNotes] = useState('Device physically verified. Power cord included.');
  const [isVerifying, setIsVerifying] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const fetchPickups = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/v1/collector/assigned-pickups', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAssignedPickups(data.pickups || []);
        if (data.pickups?.length > 0 && !selectedPickup) {
          setSelectedPickup(data.pickups[0]);
        }
      }
    } catch {
      // handled
    }
  };

  useEffect(() => {
    fetchPickups();
  }, [token]);

  // Leaflet Map for Collector Route
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    const map = L.map(mapContainerRef.current).setView([17.4485, 78.3758], 12);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Add marker for active stops
    assignedPickups.forEach((pickup) => {
      const lat = pickup.latitude || (17.44 + Math.random() * 0.05);
      const lng = pickup.longitude || (78.37 + Math.random() * 0.05);
      L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`<b>${pickup.request_code}</b><br/>${pickup.device_name}<br/>${pickup.pickup_address_text || 'Madhapur'}`);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [assignedPickups]);

  const handleConfirmCollection = async () => {
    if (!selectedPickup || !token) return;
    setIsVerifying(true);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/v1/collector/requests/${selectedPickup.id}/confirm-collection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          actual_weight_kg: parseFloat(verifiedWeight) || 2.0,
          condition_notes: collectorNotes
        })
      });

      const data = await res.json();
      if (res.ok) {
        setActionSuccess(`Pickup ${selectedPickup.request_code} successfully collected and receipt generated.`);
        fetchPickups();
      } else {
        alert(data.error || 'Failed to confirm collection.');
      }
    } catch {
      alert('Network error confirming collection.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!user || (user.role !== 'collector' && user.role !== 'admin')) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-3xl glass-panel text-center border border-amber-500/30 shadow-xl">
        <Truck className="w-12 h-12 text-amber-600 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Collector Logistics Portal</h3>
        <p className="text-xs text-gray-500 mt-1 mb-6">
          Access mobile-first navigation, weighbridge digital verification, and doorstep handover tools.
        </p>
        <button
          onClick={() => switchRoleDemo('collector')}
          className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider shadow-md"
        >
          Sign In as Demo Collector (Vikram)
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Banner */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-amber-500/20 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center space-x-1.5">
            <Truck className="w-4 h-4" />
            <span>EcoCollector Field Operations</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-0.5">
            Collector Hub — {user.full_name}
          </h2>
          <span className="text-xs text-gray-500">
            Assigned Region: Hyderabad West Cluster • Vehicle ID: AP-28-ECO-994
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">Pending Pickups</span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{assignedPickups.length} Tasks</span>
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Grid: Left Pickups List, Right Leaflet Map & Handover Action */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Assigned Requests */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Daily Pickup Schedule ({assignedPickups.length})
          </h3>

          {assignedPickups.length === 0 ? (
            <div className="p-8 rounded-3xl glass-panel text-center text-xs text-gray-400 border border-gray-200 dark:border-gray-800">
              No active pickups assigned for this vehicle today.
            </div>
          ) : (
            <div className="space-y-3">
              {assignedPickups.map((p) => {
                const isSelected = selectedPickup?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPickup(p)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 shadow-md ring-2 ring-amber-500/20'
                        : 'glass-panel border-gray-200 dark:border-gray-800 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400">
                        {p.request_code}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        {p.pickup_slot || 'morning'}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-gray-900 dark:text-white mt-1">
                      {p.device_name}
                    </h4>

                    <div className="mt-2 text-xs text-gray-500 flex items-start space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="truncate">{p.pickup_address_text || 'Madhapur, Hyderabad'}</span>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-gray-100 dark:border-gray-800">
                      <span>Est: {p.estimated_weight_kg || 1.0} kg</span>
                      <span className="text-amber-600 font-semibold flex items-center space-x-1">
                        <span>Tap to verify</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Interactive Map & Collection Verification */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Navigation Map */}
          <div className="rounded-3xl glass-panel p-5 border border-gray-200 dark:border-gray-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center space-x-1.5">
                <Navigation className="w-4 h-4 text-amber-500" />
                <span>Optimal Route & Dropoff Points</span>
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold">Active Dispatch</span>
            </div>

            <div 
              ref={mapContainerRef} 
              className="w-full h-64 rounded-2xl border border-gray-300 dark:border-gray-700 overflow-hidden shadow-inner z-10"
            />
          </div>

          {/* Collection Verification Form */}
          {selectedPickup && (
            <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-amber-500/30 shadow-xl space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Doorstep Verification</span>
                  <h4 className="text-xl font-black text-gray-900 dark:text-white">
                    {selectedPickup.device_name} ({selectedPickup.request_code})
                  </h4>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Scale className="w-5 h-5" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Certified Scale Weight (Kg)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={verifiedWeight}
                    onChange={(e) => setVerifiedWeight(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-charcoal-900 text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Condition Assessment
                  </label>
                  <input
                    type="text"
                    value={collectorNotes}
                    onChange={(e) => setCollectorNotes(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-charcoal-900 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleConfirmCollection}
                disabled={isVerifying}
                className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center space-x-2 transition-transform hover:scale-[1.01]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isVerifying ? t.loading : 'Issue Digital Handover Receipt & Confirm'}</span>
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
