'use client';
import React, { useEffect, useState } from "react";
import { useNavigate } from "@/routing-shim";
import { Home, Search, ArrowRight } from "lucide-react";
import "../css/NotFound.css";

const NotFound = () => {
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const faceX = mousePos.x * 0.5;
  const faceY = mousePos.y * 0.5;
  const expX = mousePos.x * 0.8;
  const expY = mousePos.y * 0.8;
  const hairX = mousePos.x * -0.2;
  const hairY = mousePos.y * -0.2;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center font-sans text-slate-800 relative overflow-hidden">

      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
          @keyframes float-delayed {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
            100% { transform: translateY(0px); }
          }
          @keyframes shadow-pulse {
            0% { transform: scale(1); opacity: 1; transform-origin: center; }
            50% { transform: scale(0.9); opacity: 0.6; transform-origin: center; }
            100% { transform: scale(1); opacity: 1; transform-origin: center; }
          }
          @keyframes glow-pulse {
            0% { opacity: 0.05; transform: translate(-50%, -50%) scale(0.95); }
            50% { opacity: 0.15; transform: translate(-50%, -50%) scale(1.05); }
            100% { opacity: 0.05; transform: translate(-50%, -50%) scale(0.95); }
          }
          @keyframes blink {
            0%, 96%, 98% { transform: scaleY(1); }
            97% { transform: scaleY(0.1); }
          }
          @keyframes twinkle {
            0%, 100% { opacity: 0.2; transform: scale(0.8); }
            50% { opacity: 0.6; transform: scale(1.2); }
          }
        `}
      </style>

      {/* Decorative gradient blur in background */}
      <div className="absolute top-1/2 left-1/2 w-[600px] h-[400px] bg-[#5D4FEC] rounded-full blur-[150px] pointer-events-none" style={{ animation: 'glow-pulse 6s ease-in-out infinite' }}></div>

      {/* 404 Illustration */}
      <div className="w-full max-w-[600px] mx-auto mb-0 relative flex justify-center px-4 z-10">
        <svg viewBox="0 0 550 300" width="100%" height="auto" className="max-h-[300px]" xmlns="http://www.w3.org/2000/svg">

          {/* Twinkling Stars */}
          <g fill="#F97316">
            <circle cx="100" cy="50" r="1.5" style={{ animation: 'twinkle 3s ease-in-out infinite 0.5s', transformOrigin: '100px 50px' }} />
            <circle cx="450" cy="80" r="2" style={{ animation: 'twinkle 4s ease-in-out infinite 1s', transformOrigin: '450px 80px' }} />
            <circle cx="150" cy="220" r="1" style={{ animation: 'twinkle 3.5s ease-in-out infinite 0.2s', transformOrigin: '150px 220px' }} />
            <circle cx="380" cy="200" r="1.5" style={{ animation: 'twinkle 4.5s ease-in-out infinite 1.5s', transformOrigin: '380px 200px' }} />
            <circle cx="275" cy="40" r="1.5" style={{ animation: 'twinkle 3.2s ease-in-out infinite 0.8s', transformOrigin: '275px 40px' }} />
            <circle cx="50" cy="150" r="2.5" style={{ animation: 'twinkle 5s ease-in-out infinite 0.1s', transformOrigin: '50px 150px' }} />
            <circle cx="200" cy="80" r="1" style={{ animation: 'twinkle 2.5s ease-in-out infinite 1.2s', transformOrigin: '200px 80px' }} />
            <circle cx="300" cy="250" r="1.5" style={{ animation: 'twinkle 3.8s ease-in-out infinite 0.7s', transformOrigin: '300px 250px' }} />
            <circle cx="500" cy="150" r="2" style={{ animation: 'twinkle 4.2s ease-in-out infinite 1.8s', transformOrigin: '500px 150px' }} />
            <circle cx="420" cy="30" r="1" style={{ animation: 'twinkle 2.8s ease-in-out infinite 0.3s', transformOrigin: '420px 30px' }} />
            <circle cx="60" cy="260" r="2" style={{ animation: 'twinkle 4.7s ease-in-out infinite 1.1s', transformOrigin: '60px 260px' }} />
          </g>

          {/* Base/Ground shadow */}
          <ellipse cx="275" cy="245" rx="100" ry="6" fill="#E8EDF5" style={{ animation: 'shadow-pulse 4s ease-in-out infinite' }} />

          {/* Left 4 */}
          <g transform="translate(50, 90)">
            <g style={{ animation: 'float-delayed 5s ease-in-out infinite 1s' }}>
              <path d="M 100 0 L 135 0 L 135 155 L 100 155 L 100 120 L 0 120 L 0 85 L 100 0 Z M 100 35 L 35 90 L 100 90 Z" fillRule="evenodd" fill="#5D4FEC" />
            </g>
          </g>

          {/* Right 4 */}
          <g transform="translate(365, 90)">
            <g style={{ animation: 'float-delayed 5s ease-in-out infinite 2s' }}>
              <path d="M 100 0 L 135 0 L 135 155 L 100 155 L 100 120 L 0 120 L 0 85 L 100 0 Z M 100 35 L 35 90 L 100 90 Z" fillRule="evenodd" fill="#5D4FEC" />
            </g>
          </g>

          {/* Robot Center '0' with floating animation */}
          <g style={{ animation: 'float 4s ease-in-out infinite' }}>
            <g
              transform="translate(275, 175) scale(2.8)"
              style={{ cursor: 'pointer' }}
            >
              <g style={{ transform: 'translate(-26px, -25px)', transition: 'transform 0.1s ease-out' }}>
                <path d="M26,0c20.24,0,26,5.49,26,26.47,0,23.84-10.75,23.53-26,23.53S0,50.31,0,26.47C0,5.49,5.76,0,26,0Z" fill="url(#head-color)" />
                <defs>
                  <linearGradient id="head-color" x1="26" y1="0" x2="26" y2="50" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#E8EDF5" />
                    <stop offset="1" stopColor="#D4D9F0" />
                  </linearGradient>
                </defs>
              </g>

              <g style={{ transform: `translate(calc(-22px + ${faceX}px), calc(-18px + ${faceY}px))`, transition: 'transform 0.1s ease-out' }}>
                <path d="M22,36c15.09,0,20.52-.87,21.83-16.94S39.44,0,22,0-1.1,3.45.17,19.06c1.3,16.07,6.74,16.94,21.83,16.94Z" fill="url(#face-color)" />
                <defs>
                  <linearGradient id="face-color" x1="22" y1="0" x2="22" y2="36" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#1C1B3B" />
                    <stop offset="1" stopColor="#312F62" />
                  </linearGradient>
                </defs>
              </g>

              <g style={{ transform: `translate(calc(-15px + ${expX}px), calc(-7.5px + ${expY}px))`, transition: 'transform 0.1s ease-out' }}>
                <path id="eye-l" d="M3.78,12c3.45,0,3.78-2.7,3.78-6S7.56,0,3.78,0,0,2.7,0,6s.33,6,3.78,6Z" fill="white" style={{ animation: 'blink 5s infinite', transformOrigin: '3.78px 6px' }} />
                <path id="mouth" d="M13.05,12.76c-1.13-.45-.82,2.24,2.99,2.24,4.21,0,4.24-3.55,3.01-4.13-1.35-.64-1.75,3.6-5.99,1.89Z" fill="white" />
                <path id="eye-r" d="M26.22,12c3.45,0,3.78-2.7,3.78-6s0-6-3.78-6-3.78,2.7-3.78,6,.33,6,3.78,6Z" fill="white" style={{ animation: 'blink 5s infinite', transformOrigin: '26.22px 6px' }} />
              </g>
            </g>
          </g>

        </svg>
      </div>

      {/* Main Text Content */}
      <div className="z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-4xl md:text-[40px] font-semibold text-[#111827] mb-4 text-center tracking-tight">
          Page Not Found!
        </h1>
        <p className="text-[#6B7280] text-center max-w-md mx-auto mb-10 leading-relaxed text-[15px]">
          The page you're looking for doesn't exist or may have been moved.<br className="hidden sm:block" />
          Let's get you back to where you need to go.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 w-full px-4 sm:px-0 sm:w-auto">
          <button
            onClick={() => navigate("/")}
            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-[#5D4FEC] hover:bg-[#4C40D4] text-white rounded-lg font-medium transition-colors w-full sm:w-auto text-[15px]"
          >
            <Home className="w-[18px] h-[18px]" strokeWidth={2} /> Go to Homepage
          </button>
          <button
            onClick={() => navigate("/jobs")}
            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-white border border-[#E5E7EB] text-[#5D4FEC] hover:bg-slate-50 rounded-lg font-medium transition-colors w-full sm:w-auto text-[15px]"
          >
            <Search className="w-[18px] h-[18px]" strokeWidth={2} /> Browse Jobs
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 w-full max-w-[1200px] flex flex-col md:flex-row justify-between items-center text-[13.5px] text-slate-500 px-8 z-10">
        <p className="mb-4 md:mb-0 font-medium">© 2026 <a href="https://careerfast.in/" target="_blank" className="text-[#5D4FEC] transition-colors hover:text-[#4C40D4]">Careerfast</a>. All rights reserved.</p>
        <button onClick={() => navigate("/contact")} className="hover:text-[#5D4FEC] transition-colors flex items-center gap-1.5 group">
          Need help? <span className="font-semibold text-[#5D4FEC]">Contact Support</span>
          <ArrowRight className="w-4 h-4 text-[#5D4FEC] group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

    </div>
  );
};

export default NotFound;
