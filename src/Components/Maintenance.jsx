import React, { useEffect, useRef } from 'react';

export default function Maintenance() {
    const chatbotRef = useRef(null);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!chatbotRef.current) return;
            const x = (e.clientX / window.innerWidth - 0.5) * 20; // max 20px offset
            const y = (e.clientY / window.innerHeight - 0.5) * 20;

            // Adjust offset for different layers to create parallax
            const layers = chatbotRef.current.querySelectorAll('.robot-layer');
            layers.forEach((layer) => {
                if (layer.id === 'face') {
                    layer.style.setProperty('--offset-x', `${x * 0.5}px`);
                    layer.style.setProperty('--offset-y', `${y * 0.5}px`);
                } else if (layer.id === 'expression') {
                    layer.style.setProperty('--offset-x', `${x * 0.8}px`);
                    layer.style.setProperty('--offset-y', `${y * 0.8}px`);
                } else if (layer.id === 'hair') {
                    layer.style.setProperty('--offset-x', `${-x * 0.2}px`);
                    layer.style.setProperty('--offset-y', `${-y * 0.2}px`);
                }
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="flex flex-col justify-center items-center m-0 p-0 bg-[#000000] min-h-screen relative overflow-hidden">
            <style>
                {`
                #chatbot {
                    position: relative;
                    width: 80px;
                    height: 80px;
                    transform: scale(3);
                }
                .robot-layer {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(
                        calc(-50% + var(--offset-x, 0px)),
                        calc(-50% + var(--offset-y, 0px))
                    );
                    transition: transform 0.1s ease-out;
                    will-change: transform;
                }
                #chatbot:hover #hair {
                    transform: translate(
                        calc(-50% + var(--offset-x, 0px)),
                        calc(-50% + var(--offset-y, 0px))
                    )
                    rotate(-270deg);
                    transition: 0.3s ease-out;
                }
                `}
            </style>

            <div id="chatbot" ref={chatbotRef} className="mb-24 mt-[-60px]">
                <svg id="hair" className="robot-layer" width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M29.9988 24.148L5.8512 0L-5.0344e-05 5.85133L24.1476 29.9993L29.9988 24.148Z" fill="#0E75B4" />
                    <path d="M24.1487 0.00046199L0.00109863 24.1484L5.85235 29.9998L30 5.8518L24.1487 0.00046199Z" fill="#0E75B4" />
                </svg>
                <svg id="head" className="robot-layer" width="52" height="50" viewBox="0 0 52 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M26,0c20.24,0,26,5.49,26,26.47,0,23.84-10.75,23.53-26,23.53S0,50.31,0,26.47C0,5.49,5.76,0,26,0Z" fill="url(#head-color)" />
                    <defs>
                        <linearGradient id="head-color" x1="26" y1="0" x2="26" y2="50" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#69D7FF" />
                            <stop offset="1" stopColor="#00B4F5" />
                        </linearGradient>
                    </defs>
                </svg>
                <svg id="face" className="robot-layer" width="44" height="36" viewBox="0 0 44 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22,36c15.09,0,20.52-.87,21.83-16.94S39.44,0,22,0-1.1,3.45.17,19.06c1.3,16.07,6.74,16.94,21.83,16.94Z" fill="url(#face-color)" />
                    <defs>
                        <linearGradient id="face-color" x1="22" y1="0" x2="22" y2="36" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#005284" />
                            <stop offset="1" stopColor="#0076BE" />
                        </linearGradient>
                    </defs>
                </svg>
                <svg id="expression" className="robot-layer" width="30" height="15" viewBox="0 0 32 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path id="eye-l" d="M3.78,12c3.45,0,3.78-2.7,3.78-6S7.56,0,3.78,0,0,2.7,0,6s.33,6,3.78,6Z" fill="white" />
                    <path id="mouth" d="M13.05,12.76c-1.13-.45-.82,2.24,2.99,2.24,4.21,0,4.24-3.55,3.01-4.13-1.35-.64-1.75,3.6-5.99,1.89Z" fill="white" />
                    <path id="eye-r" d="M26.22,12c3.45,0,3.78-2.7,3.78-6s0-6-3.78-6-3.78,2.7-3.78,6,.33,6,3.78,6Z" fill="white" />
                </svg>
            </div>

            <div className="text-center z-10 mt-1 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">System Maintenance</h1>
                <p className="text-slate-400 text-lg md:text-xl max-w-lg mx-auto">
                    We're currently performing some scheduled maintenance to improve our platform. We'll be back online shortly.
                </p>
                <div className="mt-8 flex items-center justify-center gap-3 text-slate-500">
                    <div className="w-2 h-2 bg-[#00B4F5] rounded-full animate-ping"></div>
                    <span className="text-sm font-medium tracking-widest uppercase text-[#00B4F5]">Working on it</span>
                </div>
            </div>
        </div>
    );
}
