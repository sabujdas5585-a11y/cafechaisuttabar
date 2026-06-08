import React, { useEffect } from 'react';
import { motion } from 'motion/react';

interface SplashAnimationProps {
  onComplete: () => void;
}

export default function SplashAnimation({ onComplete }: SplashAnimationProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="text-center space-y-4"
      >
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 1 }}
        >
          <h1 className="text-5xl font-black font-mono tracking-tighter uppercase text-amber-500">
            Cafe Chai Sutta Bar
          </h1>
        </motion.div>
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
        >
            <p className="text-stone-400 font-mono text-xs tracking-widest uppercase">Madhuban More, Jhargram</p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
