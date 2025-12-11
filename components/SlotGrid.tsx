import React from 'react';
import { Court, Booking } from '../types';
import { OPENING_HOUR, CLOSING_HOUR } from '../constants';
import { format } from 'date-fns';
import { Lock, Check, Clock } from 'lucide-react';

interface SlotGridProps {
  date: Date;
  courts: Court[];
  bookings: Booking[];
  onSelectSlot: (courtId: string, hour: number) => void;
}

const SlotGrid: React.FC<SlotGridProps> = ({ date, courts, bookings, onSelectSlot }) => {
  const hours = Array.from({ length: CLOSING_HOUR - OPENING_HOUR }, (_, i) => i + OPENING_HOUR);

  const isSlotBooked = (courtId: string, hour: number) => {
    return bookings.some(b => {
      const bHour = b.startTime.getHours();
      return b.courtId === courtId && bHour === hour;
    });
  };

  const isPast = (hour: number) => {
    const now = new Date();
    const checkDate = new Date(date);
    checkDate.setHours(hour, 59, 0, 0);
    return checkDate < now;
  };

  return (
    <div className="overflow-x-auto border rounded-xl shadow-sm bg-white">
      <div className="min-w-[600px]">
        {/* Header */}
        <div className="grid grid-cols-[100px_repeat(3,_1fr)] border-b bg-gray-50">
          <div className="p-4 font-semibold text-gray-500 text-sm flex items-center justify-center">Time</div>
          {courts.map(court => (
            <div key={court.id} className="p-4 text-center border-l">
              <div className="font-bold text-gray-800">{court.name}</div>
              <div className="text-xs text-gray-500 uppercase">{court.type}</div>
            </div>
          ))}
        </div>

        {/* Rows */}
        {hours.map(hour => (
          <div key={hour} className="grid grid-cols-[100px_repeat(3,_1fr)] border-b last:border-b-0 hover:bg-gray-50/50 transition-colors">
            <div className="p-3 text-sm text-gray-500 font-medium flex items-center justify-center border-r">
              {format(new Date().setHours(hour, 0, 0, 0), 'h:00 a')}
            </div>
            {courts.map(court => {
              const booked = isSlotBooked(court.id, hour);
              const past = isPast(hour);

              let cellContent = (
                <div className="flex flex-col items-center text-emerald-600">
                  <span className="text-xs font-semibold">Available</span>
                </div>
              );
              let cellClass = "cursor-pointer hover:bg-emerald-50 bg-white";

              if (booked) {
                cellContent = (
                  <div className="flex flex-col items-center text-red-400">
                    <Lock size={16} />
                    <span className="text-xs mt-1">Booked</span>
                  </div>
                );
                cellClass = "cursor-not-allowed bg-gray-50 opacity-70";
              } else if (past) {
                cellContent = (
                  <div className="flex flex-col items-center text-gray-300">
                    <Clock size={16} />
                  </div>
                );
                cellClass = "cursor-not-allowed bg-gray-100";
              }

              return (
                <div 
                  key={`${court.id}-${hour}`} 
                  onClick={() => !booked && !past && onSelectSlot(court.id, hour)}
                  className={`p-3 h-16 flex items-center justify-center border-l transition-all ${cellClass}`}
                >
                  {cellContent}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SlotGrid;
