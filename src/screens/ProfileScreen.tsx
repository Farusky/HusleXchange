import React, { useState } from 'react';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { doc, updateDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { UserProfile, Review } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, User as UserIcon, Phone, Mail, Plus, X, Edit2, Save, CheckCircle, Zap, Search, Star, MessageSquare } from 'lucide-react';

interface Props {
  user: User;
  profile: UserProfile | null;
  onLogout: () => void;
}

export default function ProfileScreen({ user, profile, onLogout }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [newOfferedSkill, setNewOfferedSkill] = useState('');
  const [newWantedSkill, setNewWantedSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  React.useEffect(() => {
    if (!profile) return;
    const q = query(
      collection(db, 'reviews'),
      where('toId', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newReviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      setReviews(newReviews);
      setLoadingReviews(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reviews');
    });

    return () => unsubscribe();
  }, [profile?.uid]);

  if (!profile) return null;

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name,
        phone,
      });
      setIsEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const addSkill = async (type: 'offered' | 'wanted') => {
    const skill = type === 'offered' ? newOfferedSkill : newWantedSkill;
    if (!skill.trim()) return;

    const currentSkills = type === 'offered' ? profile.skillsOffered : profile.skillsWanted;
    if (currentSkills.length >= 20) return;

    try {
      const field = type === 'offered' ? 'skillsOffered' : 'skillsWanted';
      await updateDoc(doc(db, 'users', user.uid), {
        [field]: [...currentSkills, skill.trim()]
      });
      if (type === 'offered') setNewOfferedSkill('');
      else setNewWantedSkill('');
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const removeSkill = async (type: 'offered' | 'wanted', index: number) => {
    const currentSkills = type === 'offered' ? profile.skillsOffered : profile.skillsWanted;
    const newSkills = currentSkills.filter((_, i) => i !== index);

    try {
      const field = type === 'offered' ? 'skillsOffered' : 'skillsWanted';
      await updateDoc(doc(db, 'users', user.uid), {
        [field]: newSkills
      });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">My <span className="text-[#22C55E]">Profile</span></h1>
        <button
          onClick={onLogout}
          className="p-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 hover:bg-red-500/20 transition-all"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1E293B] p-8 rounded-3xl border border-white/5 shadow-2xl mb-8"
      >
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-20 h-20 bg-[#0F172A] rounded-3xl flex items-center justify-center border border-white/5">
            <UserIcon className="w-10 h-10 text-[#22C55E]" />
          </div>
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0F172A] text-white p-3 rounded-xl border border-white/10 focus:border-[#22C55E] outline-none text-xl font-bold mb-2"
              />
            ) : (
              <h2 className="text-2xl font-bold text-white mb-1">{profile.name}</h2>
            )}
            <div className="flex items-center text-sm text-gray-400 space-x-2">
              <Mail className="w-4 h-4" />
              <span>{profile.email}</span>
            </div>
            {profile.ratingCount && profile.ratingCount > 0 && (
              <div className="flex items-center space-x-2 mt-2">
                <div className="flex items-center bg-yellow-400/10 px-2 py-1 rounded-lg">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
                  <span className="text-yellow-400 font-bold text-sm">{profile.ratingAverage?.toFixed(1)}</span>
                </div>
                <span className="text-gray-500 text-xs">({profile.ratingCount} reviews)</span>
              </div>
            )}
          </div>
          <button
            onClick={() => isEditing ? handleUpdateProfile() : setIsEditing(true)}
            className={`p-3 rounded-2xl border transition-all ${
              isEditing ? 'bg-[#22C55E]/20 border-[#22C55E]/30 text-[#22C55E]' : 'bg-white/5 border-white/10 text-gray-400'
            }`}
          >
            {isEditing ? <Save className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-4 bg-[#0F172A] rounded-2xl border border-white/5">
            <Phone className="w-5 h-5 text-[#38BDF8]" />
            {isEditing ? (
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 bg-transparent text-white outline-none"
                placeholder="WhatsApp Number"
              />
            ) : (
              <span className="text-[#E2E8F0]">{profile.phone}</span>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Offered Skills */}
        <div className="bg-[#1E293B] p-6 rounded-3xl border border-white/5 shadow-xl">
          <h3 className="text-sm font-bold text-[#22C55E] uppercase tracking-wider mb-4 flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Skills I Offer</span>
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {profile.skillsOffered.map((skill, i) => (
              <span key={i} className="bg-[#0F172A] text-[#E2E8F0] px-3 py-1.5 rounded-xl text-xs flex items-center space-x-2 border border-white/5">
                <span>{skill}</span>
                <button onClick={() => removeSkill('offered', i)} className="text-gray-500 hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Add skill..."
              value={newOfferedSkill}
              onChange={(e) => setNewOfferedSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSkill('offered')}
              className="flex-1 bg-[#0F172A] text-white p-3 rounded-xl border border-white/10 focus:border-[#22C55E] outline-none text-xs"
            />
            <button
              onClick={() => addSkill('offered')}
              className="p-3 bg-[#22C55E] text-white rounded-xl hover:bg-[#16A34A] transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Wanted Skills */}
        <div className="bg-[#1E293B] p-6 rounded-3xl border border-white/5 shadow-xl">
          <h3 className="text-sm font-bold text-[#38BDF8] uppercase tracking-wider mb-4 flex items-center space-x-2">
            <Search className="w-4 h-4" />
            <span>Skills I Want</span>
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {profile.skillsWanted.map((skill, i) => (
              <span key={i} className="bg-[#0F172A] text-[#E2E8F0] px-3 py-1.5 rounded-xl text-xs flex items-center space-x-2 border border-white/5">
                <span>{skill}</span>
                <button onClick={() => removeSkill('wanted', i)} className="text-gray-500 hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Add skill..."
              value={newWantedSkill}
              onChange={(e) => setNewWantedSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSkill('wanted')}
              className="flex-1 bg-[#0F172A] text-white p-3 rounded-xl border border-white/10 focus:border-[#38BDF8] outline-none text-xs"
            />
            <button
              onClick={() => addSkill('wanted')}
              className="p-3 bg-[#38BDF8] text-white rounded-xl hover:bg-[#0EA5E9] transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-[#1E293B] p-8 rounded-3xl border border-white/5 shadow-xl mb-8">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-[#22C55E]" />
          <span>Reviews & Ratings</span>
        </h3>

        {loadingReviews ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#22C55E]"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 bg-[#0F172A] rounded-2xl border border-dashed border-white/5">
            <Star className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No reviews yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-[#0F172A] p-5 rounded-2xl border border-white/5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-[#1E293B] rounded-lg flex items-center justify-center border border-white/5">
                      <span className="text-[#22C55E] text-xs font-bold">{review.fromName.charAt(0)}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{review.fromName}</h4>
                      <p className="text-[10px] text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center bg-yellow-400/10 px-2 py-0.5 rounded-lg">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 mr-1" />
                    <span className="text-yellow-400 font-bold text-xs">{review.rating}</span>
                  </div>
                </div>
                <p className="text-gray-300 text-sm italic leading-relaxed">"{review.comment}"</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#22C55E] text-white px-6 py-3 rounded-full shadow-lg flex items-center space-x-2 z-50"
          >
            <CheckCircle className="w-5 h-5" />
            <span className="font-bold text-sm">Profile updated successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
