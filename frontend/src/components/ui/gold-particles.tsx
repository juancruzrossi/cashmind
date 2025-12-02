'use client';

import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  left: string;
  top: string;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
}

interface GoldParticlesProps {
  count?: number;
  className?: string;
}

export function GoldParticles({ count = 30, className = '' }: GoldParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: Math.random() * 3 + 1,
        delay: Math.random() * 20,
        duration: Math.random() * 15 + 15,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }
    setParticles(newParticles);
  }, [count]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: particle.left,
            top: particle.top,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: `radial-gradient(circle, rgba(212, 168, 83, ${particle.opacity}) 0%, rgba(212, 168, 83, 0) 70%)`,
            animation: `floatParticle ${particle.duration}s ease-in-out infinite`,
            animationDelay: `${particle.delay}s`,
            '--tx': `${(Math.random() - 0.5) * 60}px`,
            '--ty': `${-Math.random() * 150 - 50}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

export function GoldGradientOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full animate-pulse-slow"
        style={{
          background: 'radial-gradient(circle, rgba(212, 168, 83, 0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full animate-pulse-slow"
        style={{
          background: 'radial-gradient(circle, rgba(212, 168, 83, 0.06) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animationDelay: '2s',
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(212, 168, 83, 0.03) 0%, transparent 50%)',
        }}
      />
    </div>
  );
}
