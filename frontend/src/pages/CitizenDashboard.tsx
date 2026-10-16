import React, { useEffect, useState } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { EWasteRequest } from '../types';
import { RequestTimeline } from '../components/tracking/RequestTimeline';
import { Link, useNavigate } from 'react-router-dom';
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
  FileText
} from 'lucide-react';

export const CitizenDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user, token, switchRoleDemo } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState<EWasteRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<EWasteRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-3xl glass-panel text-center border border-emerald-500/30 shadow-xl">
        <Package className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Citizen Portal Access</h3>
        <p className="text-xs text-gray-500 mt-1 mb-6">
          Sign in to view your active e-waste requests, track pickups, and manage your green reward points.
        </p>
        <button
          onClick={() => switchRoleDemo('individual')}
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md"
        >
          Sign In as Demo Citizen
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Welcome & Points Ledger Card */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-emerald-500/20 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Citizen Eco-Profile
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-0.5">
            Welcome back, {user.full_name}
          </h2>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Registered Account: {user.email}
          </span>
        </div>

        <div className="flex items-center space-x-6">
          <div className="text-right">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
              Green Reward Points
            </span>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-end space-x-1.5">
              <Award className="w-6 h-6" />
              <span>{user.reward_points || 150} pts</span>
            </div>
            <span className="text-[10px] text-gray-400 block">
              Redeemable for eco-coupons & marketplace vouchers
            </span>
          </div>

          <Link
            to="/schedule"
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md flex items-center space-x-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Pickup</span>
          </Link>
        </div>
      </div>

      {/* Main Content: Left Requests List, Right Request Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: My Requests List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <Package className="w-5 h-5 text-emerald-600" />
              <span>My E-Waste Submissions ({requests.length})</span>
            </h3>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-gray-400">Loading your submissions...</div>
          ) : requests.length === 0 ? (
            <div className="p-8 rounded-3xl glass-panel text-center text-xs text-gray-500 border border-gray-200 dark:border-gray-800">
              No e-waste items registered yet.
              <div className="mt-4">
                <Link
                  to="/identify"
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                >
                  Diagnose First Item
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => {
                const isSelected = selectedRequest?.id === req.id;
                return (
                  <div
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'glass-panel-accent border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                        : 'glass-panel border-gray-200 dark:border-gray-800 hover:border-emerald-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        {req.request_code}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-500 capitalize px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
                        {req.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-gray-900 dark:text-white mt-1">
                      {req.device_name}
                    </h4>

                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <span>{req.estimated_weight_kg || 0.5} kg</span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{req.pickup_date || 'Slot Pending'}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Selected Request Details & Timeline */}
        <div className="lg:col-span-7">
          {selectedRequest ? (
            <RequestTimeline request={selectedRequest} />
          ) : (
            <div className="p-12 rounded-3xl glass-panel text-center text-xs text-gray-400 border border-gray-200 dark:border-gray-800">
              Select a request on the left to inspect its circular lifecycle and digital certifications.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
