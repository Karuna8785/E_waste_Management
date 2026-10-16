import React from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { EWasteRequest } from '../../types';
import { 
  CheckCircle2, 
  Clock, 
  Truck, 
  Building2, 
  Wrench, 
  Award, 
  FileDown, 
  AlertCircle 
} from 'lucide-react';

interface RequestTimelineProps {
  request: EWasteRequest;
}

export const RequestTimeline: React.FC<RequestTimelineProps> = ({ request }) => {
  const { t } = useTranslation();

  const allStages = [
    { key: 'submitted', label: t.status_submitted, icon: Clock },
    { key: 'collector_assigned', label: t.status_collector_assigned, icon: Truck },
    { key: 'pickup_scheduled', label: t.status_pickup_scheduled, icon: Clock },
    { key: 'collected', label: t.status_collected, icon: CheckCircle2 },
    { key: 'in_transit', label: t.status_in_transit, icon: Truck },
    { key: 'received_at_facility', label: t.status_received_at_facility, icon: Building2 },
    { key: 'under_inspection', label: t.status_under_inspection, icon: Wrench },
    { key: 'completed', label: t.status_completed, icon: Award },
  ];

  const stageOrder = allStages.map(s => s.key);
  const currentIdx = stageOrder.indexOf(request.status);

  const downloadReceipt = async () => {
    try {
      const token = localStorage.getItem('ecocycle_token');
      const response = await fetch(`/api/v1/ewaste/requests/${request.id}/receipt`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        alert("Digital receipt is generated once the item is collected at your doorstep.");
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `EcoCycle_Receipt_${request.request_code}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert("Receipt download error.");
    }
  };

  return (
    <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-xl space-y-8">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Request Identifier
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-0.5">
            {request.request_code}
          </h3>
          <span className="text-xs text-gray-500">
            {request.device_name} • Registered {new Date(request.created_at).toLocaleDateString()}
          </span>
        </div>

        {/* Digital Receipt Download */}
        <button
          onClick={downloadReceipt}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md flex items-center space-x-2 self-start sm:self-auto transition-transform hover:scale-105"
        >
          <FileDown className="w-4 h-4" />
          <span>{t.download_receipt}</span>
        </button>
      </div>

      {/* Stepper Timeline */}
      <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-800">
        {allStages.map((stage, idx) => {
          const Icon = stage.icon;
          const isPassed = currentIdx >= idx;
          const isCurrent = currentIdx === idx;

          return (
            <div key={stage.key} className="relative flex items-start space-x-4">
              
              {/* Step Circle Indicator */}
              <div
                className={`absolute -left-6 sm:-left-8 w-6 sm:w-8 h-6 sm:h-8 rounded-full flex items-center justify-center transition-all ${
                  isCurrent
                    ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20 shadow-md animate-pulse'
                    : isPassed
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-200 dark:bg-gray-800 text-gray-400'
                }`}
              >
                <Icon className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              </div>

              {/* Stage Content */}
              <div className="pt-0.5">
                <span className={`text-sm font-bold block ${
                  isCurrent 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : isPassed 
                    ? 'text-gray-900 dark:text-white' 
                    : 'text-gray-400'
                }`}>
                  {stage.label}
                </span>

                {isCurrent && (
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Active State
                  </span>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Handover Details if collected */}
      {request.handover_receipt && (
        <div className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-900 dark:text-emerald-300 space-y-1">
          <div className="font-bold flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Doorstep Weighbridge Verification Confirmed</span>
          </div>
          <p>
            Verified Weight: <span className="font-bold">{request.handover_receipt.verified_weight_kg} kg</span> • Handed to Collector: <span className="font-bold">{request.handover_receipt.collector_name}</span>
          </p>
          <p>
            Green Reward Points Credited: <span className="font-bold text-emerald-700 dark:text-emerald-200">+{request.handover_receipt.points_awarded} pts</span>
          </p>
        </div>
      )}

    </div>
  );
};
