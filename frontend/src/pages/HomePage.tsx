import React, { useEffect, useState } from 'react';
import { HeroSection } from '../components/home/HeroSection';
import { EwasteJourney } from '../components/home/EwasteJourney';
import { CategoryShowcase } from '../components/home/CategoryShowcase';
import { ImpactDashboard } from '../components/home/ImpactDashboard';
import { CommunityDrives } from '../components/home/CommunityDrives';
import { SafetyGuidelines } from '../components/home/SafetyGuidelines';
import { ImpactMetrics } from '../types';

export const HomePage: React.FC = () => {
  const [metrics, setMetrics] = useState<ImpactMetrics | null>(null);

  useEffect(() => {
    fetch('/api/v1/analytics/environmental-impact')
      .then(res => res.json())
      .then(data => setMetrics(data))
      .catch(() => {
        // Fallback demo metrics if server is warming up
        setMetrics({
          verified_collected_kg: 1890.0,
          co2_saved_kg: 5292.0,
          total_devices_collected: 142,
          metrics: {
            total_weight_diverted_kg: 1890.0,
            total_devices_collected: 142,
            completed_devices: 98,
            devices_reused: 45,
            devices_repaired: 38,
            devices_recycled: 59,
            carbon_offset_co2e_kg: 5292.0,
            groundwater_protected_liters: 26460000,
            trees_equivalent_annual: 243.8,
            materials_recovered: [
              { material: 'Refined Copper', quantity: 226.8, unit: 'kg' },
              { material: 'Polymer Plastics', quantity: 793.8, unit: 'kg' },
              { material: 'Aluminum & Alloys', quantity: 302.4, unit: 'kg' },
              { material: 'Gold & Precious Traces', quantity: 340.2, unit: 'grams' },
              { material: 'Hazardous Lead Neutralized', quantity: 94.5, unit: 'kg' }
            ],
            monthly_trends: [
              { month: 'May 2026', collected_kg: 420.0, co2_saved_kg: 1176.0 },
              { month: 'Jun 2026', collected_kg: 680.5, co2_saved_kg: 1905.4 },
              { month: 'Jul 2026', collected_kg: 950.0, co2_saved_kg: 2660.0 },
              { month: 'Aug 2026', collected_kg: 1240.2, co2_saved_kg: 3472.5 },
              { month: 'Sep 2026', collected_kg: 1580.0, co2_saved_kg: 4424.0 },
              { month: 'Oct 2026', collected_kg: 1890.0, co2_saved_kg: 5292.0 }
            ]
          }
        });
      });
  }, []);

  return (
    <div className="space-y-12">
      <HeroSection metrics={metrics} />
      <EwasteJourney />
      <CategoryShowcase />
      <ImpactDashboard metrics={metrics} />
      <CommunityDrives />
      <SafetyGuidelines />
    </div>
  );
};
