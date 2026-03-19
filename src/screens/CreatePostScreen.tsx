import React, { useState } from 'react';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { UserProfile } from '../types';
import { motion } from 'motion/react';
import { Zap, Send, Plus, X, AlertCircle } from 'lucide-react';

interface Props {
  user: User;
  profile: UserProfile | null;
  onPostCreated: () => void;
}

export default function CreatePostScreen({ user, profile, onPostCreated }: Props) {
  const [offer, setOffer] = useState('');
  const [need, setNeed] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!offer || !need) {
      setError('Please fill in both fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const postData = {
        userId: user.uid,
        userName: profile.name,
        userRating: profile.ratingAverage || 0,
        userRatingCount: profile.ratingCount || 0,
        offer,
        need,
        createdAt: Date.now(),
        phone: profile.phone,
      };

      const docRef = await addDoc(collection(db, 'posts'), postData);
      // Update the document with its ID
      await updateDoc(doc(db, 'posts', docRef.id), { id: docRef.id });
      
      onPostCreated();
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'posts');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create <span className="text-[#22C55E]">Exchange</span></h1>
        <p className="text-gray-400 text-sm">Post what you can offer and what you need in return.</p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1E293B] p-8 rounded-3xl border border-white/5 shadow-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold text-[#22C55E] mb-2">I CAN OFFER</label>
            <textarea
              placeholder="e.g. Graphic Design, Tutoring, Coding..."
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
              className="w-full bg-[#0F172A] text-white p-4 rounded-2xl border border-white/10 focus:border-[#22C55E] outline-none transition-all resize-none h-32"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold text-[#38BDF8] mb-2">I NEED</label>
            <textarea
              placeholder="e.g. Photography, Piano Lessons, Marketing..."
              value={need}
              onChange={(e) => setNeed(e.target.value)}
              className="w-full bg-[#0F172A] text-white p-4 rounded-2xl border border-white/10 focus:border-[#38BDF8] outline-none transition-all resize-none h-32"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-sm flex items-center space-x-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#22C55E]/20"
          >
            <Send className="w-5 h-5" />
            <span>{loading ? 'Posting...' : 'Post Exchange'}</span>
          </button>
        </form>
      </motion.div>

      <div className="mt-8 p-6 bg-[#1E293B]/50 rounded-3xl border border-white/5">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
          <Zap className="w-4 h-4 text-[#22C55E]" />
          <span>Quick Tips</span>
        </h3>
        <ul className="space-y-3 text-xs text-gray-400">
          <li className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-[#22C55E] rounded-full mt-1"></div>
            <span>Be specific about your skills to attract the right people.</span>
          </li>
          <li className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-[#22C55E] rounded-full mt-1"></div>
            <span>Mention your availability or level of expertise.</span>
          </li>
          <li className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-[#22C55E] rounded-full mt-1"></div>
            <span>Keep it professional and friendly!</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
