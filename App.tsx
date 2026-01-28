
import React, { useState, useEffect, useRef, useCallback } from 'react';
import MeshBackground from './components/MeshBackground';
import BlackHole from './components/BlackHole';
import QuoteSection from './components/QuoteSection';
import { QUOTES } from './constants';
import { Quote, AnimationState } from './types';

const App: React.FC = () => {
  const [quote, setQuote] = useState<Quote>(QUOTES[0]);
  const [animationState, setAnimationState] = useState<AnimationState>('idle');
  const [showFlash, setShowFlash] = useState(false);

  // Audio Context Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  
  // Store references to the drone nodes
  const droneStateRef = useRef<{
    oscs: OscillatorNode[],
    gains: GainNode[],
    filters: BiquadFilterNode[],
    lfo: OscillatorNode | null
  }>({ oscs: [], gains: [], filters: [], lfo: null });

  // Initialize Audio Engine
  const initAudio = useCallback(() => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    }

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    // --- MAIN MIX BUS ---
    // 1. Dynamics Compressor (Glues drone & noise together, adds punch)
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -10;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    compressor.connect(ctx.destination);
    compressorRef.current = compressor;

    // 2. Space Delay (The "Void Echo")
    // Aux send from compressor to a feedback delay loop
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.6; // 600ms echo
    
    const delayFeedback = ctx.createGain();
    delayFeedback.gain.value = 0.5; // 50% feedback for long tails
    
    const delayFilter = ctx.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.value = 600; // Darken the echoes

    // Connect Delay Graph
    compressor.connect(delay);
    delay.connect(delayFilter);
    delayFilter.connect(delayFeedback);
    delayFeedback.connect(delay); // Loop
    delayFilter.connect(ctx.destination); // Output to speakers

    // --- DRONE SUB-MIX ---
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.65, ctx.currentTime);
    masterGain.connect(compressor); // Connect drones to compressor
    masterGainRef.current = masterGain;

    const oscs: OscillatorNode[] = [];
    const gains: GainNode[] = [];
    const filters: BiquadFilterNode[] = [];

    // --- LAYER 1: The Sub Foundation (Pure Sine) ---
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 35;
    
    const gain1 = ctx.createGain();
    gain1.gain.value = 0.6;
    
    osc1.connect(gain1).connect(masterGain);
    oscs.push(osc1);
    gains.push(gain1);

    // --- LAYER 2: The Texture (Sawtooth) ---
    const osc2 = ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.value = 35.5; 
    
    const filter2 = ctx.createBiquadFilter();
    filter2.type = 'lowpass';
    filter2.frequency.value = 220; 
    filter2.Q.value = 1;

    const gain2 = ctx.createGain();
    gain2.gain.value = 0.4;

    osc2.connect(filter2).connect(gain2).connect(masterGain);
    oscs.push(osc2);
    gains.push(gain2);
    filters.push(filter2);

    // --- LAYER 3: The Atmosphere (Triangle) ---
    const osc3 = ctx.createOscillator();
    osc3.type = 'triangle';
    osc3.frequency.value = 90;
    
    const filter3 = ctx.createBiquadFilter();
    filter3.type = 'lowpass';
    filter3.frequency.value = 700;

    const gain3 = ctx.createGain();
    gain3.gain.value = 0.35;

    osc3.connect(filter3).connect(gain3).connect(masterGain);
    oscs.push(osc3);
    gains.push(gain3);
    filters.push(filter3);

    // --- LFO ---
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.15;
    
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 50;

    lfo.connect(lfoGain).connect(filter2.frequency);
    lfo.start();

    oscs.forEach(o => o.start());

    droneStateRef.current = { oscs, gains, filters, lfo };

    return ctx;
  }, []);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * QUOTES.length);
    setQuote(QUOTES[randomIndex]);

    const handleUserGesture = () => {
      initAudio();
    };

    window.addEventListener('click', handleUserGesture);
    window.addEventListener('keydown', handleUserGesture);
    return () => {
      window.removeEventListener('click', handleUserGesture);
      window.removeEventListener('keydown', handleUserGesture);
    };
  }, [initAudio]);

  const playCollapseSequence = () => {
    const ctx = initAudio();
    if (!ctx || !compressorRef.current) return;
    
    const now = ctx.currentTime;
    const compressor = compressorRef.current;

    // 1. MANIPULATE THE DRONE (Pitch Dive + Fade)
    droneStateRef.current.oscs.forEach(osc => {
      osc.frequency.cancelScheduledValues(now);
      osc.frequency.setValueAtTime(osc.frequency.value, now);
      // Slower, deeper dive into the void
      osc.frequency.exponentialRampToValueAtTime(0.5, now + 4.0);
    });

    if (masterGainRef.current) {
        masterGainRef.current.gain.cancelScheduledValues(now);
        masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, now);
        // Swell up
        masterGainRef.current.gain.linearRampToValueAtTime(1.0, now + 1.8);
        // Smooth, asymptotic decay (simulates natural resonance fade)
        masterGainRef.current.gain.setTargetAtTime(0, now + 2.0, 0.8);
    }

    if (droneStateRef.current.lfo) {
        droneStateRef.current.lfo.frequency.exponentialRampToValueAtTime(20, now + 3.0);
    }

    // 2. SYNTHESIZE THE TEAR (Brownian Noise)
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; 
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 80;
    noiseFilter.Q.value = 1;

    const distortion = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
        const x = (i * 2) / 256 - 1;
        curve[i] = (3 + 10) * x * 20 * (Math.PI / 180) / (Math.PI + 10 * Math.abs(x));
    }
    distortion.curve = curve;
    distortion.oversample = '4x';

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(1.0, now + 1.8);
    // Decay matching the drone for consistency
    noiseGain.gain.setTargetAtTime(0, now + 2.0, 0.6); 

    // Connect Noise to Compressor (Shared Bus) so it gets Echoed
    noise.connect(noiseFilter).connect(distortion).connect(noiseGain).connect(compressor);

    // Filter Sweep
    noiseFilter.frequency.exponentialRampToValueAtTime(600, now + 3.0);
    
    noise.start(now);
    // Stop much later to allow delay tail to ring out naturally
    noise.stop(now + 8.0);
  };

  const handleCollapse = () => {
    playCollapseSequence();
    setAnimationState('collapsing');

    setTimeout(() => {
      setShowFlash(true);
      setTimeout(() => {
        setAnimationState('collapsed');
      }, 100);
      setTimeout(() => {
        setShowFlash(false);
      }, 3500);
    }, 2300);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-white select-none">
      <MeshBackground state={animationState} />
      
      <BlackHole state={animationState} />
      
      <QuoteSection 
        quote={quote} 
        state={animationState} 
        onCollapse={handleCollapse} 
      />

      {/* Flashbang Overlay */}
      <div 
        className={`fixed inset-0 z-[100] bg-white pointer-events-none transition-opacity duration-[1500ms] ease-out
          ${showFlash ? 'opacity-100' : 'opacity-0'}
        `}
      />

      {/* UI Elements that remain */}
      <div className="fixed top-8 left-8 z-50 text-[10px] tracking-[0.4em] uppercase font-bold text-zinc-300">
        Project Singularity // 001
      </div>
      
      <div className="fixed bottom-8 right-8 z-50 flex gap-4">
        <div className="w-1 h-1 bg-black/20 rounded-full" />
        <div className="w-1 h-1 bg-black/40 rounded-full" />
        <div className="w-1 h-1 bg-black/10 rounded-full" />
      </div>
    </div>
  );
};

export default App;
