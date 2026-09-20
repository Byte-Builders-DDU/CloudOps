import React, { useEffect, useRef } from 'react';

export function CursorGlow() {
  const glowRef = useRef(null);
  const dotRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    let animationFrameId;
    let particles = [];
    let mouse = { x: -1000, y: -1000 };
    let isMoving = false;
    let timeoutId;

    // Canvas setup for particle trail
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1;
        // Float upwards and outwards like sparks
        this.speedX = (Math.random() - 0.5) * 2;
        this.speedY = (Math.random() - 0.5) * 2 - 0.5;
        // Neon cyan and emerald colors to match the theme
        const colors = ['#22d3ee', '#34d399', '#818cf8', '#38bdf8'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.life = 1;
        this.decay = Math.random() * 0.02 + 0.015;
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
        this.size = Math.max(0, this.size - 0.05);
      }
      
      draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
      }
    }

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      
      // Spawn particles on mouse move (fairy dust effect)
      for (let i = 0; i < 3; i++) {
        particles.push(new Particle(mouse.x, mouse.y));
      }

      // Update the ambient glow
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0) translate(-50%, -50%)`;
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0) translate(-50%, -50%)`;
      }
      
      // Pulse dot when moving
      if (dotRef.current && !isMoving) {
        dotRef.current.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0) translate(-50%, -50%) scale(1.5)`;
        isMoving = true;
      }
      
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        isMoving = false;
        if (dotRef.current) {
          dotRef.current.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0) translate(-50%, -50%) scale(1)`;
        }
      }, 100);
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      
      // Remove dead particles
      particles = particles.filter(p => p.life > 0);
      
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    animate();
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resizeCanvas);
      clearTimeout(timeoutId);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <canvas 
        ref={canvasRef}
        className="pointer-events-none fixed top-0 left-0 z-[9998] w-full h-full mix-blend-screen hidden md:block"
      />
      {/* Large Ambient Glow - Trails slower */}
      <div
        ref={glowRef}
        className="pointer-events-none fixed top-0 left-0 z-0 w-[500px] h-[500px] rounded-full mix-blend-screen transition-all duration-500 ease-out hidden md:block"
        style={{
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.08) 0%, rgba(56, 189, 248, 0.02) 40%, rgba(0,0,0,0) 70%)',
          willChange: 'transform',
          transform: 'translate(-50%, -50%)',
        }}
      />
      {/* Tiny Sharp Dot - Trails faster */}
      <div
        ref={dotRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999] w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_15px_4px_rgba(34,211,238,0.6)] transition-all duration-100 ease-out hidden md:block"
        style={{
          willChange: 'transform',
          transform: 'translate(-50%, -50%)',
        }}
      />
    </>
  );
}
