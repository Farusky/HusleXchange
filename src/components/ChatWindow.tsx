import React, { useState, useEffect, useRef } from 'react';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, serverTimestamp, limit } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Chat, Message, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Send, ArrowLeft, User as UserIcon, Zap, MessageCircle } from 'lucide-react';

interface Props {
  user: User;
  profile: UserProfile | null;
  chat: Chat;
  onBack: () => void;
}

export default function ChatWindow({ user, profile, chat, onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const otherId = chat.participants.find(id => id !== user.uid);
  const otherName = otherId ? chat.participantNames[otherId] || 'User' : 'User';

  useEffect(() => {
    const q = query(
      collection(db, 'chats', chat.id, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(newMessages);
      setLoading(false);
      scrollToBottom();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `chats/${chat.id}/messages`);
    });

    return () => unsubscribe();
  }, [chat.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const text = newMessage.trim();
    setNewMessage('');

    try {
      const messageData = {
        senderId: user.uid,
        text,
        timestamp: Date.now(),
      };

      const messagesRef = collection(db, 'chats', chat.id, 'messages');
      const newMessageRef = doc(messagesRef);
      
      await updateDoc(doc(db, 'chats', chat.id), {
        lastMessage: text,
        lastTimestamp: Date.now(),
      });

      const { setDoc } = await import('firebase/firestore');
      await setDoc(newMessageRef, { ...messageData, id: newMessageRef.id });
      
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, `chats/${chat.id}/messages`);
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 bg-[#0F172A] z-[60] flex flex-col">
      {/* Header */}
      <header className="bg-[#1E293B]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center space-x-4 sticky top-0 z-10">
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-xl text-gray-400 transition-all">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="w-10 h-10 bg-[#0F172A] rounded-xl flex items-center justify-center border border-white/5">
          <UserIcon className="w-6 h-6 text-[#22C55E]" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-white truncate">{otherName}</h2>
          <div className="flex items-center text-[10px] text-[#22C55E] space-x-1">
            <div className="w-1.5 h-1.5 bg-[#22C55E] rounded-full animate-pulse"></div>
            <span className="font-bold uppercase tracking-widest">Online</span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#22C55E]"></div>
            <p className="text-gray-400 text-sm">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-[#1E293B] rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
              <Zap className="w-8 h-8 text-[#22C55E]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Start the conversation!</h3>
            <p className="text-gray-400 text-sm">Say hi and discuss your skill exchange.</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderId === user.uid;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] p-4 rounded-3xl shadow-lg ${
                  isMe 
                    ? 'bg-[#22C55E] text-white rounded-tr-none' 
                    : 'bg-[#1E293B] text-[#E2E8F0] rounded-tl-none border border-white/5'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <span className={`text-[9px] block mt-1 font-bold uppercase tracking-widest ${
                    isMe ? 'text-white/60' : 'text-gray-500'
                  }`}>
                    {formatDate(msg.timestamp)}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 bg-[#1E293B]/80 backdrop-blur-xl border-t border-white/5 sticky bottom-0">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-[#0F172A] text-white p-4 rounded-2xl border border-white/10 focus:border-[#22C55E] outline-none transition-all text-sm"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-4 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#22C55E]/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
