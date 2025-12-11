import React, { useState } from 'react';
import UserPortal from './pages/UserPortal';
import AdminDashboard from './pages/AdminDashboard';
import CoachDashboard from './pages/CoachDashboard';
import AuthPage from './pages/AuthPage';
import { User } from './types';
import { LayoutGrid, LogOut } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <AuthPage onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-slate-900">
      {/* Navbar */}
      <nav className="bg-slate-900 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg">
              <LayoutGrid size={20} className="text-white" />
            </div>
            <div>
                <span className="font-bold text-xl tracking-tight block leading-none">CourtConnect</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                    {user.role === 'user' ? 'Member Portal' : user.role === 'coach' ? 'Partner Portal' : 'Admin Console'}
                </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user.role}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 hover:text-red-400 transition"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {user.role === 'user' && <UserPortal currentUser={user} />}
        {user.role === 'coach' && <CoachDashboard currentUser={user} />}
        {user.role === 'admin' && <AdminDashboard />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>© 2024 CourtConnect. All rights reserved.</p>
          <p className="mt-1">Built for Sports Facility Management Demo.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
