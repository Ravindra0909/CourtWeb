import React, { useState, useEffect } from 'react';
import { Court, Coach, PricingBreakdown } from '../types';
import { calculatePrice, checkAvailability } from '../services/mockApi';
import { X, User, ShoppingBag, AlertCircle, CheckCircle, Loader2, Info } from 'lucide-react';
import { format } from 'date-fns';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  selectedCourt: Court;
  date: Date;
  hour: number;
  coaches: Coach[];
}

const BookingModal: React.FC<BookingModalProps> = ({ 
  isOpen, onClose, onSubmit, selectedCourt, date, hour, coaches 
}) => {
  const [rackets, setRackets] = useState(0);
  const [shoes, setShoes] = useState(0);
  const [selectedCoachId, setSelectedCoachId] = useState<string>('');
  const [pricing, setPricing] = useState<PricingBreakdown | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  // Reset state when modal opens for new slot
  useEffect(() => {
    if (isOpen) {
      setRackets(0);
      setShoes(0);
      setSelectedCoachId('');
      setAvailabilityError(null);
    }
  }, [isOpen, selectedCourt.id, hour]);

  // Recalculate price when inputs change
  useEffect(() => {
    if (isOpen) {
      const breakdown = calculatePrice(
        selectedCourt.id,
        date,
        hour,
        rackets,
        shoes,
        selectedCoachId || undefined
      );
      setPricing(breakdown);

      // Simple real-time conflict check for coach
      if (selectedCoachId) {
        checkAvailability(selectedCourt.id, date, hour, selectedCoachId).then(res => {
            if (!res.available) {
                setAvailabilityError(res.reason || "Coach unavailable");
            } else {
                setAvailabilityError(null);
            }
        });
      } else {
        setAvailabilityError(null);
      }
    }
  }, [rackets, shoes, selectedCoachId, selectedCourt, date, hour, isOpen]);

  const handleSubmit = async () => {
    if (availabilityError) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        rackets,
        shoes,
        coachId: selectedCoachId || undefined,
        pricing
      });
      onClose();
    } catch (e: any) {
        setAvailabilityError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Left: Configuration */}
        <div className="p-6 md:w-3/5 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">Complete Booking</h2>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Slot Info */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-500" /> Selected Slot
              </h3>
              <div className="text-sm text-slate-600 grid grid-cols-2 gap-2">
                <div>Court: <span className="font-medium text-slate-900">{selectedCourt.name}</span></div>
                <div>Date: <span className="font-medium text-slate-900">{format(date, 'MMM d, yyyy')}</span></div>
                <div>Time: <span className="font-medium text-slate-900">{format(new Date().setHours(hour,0,0,0), 'h:00 a')}</span></div>
                <div>Base Rate: <span className="font-medium text-slate-900">${selectedCourt.basePrice}/hr</span></div>
              </div>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <ShoppingBag size={18} className="text-blue-500" /> Equipment Add-ons
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="border p-3 rounded-lg hover:border-blue-300 transition-colors">
                  <label className="block text-sm font-medium text-slate-600 mb-1">Rackets ($5)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="4"
                    value={rackets}
                    onChange={(e) => setRackets(parseInt(e.target.value) || 0)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="border p-3 rounded-lg hover:border-blue-300 transition-colors">
                  <label className="block text-sm font-medium text-slate-600 mb-1">Shoes ($3)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="4"
                    value={shoes}
                    onChange={(e) => setShoes(parseInt(e.target.value) || 0)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Coach */}
            <div>
              <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <User size={18} className="text-purple-500" /> Professional Coaching
              </h3>
              <select 
                value={selectedCoachId}
                onChange={(e) => setSelectedCoachId(e.target.value)}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2.5 bg-white border"
              >
                <option value="">No Coach needed</option>
                {coaches.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.specialty} (+${c.hourlyRate}/hr)
                  </option>
                ))}
              </select>
              {selectedCoachId && !availabilityError && (
                 <div className="mt-2 text-sm text-amber-600 flex items-start gap-2 bg-amber-50 p-2 rounded">
                    <Info size={16} className="mt-0.5 shrink-0" />
                    <span>Booking with a coach requires approval. Your slot will be marked as "Pending" until confirmed.</span>
                 </div>
              )}
              {availabilityError && (
                  <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {availabilityError}
                  </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Pricing Engine Output */}
        <div className="md:w-2/5 bg-slate-50 border-t md:border-t-0 md:border-l p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4">Price Breakdown</h3>
            
            {pricing && (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Base Rate</span>
                  <span>${pricing.basePrice.toFixed(2)}</span>
                </div>
                
                {pricing.isWeekend && (
                  <div className="flex justify-between text-amber-600 bg-amber-50 p-2 rounded">
                    <span>Weekend Surcharge</span>
                    <span>+${pricing.weekendSurcharge.toFixed(2)}</span>
                  </div>
                )}
                
                {pricing.isPeak && (
                  <div className="flex justify-between text-orange-600 bg-orange-50 p-2 rounded">
                    <span>Peak Hour ({pricing.timeMultiplier}x)</span>
                    <span className="font-mono">Active</span>
                  </div>
                )}

                {(pricing.equipmentFee > 0) && (
                  <div className="flex justify-between text-blue-600">
                    <span>Equipment</span>
                    <span>+${pricing.equipmentFee.toFixed(2)}</span>
                  </div>
                )}

                {(pricing.coachFee > 0) && (
                  <div className="flex justify-between text-purple-600">
                    <span>Coach Fee</span>
                    <span>+${pricing.coachFee.toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t border-slate-200 my-4"></div>
                
                <div className="flex justify-between items-end">
                  <span className="font-bold text-slate-700 text-lg">Total</span>
                  <span className="font-extrabold text-slate-900 text-3xl">
                    ${pricing.total.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !!availabilityError}
            className="w-full mt-6 bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : (selectedCoachId ? 'Request Booking' : 'Confirm Booking')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
