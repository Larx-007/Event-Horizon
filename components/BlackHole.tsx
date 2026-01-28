
import React, { useMemo } from 'react';
import { AnimationState } from '../types';

interface BlackHoleProps {
  state: AnimationState;
}

const BlackHole: React.FC<BlackHoleProps> = ({ state }) => {
  const isCollapsing = state === 'collapsing';

  // Generate a high-density accretion disk particle system
  const diskParticles = useMemo(() => {
    // Increased count from 80 to 200 for better visibility
    return Array.from({ length: 200 }).map((_, i) => {
      const distance = 60 + Math.random() * 260;
      // Closer particles move significantly faster (Keplerian dynamics)
      const baseDuration = (distance / 40) + 1.5; 
      return {
        id: i,
        // Increased size range from 0.5-2.5 to 1.5-4.5
        size: Math.random() * 3 + 1.5,
        baseAngle: Math.random() * 360,
        distance: distance,
        duration: baseDuration * (0.9 + Math.random() * 0.2),
        // Increased opacity base from 0.1 to 0.4
        opacity: 0.4 + Math.random() * 0.6,
        delay: Math.random() * -20,
        // Tilt each particle slightly for a messy, organic disk feel
        tilt: Math.random() * 20 - 10,
        hasTail: Math.random() > 0.6,
      };
    });
  }, []);

  return (
    <div className={`fixed top-12 right-12 w-64 h-64 md:w-96 md:h-96 z-20 flex items-center justify-center transition-all duration-[2500ms] ease-in-out ${isCollapsing ? 'scale-[3.5] brightness-[2.5] saturate-0' : ''}`}>
      
      {/* Primary Atmospheric Glow (Deep spatial distortion) */}
      <div className={`absolute inset-[-140px] rounded-full bg-radial from-black/25 via-transparent to-transparent blur-[100px] transition-opacity duration-[2500ms] ${isCollapsing ? 'opacity-100' : 'opacity-40'}`} />

      {/* Main Accretion Disk Particle Field */}
      <div 
        className="absolute inset-0 pointer-events-none overflow-visible"
        style={{ transform: 'rotateX(75deg) rotateY(-10deg) rotateZ(5deg)' }}
      >
        {diskParticles.map((p) => (
          <div
            key={p.id}
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
              width: '1px',
              height: '1px',
              animation: `disk-orbit ${isCollapsing ? p.duration * 0.08 : p.duration}s linear infinite`,
              animationDelay: `${p.delay}s`,
            }}
          >
            <div
              className={`rounded-full bg-black ${p.hasTail ? 'shadow-[-10px_0_8px_rgba(0,0,0,0.3)]' : ''}`}
              style={{
                width: `${p.size}px`,
                height: `${p.size}px`,
                opacity: p.opacity,
                transform: `translateX(${isCollapsing ? p.distance * 0.3 : p.distance}px) rotateY(${p.tilt}deg)`,
                filter: 'blur(0px)', // Removed blur for sharper visibility
                transition: 'transform 1.5s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          </div>
        ))}
      </div>

      {/* Extreme Outer Accretion Shadow/Glow (The "Ring") */}
      <div 
        className={`absolute inset-0 rounded-full border-[2px] border-black/10 transition-transform duration-[4000ms] ease-linear`}
        style={{ 
          animation: `spin ${isCollapsing ? '0.1s' : '30s'} linear infinite`,
          boxShadow: `inset 0 0 120px rgba(0,0,0,0.1), 0 0 80px rgba(0,0,0,0.05)`
        }}
      >
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-black/40 to-transparent transform -translate-y-1/2 blur-[2px]" />
        <div className="absolute top-0 left-1/2 w-[1px] h-full bg-gradient-to-b from-transparent via-black/20 to-transparent transform -translate-x-1/2 blur-[4px]" />
      </div>

      {/* High-Intensity Accretion Core Layer 1 (Warped Ring) */}
      <div 
        className={`absolute w-full h-24 md:h-32 border-y-[12px] border-black rounded-[100%] transition-all duration-500`}
        style={{ 
          animation: `spin-skew ${isCollapsing ? '0.15s' : '8s'} linear infinite`,
          opacity: isCollapsing ? 1 : 0.8,
          filter: isCollapsing ? 'blur(4px) brightness(1.5)' : 'blur(2px)',
          boxShadow: isCollapsing ? '0 0 120px 30px rgba(0,0,0,0.25)' : 'none'
        }}
      />

      {/* High-Intensity Accretion Core Layer 2 (Counter-Rotating) */}
      <div 
        className={`absolute w-full h-16 md:h-20 border-y-[4px] border-black/60 rounded-[100%] transition-all duration-500`}
        style={{ 
          animation: `spin-skew ${isCollapsing ? '0.1s' : '6s'} linear infinite reverse`,
          opacity: isCollapsing ? 0.9 : 0.5,
          filter: 'blur(1px)'
        }}
      />

      {/* Vertical Lensing Arc 1 */}
      <div 
        className={`absolute w-32 md:w-48 h-full border-x-[8px] border-black rounded-[100%] transition-all duration-500`}
        style={{ 
          animation: `spin-skew-alt ${isCollapsing ? '0.2s' : '12s'} linear infinite`,
          opacity: isCollapsing ? 1 : 0.6,
          filter: isCollapsing ? 'blur(3px)' : 'blur(1px)'
        }}
      />

      {/* Vertical Lensing Arc 2 */}
      <div 
        className={`absolute w-16 md:w-24 h-full border-x-[2px] border-black/40 rounded-[100%] transition-all duration-500`}
        style={{ 
          animation: `spin-skew-alt ${isCollapsing ? '0.15s' : '16s'} linear infinite reverse`,
          opacity: isCollapsing ? 0.8 : 0.4,
          filter: 'blur(1px)'
        }}
      />

      {/* Event Horizon (The Center Void) */}
      <div className={`relative w-32 h-32 md:w-48 md:h-48 bg-black rounded-full shadow-[0_0_120px_50px_rgba(0,0,0,1)] z-10 transition-transform duration-[2500ms] ${isCollapsing ? 'scale-125' : 'scale-100'}`}>
        <div 
           className="absolute inset-0 rounded-full bg-gradient-to-tr from-black via-zinc-900 to-black opacity-60 overflow-hidden"
           style={{ animation: isCollapsing ? 'pulse-fast 0.1s infinite alternate' : 'pulse-slow 4s infinite alternate' }}
        >
          {/* Internal Swirl Distortions */}
          <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border border-white/5 rounded-full blur-2xl animate-pulse" />
        </div>
      </div>

      <style>{`
        @keyframes disk-orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-skew {
          from { transform: rotateX(72deg) rotateZ(0deg); }
          to { transform: rotateX(72deg) rotateZ(360deg); }
        }
        @keyframes spin-skew-alt {
          from { transform: rotateY(82deg) rotateZ(0deg); }
          to { transform: rotateY(82deg) rotateZ(360deg); }
        }
        @keyframes pulse-slow {
          from { opacity: 0.4; transform: scale(0.98); }
          to { opacity: 0.8; transform: scale(1.02); }
        }
        @keyframes pulse-fast {
          from { opacity: 0.6; transform: scale(1); }
          to { opacity: 1; transform: scale(1.1); filter: brightness(2); }
        }
      `}</style>
    </div>
  );
};

export default BlackHole;
