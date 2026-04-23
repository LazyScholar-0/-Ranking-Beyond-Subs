import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Star, TrendingUp, Users, BadgeCheck, Activity } from 'lucide-react';
import { SEED_DATA } from '../lib/top100';

export default function Leaderboard() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'leaderboard'), orderBy('fairScore', 'desc'), limit(100));
    
    // Automatically stream live updates straight from the database. 
    // No more "old ranks", completely real-time as the ecosystem evolves.
    const unsubscribe = onSnapshot(q, (snap) => {
      try {
        const dbEntries = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const merged = [...SEED_DATA];
        dbEntries.forEach(dbItem => {
          const existing = merged.find(m => m.id === dbItem.entityId || m.title.toLowerCase() === dbItem.title.toLowerCase());
          if (existing) {
             existing.fairScore = dbItem.fairScore; 
          } else {
             merged.push(dbItem);
          }
        });

        // Filter out bad/missing scores and sort globally
        const sanitized = merged.filter(e => typeof e.fairScore === 'number' && !isNaN(e.fairScore));
        sanitized.sort((a, b) => b.fairScore - a.fairScore);
        
        setEntries(sanitized.slice(0, 100)); 
      } catch (err) {
        console.error("Live-sync payload failed:", err);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error("Leaderboard live-sync error:", error);
      // Fallback
      const sortedSeed = [...SEED_DATA].sort((a, b) => b.fairScore - a.fairScore);
      setEntries(sortedSeed.slice(0, 100));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <TrendingUp className="text-[#FF4B2B]" /> The TrueWeb Hall of Fame
        </h1>
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
          <Activity className="w-3 h-3 animate-pulse" />
          <span>LIVE AUTOSYNC</span>
        </div>
      </div>
      
      <p className="text-gray-400 mb-8 max-w-2xl leading-relaxed">
        The absolute pinnacle of independent YouTube creators. No corporations, no VEVO music labels, no TV networks. 
        Ranked strictly by their TrueWeb <span className="text-white font-bold">Fair Score</span> — 
        a reflection of pure community respect, educational value, and authentic creative integrity.
      </p>
      
      {loading ? (
        <div className="text-gray-500 animate-pulse">Loading the Hall of Fame...</div>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry, idx) => {
            return (
              <div key={entry.id || entry.entityId} className="bento-card grid grid-cols-[30px_1fr_auto] sm:grid-cols-[40px_1fr_120px] items-center gap-4 sm:gap-6 p-4 sm:px-6 hover:border-[#404040] transition-colors">
                
                {/* Rank Column */}
                <div className="text-2xl sm:text-3xl font-black text-gray-700 text-center">
                  {idx + 1}
                </div>
                
                {/* Creator Details Column */}
                <div className="flex flex-col overflow-hidden whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg sm:text-xl truncate">{entry.title}</h3>
                    {entry.fairScore >= 9.5 && <BadgeCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF4B2B] shrink-0" />}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1 mt-0.5 truncate">
                    <Users className="w-3 h-3 shrink-0" />
                    {entry.subscriberCount?.toLocaleString() || 0} Subs
                  </div>
                </div>

                {/* Score Column */}
                <div className="flex items-center gap-1 sm:gap-2 bg-[#1A1A1A] border border-[#262626] px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl justify-self-end w-full sm:w-auto justify-end">
                  <Star className="text-[#FF4B2B] w-4 h-4 sm:w-5 sm:h-5 fill-current shrink-0" />
                  <span className="text-xl sm:text-2xl font-black score-gradient tabular-nums tracking-tighter">{entry.fairScore.toFixed(1)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
