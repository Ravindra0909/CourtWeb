import { Booking, Court, PricingRules, PricingBreakdown, Coach, BookingStatus, User, Role } from '../types';
import { INITIAL_COURTS, INITIAL_COACHES, INITIAL_PRICING_RULES } from '../constants';

// In-memory "Database"
let bookingsDb: Booking[] = [];
let courtsDb: Court[] = [...INITIAL_COURTS];
let coachesDb: Coach[] = [...INITIAL_COACHES];
let rulesDb: PricingRules = { ...INITIAL_PRICING_RULES };

// Mock Users
let usersDb: User[] = [
  { id: 'user_123', name: 'Alice Member', email: 'alice@test.com', role: 'user' },
  { id: 'coach1', name: 'John Doe', email: 'john@test.com', role: 'coach' },
  { id: 'admin1', name: 'Admin User', email: 'admin@courtconnect.com', role: 'admin' }
];

/**
 * Simulate DB Latency
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// --- AUTH METHODS ---

export const login = async (email: string): Promise<User> => {
  await delay(600);
  const user = usersDb.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error("Invalid credentials");
  return user;
};

export const signup = async (name: string, email: string, role: Role): Promise<User> => {
  await delay(800);
  
  if (usersDb.find(u => u.email === email)) {
    throw new Error("Email already registered");
  }

  const newUser: User = {
    id: `user_${Math.random().toString(36).substring(7)}`,
    name,
    email,
    role
  };

  usersDb.push(newUser);

  // If user signs up as a coach, add them to the Coach DB so they appear in bookings
  if (role === 'coach') {
    const newCoach: Coach = {
      id: newUser.id,
      name: newUser.name,
      specialty: 'General Trainer', // Default
      hourlyRate: 20, // Default
      blockedSlots: [],
      bio: 'New coach at CourtConnect!',
      rating: 5.0
    };
    coachesDb.push(newCoach);
  }

  return newUser;
};


// --- CORE METHODS ---

export const getCourts = async (): Promise<Court[]> => {
  await delay(300);
  return courtsDb;
};

export const getCoaches = async (): Promise<Coach[]> => {
  await delay(300);
  return coachesDb;
};

export const getPricingRules = async (): Promise<PricingRules> => {
  await delay(200);
  return rulesDb;
};

export const updatePricingRules = async (newRules: PricingRules): Promise<void> => {
  await delay(300);
  rulesDb = newRules;
};

// --- USER METHODS ---

export const getBookingsForDate = async (date: Date): Promise<Booking[]> => {
  await delay(400);
  return bookingsDb.filter(b => 
    b.startTime.getDate() === date.getDate() &&
    b.startTime.getMonth() === date.getMonth() &&
    b.startTime.getFullYear() === date.getFullYear() &&
    b.status !== 'cancelled' && b.status !== 'rejected'
  );
};

export const getUserBookings = async (userId: string): Promise<Booking[]> => {
  await delay(300);
  // Sort by date descending
  return bookingsDb
    .filter(b => b.userId === userId)
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
};

export const cancelBooking = async (bookingId: string): Promise<void> => {
  await delay(300);
  const booking = bookingsDb.find(b => b.id === bookingId);
  if (booking) {
    booking.status = 'cancelled';
  }
};

// --- PROVIDER METHODS ---

export const getCoachBookings = async (coachId: string): Promise<Booking[]> => {
  await delay(300);
  return bookingsDb
    .filter(b => b.resources.coachId === coachId && b.status !== 'cancelled')
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
};

export const updateBookingStatus = async (bookingId: string, status: BookingStatus): Promise<void> => {
  await delay(300);
  const booking = bookingsDb.find(b => b.id === bookingId);
  if (booking) {
    booking.status = status;
  }
};

export const toggleCoachAvailability = async (coachId: string, slotIso: string): Promise<void> => {
  await delay(200);
  const coach = coachesDb.find(c => c.id === coachId);
  if (!coach) return;

  if (coach.blockedSlots.includes(slotIso)) {
    coach.blockedSlots = coach.blockedSlots.filter(s => s !== slotIso);
  } else {
    coach.blockedSlots.push(slotIso);
  }
};

// --- ADMIN METHODS ---

export const getAllBookings = async (): Promise<Booking[]> => {
  await delay(400);
  return bookingsDb.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
};

/**
 * THE PRICING ENGINE
 */
