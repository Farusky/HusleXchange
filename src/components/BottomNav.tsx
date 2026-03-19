import React from 'react';
import { Home, PlusCircle, User, Repeat, Settings } from 'lucide-react';

interface Props {
  currentScreen: 'feed' | 'create' | 'exchanges' | 'profile' | 'settings';
  onNavigate: (screen: 'feed' | 'create' | 'exchanges' | 'profile' | 'settings') => void;
}

export default function BottomNav({ currentScreen, onNavigate }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1E293B]/80 backdrop-blur-xl border-t border-white/5 px-4 py-4 flex justify-around items-center z-50">
      <button
        onClick={() => onNavigate('feed')}
        className={`flex flex-col items-center space-y-1 transition-all ${
          currentScreen === 'feed' ? 'text-[#22C55E]' : 'text-gray-500 hover:text-gray-300'
        }`}
      >
        <Home className={`w-5 h-5 ${currentScreen === 'feed' ? 'fill-[#22C55E]/20' : ''}`} />
        <span className="text-[9px] font-bold uppercase tracking-wider">Feed</span>
      </button>

      <button
        onClick={() => onNavigate('exchanges')}
        className={`flex flex-col items-center space-y-1 transition-all ${
          currentScreen === 'exchanges' ? 'text-[#22C55E]' : 'text-gray-500 hover:text-gray-300'
        }`}
      >
        <Repeat className={`w-5 h-5 ${currentScreen === 'exchanges' ? 'fill-[#22C55E]/20' : ''}`} />
        <span className="text-[9px] font-bold uppercase tracking-wider">Exchanges</span>
      </button>

      <button
        onClick={() => onNavigate('create')}
        className={`flex flex-col items-center space-y-1 transition-all ${
          currentScreen === 'create' ? 'text-[#22C55E]' : 'text-gray-500 hover:text-gray-300'
        }`}
      >
        <div className={`p-2.5 rounded-2xl -mt-10 shadow-xl transition-all ${
          currentScreen === 'create' ? 'bg-[#22C55E] text-white shadow-[#22C55E]/20' : 'bg-[#1E293B] text-gray-500 border border-white/5'
        }`}>
          <PlusCircle className="w-6 h-6" />
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wider">Create</span>
      </button>

      <button
        onClick={() => onNavigate('settings')}
        className={`flex flex-col items-center space-y-1 transition-all ${
          currentScreen === 'settings' ? 'text-[#22C55E]' : 'text-gray-500 hover:text-gray-300'
        }`}
      >
        <Settings className={`w-5 h-5 ${currentScreen === 'settings' ? 'fill-[#22C55E]/20' : ''}`} />
        <span className="text-[9px] font-bold uppercase tracking-wider">Settings</span>
      </button>

      <button
        onClick={() => onNavigate('profile')}
        className={`flex flex-col items-center space-y-1 transition-all ${
          currentScreen === 'profile' ? 'text-[#22C55E]' : 'text-gray-500 hover:text-gray-300'
        }`}
      >
        <User className={`w-5 h-5 ${currentScreen === 'profile' ? 'fill-[#22C55E]/20' : ''}`} />
        <span className="text-[9px] font-bold uppercase tracking-wider">Profile</span>
      </button>
    </nav>
  );
}
