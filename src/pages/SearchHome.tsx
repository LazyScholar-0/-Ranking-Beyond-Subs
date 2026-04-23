import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Star, MessageSquare, PlayCircle, Loader2, Calendar, Clock, Wifi, WifiOff } from 'lucide-react';
import { analyzeYouTubeEntity, TrueWebScoreModel } from '../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, setDoc, doc, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { ShareButtons } from '../components/ShareButtons';

export default function SearchHome() {
  const { user } = useAuth();
  const [queryInput, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TrueWebScoreModel | null>(null);
  const [entityId, setEntityId] = useState('');
  
  const [reviews, setReviews] = useState<any[]>([]);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);

  const normalizeId = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 120);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!queryInput.trim()) return;

    setIsLoading(true);
    setResult(null);
    try {
      const data = await analyzeYouTubeEntity(queryInput);
      setResult(data);
      const eId = normalizeId(data.title);
      setEntityId(eId);

      // Save to leaderboard so it has initial TrueWeb Score
      try {
        const lbRef = doc(db, 'leaderboard', eId);
        const lbDoc = await getDoc(lbRef);
        if (!lbDoc.exists()) {
          if (user) {
            await setDoc(lbRef, {
              entityId: eId,
              title: data.title,
              subscriberCount: data.subscriberCount || 0,
              positiveRatings: 0,
              fairScore: data.score, // Base it initially on pure sentiment
              baseAIscore: data.score,
              updatedAt: serverTimestamp()
            });
          }
        }
      } catch (err) {
        console.warn("Could not create leaderboard entry:", err);
      }

      // Fetch reviews
      const q = query(collection(db, 'reviews'), where('entityId', '==', eId));
      const snap = await getDocs(q);
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      alert("Search failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("You must be logged in to review!");
    if (!result || !newReviewComment.trim()) return;

    try {
      await addDoc(collection(db, 'reviews'), {
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        entityId: entityId,
        entityTitle: result.title,
        rating: newReviewRating,
        comment: newReviewComment,
        createdAt: serverTimestamp()
      });

      // Update leaderboard stats dynamically incorporating external gemini sentiment + new ratings
      try {
        const lbRef = doc(db, 'leaderboard', entityId);
        const lbDoc = await getDoc(lbRef);
        if (lbDoc.exists()) {
          const data = lbDoc.data();
          let newPositive = data.positiveRatings || 0;
          if (newReviewRating >= 6) newPositive += 1;
          
          let base = data.baseAIscore || result.score;
          
          // Bayesian-style rating update.
          // The base AI score is heavily weighted (representing thousands of off-platform posts).
          // Every explicit user review slowly pulls the score toward their rating without destroying it entirely.
          let currentFairScore = data.fairScore || base;
          
          // Pull score 10% towards the new user review. 
          // This prevents high-sub channels from tanking immediately upon getting 1 rating.
          let newFairScore = (currentFairScore * 0.9) + (newReviewRating * 0.1);

          newFairScore = Math.min(Math.max(newFairScore, 1), 10);

          await setDoc(lbRef, {
            ...data,
            positiveRatings: newPositive,
            fairScore: newFairScore,
            updatedAt: serverTimestamp()
          });
        }
      } catch (err) {
         console.warn("Leaderboard update failed:", err);
      }

      alert("Review published!");
      // Reload reviews
      const q = query(collection(db, 'reviews'), where('entityId', '==', entityId));
      const snap = await getDocs(q);
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      
      setNewReviewComment('');
      setNewReviewRating(5);
    } catch (error) {
      console.error(error);
      alert("Failed to submit review.");
    }
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!result && !isLoading && (
          <motion.div 
            key="search"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center mt-20"
          >
            <h1 className="text-5xl sm:text-7xl font-light tracking-tighter mb-4">
              Beyond the <span className="score-gradient font-bold">Likes</span>.
            </h1>
            <p className="text-gray-400 mb-12 max-w-lg text-lg">
              Discover the real consensus on YouTube creators and videos based on raw, off-platform sentiment.
            </p>

            <form onSubmit={handleSearch} className="w-full max-w-xl relative">
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Paste a video URL or creator name..."
                className="w-full bg-[#141414] border border-[#262626] rounded-full py-4 pl-6 pr-16 text-lg focus:outline-none focus:border-[#404040] transition-colors shadow-2xl"
              />
              <button 
                type="submit"
                disabled={!queryInput.trim()}
                className="absolute right-2 top-2 bottom-2 aspect-square rounded-full bg-[#FF4B2B] text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Search className="w-5 h-5" />
              </button>
            </form>

            <div className="mt-24 w-full">
              <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-6">Trending Searches</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {['MKBHD', 'Veritasium', 'I built a secret room'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => { setQuery(tag); setTimeout(() => handleSearch(), 0); }}
                    className="px-4 py-2 rounded-full bg-[#141414] border border-[#262626] text-sm hover:border-[#404040] transition-colors flex items-center gap-2 text-gray-300 shadow-sm"
                  >
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {isLoading && (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-32"
          >
            <Loader2 className="w-8 h-8 text-[#FF4B2B] animate-spin mb-4" />
            <p className="text-gray-400 animate-pulse">Analyzing cross-platform sentiment...</p>
          </motion.div>
        )}

        {result && !isLoading && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full"
          >
            <button 
              onClick={() => setResult(null)}
              className="text-gray-400 hover:text-white mb-8 flex items-center gap-2 text-sm uppercase tracking-wider font-bold"
            >
              &larr; Back to Search
            </button>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12">
              <div className="md:col-span-8 bento-card">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">{result.title}</h1>
                <div className="flex flex-wrap gap-2 mb-6">
                  {result.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded border border-[#262626] bg-[#1F1F1F] text-xs font-mono text-gray-400">
                      #{tag}
                    </span>
                  ))}
                  <span className="px-3 py-1 rounded border border-[#262626] bg-[#1F1F1F] text-xs font-mono text-gray-400">
                    Est. {result.subscriberCount?.toLocaleString() || 0} Subs/Views
                  </span>
                </div>

                <div className="flex flex-wrap gap-3 mb-6">
                  {result.isActive !== undefined && (
                    <div className={`text-xs uppercase tracking-wider font-bold px-3 py-1.5 rounded-full border ${result.isActive ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'} flex items-center gap-1.5 w-fit`}>
                      {result.isActive ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                      {result.isActive ? 'Active' : 'Inactive'}
                    </div>
                  )}
                  {result.uploadFrequency && (
                    <div className="text-xs uppercase tracking-wider font-bold px-3 py-1.5 rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/20 flex items-center gap-1.5 w-fit">
                      <Calendar className="w-3.5 h-3.5" />
                      {result.uploadFrequency}
                    </div>
                  )}
                  {result.contentLength && (
                    <div className="text-xs uppercase tracking-wider font-bold px-3 py-1.5 rounded-full border bg-purple-500/10 text-purple-400 border-purple-500/20 flex items-center gap-1.5 w-fit">
                      <Clock className="w-3.5 h-3.5" />
                      {result.contentLength}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold">General Consensus</h3>
                  <p className="text-lg leading-relaxed text-gray-300 font-serif">
                    {result.sentiment}
                  </p>
                </div>
                
                <ShareButtons title={result.title} url={window.location.href} />
              </div>

              <div className="md:col-span-4 bento-card text-center items-center justify-center">
                <div className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">Fair Score</div>
                <div className="flex items-start gap-1 justify-center">
                  <span className="text-8xl font-black score-gradient leading-none">{result.score.toFixed(1)}</span>
                </div>
                
                <div className="w-full mt-6">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Internal (Likes)</span>
                    <span className="text-white font-mono break-words">Algorithmic</span>
                  </div>
                  <div className="progress-bar mb-4">
                    <div className="progress-fill w-[50%] bg-[#404040]"></div>
                  </div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">External Web Buzz</span>
                    <span className="text-white font-mono">{result.score * 10}%</span>
                  </div>
                  <div className="progress-bar mb-2">
                    <div className="progress-fill" style={{ width: `${result.score * 10}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* User Reviews Section */}
            <div>
              <div className="flex items-center gap-3 mb-6 px-1">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                <h2 className="text-xl font-bold tracking-tight">Community Voices</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-8 flex flex-col gap-4">
                  {reviews.length === 0 ? (
                    <div className="bento-card items-center justify-center text-center py-16">
                      <p className="text-gray-400 font-medium mb-2">No community reviews yet.</p>
                      <p className="text-sm text-gray-500">Be the first to share your perspective on this creator or video.</p>
                    </div>
                  ) : (
                    reviews.map(review => (
                      <div key={review.id} className="bento-card">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-medium text-gray-200">{review.userName}</div>
                          </div>
                          <div className="flex items-center gap-1 bg-[#1F1F1F] border border-[#262626] px-2 py-1 rounded">
                            <Star className="w-3 h-3 text-[#FF4B2B] fill-current" />
                            <span className="text-sm font-bold text-gray-200">{review.rating}</span>
                          </div>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">{review.comment}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="md:col-span-4 bento-card h-fit sticky top-24">
                  <h3 className="text-lg font-bold mb-6">Drop Your Take</h3>
                  <form onSubmit={submitReview} className="space-y-6">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-gray-500 font-bold mb-3">Rating out of 10</label>
                      <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        value={newReviewRating}
                        onChange={(e) => setNewReviewRating(Number(e.target.value))}
                        className="w-full accent-[#FF4B2B]"
                      />
                      <div className="flex justify-between mt-2 font-mono text-xs text-gray-500">
                        <span>1</span>
                        <span className="text-white font-bold text-lg">{newReviewRating}</span>
                        <span>10</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-gray-500 font-bold mb-3">Your Perspective</label>
                      <textarea 
                        required
                        value={newReviewComment}
                        onChange={(e) => setNewReviewComment(e.target.value)}
                        placeholder="What's your unbiased opinion?"
                        className="w-full bg-[#1F1F1F] border border-[#262626] rounded-xl p-4 text-sm focus:outline-none focus:border-[#404040] transition-colors min-h-[120px] resize-none"
                      ></textarea>
                    </div>

                    <button 
                      type="submit"
                      disabled={!user}
                      className="w-full py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      {user ? "Publish Review" : "Login to Publish"}
                    </button>
                    {!user && <p className="text-xs text-center text-gray-500 mt-2">Check the Profile tab to login</p>}
                  </form>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
