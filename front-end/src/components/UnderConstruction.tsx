import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const UnderConstruction: React.FC = () => {
  const { t } = useTranslation();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 60000; // 60 seconds

    const updateProgress = () => {
      const elapsed = (Date.now() - startTime) % duration;
      const currentProgress = (elapsed / duration) * 100;
      setProgress(currentProgress);
    };

    const interval = setInterval(updateProgress, 50);
    return () => clearInterval(interval);
  }, []);

  const calculateRotation = (baseSpeed: number) => {
    const time = Date.now() / 1000;
    const mouseInfluence = (mousePos.x / window.innerWidth) * 20;
    return (time * baseSpeed + mouseInfluence) % 360;
  };

  const Cog = ({ 
    size, 
    x, 
    y, 
    speed, 
    delay = 0 
  }: { 
    size: number; 
    x: number; 
    y: number; 
    speed: number; 
    delay?: number;
  }) => (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        animation: `float ${4 + delay}s ease-in-out infinite`,
        animationDelay: `${delay}s`
      }}
    >
      <svg 
        className="cog" 
        width={size} 
        height={size}
        viewBox="0 0 50 50" 
        xmlns="http://www.w3.org/2000/svg"
        style={{
          transform: `rotate(${calculateRotation(speed)}deg)`,
          transition: 'transform 0.1s linear'
        }}
      >
        <path 
          d="M25,31.8181818 C21.1363636,31.8181818 18.1818182,28.8636364 18.1818182,25 C18.1818182,21.1363636 21.1363636,18.1818182 25,18.1818182 C28.8636364,18.1818182 31.8181818,21.1363636 31.8181818,25 C31.8181818,28.8636364 28.8636364,31.8181818 25,31.8181818 M44.0909091,25 C44.0909091,23.8636364 44.0909091,22.9545455 43.8636364,22.0454545 L50,16.5909091 L44.7727273,8.18181818 L37.5,10.4545455 C35.6818182,8.86363636 33.8636364,7.72727273 31.5909091,7.04545455 L30,0 L20,0 L18.4090909,7.04545455 C16.1363636,7.72727273 14.0909091,9.09090909 12.5,10.4545455 L5.22727273,8.18181818 L0,16.5909091 L6.13636364,21.8181818 C5.90909091,22.7272727 5.90909091,23.8636364 5.90909091,24.7727273 C5.90909091,25.6818182 5.90909091,26.8181818 6.13636364,27.7272727 L0,33.4090909 L5.22727273,41.8181818 L12.5,39.5454545 C14.3181818,41.1363636 16.1363636,42.2727273 18.4090909,42.9545455 L20,50 L30,50 L31.5909091,42.9545455 C33.8636364,42.0454545 35.9090909,40.9090909 37.5,39.5454545 L44.7727273,41.8181818 L50,33.4090909 L43.8636364,28.1818182 C44.0909091,27.0454545 44.0909091,26.1363636 44.0909091,25"
          fill="#8b0002"
          opacity="0.8"
        />
        <circle cx="25" cy="25" r="7" fill="white" />
      </svg>
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #f9fafb, #f3f4f6)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
          50% { transform: translate(-50%, -50%) translateY(-10px); }
        }
        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      {/* Background grid pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.05
      }}>
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#8b0002" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Mouse-reactive background gradient */}
      <div
        style={{
           position: 'absolute',
            inset: 0,
            opacity: 0.1,
            background: `radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, #8b0002 0%, rgba(139, 0, 2, 0.5) 20%, transparent 50%)`,
            pointerEvents: 'none' // Ensures it doesn't interfere with mouse events
        }}
      />

      {/* 5 Cogs positioned above PoliConnect text - non-intersecting */}
      <Cog size={80} x={20} y={25} speed={30} delay={0} />
      <Cog size={100} x={50} y={20} speed={-20} delay={0.3} />
      <Cog size={70} x={80} y={28} speed={25} delay={0.6} />
      <Cog size={90} x={35} y={35} speed={-35} delay={0.9} />
      <Cog size={75} x={65} y={38} speed={40} delay={1.2} />

      {/* Main content container */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          marginTop: '8rem',
          transform: `scale(${isHovered ? 1.05 : 1})`,
          transition: 'transform 0.3s ease-out'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Text content */}
        <div style={{ 
          textAlign: 'center',
          animation: 'slideIn 0.8s ease-out'
        }}>
          <h1 style={{ 
            fontSize: '2.25rem',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '0.5rem'
          }}>
            Poli<span style={{ color: '#8b0002' }}>Connect</span>
          </h1>
          <h2 style={{ 
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '1rem'
          }}>
            {t('common.underConstruction')}
          </h2>
          <p style={{ 
            color: '#4b5563',
            maxWidth: '28rem',
            margin: '0 auto',
            padding: '0 1rem'
          }}>
            {t('common.underConstruction.message')}
          </p>

          {/* Progress indicator */}
          <div style={{ 
            marginTop: '2rem',
            margin: '2rem auto 0',
            width: '16rem',
            height: '0.75rem',
            backgroundColor: '#e5e7eb',
            borderRadius: '9999px',
            overflow: 'hidden',
            boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
          }}>
            <div
              style={{
                height: '100%',
                borderRadius: '9999px',
                transition: 'all 0.3s linear',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #8b0002 0%, #a61e1e 50%, #8b0002 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s linear infinite',
                boxShadow: '0 0 10px rgba(139, 0, 2, 0.5)'
              }}
            />
          </div>
          <p style={{ 
            fontSize: '0.875rem',
            color: '#6b7280',
            marginTop: '0.5rem'
          }}>
            {t('common.underConstruction.progress', { progress: Math.floor(progress) })}
          </p>
        </div>
      </div>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: '0.5rem',
            height: '0.5rem',
            borderRadius: '50%',
            background: i % 2 === 0 ? '#8b0002' : '#6b6b6b',
            opacity: 0.2,
            left: `${20 + i * 15}%`,
            top: `${80 + Math.sin(i) * 10}%`,
            animation: `float ${4 + i * 0.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`
          }}
        />
      ))}
    </div>
  );
};

export default UnderConstruction;