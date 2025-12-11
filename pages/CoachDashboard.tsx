import React, { useState, useEffect } from 'react';
import { getCoachBookings, updateBookingStatus, getCoaches, toggleCoachAvailability } from '../services/mockApi';
import { Booking, Coach, User } from '../types';
import { format, addDays, startOfToday } from 'date-fns';
import { CheckCircle, XCircle, Clock, DollarSign, Calendar, TrendingUp, Zap } from 'lucide-react';

interface CoachDashboardProps {
  currentUser: User;
}

const CoachDashboard: React.FC<CoachDashboardProps> = ({ currentUser }) => {
  // Use the logged in user's ID
  const COACH_ID = currentUser.id;
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [coachProfile, setCoachProfile] = useState<Coach | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewDate, setViewDate] = useState(startOfToday());

  useEffect(() => {
    fetchData();
  }, [viewDate, COACH_ID]);

  const fetchData = async () => {
    setIsLoading(true);
    const [b, coaches] = await Promise.all([
      getCoachBookings(COACH_ID),
      getCoaches()
    ]);
    setBookings(b);
    setCoachProfile(coaches.find(c => c.id === COACH_ID) || null);
    setIsLoading(false);
  };

  const handleStatusUpdate = async (bookingId: string, status: 'confirmed' | 'rejected') => {
    await updateBookingStatus(bookingId, status);
    fetchData();
  };

  const handleToggleSlot = async (hour: number) => {
    const slotDate = new Date(viewDate);
    slotDate.setHours(hour, 0, 0, 0);
    await toggleCoachAvailability(COACH_ID, slotDate.toISOString());
    fetchData();
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending_approval');
  const upcomingBookings = bookings.filter(b => b.status === 'confirmed' && new Date(b.startTime) >= new Date());
  
  // Stats
  const totalEarnings = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((acc, b) => acc + b.pricing.coachFee, 0);

  const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 10 PM

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>;
  if (!coachProfile) return <div className="p-8 text-center text-slate-500">Coach profile not found. Please contact admin.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
           <div className="flex items-center gap-2 mb-1">
             <h1 className="text-3xl font-bold text-slate-900">Coach Dashboard</h1>
             <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold uppercase">Pro</span>
           </div>
           <p className="text-slate-500">Welcome back, {coachProfile.name}.</p>
        </div>
        <div className="flex gap-4">
             <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center gap-3">
                 <div className="bg-emerald-100 p-2 rounded-full text-emerald-600"><DollarSign size={20} /></div>
                 <div>
                    <p className="text-xs text-slate-500 font-medium">Earnings</p>
                    <p className="text-xl font-bold text-slate-900">${totalEarnings}</p>
                 </div>
             </div>
             <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center gap-3">
                 <div className="bg-blue-100 p-2 rounded-full text-blue-600"><TrendingUp size={20} /></div>
                 <div>
                    <p className="text-xs text-slate-500 font-medium">Rate (AI)</p>
                    <p className="text-xl font-bold text-slate-900">${coachProfile.hourlyRate}/hr</p>
                 </div>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COL: Bookings Management */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* Pending Requests */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-4 border-b bg-amber-50 flex justify-between items-center">
                    <h3 className="font-bold text-amber-900 flex items-center gap-2">
                        <Clock size={18} /> Pending Requests ({pendingBookings.length})
                    </h3>
                </div>
                <div className="p-4 space-y-3">
                    {pendingBookings.length === 0 && <p className="text-slate-400 text-center py-4">No pending requests.</p>}
                    {pendingBookings.map(b => (
                        <div key={b.id} className="border rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                                <p className="font-bold text-slate-800">{format(b.startTime, 'MMM d, h:mm a')} - {format(b.endTime, 'h:mm a')}</p>
                                <p className="text-sm text-slate-500">{b.courtId} • Revenue: <span className="font-medium text-emerald-600">+${b.pricing.coachFee}</span></p>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleStatusUpdate(b.id, 'confirmed')}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-1"
                                >
                                    <CheckCircle size={16} /> Accept
                                </button>
                                <button 
                                    onClick={() => handleStatusUpdate(b.id, 'rejected')}
                                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 flex items-center gap-1"
                                >
                                    <XCircle size={16} /> Decline
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Upcoming Schedule */}
            <div className="bg-white rounded-xl shadow-sm border">
                <div className="p-4 border-b">
                    <h3 className="font-bold text-slate-900">Upcoming Sessions</h3>
                </div>
                <div className="divide-y">
                    {upcomingBookings.length === 0 && <p className="text-slate-400 text-center p-8">No upcoming sessions.</p>}
                    {upcomingBookings.map(b => (
                        <div key={b.id} className="p-4 hover:bg-slate-50 flex justify-between items-center">
                             <div className="flex items-center gap-4">
                                <div className="bg-blue-50 text-blue-600 p-3 rounded-lg font-bold text-center w-16 leading-tight">
                                    <span className="block text-xs uppercase">{format(b.startTime, 'MMM')}</span>
                                    <span className="block text-xl">{format(b.startTime, 'd')}</span>
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900">{format(b.startTime, 'h:mm a')} - {format(b.endTime, 'h:mm a')}</p>
                                    <p className="text-sm text-slate-500">Confirmed • {b.courtId}</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded font-medium">Active</span>
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* RIGHT COL: Availability Manager */}
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-4">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Calendar size={18} /> Availability Manager
                </h3>
                
                {/* Date Nav */}
                <div className="flex justify-between items-center mb-4 bg-slate-50 p-2 rounded-lg">
                    <button onClick={() => setViewDate(addDays(viewDate, -1))} className="p-1 hover:bg-white rounded"><XCircle className="rotate-45" size={20} /></button>
                    <span className="font-semibold text-sm">{format(viewDate, 'EEE, MMM d')}</span>
                    <button onClick={() => setViewDate(addDays(viewDate, 1))} className="p-1 hover:bg-white rounded"><XCircle className="rotate-45" size={20} /></button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {hours.map(h => {
                        const slotDate = new Date(viewDate);
                        slotDate.setHours(h, 0, 0, 0);
                        const isBlocked = coachProfile.blockedSlots.includes(slotDate.toISOString());
                        
                        // Check if actually booked (can't block if booked)
                        const isBooked = bookings.some(b => 
                            b.status === 'confirmed' && 
                            b.startTime.getTime() === slotDate.getTime()
                        );

                        return (
                            <button
                                key={h}
                                disabled={isBooked}
                                onClick={() => handleToggleSlot(h)}
                                className={`
                                    py-2 px-3 rounded-md text-sm font-medium border transition-all text-left flex justify-between items-center
                                    ${isBooked ? 'bg-blue-100 border-blue-200 text-blue-700 cursor-not-allowed' : ''}
                                    ${!isBooked && isBlocked ? 'bg-red-50 border-red-200 text-red-500' : ''}
                                    ${!isBooked && !isBlocked ? 'bg-white hover:bg-slate-50 text-slate-600' : ''}
                                `}
                            >
                                <span>{format(slotDate, 'h:00 a')}</span>
                                {isBooked && <Zap size={14} />}
                                {!isBooked && isBlocked && <span className="text-xs">OFF</span>}
                            </button>
                        )
                    })}
                </div>
                <p className="text-xs text-slate-400 mt-4 text-center">Tap time slots to mark as Unavailable (OFF).</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CoachDashboard;
