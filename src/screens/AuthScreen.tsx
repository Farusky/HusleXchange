import React, { useState } from 'react';
import { auth, db, OperationType, handleFirestoreError } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Mail, Lock, User, Phone, Zap, ArrowRight } from 'lucide-react';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        if (!name || !phone) {
          setError('Please fill in all fields');
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create user profile in Firestore
        const userProfile = {
          uid: user.uid,
          name,
          email,
          phone,
          skillsOffered: [],
          skillsWanted: [],
          createdAt: Date.now(),
        };
        await setDoc(doc(db, 'users', user.uid), userProfile);
      }
    } catch (err: any) {
      console.error(err);
      const errorCode = err.code || (err.message && err.message.includes('auth/') ? err.message.match(/auth\/[a-z-]+/)?.[0] : null);
      
      if (errorCode === 'auth/email-already-in-use') {
        setError('This email is already registered. Please log in instead.');
      } else if (errorCode === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else if (errorCode === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential' || errorCode === 'auth/invalid-login-credentials') {
        setError('Invalid email or password.');
      } else if (errorCode === 'auth/operation-not-allowed') {
        setError('Email/Password authentication is not enabled in the Firebase Console. Please enable it in the Authentication tab.');
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col justify-center p-6 sm:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full mx-auto"
      >
        <div className="flex items-center justify-center mb-8 space-x-3">
          <div className="w-10 h-10 bg-[#22C55E] rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#E2E8F0]">
            Hustle<span className="text-[#22C55E]">Xchange</span>
          </h1>
        </div>

        <div className="bg-[#1E293B] p-8 rounded-3xl shadow-2xl border border-white/5">
          <h2 className="text-2xl font-bold text-white mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-[#38BDF8] mb-8 text-sm">
            {isLogin ? 'Log in to continue your skill exchange journey' : 'Join the community and start trading skills'}
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#0F172A] text-white pl-12 pr-4 py-4 rounded-2xl border border-white/10 focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] outline-none transition-all"
                    required
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="WhatsApp Number (e.g. +234...)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#0F172A] text-white pl-12 pr-4 py-4 rounded-2xl border border-white/10 focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] outline-none transition-all"
                    required
                  />
                </div>
              </>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0F172A] text-white pl-12 pr-4 py-4 rounded-2xl border border-white/10 focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] outline-none transition-all"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0F172A] text-white pl-12 pr-4 py-4 rounded-2xl border border-white/10 focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] outline-none transition-all"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#22C55E]/20"
            >
              <span>{loading ? 'Processing...' : isLogin ? 'Log In' : 'Sign Up'}</span>
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#38BDF8] text-sm font-medium hover:underline"
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Log In'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
