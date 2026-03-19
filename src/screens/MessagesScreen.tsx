import React, { useState, useEffect } from 'react';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Chat, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Clock, Search, User as UserIcon, ChevronRight } from 'lucide-react';
import ChatWindow from '../components/ChatWindow';

interface Props {
  user: User;
  profile: UserProfile | null;
}

export default function MessagesScreen({ user, profile }: Props) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastTimestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newChats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chat[];
      setChats(newChats);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
    });

    return () => unsubscribe();
  }, [user]);

  const getOtherParticipantName = (chat: Chat) => {
    const otherId = chat.participants.find(id => id !== user.uid);
    return otherId ? chat.participantNames[otherId] || 'User' : 'User';
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return '';
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

  if (selectedChat) {
    return (
      <ChatWindow
        user={user}
        profile={profile}
        chat={selectedChat}
        onBack={() => setSelectedChat(null)}
      />
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto h-full flex flex-col">
      <header className="mb-8">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-6 h-6 text-[#22C55E]" />
          <h1 className="text-2xl font-bold text-white">My <span className="text-[#22C55E]">Messages</span></h1>
        </div>
      </header>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#22C55E]"></div>
          <p className="text-gray-400 text-sm">Loading conversations...</p>
        </div>
      ) : chats.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20 bg-[#1E293B] rounded-3xl border border-dashed border-white/10 p-8">
          <div className="w-16 h-16 bg-[#0F172A] rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No messages yet</h3>
          <p className="text-gray-400">Start a conversation from the feed to trade skills!</p>
        </div>
      ) : (
        <div className="space-y-4 flex-1 overflow-y-auto pb-24">
          <AnimatePresence mode="popLayout">
            {chats.map((chat) => (
              <motion.button
                key={chat.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setSelectedChat(chat)}
                className="w-full bg-[#1E293B] p-5 rounded-3xl border border-white/5 shadow-xl flex items-center space-x-4 hover:bg-[#1E293B]/80 transition-all text-left group"
              >
                <div className="w-12 h-12 bg-[#0F172A] rounded-2xl flex items-center justify-center border border-white/5 flex-shrink-0 group-hover:border-[#22C55E]/30 transition-all">
                  <UserIcon className="w-6 h-6 text-[#22C55E]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-white truncate">{getOtherParticipantName(chat)}</h4>
                    <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">{formatDate(chat.lastTimestamp)}</span>
                  </div>
                  <p className="text-sm text-gray-400 truncate leading-relaxed">
                    {chat.lastMessage || 'No messages yet'}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-[#22C55E] transition-all" />
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
