interface SpinningFanProps {
  size?: number
  className?: string
}

export const SpinningFan = ({ size = 260, className = '' }: SpinningFanProps) => (
  <div
    className={`fan-orbit relative grid place-items-center rounded-full border border-cyan-500/30 bg-slate-900/70 shadow-[0_0_80px_rgba(34,211,238,0.2)] ${className}`}
    style={{ width: size, height: size }}
  >
    <svg viewBox="0 0 200 200" className="absolute h-[86%] w-[86%]">
      <defs>
        <linearGradient id="bladeGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.25" />
        </linearGradient>
      </defs>

      <g className="fan-rotor origin-center">
        {Array.from({ length: 7 }, (_, idx) => (
          <path
            key={idx}
            transform={`rotate(${idx * 51.4} 100 100)`}
            d="M100 100 C120 70, 154 56, 166 86 C152 98, 128 113, 104 116 Z"
            fill="url(#bladeGrad)"
            stroke="rgba(34,211,238,0.7)"
            strokeWidth="1"
          />
        ))}
      </g>

      <circle cx="100" cy="100" r="20" fill="rgba(15,23,42,0.85)" stroke="#22d3ee" strokeWidth="2" />
      <circle cx="100" cy="100" r="5" fill="#67e8f9" />
    </svg>
  </div>
)
