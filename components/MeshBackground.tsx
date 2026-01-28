
import React, { useEffect, useRef } from 'react';
import { AnimationState } from '../types';

interface MeshBackgroundProps {
  state: AnimationState;
}

interface Point {
  x: number;
  y: number;
  dist: number;
  opacity: number;
}

interface AmbientParticle {
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  size: number;
  shimmerPhase: number;
  shimmerSpeed: number;
  maxAlpha: number;
  driftOffset: number;
}

interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  phase: number;
}

interface RadiationParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  alpha: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
}

const MeshBackground: React.FC<MeshBackgroundProps> = ({ state }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -2000, y: -2000 });
  const easedMouseRef = useRef({ x: -2000, y: -2000 });
  const influenceRef = useRef(0);
  
  // Physics simulation state for smooth transitions
  const physicsRef = useRef({
    flowSpeed: 8,
    radius: 700,
    pullForce: 200,
    swirlStrength: 100,
    timeStep: 0.012,
  });

  const ambientParticlesRef = useRef<AmbientParticle[]>([]);
  const dustParticlesRef = useRef<DustParticle[]>([]);
  const radiationParticlesRef = useRef<RadiationParticle[]>([]);
  const starsRef = useRef<Star[]>([]);
  const isCollapsing = state === 'collapsing';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;
    let lastMouseX = -2000;
    let lastMouseY = -2000;

    const initStars = () => {
      const count = 300;
      const stars: Star[] = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: Math.random() * 1 + 0.5,
          alpha: 0.1 + Math.random() * 0.4,
        });
      }
      starsRef.current = stars;
    };

    const initDustParticles = () => {
      // High count for density, but very subtle visually
      const count = Math.floor((window.innerWidth * window.innerHeight) / 5000); 
      const particles: DustParticle[] = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 0.2, // Very slow drift
          vy: (Math.random() - 0.5) * 0.2,
          size: Math.random() * 0.8 + 0.2, // Very small
          alpha: 0.02 + Math.random() * 0.08, // Barely visible
          phase: Math.random() * Math.PI * 2, // For chaotic sine movement
        });
      }
      dustParticlesRef.current = particles;
    };

    const initAmbientParticles = () => {
      const count = Math.floor((window.innerWidth * window.innerHeight) / 15000);
      const particles: AmbientParticle[] = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          baseX: Math.random() * window.innerWidth,
          baseY: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 0.5,
          shimmerPhase: Math.random() * Math.PI * 2,
          shimmerSpeed: 0.005 + Math.random() * 0.04,
          maxAlpha: 0.05 + Math.random() * 0.15,
          driftOffset: Math.random() * 1000,
        });
      }
      ambientParticlesRef.current = particles;
    };

    const spawnRadiationParticle = (bhX: number, bhY: number) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = isCollapsing ? 2 + Math.random() * 8 : 0.5 + Math.random() * 1.5;
      const life = isCollapsing ? 50 + Math.random() * 50 : 200 + Math.random() * 300;
      
      radiationParticlesRef.current.push({
        x: bhX + (Math.random() - 0.5) * 100,
        y: bhY + (Math.random() - 0.5) * 100,
        vx: Math.cos(angle) * speed * -1, 
        vy: Math.sin(angle) * speed,
        life: life,
        maxLife: life,
        size: Math.random() * 1.5 + 0.5,
        alpha: 0,
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      const moveDist = Math.sqrt(dx * dx + dy * dy);
      influenceRef.current = Math.min(1.0, influenceRef.current + moveDist * 0.015);
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initAmbientParticles();
      initDustParticles();
      initStars();
    };

    const processPoint = (origX: number, origY: number, spacing: number): Point => {
      let x = origX;
      let y = origY;

      const bhSize = window.innerWidth < 768 ? 256 : 384;
      const offset = 48;
      const bhX = canvas.width - offset - (bhSize / 2);
      const bhY = offset + (bhSize / 2);

      // Physics State
      const { flowSpeed, radius, pullForce, swirlStrength } = physicsRef.current;

      // 1. Base Flow (Ambient movement)
      const fdx = x - bhX;
      const fdy = y - bhY;
      const fdist = Math.sqrt(fdx * fdx + fdy * fdy);
      
      // Smooth out the flow offset to avoid jumps
      const flowOffset = Math.sin(time * 0.5 + fdist * 0.001) * spacing * 0.5;
      if (fdist > 10) {
        x += (fdy / fdist) * flowOffset * 0.2; // Perpendicular flow
        y += (fdx / fdist) * flowOffset * 0.2;
      }

      // 2. Wave Distortions
      const waveFreq = 0.003;
      const waveHeight = 20;
      y += Math.sin(time * 0.5 + x * waveFreq + y * waveFreq * 0.5) * waveHeight;
      x += Math.cos(time * 0.4 + y * waveFreq) * 12;

      // 3. Mouse Interaction (Repulsion)
      const mRadius = 150;
      const interactionPoints = [
        { pos: mouseRef.current, weight: 0.8 },
        { pos: easedMouseRef.current, weight: 0.4 + influenceRef.current * 0.3 }
      ];

      interactionPoints.forEach(({ pos, weight }) => {
        const mdx = x - pos.x;
        const mdy = y - pos.y;
        const mdistSq = mdx * mdx + mdy * mdy;
        if (mdistSq < mRadius * mRadius) {
          const mdist = Math.sqrt(mdistSq);
          // Smooth Hermite interpolation for force to avoid hard edges
          const t = 1 - (mdist / mRadius);
          const smoothT = t * t * (3 - 2 * t); 
          const pushAmount = smoothT * 40 * weight;
          x += (mdx / mdist) * pushAmount;
          y += (mdy / mdist) * pushAmount;
        }
      });

      // 4. Black Hole Gravity (The "Suck")
      const dx = x - bhX;
      const dy = y - bhY;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq);

      // Smoothstep falloff for gravity well
      // This eliminates the "step-wise" feeling of the `if (dist < radius)` check
      const gravityRadius = radius * 1.2;
      if (dist < gravityRadius) {
        const t = 1 - (dist / gravityRadius);
        // Quartic falloff for sharper center, smooth edge
        const force = t * t * t * t; 
        
        const pull = force * pullForce;
        x -= (dx / dist) * pull;
        y -= (dy / dist) * pull;

        const angle = Math.atan2(dy, dx);
        const swirl = force * swirlStrength * (isCollapsing ? 2.5 : 1.0);
        x += Math.cos(angle + Math.PI / 2) * swirl;
        y += Math.sin(angle + Math.PI / 2) * swirl;
      }

      // Opacity Calculation
      const edgeFade = Math.min(x / 100, (canvas.width - x) / 100, y / 100, (canvas.height - y) / 100, 1);
      const bhFade = Math.min(1, Math.max(0, (dist - 60) / 300));
      const opacity = Math.max(0, edgeFade * bhFade * 0.18); // Slightly higher base opacity

      return { x, y, dist, opacity: isCollapsing ? opacity * 3 : opacity };
    };

    const draw = () => {
      // Lerp physics values towards target
      // Slower lerp for radius to make it feel "heavy"
      // Faster lerp for pullForce to feel "responsive"
      const targetFlowSpeed = isCollapsing ? 60 : 8;
      const targetRadius = isCollapsing ? 2200 : 700;
      const targetPullForce = isCollapsing ? 800 : 200;
      const targetSwirlStrength = isCollapsing ? 500 : 100;
      const targetTimeStep = isCollapsing ? 0.06 : 0.012;

      const lerp = 0.05; // Slightly faster for responsiveness
      physicsRef.current.flowSpeed += (targetFlowSpeed - physicsRef.current.flowSpeed) * lerp;
      physicsRef.current.radius += (targetRadius - physicsRef.current.radius) * lerp;
      physicsRef.current.pullForce += (targetPullForce - physicsRef.current.pullForce) * lerp;
      physicsRef.current.swirlStrength += (targetSwirlStrength - physicsRef.current.swirlStrength) * lerp;
      physicsRef.current.timeStep += (targetTimeStep - physicsRef.current.timeStep) * lerp;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const mouseLerp = 0.1;
      easedMouseRef.current.x += (mouseRef.current.x - easedMouseRef.current.x) * mouseLerp;
      easedMouseRef.current.y += (mouseRef.current.y - easedMouseRef.current.y) * mouseLerp;
      influenceRef.current *= 0.95;

      const bhSize = window.innerWidth < 768 ? 256 : 384;
      const offset = 48;
      const bhX = canvas.width - offset - (bhSize / 2);
      const bhY = offset + (bhSize / 2);

      // --- Draw Static Starfield ---
      starsRef.current.forEach(star => {
        const dx = star.x - bhX;
        const dy = star.y - bhY;
        const d = Math.sqrt(dx*dx + dy*dy);
        
        // Stars warp slightly too
        const warpFactor = isCollapsing ? 0.2 : 0;
        const tx = star.x - (dx/d) * warpFactor * 100;
        const ty = star.y - (dy/d) * warpFactor * 100;

        const holeRadius = isCollapsing ? physicsRef.current.radius * 0.3 : 280;
        const alphaScale = Math.min(1, Math.max(0, (d - holeRadius) / 300));
        
        if (alphaScale > 0.05) {
          ctx.fillStyle = `rgba(0, 0, 0, ${star.alpha * alphaScale * 0.3})`;
          ctx.beginPath();
          ctx.arc(tx, ty, star.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // --- Draw Galactic Dust (Subtle Background Flow) ---
      dustParticlesRef.current.forEach(p => {
        // Chaotic drift
        p.x += p.vx + Math.sin(time * 0.2 + p.phase) * 0.05;
        p.y += p.vy + Math.cos(time * 0.15 + p.phase) * 0.05;

        // Wrap around
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Apply physics/distortion (gravity) but keep them subtle
        const transformed = processPoint(p.x, p.y, 10);
        const finalAlpha = Math.min(p.alpha, transformed.opacity * p.alpha * 8);

        if (finalAlpha > 0.001) {
          ctx.fillStyle = `rgba(0, 0, 0, ${finalAlpha})`;
          ctx.beginPath();
          ctx.arc(transformed.x, transformed.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // --- Spawn Radiation Particles ---
      const spawnChance = isCollapsing ? 0.9 : 0.05;
      if (Math.random() < spawnChance) {
        spawnRadiationParticle(bhX, bhY);
      }

      // --- Draw Radiation Particles ---
      radiationParticlesRef.current = radiationParticlesRef.current.filter(p => {
        p.life--;
        p.x += p.vx;
        p.y += p.vy;
        p.y += Math.sin(time + p.x * 0.01) * 0.2;
        const lifeRatio = p.life / p.maxLife;
        p.alpha = Math.sin(lifeRatio * Math.PI) * 0.6;
        if (p.life > 0) {
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          return true;
        }
        return false;
      });

      // --- Draw Ambient Particles ---
      ambientParticlesRef.current.forEach(p => {
        p.vx += (Math.random() - 0.5) * 0.015;
        p.vy += (Math.random() - 0.5) * 0.015;
        p.vx += Math.sin(time * 0.3 + p.baseY * 0.005 + p.driftOffset) * 0.003;
        p.vy += Math.cos(time * 0.3 + p.baseX * 0.005 + p.driftOffset) * 0.003;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.baseX += p.vx;
        p.baseY += p.vy;

        if (p.baseX < 0) p.baseX = canvas.width;
        if (p.baseX > canvas.width) p.baseX = 0;
        if (p.baseY < 0) p.baseY = canvas.height;
        if (p.baseY > canvas.height) p.baseY = 0;

        const transformed = processPoint(p.baseX, p.baseY, 25);
        
        p.shimmerPhase += p.shimmerSpeed * (0.8 + Math.random() * 0.4);
        const shimmer = (Math.sin(p.shimmerPhase) + 1) / 2;
        const alpha = transformed.opacity * p.maxAlpha * (0.3 + shimmer * 0.7);

        if (alpha > 0.005) {
          ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
          ctx.beginPath();
          ctx.arc(transformed.x, transformed.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // --- Draw Hex Grid (Higher Density) ---
      const spacing = 25; // Decreased from 35 for smoother mesh
      const hexW = spacing * 1.5;
      const hexH = spacing * Math.sqrt(3);
      const cols = Math.ceil(canvas.width / hexW) + 6;
      const rows = Math.ceil(canvas.height / hexH) + 6;

      const getHexPoint = (c: number, r: number) => {
        const bx = (c - 3) * hexW;
        let by = (r - 3) * hexH;
        if (c % 2 !== 0) by += hexH / 2;
        return processPoint(bx, by, spacing);
      };

      ctx.lineWidth = 0.8;
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const p1 = getHexPoint(c, r);
          // Optimization: Skip if p1 is completely transparent
          if (!p1 || p1.opacity <= 0.001) continue;

          const neighbors = [getHexPoint(c + 1, r), getHexPoint(c, r + 1)];
          if (c % 2 === 0) neighbors.push(getHexPoint(c + 1, r - 1));
          else neighbors.push(getHexPoint(c + 1, r + 1));

          neighbors.forEach(p2 => {
            if (!p2) return;
            const avgOpacity = (p1.opacity + p2.opacity) / 2;
            if (avgOpacity <= 0.001) return;
            
            ctx.strokeStyle = `rgba(0, 0, 0, ${avgOpacity})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          });

          if (p1.opacity > 0.01) {
            ctx.fillStyle = `rgba(0, 0, 0, ${p1.opacity * 2})`;
            ctx.beginPath();
            ctx.arc(p1.x, p1.y, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      time += physicsRef.current.timeStep;
      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [state, isCollapsing]);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
};

export default MeshBackground;
