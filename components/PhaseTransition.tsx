"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { GamePhase } from '@/lib/game-types';

interface PhaseTransitionProps {
  phase: GamePhase;
  dayCount: number;
}

export function PhaseTransition({ phase, dayCount }: PhaseTransitionProps) {
  const [showAnimation, setShowAnimation] = useState(false);
  const [lastPhase, setLastPhase] = useState<GamePhase>(phase);
  const [transitionPhase, setTransitionPhase] = useState<'day' | 'night' | null>(null);
  
  // Detect phase changes and trigger animation
  useEffect(() => {
    if (phase !== lastPhase) {
      // Only show animation when transitioning to day or night phase
      if (phase === 'day') {
        setTransitionPhase('day');
        setShowAnimation(true);
      } else if (phase === 'night') {
        setTransitionPhase('night');
        setShowAnimation(true);
      }
      
      setLastPhase(phase);
    }
  }, [phase, lastPhase]);
  
  // Hide animation after it completes
  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => {
        setShowAnimation(false);
      }, 3000); // 3 seconds for animation
      
      return () => clearTimeout(timer);
    }
  }, [showAnimation]);
  
  if (!showAnimation || !transitionPhase) return null;
  
  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-1000",
        showAnimation ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="absolute inset-0 bg-black/80" />
      
      <div className="relative z-10 text-center">
        {transitionPhase === 'day' && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="w-40 h-40 md:w-60 md:h-60 relative animate-sun-rise mb-4">
              <Image
                src="/day.jpeg"
                alt="Day"
                fill
                className="object-contain animate-pulse"
              />
            </div>
            <h2 className="text-white text-3xl md:text-5xl font-bold animate-fade-up">
              Day {dayCount}
            </h2>
            <p className="text-yellow-200 text-xl mt-2 animate-fade-up animation-delay-100">
              Time to identify the Mafia...
            </p>
          </div>
        )}
        
        {transitionPhase === 'night' && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="w-40 h-40 md:w-60 md:h-60 relative animate-moon-rise mb-4">
              <Image
                src="/night.jpeg"
                alt="Night"
                fill
                className="object-contain rounded-full animate-pulse"
              />
            </div>
            <h2 className="text-white text-3xl md:text-5xl font-bold animate-fade-up">
              Night {dayCount}
            </h2>
            <p className="text-blue-200 text-xl mt-2 animate-fade-up animation-delay-100">
              The village sleeps...
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 