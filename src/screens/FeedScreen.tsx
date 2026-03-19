import React, { useState, useEffect } from 'react';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, where, getDocs } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Post, UserProfile, Exchange } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Clock, Search, Zap, User as UserIcon, Star } from 'lucide-react';

interface Props {
  user: User;
  profile: UserProfile | null;
}

export default function FeedScreen({ user, profile }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(newPosts);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'posts');
    });

    return () => unsubscribe();
  }, []);

  const filteredPosts = posts.filter(post => 
    post.offer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.need.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConnect = async (post: Post) => {
    if (!profile) return;

    // Create an exchange record if it doesn't exist
    try {
      const q = query(
        collection(db, 'exchanges'),
        where('postId', '==', post.id),
        where('requesterId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        const exchangeData: Omit<Exchange, 'id'> = {
          postId: post.id,
          requesterId: user.uid,
          requesterName: profile.name,
          providerId: post.userId,
          providerName: post.userName,
          offer: post.offer,
          need: post.need,
          status: 'pending',
          createdAt: Date.now(),
        };
        await addDoc(collection(db, 'exchanges'), exchangeData);
      }
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'exchanges');
    }

    const message = encodeURIComponent(`Hi, I saw your HustleXchange post. I'm interested in exchanging skills. I saw you offer: ${post.offer} and need: ${post.need}.`);
    const whatsappUrl = `https://wa.me/${post.phone.replace(/\+/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const formatDate = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Zap className="w-6 h-6 text-[#22C55E]" />
            <h1 className="text-2xl font-bold text-white">Hustle<span className="text-[#22C55E]">Feed</span></h1>
          </div>
          <div className="w-10 h-10 bg-[#1E293B] rounded-full flex items-center justify-center border border-white/10">
            <UserIcon className="w-5 h-5 text-[#38BDF8]" />
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search skills or people..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1E293B] text-white pl-12 pr-4 py-4 rounded-2xl border border-white/5 focus:border-[#22C55E] outline-none transition-all"
          />
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#22C55E]"></div>
          <p className="text-gray-400 text-sm">Loading latest exchanges...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-20 bg-[#1E293B] rounded-3xl border border-dashed border-white/10 p-8">
          <div className="w-16 h-16 bg-[#0F172A] rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No exchanges yet</h3>
          <p className="text-gray-400 mb-6">Be the first to post your skills and start trading!</p>
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {filteredPosts.map((post) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#1E293B] p-6 rounded-3xl border border-white/5 shadow-xl"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#0F172A] rounded-xl flex items-center justify-center border border-white/5">
                      <span className="text-[#22C55E] font-bold">{post.userName.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-white">{post.userName}</h4>
                        {post.userRating !== undefined && post.userRating > 0 && (
                          <div className="flex items-center bg-[#0F172A] px-2 py-0.5 rounded-full border border-white/5">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 mr-1" />
                            <span className="text-[10px] font-bold text-white">{post.userRating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center text-xs text-gray-400 space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="bg-[#0F172A] p-4 rounded-2xl border border-white/5">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[#22C55E] block mb-1">I CAN OFFER</span>
                    <p className="text-[#E2E8F0] text-sm leading-relaxed">{post.offer}</p>
                  </div>
                  <div className="bg-[#0F172A] p-4 rounded-2xl border border-white/5">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[#38BDF8] block mb-1">I NEED</span>
                    <p className="text-[#E2E8F0] text-sm leading-relaxed">{post.need}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleConnect(post)}
                  className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold py-3 px-6 rounded-2xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-[#22C55E]/10"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Connect via WhatsApp</span>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
