import React from 'react';
import { PickupScheduler } from '../components/pickup/PickupScheduler';

export const SchedulePage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <PickupScheduler />
    </div>
  );
};
