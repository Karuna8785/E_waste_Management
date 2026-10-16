import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, CheckCircle, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import L from 'leaflet';

export const PickupScheduler: React.FC = () => {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const prefill = location.state || {};

  const [deviceName, setDeviceName] = useState(prefill.category ? `My ${prefill.category}` : '');
  const [categoryName, setCategoryName] = useState(prefill.category || 'Mobile Phone');
  const [weightKg, setWeightKg] = useState('1.5');
  const [quantity, setQuantity] = useState('1');
  const [addressText, setAddressText] = useState('Plot 42, Silicon Valley Colony, Madhapur, Hyderabad');
  const [pickupDate, setPickupDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [pickupSlot, setPickupSlot] = useState('morning');
  const [latLng, setLatLng] = useState<{ lat: number; lng: number }>({ lat: 17.4485, lng: 78.3758 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Default icon fix for Leaflet
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    const map = L.map(mapContainerRef.current).setView([latLng.lat, latLng.lng], 13);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Initial marker
    const marker = L.marker([latLng.lat, latLng.lng], { draggable: true }).addTo(map);
    markerRef.current = marker;

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      setLatLng({ lat: pos.lat, lng: pos.lng });
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      setLatLng({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setErrorMessage("Please sign in or select 'Citizen' from the quick demo role switcher to submit.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Create Request
      const createRes = await fetch('/api/v1/ewaste/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          device_name: deviceName || 'Household E-Waste Item',
          condition_description: prefill.recommendation ? `AI Pathway: ${prefill.recommendation}` : 'General electronic item',
          quantity: parseInt(quantity) || 1,
          estimated_weight_kg: parseFloat(weightKg) || 1.0,
          recommendation: prefill.recommendation || 'recycle',
          pickup_address_text: addressText,
          latitude: latLng.lat,
          longitude: latLng.lng,
          preferred_slot: pickupSlot,
          ai_analysis: prefill.aiRecord ? {
            predicted_category: prefill.aiRecord.prediction?.predicted_category || categoryName,
            confidence: prefill.aiRecord.prediction?.confidence || 0.92,
            visual_flags: prefill.aiRecord.prediction?.visual_flags || {},
            benchmark_materials: prefill.aiRecord.prediction?.benchmark_materials || {}
          } : undefined
        })
      });

      const createData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createData.error || 'Failed to submit e-waste request.');
      }

      const requestId = createData.request.id;

      // 2. Schedule Pickup
      const scheduleRes = await fetch(`/api/v1/ewaste/requests/${requestId}/schedule-pickup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          pickup_date: pickupDate,
          pickup_slot: pickupSlot,
          address_details: addressText
        })
      });

      const scheduleData = await scheduleRes.json();
      setSuccessData(scheduleData.request || createData.request);

    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while scheduling pickup.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successData) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-3xl glass-panel text-center border border-emerald-500/30 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-black text-gray-900 dark:text-white">
          Collection Confirmed!
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {t.pickup_success}{' '}
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">
            {successData.request_code}
          </span>
        </p>

        <div className="mt-6 p-4 rounded-2xl bg-white dark:bg-charcoal-900 border border-gray-200 dark:border-gray-800 text-left text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">Device Item:</span>
            <span className="font-semibold text-gray-800 dark:text-gray-200">{successData.device_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Scheduled Date:</span>
            <span className="font-semibold text-gray-800 dark:text-gray-200">{successData.pickup_date} ({successData.pickup_slot})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Location:</span>
            <span className="font-semibold text-gray-800 dark:text-gray-200 truncate max-w-xs">{successData.pickup_address_text}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Assigned Logistics Hub:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Hyderabad West EcoHub</span>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center space-x-2"
          >
            <span>View in My Requests</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSuccessData(null);
              setDeviceName('');
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-xs"
          >
            Schedule Another Item
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto my-8 p-6 sm:p-10 rounded-3xl glass-panel shadow-2xl border border-emerald-500/20">
      
      {/* Title */}
      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Zero-Emission Circular Doorstep Logistics
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
          {t.pickup_title}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {t.pickup_subtitle}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: Input Form */}
        <div className="space-y-5">
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              Device Name or Model
            </label>
            <input
              type="text"
              required
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="e.g. Dell Inspiron Laptop, Samsung Galaxy S20"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-charcoal-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Estimated Weight (Kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-charcoal-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-charcoal-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              {t.pickup_address_label}
            </label>
            <textarea
              required
              rows={2}
              value={addressText}
              onChange={(e) => setAddressText(e.target.value)}
              placeholder="Full address, apartment number, and landmark"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-charcoal-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                {t.pickup_date_label}
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-charcoal-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                {t.pickup_slot_label}
              </label>
              <select
                value={pickupSlot}
                onChange={(e) => setPickupSlot(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-charcoal-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="morning">{t.slot_morning}</option>
                <option value="afternoon">{t.slot_afternoon}</option>
                <option value="evening">{t.slot_evening}</option>
              </select>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-forest-700 hover:from-emerald-500 hover:to-forest-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-transform hover:scale-[1.01] disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Calendar className="w-4 h-4" />
            <span>{isSubmitting ? t.loading : t.btn_confirm_pickup}</span>
          </button>
        </div>

        {/* Right: Interactive OpenStreetMap with pin placement */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
              <span>Pinpoint Doorstep Coordinates</span>
            </span>
            <span className="text-[11px] text-gray-400">
              Click or drag pin to adjust
            </span>
          </div>

          <div 
            ref={mapContainerRef} 
            className="w-full flex-1 min-h-[320px] rounded-2xl border border-gray-300 dark:border-gray-700 overflow-hidden shadow-inner z-10"
          />

          <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
            <span>Selected Coordinates: {latLng.lat.toFixed(4)}°N, {latLng.lng.toFixed(4)}°E</span>
            <span className="font-semibold text-emerald-600">Active Service Coverage</span>
          </div>
        </div>

      </form>

    </div>
  );
};
