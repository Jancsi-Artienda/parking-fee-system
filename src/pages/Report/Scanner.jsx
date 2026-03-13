import { useState, useEffect } from "react";

export default function Scanner() {
  const [dots, setDots] = useState(0);
  const [scanLine, setScanLine] = useState(0);

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev + 1) % 4);
    }, 500);
    return () => clearInterval(dotsInterval);
  }, []);

  useEffect(() => {
    const scanInterval = setInterval(() => {
      setScanLine((prev) => (prev >= 100 ? 0 : prev + 0.5));
    }, 16);
    return () => clearInterval(scanInterval);
  }, []);

  const dotString = ".".repeat(dots);
  const scanOpacity = scanLine > 95 || scanLine < 5 ? 0 : 0.7;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center font-mono relative overflow-hidden p-6">
      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(245,158,11,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(245,158,11,0.06) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glowing orb */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          background: "radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)",
          animation: "pulse-orb 4s ease-in-out infinite",
        }}
      />

      {/* Card */}
      <div
        className="relative bg-white border border-amber-200 rounded-2xl px-10 py-12 max-w-[460px] w-full text-center"
        style={{
          boxShadow: "0 0 60px rgba(245,158,11,0.06), 0 24px 48px rgba(0,0,0,0.06)",
          animation: "float-card 6s ease-in-out infinite",
        }}
      >
        {/* Scanner icon with animated scan line */}
        <div className="relative w-20 h-20 mx-auto mb-6 overflow-hidden">
          <svg
            width="80"
            height="80"
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ animation: "flicker 5s infinite" }}
          >
            {/* QR-like corners */}
            <rect x="8" y="8" width="18" height="4" fill="#f59e0b" rx="1" />
            <rect x="8" y="8" width="4" height="18" fill="#f59e0b" rx="1" />
            <rect x="54" y="8" width="18" height="4" fill="#f59e0b" rx="1" />
            <rect x="68" y="8" width="4" height="18" fill="#f59e0b" rx="1" />
            <rect x="8" y="68" width="18" height="4" fill="#f59e0b" rx="1" />
            <rect x="8" y="54" width="4" height="18" fill="#f59e0b" rx="1" />
            <rect x="54" y="68" width="18" height="4" fill="#f59e0b" rx="1" />
            <rect x="68" y="54" width="4" height="18" fill="#f59e0b" rx="1" />
            {/* Center wrench */}
            <path
              d="M35 28c-5.5 0-10 4.5-10 10 0 2.5.9 4.8 2.4 6.5L20 52l8 8 7.5-7.5c1.7 1.5 4 2.5 6.5 2.5 5.5 0 10-4.5 10-10 0-1.3-.3-2.6-.7-3.7l-5.3 5.3-4-4 5.3-5.3C45.8 37.3 44.7 37 43.5 37c-.8 0-1.6.1-2.3.3L35 28z"
              fill="#f59e0b"
              opacity="0.9"
            />
          </svg>

          {/* Animated scan line */}
          <div
            className="absolute left-0 right-0 h-0.5 pointer-events-none"
            style={{
              top: `${scanLine}%`,
              opacity: scanOpacity,
              background: "linear-gradient(90deg, transparent, #f59e0b, transparent)",
              transition: "top 0.016s linear",
            }}
          />
        </div>

        {/* Badge */}
        <div className="inline-block bg-amber-50 border border-amber-200 text-amber-500 text-[10px] font-semibold tracking-[3px] px-3 py-1 rounded mb-5">
          OFFLINE
        </div>

        <h1
          className="text-[26px] font-extrabold text-gray-900 mb-3 leading-tight"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Scanner Under Development
        </h1>

        <p className="text-[13px] text-gray-400 leading-relaxed mb-7">
          The Receipt scanner is currently being serviced.
          <br />
          Jairam is working on this feature{dotString}
        </p>

        {/* Divider */}
        <div
          className="h-px mb-7"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.3), transparent)",
          }}
        />

        <p className="text-[11px] text-gray-300 leading-relaxed m-0">
          For urgent concerns, please contact the Developer directly.
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Syne:wght@700;800&display=swap');

        @keyframes pulse-orb {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.15; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.25; }
        }
        @keyframes float-card {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          92% { opacity: 1; }
          93% { opacity: 0.4; }
          94% { opacity: 1; }
          96% { opacity: 0.6; }
          97% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}