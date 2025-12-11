import React, { useState, useEffect } from 'react';
import { getCourts, getBookingsForDate, createBooking, getCoaches } from '../services/mockApi';
import { Court, Booking, Coach } from '../types';
import SlotGrid from '../components/SlotGrid';
import BookingModal from '../components/BookingModal';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';

const BookingPage: React.FC = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [courts, setCourts] = useState<Court[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [selectedSlot, setSelectedSlot] = useState<{ courtId: string; hour: number } | null>(null);

  useEffect(() => {
    fetchData();
  }, [date]);

  const fetchData = async () => {
    setIsLoading(true);
    const [fetchedCourts, fetchedBookings, fetchedCoaches] = await Promise.all([
      getCourts(),
      getBookingsForDate(date),
      getCoaches()
    ]);
    setCourts(fetchedCourts);
    setBookings(fetchedBookings);
    setCoaches(fetchedCoaches);
    setIsLoading(false);
  };

  const handleBookingSubmit = async (data: any) => {
    if (!selectedSlot) return;

    const startTime = new Date(date);
    startTime.setHours(selectedSlot.hour, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(selectedSlot.hour + 1, 0, 0, 0);

    const newBooking = {
      courtId: selectedSlot.courtId,
      userId: 'user_123', // Note: In a real redux app, this would be selected from store. For this specific component refactor, we are keeping it simple as prop drilling BookingPage is complex without Context. The UserPortal MyBookings handles specific user data.
      startTime,
      endTime,
      resources: {
        rackets: data.rackets,
        shoes: data.shoes,
        coachId: data.coachId
      },
      pricing: data.pricing
    };

    await createBooking(newBooking);
    await fetchData(); // Refresh grid
    setSelectedSlot(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header & Date Navigation */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Find a Court</h1>
          <p className="text-slate-500 mt-1">Select a time slot to view dynamic pricing.</p>
        </div>

        <div className="flex items-center bg-white p-1 rounded-xl border shadow-sm">
          <button 
            onClick={() => setDate(subDays(date, 1))}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2 px-6 font-semibold text-slate-700 w-48 justify-center">
            <Calendar size={18} className="text-slate-400" />
            {format(date, 'EEE, MMM d')}
          </div>
          <button 
            onClick={() => setDate(addDays(date, 1))}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-400">
          Loading availability...
        </div>
      ) : (
        <SlotGrid 
          date={date} 
          courts={courts} 
          bookings={bookings} 
          onSelectSlot={(courtId, hour) => setSelectedSlot({ courtId, hour })} 
        />
      )}

      {selectedSlot && (
        <BookingModal
          isOpen={!!selectedSlot}
          onClose={() => setSelectedSlot(null)}
          selectedCourt={courts.find(c => c.id === selectedSlot.courtId)!}
          date={date}
          hour={selectedSlot.hour}
          onSubmit={handleBookingSubmit}
          coaches={coaches}
        />
      )}
    </div>
  );
};

export default BookingPage;
