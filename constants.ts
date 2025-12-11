import { Court, Coach, ResourceType, PricingRules } from './types';

export const OPENING_HOUR = 8; // 8 AM
export const CLOSING_HOUR = 22; // 10 PM

export const INITIAL_COURTS: Court[] = [
  { id: 'c1', name: 'Court A (Center)', type: ResourceType.INDOOR, basePrice: 20 },
  { id: 'c2', name: 'Court B (East)', type: ResourceType.INDOOR, basePrice: 20 },
  { id: 'c3', name: 'Court C (Outdoor)', type: ResourceType.OUTDOOR, basePrice: 15 },
];

export const INITIAL_COACHES: Coach[] = [
  { 
    id: 'coach1', 
    name: 'John Doe', 
    specialty: 'Badminton Pro', 
    hourlyRate: 25, 
    blockedSlots: [],
    bio: 'Former national champion with 10 years of coaching experience.',
    rating: 4.9
  },
  { 
    id: 'coach2', 
    name: 'Sarah Smith', 
    specialty: 'Fitness & Agility', 
    hourlyRate: 20, 
    blockedSlots: [],
    bio: 'Certified strength and conditioning specialist focusing on court agility.',
    rating: 4.7
  },
];

export const INITIAL_PRICING_RULES: PricingRules = {
  weekendSurcharge: 5,
  peakHourMultiplier: 1.5,
  peakStartHour: 18, // 6 PM
  peakEndHour: 21, // 9 PM
  racketPrice: 5,
  shoePrice: 3,
};
