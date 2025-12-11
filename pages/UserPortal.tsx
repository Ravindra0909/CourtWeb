import React, { useState, useEffect } from 'react';
import BookingPage from './BookingPage'; // Reuse the grid logic
import { getUserBookings, cancelBooking } from '../services/mockApi';
import { Booking, User } from '../types';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, MapPin, Trash2, CheckCircle, Clock3, XCircle } from 'lucide-react';

interface UserPortalProps {
  currentUser: User;
}

// "My Bookings" Sub-component
const MyBookings: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    setIsLoading(true);
    const data = await getUserBookings(currentUser.id);
    setBookings(data);
    setIsLoading(false);
  };

  const handleCancel = async (id: string) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      await cancelBooking(id);
      fetchData();
    }
  };

  const addToCalendar = (b: Booking) => {
    alert(`📅 Added to your calendar:\n${format(b.startTime, 'MMM d')} @ ${format(b.startTime, 'h:mm a')}\nCourt: ${b.courtId}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-semibold"><CheckCircle size={12} /> Confirmed</span>;
      case 'pending_approval': return <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-semibold"><Clock3 size={12} /> Pending</span>;
      case 'cancelled': return <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs font-semibold"><XCircle size={12} /> Cancelled</span>;
      case 'rejected': return <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold"><XCircle size={12} /> Rejected</span>;
      default: return null;
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading your bookings...</div>;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">My Bookings</h2>
      {bookings.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl border border-dashed">
            <p className="text-slate-500">You haven't booked any slots yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(booking => (
            <div key={booking.id} className="bg-white p-5 rounded-xl border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                   {getStatusBadge(booking.status)}
                   <span className="text-sm text-slate-400 font-mono">#{booking.id}</span>
                </div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <CalendarIcon size={18} className="text-blue-500" />
                    {format(booking.startTime, 'EEEE, MMM d, yyyy')}
                </h3>
                <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1"><Clock size={14} /> {format(booking.startTime, 'h:mm a')} - {format(booking.endTime, 'h:mm a')}</span>
                    <span className="flex items-center gap-1"><MapPin size={14} /> {booking.courtId}</span>
                </div>
                {booking.resources.coachId && (
                    <div className="text-xs font-semibold text-purple-600 bg-purple-50 inline-block px-2 py-0.5 rounded">
                        + Coach Session
                    </div>
                )}
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="text-right mr-2 hidden md:block">
                    <p className="text-sm text-slate-500">Total</p>
                    <p className="font-bold text-slate-900">${booking.pricing.total.toFixed(2)}</p>
                </div>
                {booking.status !== 'cancelled' && booking.status !== 'rejected' && (
                    <>
                    <button 
                        onClick={() => addToCalendar(booking)}
                        className="flex-1 md:flex-none px-4 py-2 border rounded-lg text-sm font-medium hover:bg-slate-50 transition"
                    >
                        Sync Calendar
                    </button>
                    <button 
                        onClick={() => handleCancel(booking.id)}
                        className="flex-1 md:flex-none px-4 py-2 border border-red-100 text-red-600 bg-red-50 rounded-lg text-sm font-medium hover:bg-red-100 transition flex items-center justify-center gap-2"
                    >
                        <Trash2 size={16} /> Cancel
                    </button>
                    </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const UserPortal: React.FC<UserPortalProps> = ({ currentUser }) => {
    const [view, setView] = useState<'book' | 'my-bookings'>('book');

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sub-nav for User Portal */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 flex gap-6">
                    <button 
                        onClick={() => setView('book')}
                        className={`py-4 text-sm font-medium border-b-2 transition ${view === 'book' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        Book a Court
                    </button>
                    <button 
                        onClick={() => setView('my-bookings')}
                        className={`py-4 text-sm font-medium border-b-2 transition ${view === 'my-bookings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        My Bookings
                    </button>
                </div>
            </div>

            {view === 'book' ? <BookingPage /> : <MyBookings currentUser={currentUser} />}
        </div>
    );
}

export default UserPortal;
