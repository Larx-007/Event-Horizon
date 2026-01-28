
import React, { useMemo, useState, useEffect } from 'react';
import { Quote, AnimationState } from '../types';

interface QuoteSectionProps {
  quote: Quote;
  state: AnimationState;
  onCollapse: () => void;
}

const QuoteSection: React.FC<QuoteSectionProps> = ({ quote, state, onCollapse }) => {
  if (state === 'collapsed') return null;

  const isCollapsing = state === 'collapsing';
  const [animationStyles, setAnimationStyles] = useState<string>('');

  // Generate the dynamic keyframes on mount or resize
  useEffect(() => {
    // 1. Calculate Start and End Points relative to the viewport
    // Quote is fixed: bottom-12 (3rem), left-12 (3rem)
    // We treat the start as (0,0) relative to the element itself
    
    // BlackHole target: Top-12 (3rem), Right-12 (3rem)
    // We need the delta from Bottom-Left to Top-Right
    const rem = 16; // approximate, or use parseFloat(getComputedStyle(document.documentElement).fontSize)
    const padding = 3 * rem; // 12 unit in tailwind = 3rem
    
    // Target position (Black Hole Center approx)
    const bhSize = window.innerWidth < 768 ? 256 : 384;
    const targetX = window.innerWidth - padding - (bhSize / 2) - padding; // Subtract start X (padding)
    const targetY = -(window.innerHeight - padding - (bhSize / 2) - padding); // Negative because going UP

    // 2. Generate smooth Cubic Bezier Path Points
    // Control Points for a "Slingshot" curve
    // Start (0,0)
    // CP1: Shoot out horizontally first (50% of width)
    const cp1X = targetX * 0.4;
    const cp1Y = 0; 
    // CP2: Then curve up aggressively
    const cp2X = targetX;
    const cp2Y = targetY * 0.5;
    // End (targetX, targetY)

    let keyframes = '';
    const totalFrames = 60;
    
    for (let i = 0; i <= totalFrames; i++) {
      const t = i / totalFrames;
      
      // Bezier Math
      const u = 1 - t;
      const tt = t * t;
      const uu = u * u;
      const uuu = uu * u;
      const ttt = tt * t;

      // Position
      const x = (uuu * 0) + (3 * uu * t * cp1X) + (3 * u * tt * cp2X) + (ttt * targetX);
      const y = (uuu * 0) + (3 * uu * t * cp1Y) + (3 * u * tt * cp2Y) + (ttt * targetY);

      // Rotation (Accelerating spin)
      // Exponential curve for rotation: slower at start, crazy fast at end
      const rotation = Math.pow(t, 2.5) * 540; // Spin 1.5 times total

      // Scale (Shrink into void)
      const scale = 1 - Math.pow(t, 0.8); // Slightly faster shrink start

      // Opacity
      const opacity = 1 - Math.pow(t, 3); // Stay visible longer, then fade fast

      keyframes += `
        ${(t * 100).toFixed(1)}% {
          transform: translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rotation.toFixed(0)}deg) scale(${scale.toFixed(3)});
          opacity: ${opacity.toFixed(2)};
        }
      `;
    }

    setAnimationStyles(`
      @keyframes dynamic-suck {
        ${keyframes}
      }
    `);

  }, []);

  return (
    <>
      <style>{animationStyles}</style>
      <div 
        className={`fixed bottom-12 left-12 max-w-md z-30`}
        style={{
          animation: isCollapsing ? 'dynamic-suck 2.4s cubic-bezier(0.5, 0, 0.2, 1) forwards' : 'none',
          willChange: 'transform, opacity'
        }}
      >
        <div className="transition-all duration-1000">
          <p className="text-3xl md:text-4xl font-light tracking-tight text-black mb-4 leading-tight italic">
            "{quote.text}"
          </p>
          <div className="flex items-center gap-6">
            <span className="text-sm font-bold tracking-widest text-zinc-400 uppercase">
              — {quote.author}
            </span>
            <button
              onClick={onCollapse}
              disabled={isCollapsing}
              className={`px-8 py-3 border border-black text-black hover:bg-black hover:text-white transition-all duration-300 tracking-[0.2em] uppercase text-xs font-bold
                ${isCollapsing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              `}
            >
              Collapse
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuoteSection;