export const calculatePrice = (
  courtId: string,
  date: Date,
  hour: number,
  rackets: number,
  shoes: number,
  coachId?: string
): PricingBreakdown => {
  const court = courtsDb.find(c => c.id === courtId);
  const basePrice = court ? court.basePrice : 0;
  
  const day = date.getDay(); // 0 Sun, 6 Sat
  const isWeekend = day === 0 || day === 6;
  const isPeak = hour >= rulesDb.peakStartHour && hour < rulesDb.peakEndHour;

  let runningTotal = basePrice;
  let weekendFee = 0;
  let timeMultiplier = 1;

  if (isWeekend) {
    weekendFee = rulesDb.weekendSurcharge;
    runningTotal += weekendFee;
  }

  if (isPeak) {
    timeMultiplier = rulesDb.peakHourMultiplier;
    runningTotal = runningTotal * timeMultiplier;
  }

  const equipmentFee = (rackets * rulesDb.racketPrice) + (shoes * rulesDb.shoePrice);
  
  let coachFee = 0;
  if (coachId) {
    const coach = coachesDb.find(c => c.id === coachId);
    if (coach) coachFee = coach.hourlyRate;
  }

  const finalTotal = runningTotal + equipmentFee + coachFee;

  return {
    basePrice,
    timeMultiplier,
    weekendSurcharge: weekendFee,
    equipmentFee,
    coachFee,
    total: parseFloat(finalTotal.toFixed(2)),
    isPeak,
    isWeekend
  };
};

/**
 * CHECK AVAILABILITY LOGIC
 */
export const checkAvailability = async (
  courtId: string,
  date: Date,
  hour: number,
  coachId?: string
): Promise<{ available: boolean; reason?: string }> => {
  await delay(200);

  const startToCheck = new Date(date);
  startToCheck.setHours(hour, 0, 0, 0);
  
  const endToCheck = new Date(startToCheck);
  endToCheck.setHours(hour + 1, 0, 0, 0);

  // 1. Check if Coach manually blocked this slot
  if (coachId) {
    const coach = coachesDb.find(c => c.id === coachId);
    if (coach) {
      const slotIso = startToCheck.toISOString();
      if (coach.blockedSlots.includes(slotIso)) {
        return { available: false, reason: "Coach has blocked this time slot." };
      }
    }
  }

  // 2. Check Overlaps
  const conflictingBooking = bookingsDb.find(b => {
    if (b.status === 'cancelled' || b.status === 'rejected') return false;
    
    const bookingStart = b.startTime.getTime();
    const bookingEnd = b.endTime.getTime();
    const checkStart = startToCheck.getTime();
    const checkEnd = endToCheck.getTime();

    const isTimeOverlap = (checkStart < bookingEnd && checkEnd > bookingStart);
    
    if (!isTimeOverlap) return false;

    if (b.courtId === courtId) return true; 
    if (coachId && b.resources.coachId === coachId) return true;

    return false;
  });

  if (conflictingBooking) {
    if (conflictingBooking.courtId === courtId) {
      return { available: false, reason: 'Court is booked.' };
    }
    if (coachId && conflictingBooking.resources.coachId === coachId) {
      return { available: false, reason: 'Selected coach is unavailable.' };
    }
  }

  return { available: true };
};

export const createBooking = async (booking: Omit<Booking, 'id' | 'status'>): Promise<Booking> => {
  await delay(500);
  
  const hour = booking.startTime.getHours();
  const availability = await checkAvailability(booking.courtId, booking.startTime, hour, booking.resources.coachId);
  
  if (!availability.available) {
    throw new Error(availability.reason || "Slot no longer available");
  }

  // If a coach is involved, the booking is Pending Approval. Otherwise Confirmed.
  const initialStatus: BookingStatus = booking.resources.coachId ? 'pending_approval' : 'confirmed';

  const newBooking: Booking = {
    ...booking,
    id: Math.random().toString(36).substring(7),
    status: initialStatus
  };

  bookingsDb.push(newBooking);
  return newBooking;
};
