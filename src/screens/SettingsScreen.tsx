import React, { useState, useEffect } from 'react';
import { auth, handleFirestoreError, OperationType } from '../firebase';
import { sendPasswordResetEmail, deleteUser, signOut } from 'firebase/auth';
import { motion } from 'motion/react';
import { 
  Settings, 
  Moon, 
  Sun, 
  Key, 
  Trash2, 
  LogOut, 
  ChevronRight, 
  AlertTriangle,
  CheckCircle2,
  X
} from 'lucide-react';

interface Props {
  onLogout: () => void;
}

export default function SettingsScreen({ onLogout }: Props) {
  const [theme, setTheme] = useState<'dark' | 'light'>(
    (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
  );
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handlePasswordReset = async () => {
    if (!auth.currentUser?.email) return;
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, auth.currentUser.email);
      setMessage({ type: 'success', text: 'Password reset email sent!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to send reset email' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await deleteUser(auth.currentUser);
      onLogout();
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        setMessage({ type: 'error', text: 'Please log out and log back in to delete your account.' });
      } else {
        setMessage({ type: 'error', text: error.message || 'Failed to delete account' });
      }
      setShowDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto min-h-screen pb-24">
      <header className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Settings className="w-8 h-8 text-[#22C55E]" />
          <h1 className="text-3xl font-bold text-white">Settings</h1>
        </div>
        <p className="text-gray-400 text-sm">Manage your account and app preferences.</p>
      </header>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-2xl flex items-center justify-between ${
            message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
          }`}
        >
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)}>
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      <div className="space-y-6">
        {/* Appearance Section */}
        <section>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 ml-2">Appearance</h3>
          <div className="bg-[#1E293B] rounded-3xl border border-white/5 overflow-hidden shadow-xl">
            <button 
              onClick={toggleTheme}
              className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-[#0F172A] rounded-xl flex items-center justify-center border border-white/5">
                  {theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-yellow-400" />}
                </div>
                <div className="text-left">
                  <p className="text-white font-bold">Theme Mode</p>
                  <p className="text-xs text-gray-400 capitalize">{theme} mode active</p>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full p-1 transition-colors ${theme === 'light' ? 'bg-[#22C55E]' : 'bg-gray-600'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${theme === 'light' ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </button>
          </div>
        </section>

        {/* Account Section */}
        <section>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 ml-2">Account Security</h3>
          <div className="bg-[#1E293B] rounded-3xl border border-white/5 overflow-hidden shadow-xl divide-y divide-white/5">
            <button 
              onClick={handlePasswordReset}
              disabled={loading}
              className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-[#0F172A] rounded-xl flex items-center justify-center border border-white/5">
                  <Key className="w-5 h-5 text-[#38BDF8]" />
                </div>
                <div className="text-left">
                  <p className="text-white font-bold">Reset Password</p>
                  <p className="text-xs text-gray-400">Send a reset link to your email</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </section>

        {/* Danger Zone */}
        <section>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 ml-2">Danger Zone</h3>
          <div className="bg-[#1E293B] rounded-3xl border border-white/5 overflow-hidden shadow-xl divide-y divide-white/5">
            <button 
              onClick={() => onLogout()}
              className="w-full flex items-center justify-between p-5 hover:bg-red-500/5 transition-colors group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/10 group-hover:bg-red-500/20">
                  <LogOut className="w-5 h-5 text-red-500" />
                </div>
                <div className="text-left">
                  <p className="text-red-500 font-bold">Log Out</p>
                  <p className="text-xs text-red-500/60">Sign out of your account</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-red-500/40" />
            </button>

            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-between p-5 hover:bg-red-500/10 transition-colors group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/10 group-hover:bg-red-500/20">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <div className="text-left">
                  <p className="text-red-500 font-bold">Delete Account</p>
                  <p className="text-xs text-red-500/60">Permanently remove your data</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-red-500/40" />
            </button>
          </div>
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#1E293B] w-full max-w-md rounded-3xl border border-white/10 p-8 shadow-2xl"
          >
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white text-center mb-2">Are you sure?</h2>
            <p className="text-gray-400 text-center mb-8">
              This action is permanent and cannot be undone. All your posts, exchanges, and profile data will be deleted.
            </p>
            <div className="flex flex-col space-y-3">
              <button 
                onClick={handleDeleteAccount}
                disabled={loading}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Yes, Delete My Account'}
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all border border-white/5"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="mt-12 text-center">
        <p className="text-[10px] uppercase tracking-widest font-bold text-gray-600">HustleXchange v1.0.0</p>
      </div>
    </div>
  );
}
