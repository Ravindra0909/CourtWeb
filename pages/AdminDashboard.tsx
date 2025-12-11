import React, { useState, useEffect } from 'react';
import { getPricingRules, updatePricingRules, getAllBookings } from '../services/mockApi';
import { PricingRules, Booking } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Save, Settings, DollarSign, Calendar as CalendarIcon, Activity } from 'lucide-react';
import { format } from 'date-fns';

const AdminDashboard: React.FC = () => {
  const [rules, setRules] = useState<PricingRules | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [r, b] = await Promise.all([getPricingRules(), getAllBookings()]);
    setRules(r);
    setBookings(b);
  };

  const handleRuleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!rules) return;
    const { name, value } = e.target;
    setRules({ ...rules, [name]: parseFloat(value) });
  };

  const saveRules = async () => {
    if (!rules) return;
    setIsSaving(true);
    await updatePricingRules(rules);
    setIsSaving(false);
    alert('Pricing rules updated successfully!');
  };

  // Stats Calc - Only count confirmed
  const validBookings = bookings.filter(b => b.status === 'confirmed');
  const totalRevenue = validBookings.reduce((acc, b) => acc + b.pricing.total, 0);
  const totalBookingsCount = validBookings.length;

  // Chart Data preparation
  const chartData = validBookings.reduce((acc: any[], curr) => {
    const dateStr = format(curr.startTime, 'MM/dd');
    const found = acc.find(item => item.date === dateStr);
    if (found) {
      found.revenue += curr.pricing.total;
    } else {
      acc.push({ date: dateStr, revenue: curr.pricing.total });
    }
    return acc;
  }, []).slice(-7); 

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'overview' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'settings' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Pricing Config
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 text-green-600 rounded-full">
                  <DollarSign size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Confirmed Revenue</p>
                  <p className="text-2xl font-bold text-slate-900">${totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                  <CalendarIcon size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Confirmed Bookings</p>
                  <p className="text-2xl font-bold text-slate-900">{totalBookingsCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                  <Activity size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Avg Booking Value</p>
                  <p className="text-2xl font-bold text-slate-900">
                    ${totalBookingsCount > 0 ? (totalRevenue / totalBookingsCount).toFixed(2) : '0.00'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white p-6 rounded-xl border shadow-sm h-96">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b'}} 
                  tickFormatter={(value) => `$${value}`} 
                />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                />
                <Bar dataKey="revenue" fill="#0f172a" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#0f172a' : '#334155'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Bookings Table */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
             <div className="px-6 py-4 border-b">
                <h3 className="font-semibold text-slate-800">All Transactions (Live Feed)</h3>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                 <thead className="bg-slate-50 text-slate-500 font-medium">
                   <tr>
                     <th className="px-6 py-3">ID</th>
                     <th className="px-6 py-3">Status</th>
                     <th className="px-6 py-3">Date</th>
                     <th className="px-6 py-3">Court</th>
                     <th className="px-6 py-3">Resources</th>
                     <th className="px-6 py-3 text-right">Total</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y">
                   {bookings.slice(0, 10).map(b => (
                     <tr key={b.id} className="hover:bg-slate-50">
                       <td className="px-6 py-4 font-mono text-slate-500">#{b.id}</td>
                       <td className="px-6 py-4">
                           <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                ${b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : ''}
                                ${b.status === 'pending_approval' ? 'bg-amber-100 text-amber-700' : ''}
                                ${b.status === 'cancelled' || b.status === 'rejected' ? 'bg-red-100 text-red-700' : ''}
                           `}>
                               {b.status}
                           </span>
                       </td>
                       <td className="px-6 py-4">{format(b.startTime, 'MMM d, h:mm a')}</td>
                       <td className="px-6 py-4">
                         <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs">
                           {b.courtId}
                         </span>
                       </td>
                       <td className="px-6 py-4 text-slate-600">
                         {b.resources.rackets > 0 && `Rackets (${b.resources.rackets}) `}
                         {b.resources.coachId && <span className="text-purple-600 font-medium"> + Coach</span>}
                       </td>
                       <td className="px-6 py-4 text-right font-bold text-slate-900">${b.pricing.total}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm p-8 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b">
            <Settings className="text-slate-400" />
            <h2 className="text-xl font-bold text-slate-900">Dynamic Pricing Rules</h2>
          </div>
          
          {rules && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Weekend Surcharge ($)</label>
                  <input 
                    type="number" 
                    name="weekendSurcharge"
                    value={rules.weekendSurcharge}
                    onChange={handleRuleChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                  />
                  <p className="text-xs text-slate-500 mt-1">Added on Sat/Sun per hour.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Peak Multiplier (x)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    name="peakHourMultiplier"
                    value={rules.peakHourMultiplier}
                    onChange={handleRuleChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                  />
                  <p className="text-xs text-slate-500 mt-1">Multiplies base price.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Peak Start Hour (24h)</label>
                  <input 
                    type="number" 
                    name="peakStartHour"
                    value={rules.peakStartHour}
                    onChange={handleRuleChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Peak End Hour (24h)</label>
                  <input 
                    type="number" 
                    name="peakEndHour"
                    value={rules.peakEndHour}
                    onChange={handleRuleChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                  />
                </div>
              </div>

               <div className="grid grid-cols-2 gap-6 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Racket Price ($)</label>
                  <input 
                    type="number" 
                    name="racketPrice"
                    value={rules.racketPrice}
                    onChange={handleRuleChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Shoes Price ($)</label>
                  <input 
                    type="number" 
                    name="shoePrice"
                    value={rules.shoePrice}
                    onChange={handleRuleChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                  />
                </div>
              </div>

              <div className="pt-6">
                <button 
                  onClick={saveRules}
                  disabled={isSaving}
                  className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 transition flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  {isSaving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;