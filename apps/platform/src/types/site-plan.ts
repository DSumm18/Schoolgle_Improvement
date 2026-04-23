/**
 * Types for the interactive site plan viewer
 */

export interface SchoolRoom {
  id: string;
  school_id: string;
  room_name: string;
  room_code?: string;
  block?: string;
  room_type?: string;
  floor?: string;
  polygon_coords?: number[][];
  compliance_status: 'compliant' | 'action_needed' | 'overdue' | 'unknown';
  condition_rating?: number;
  last_inspection_date?: string;
  next_inspection_due?: string;
  fire_equipment?: FireEquipment[];
  has_emergency_lighting?: boolean;
  has_fire_door?: boolean;
  is_fire_escape_route?: boolean;
  coshh_items_count?: number;
  coshh_last_audit?: string;
  area_sqm?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FireEquipment {
  type: 'extinguisher' | 'fire_blanket' | 'alarm' | 'detector' | 'emergency_lighting' | 'fire_door';
  location: string;
  last_tested?: string;
  status?: 'compliant' | 'expired' | 'missing';
}

export type LayerType = 'rooms' | 'fireEscape' | 'fireEquipment' | 'emergencyLighting' | 'detectors';

export interface LayerState {
  rooms: boolean;
  fireEscape: boolean;
  fireEquipment: boolean;
  emergencyLighting: boolean;
  detectors: boolean;
}
