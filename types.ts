export enum ResourceType {
  INDOOR = 'Indoor',
  OUTDOOR = 'Outdoor',
}

export type Role = 'user' | 'coach' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Court {
  id: string;
  name: string;
  type: ResourceType;
  basePrice: number;
}

export interface Coach {
  id: string;
  name: string;
  specialty: string;
  hourlyRate: number;
  blockedSlots: string[]; // ISO strings for specific hours they are unavailable
  bio: string;
  rating: number;
}

export interface PricingRules {
  weekendSurcharge: number;
  peakHourMultiplier: number;
  peakStartHour: number;
  peakEndHour: number;
  racketPrice: number;
  shoePrice: number;
}

export interface PricingBreakdown {
  basePrice: number;
  timeMultiplier: number; // 1 or 1.5 etc
  weekendSurcharge: number;
  coachFee: number;
  equipmentFee: number;
  total: number;
  isPeak: boolean;
  isWeekend: boolean;
}

export type BookingStatus = 'confirmed' | 'pending_approval' | 'cancelled' | 'rejected';

export interface Booking {
  id: string;
  courtId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  resources: {
    rackets: number;
    shoes: number;
    coachId?: string;
  };
  pricing: PricingBreakdown;
  status: BookingStatus;
}

export interface TimeSlot {
  time: number; // 0-23
  label: string;
}
