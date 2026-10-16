export type UserRole = 
  | 'individual' 
  | 'organization_manager' 
  | 'collector' 
  | 'partner' 
  | 'admin' 
  | 'super_admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  preferred_language: 'en' | 'te';
  organization_id?: string;
  is_active: boolean;
  is_verified: boolean;
  reward_points: number;
  created_at: string;
}

export interface DeviceCategory {
  id: string;
  name: string;
  name_te: string;
  description: string;
  description_te: string;
  hazard_level: 'low' | 'medium' | 'high' | 'critical';
  special_handling_instructions?: string;
  special_handling_instructions_te?: string;
  estimated_points_per_kg: number;
  image_url?: string;
}

export type RequestStatus = 
  | 'draft'
  | 'submitted'
  | 'analyzing'
  | 'awaiting_confirmation'
  | 'ready_for_pickup'
  | 'collector_assigned'
  | 'pickup_scheduled'
  | 'collected'
  | 'in_transit'
  | 'received_at_facility'
  | 'under_inspection'
  | 'processing'
  | 'completed'
  | 'cancelled';

export interface EWasteRequest {
  id: string;
  request_code: string;
  user_id: string;
  category_id?: string;
  category_name?: string;
  device_name: string;
  device_brand?: string;
  device_model?: string;
  condition_description?: string;
  quantity: number;
  estimated_weight_kg: number;
  actual_weight_kg?: number;
  status: RequestStatus;
  recommendation?: 'reuse' | 'repair' | 'recycle' | 'manual_inspection';
  pickup_date?: string;
  pickup_slot?: string;
  pickup_address_text?: string;
  latitude?: number;
  longitude?: number;
  assigned_collector_id?: string;
  assigned_collector_name?: string;
  final_processing_outcome?: string;
  created_at: string;
  status_history?: StatusHistoryItem[];
  ai_analysis?: AIAnalysis;
  handover_receipt?: HandoverReceipt;
}

export interface StatusHistoryItem {
  id: string;
  previous_status?: string;
  new_status: string;
  changed_by_name: string;
  notes?: string;
  created_at: string;
}

export interface AIAnalysis {
  id: string;
  image_filename: string;
  image_url?: string;
  model_version: string;
  predicted_category: string;
  confidence: number;
  secondary_predictions: Array<{ category: string; probability: number }>;
  visual_flags: {
    has_cracked_screen: boolean;
    has_swollen_battery: boolean;
    has_burn_or_corrosion: boolean;
    has_missing_casing: boolean;
  };
  recommendation: string;
  reasoning_en: string;
  reasoning_te: string;
  benchmark_materials?: Record<string, number>;
  created_at: string;
}

export interface HandoverReceipt {
  id: string;
  receipt_code: string;
  request_id: string;
  collector_id: string;
  collector_name: string;
  verified_weight_kg: number;
  verified_quantity: number;
  condition_confirmed: string;
  points_awarded: number;
  created_at: string;
}

export interface ImpactMetrics {
  verified_collected_kg: number;
  co2_saved_kg: number;
  total_devices_collected: number;
  metrics: {
    total_weight_diverted_kg: number;
    total_devices_collected: number;
    completed_devices: number;
    devices_reused: number;
    devices_repaired: number;
    devices_recycled: number;
    carbon_offset_co2e_kg: number;
    groundwater_protected_liters: number;
    trees_equivalent_annual: number;
    materials_recovered: Array<{ material: string; quantity: number; unit: string }>;
    monthly_trends: Array<{ month: string; collected_kg: number; co2_saved_kg: number }>;
  };
}

export interface MarketplaceListing {
  id: string;
  seller_partner_id: string;
  title: string;
  category: string;
  description: string;
  condition_grade: string;
  price_inr: number;
  warranty_months: number;
  status: 'available' | 'reserved' | 'sold';
  image_url?: string;
  created_at: string;
}

export interface Campaign {
  id: string;
  title: string;
  title_te?: string;
  organization_name?: string;
  target_kg: number;
  collected_kg: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}
