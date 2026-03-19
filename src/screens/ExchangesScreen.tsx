import React, { useState, useEffect } from 'react';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, addDoc, getDoc, runTransaction, or } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Exchange, UserProfile, Review } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, Clock, Star, MessageSquare, X, User as UserIcon, ArrowRight } from 'lucide-react';

interface Props {
  user: User;
  profile: UserProfile | null;
}

export default function ExchangesScreen({ user, profile }: Props) {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState<Exchange | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Use an OR query to fetch only exchanges where the user is a participant
    // This matches the security rules and avoids "Missing or insufficient permissions"
    const q = query(
      collection(db, 'exchanges'),
      or(
        where('requesterId', '==', user.uid),
        where('providerId', '==', user.uid)
      ),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userExchanges = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Exchange[];
      
      setExchanges(userExchanges);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'exchanges');
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleComplete = async (exchange: Exchange) => {
    try {
      await updateDoc(doc(db, 'exchanges', exchange.id), {
        status: 'completed',
        completedAt: Date.now()
      });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `exchanges/${exchange.id}`);
    }
  };

  const handleSubmitRating = async () => {
    if (!showRatingModal || !profile) return;
    setSubmitting(true);

    const isRequester = showRatingModal.requesterId === user.uid;
    const targetUserId = isRequester ? showRatingModal.providerId : showRatingModal.requesterId;
    
    try {
      await runTransaction(db, async (transaction) => {
        // 1. READS FIRST: Update target user's rating stats
        const userRef = doc(db, 'users', targetUserId);
        const userSnap = await transaction.get(userRef);
        
        // 2. WRITES: Create the review
        const reviewRef = doc(collection(db, 'reviews'));
        const reviewData: Review = {
          id: reviewRef.id,
          exchangeId: showRatingModal.id,
          fromId: user.uid,
          fromName: profile.name,
          toId: targetUserId,
          rating,
          comment,
          createdAt: Date.now()
        };
        transaction.set(reviewRef, reviewData);

        // 3. WRITES: Update the exchange status to show it's been rated by this user
        const exchangeRef = doc(db, 'exchanges', showRatingModal.id);
        transaction.update(exchangeRef, {
          [isRequester ? 'ratedByRequester' : 'ratedByProvider']: true
        });

        if (userSnap.exists()) {
          const userData = userSnap.data() as UserProfile;
          const currentAvg = userData.ratingAverage || 0;
          const currentCount = userData.ratingCount || 0;
          
          const newCount = currentCount + 1;
          const newAvg = ((currentAvg * currentCount) + rating) / newCount;
          
          transaction.update(userRef, {
            ratingAverage: newAvg,
            ratingCount: newCount
          });
        }
      });

      setShowRatingModal(null);
      setRating(5);
      setComment('');
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'reviews');
    } finally {
      setSubmitting(false);
    }
  };

  const getOtherPartyName = (ex: Exchange) => {
    return ex.requesterId === user.uid ? ex.providerName : ex.requesterName;
  };

  const isRatedByMe = (ex: Exchange) => {
    return ex.requesterId === user.uid ? ex.ratedByRequester : ex.ratedByProvider;
  };

  return (
    <div className="p-6 max-w-2xl mx-auto pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">My <span className="text-[#22C55E]">Exchanges</span></h1>
        <p className="text-gray-400 text-sm mt-2">Track your skill trades and rate your partners.</p>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#22C55E]"></div>
        </div>
      ) : exchanges.length === 0 ? (
        <div className="text-center py-20 bg-[#1E293B] rounded-3xl border border-dashed border-white/10 p-8">
          <div className="w-16 h-16 bg-[#0F172A] rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No exchanges yet</h3>
          <p className="text-gray-400">Connect with others on the feed to start trading skills!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {exchanges.map((ex) => (
            <motion.div
              key={ex.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#1E293B] p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#0F172A] rounded-xl flex items-center justify-center border border-white/5">
                    <UserIcon className="w-5 h-5 text-[#38BDF8]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Exchange with {getOtherPartyName(ex)}</h4>
                    <div className="flex items-center text-xs text-gray-400 space-x-2">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(ex.createdAt).toLocaleDateString()}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        ex.status === 'completed' ? 'bg-[#22C55E]/20 text-[#22C55E]' : 'bg-[#38BDF8]/20 text-[#38BDF8]'
                      }`}>
                        {ex.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 mb-6">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="flex-1 bg-[#0F172A] p-3 rounded-xl border border-white/5">
                    <span className="text-[9px] font-bold text-[#22C55E] block uppercase mb-1">Offer</span>
                    <p className="text-gray-300 truncate">{ex.offer}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  <div className="flex-1 bg-[#0F172A] p-3 rounded-xl border border-white/5">
                    <span className="text-[9px] font-bold text-[#38BDF8] block uppercase mb-1">Need</span>
                    <p className="text-gray-300 truncate">{ex.need}</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                {ex.status === 'pending' && (
                  <button
                    onClick={() => handleComplete(ex)}
                    className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold py-3 px-4 rounded-2xl transition-all flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Mark Completed</span>
                  </button>
                )}
                {ex.status === 'completed' && !isRatedByMe(ex) && (
                  <button
                    onClick={() => setShowRatingModal(ex)}
                    className="flex-1 bg-[#38BDF8] hover:bg-[#0EA5E9] text-white font-bold py-3 px-4 rounded-2xl transition-all flex items-center justify-center space-x-2"
                  >
                    <Star className="w-4 h-4" />
                    <span>Rate Partner</span>
                  </button>
                )}
                {ex.status === 'completed' && isRatedByMe(ex) && (
                  <div className="flex-1 bg-white/5 text-gray-400 font-bold py-3 px-4 rounded-2xl flex items-center justify-center space-x-2 border border-white/5">
                    <Star className="w-4 h-4 fill-gray-500" />
                    <span>Rated</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Rating Modal */}
      <AnimatePresence>
        {showRatingModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRatingModal(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#1E293B] rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-white">Rate your partner</h3>
                  <button onClick={() => setShowRatingModal(null)} className="text-gray-400 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <p className="text-gray-400 mb-8">
                  How was your exchange with <span className="text-white font-bold">{getOtherPartyName(showRatingModal)}</span>?
                </p>

                <div className="flex justify-center space-x-2 mb-8">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 ${
                          star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <div className="mb-8">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Review Comment</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell others about your experience..."
                    className="w-full bg-[#0F172A] text-white p-4 rounded-2xl border border-white/10 focus:border-[#22C55E] outline-none min-h-[120px] resize-none"
                  />
                </div>

                <button
                  onClick={handleSubmitRating}
                  disabled={submitting}
                  className="w-full bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center space-x-2"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Submit Review</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
