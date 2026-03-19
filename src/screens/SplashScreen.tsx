import React from 'react';
import { motion } from 'motion/react';
import { Zap } from 'lucide-react';

export default function SplashScreen() {
  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-20 h-20 bg-[#22C55E] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-[#22C55E]/20">
          <Zap className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">
          Hustle<span className="text-[#22C55E]">Xchange</span>
        </h1>
        <p className="text-[#38BDF8] font-medium tracking-widest uppercase text-xs">
          Skill Trading Community
        </p>
      </motion.div>
    </div>
  );
}
