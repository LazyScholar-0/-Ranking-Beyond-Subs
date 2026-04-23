import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { PlayCircle, UserCircle2 } from 'lucide-react';
import SearchHome from './pages/SearchHome';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import { useAuth } from './lib/AuthContext';

export default function App() {
  const location = useLocation();
  const { user } = useAuth();

  const navLinks = [
    { name: 'Search', path: '/' },
    { name: 'Top 100', path: '/leaderboard' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-[#FF4B2B]/30 flex flex-col">
      {/* Header */}
      <header className="border-b border-[#262626] px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0A0A0A]/80 backdrop-blur z-50">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#FF4B2B] flex items-center justify-center shadow-[0_0_15px_rgba(255,75,43,0.5)]">
            <PlayCircle className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">Ranking Beyond Subs</span>
        </Link>
        
        <nav className="hidden md:flex gap-8 text-sm font-bold">
          {navLinks.map(link => (
            <Link 
              key={link.path} 
              to={link.path}
              className={`${location.pathname === link.path ? 'text-white' : 'text-gray-500 hover:text-gray-300'} transition-colors uppercase tracking-widest`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <Link to="/profile" className="flex items-center gap-2 bg-[#141414] border border-[#262626] px-3 py-1.5 rounded-full hover:border-[#404040] transition-colors">
          <UserCircle2 className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-semibold max-w-[100px] truncate">{user ? user.displayName : 'Login'}</span>
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-12">
        <Routes>
          <Route path="/" element={<SearchHome />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  );
}
