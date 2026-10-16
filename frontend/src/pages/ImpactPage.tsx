import React, { useEffect, useState } from 'react';
import { ImpactDashboard } from '../components/home/ImpactDashboard';
import { ImpactMetrics } from '../types';

export const ImpactPage: React.FC = () => {
  const [metrics, setMetrics] = useState<ImpactMetrics | null>(null);

  useEffect(() => {
    fetch('/api/v1/analytics/environmental-impact')
      .then(res => res.json())
      .then(data => setMetrics(data))
      .catch(() => {});
  }, []);

  return (
    <div className="py-8">
      <ImpactDashboard metrics={metrics} />
    </div>
  );
};
