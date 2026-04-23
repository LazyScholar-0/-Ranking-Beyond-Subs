import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Star } from 'lucide-react';

export default function Profile() {
  const { user, login, logout } = useAuth();
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      try {
        const q = query(collection(db, 'reviews'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        setHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error(err);
      }
    };
    fetchHistory();
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h1 className="text-4xl font-bold mb-4">Your Profile</h1>
        <p className="text-gray-400 mb-8">Sign in to track your ratings, ideas, and history.</p>
        <button onClick={login} className="px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200">Sign in with Google</button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#262626]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{user.displayName}</h1>
          <p className="text-gray-500 text-sm">{user.email}</p>
        </div>
        <button onClick={logout} className="px-4 py-2 border border-[#404040] text-sm text-gray-300 rounded hover:bg-[#1A1A1A]">Sign Out</button>
      </div>

      <h2 className="text-xl font-bold mb-4">Your Rating History</h2>
      {history.length === 0 ? (
        <div className="p-8 bento-card text-center text-gray-500 border-dashed">No history found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {history.map(review => (
            <div key={review.id} className="bento-card">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-lg leading-tight truncate">{review.entityTitle}</span>
                <div className="flex items-center gap-1 bg-[#1F1F1F] px-2 py-0.5 rounded text-sm text-gray-300">
                  <Star className="w-3 h-3 text-[#FF4B2B] fill-current" /> {review.rating}
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-2 line-clamp-3">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
