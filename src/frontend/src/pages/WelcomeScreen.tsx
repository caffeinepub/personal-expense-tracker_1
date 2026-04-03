import { Loader2 } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function WelcomeScreen() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{
        background: "linear-gradient(180deg, #0a1a0e 0%, #000000 100%)",
      }}
    >
      {/* iPhone-style smartphone frame */}
      <div
        className="relative flex flex-col"
        style={{
          width: "min(390px, 100vw)",
          minHeight: "min(844px, 100vh)",
          borderRadius: "min(48px, 6vw)",
          background:
            "linear-gradient(175deg, #0B3D2E 0%, #071f17 35%, #020d08 70%, #000000 100%)",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.08), 0 0 0 3px rgba(0,0,0,0.9), 0 0 0 4px rgba(255,255,255,0.04), 0 40px 120px rgba(0,0,0,0.9), 0 0 80px rgba(0,200,83,0.06)",
          overflow: "hidden",
        }}
        data-ocid="welcome.page"
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-8 pt-4 pb-1">
          <span className="text-white/70 text-xs font-semibold">9:41</span>
          <div
            style={{
              width: 120,
              height: 32,
              background: "#000",
              borderRadius: 20,
              position: "absolute",
              left: "50%",
              top: 0,
              transform: "translateX(-50%)",
            }}
          />
          <div className="flex items-center gap-1">
            <svg
              aria-hidden="true"
              width="16"
              height="12"
              viewBox="0 0 16 12"
              fill="none"
            >
              <rect
                x="0"
                y="3"
                width="3"
                height="9"
                rx="1"
                fill="white"
                opacity="0.4"
              />
              <rect
                x="4.5"
                y="2"
                width="3"
                height="10"
                rx="1"
                fill="white"
                opacity="0.6"
              />
              <rect
                x="9"
                y="0.5"
                width="3"
                height="11.5"
                rx="1"
                fill="white"
                opacity="0.8"
              />
              <rect
                x="13.5"
                y="0"
                width="2.5"
                height="12"
                rx="1"
                fill="white"
              />
            </svg>
            <svg
              aria-hidden="true"
              width="16"
              height="12"
              viewBox="0 0 16 12"
              fill="white"
            >
              <path
                d="M8 1C4.5 1 1.5 2.8 0 5.5l2 1.8C3.2 5.2 5.4 4 8 4s4.8 1.2 6 3.3L16 5.5C14.5 2.8 11.5 1 8 1z"
                opacity="0.6"
              />
              <path
                d="M8 5c-2 0-3.8.9-5 2.3l2 1.8C5.8 8.1 6.8 7.5 8 7.5s2.2.6 3 1.6l2-1.8C11.8 5.9 10 5 8 5z"
                opacity="0.8"
              />
              <circle cx="8" cy="11" r="1.5" />
            </svg>
            <div className="flex items-center gap-0.5">
              <div
                style={{
                  width: 22,
                  height: 11,
                  borderRadius: 3,
                  border: "1.5px solid rgba(255,255,255,0.5)",
                  padding: "1.5px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: "75%",
                    background: "white",
                    borderRadius: 1.5,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col items-center flex-1 px-7 pt-6 pb-8">
          {/* ── Top: Logo + Name + Tagline ── */}
          <div className="flex flex-col items-center gap-3 w-full">
            {/* Logo badge */}
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: "linear-gradient(135deg, #0d3320 0%, #0f4a2a 100%)",
                boxShadow:
                  "0 0 0 1px rgba(0,200,83,0.3), 0 8px 32px rgba(0,0,0,0.5), 0 0 24px rgba(0,200,83,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <WalletChartIcon />
            </div>

            {/* App name */}
            <div className="flex flex-col items-center gap-1.5">
              <h1
                className="font-black tracking-tight"
                style={{
                  color: "#ffffff",
                  fontSize: 32,
                  letterSpacing: "-0.5px",
                }}
              >
                PE Tracker
              </h1>
              <p
                className="text-center font-medium"
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 14,
                  letterSpacing: 0.1,
                }}
              >
                Simple expense tracking for everyday life.
              </p>
            </div>
          </div>

          {/* ── Center: Premium Illustration ── */}
          <div className="flex-1 flex items-center justify-center w-full py-4">
            <PremiumIllustration />
          </div>

          {/* ── Bottom: CTA + II Link + Footer ── */}
          <div className="flex flex-col items-center gap-4 w-full">
            {/* Get Started button */}
            <button
              type="button"
              data-ocid="welcome.primary_button"
              onClick={() => login()}
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-2 font-bold text-white transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{
                height: 56,
                borderRadius: 16,
                fontSize: 16,
                background: isLoggingIn ? "#009940" : "#00C853",
                boxShadow: isLoggingIn
                  ? "none"
                  : "0 4px 20px rgba(0,200,83,0.45), 0 2px 8px rgba(0,0,0,0.3)",
                letterSpacing: 0.2,
              }}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Connecting…</span>
                </>
              ) : (
                <span>Get Started</span>
              )}
            </button>

            {/* Internet Identity link */}
            <div className="flex items-center gap-2">
              <InternetIdentityMark />
              <span
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                Secure login with Internet Identity
              </span>
            </div>

            {/* Footer */}
            <p
              className="text-center"
              style={{
                color: "rgba(255,255,255,0.22)",
                fontSize: 11,
                lineHeight: 1.5,
                paddingTop: 4,
              }}
            >
              Your data is private and stored only in your personal canister on
              the Internet Computer.
            </p>
          </div>
        </div>

        {/* Home indicator */}
        <div className="flex justify-center pb-3">
          <div
            style={{
              width: 134,
              height: 5,
              background: "rgba(255,255,255,0.25)",
              borderRadius: 100,
            }}
          />
        </div>

        {/* Subtle ambient glow at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 300,
            height: 300,
            background:
              "radial-gradient(ellipse at center top, rgba(0,200,83,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}

/** Wallet + bar chart combined logo icon */
function WalletChartIcon() {
  return (
    <svg
      aria-hidden="true"
      width="38"
      height="38"
      viewBox="0 0 38 38"
      fill="none"
    >
      {/* Wallet body */}
      <rect
        x="4"
        y="12"
        width="24"
        height="16"
        rx="4"
        fill="none"
        stroke="#00C853"
        strokeWidth="2"
      />
      {/* Wallet flap */}
      <rect
        x="4"
        y="9"
        width="24"
        height="7"
        rx="3"
        fill="rgba(0,200,83,0.18)"
        stroke="#00C853"
        strokeWidth="1.5"
      />
      {/* Coin slot */}
      <circle
        cx="23"
        cy="20"
        r="3"
        fill="rgba(0,200,83,0.25)"
        stroke="#00C853"
        strokeWidth="1.5"
      />
      {/* Bar chart — top right overlay */}
      <rect
        x="25"
        y="19"
        width="4"
        height="8"
        rx="1"
        fill="#00C853"
        opacity="0.6"
      />
      <rect
        x="30"
        y="15"
        width="4"
        height="12"
        rx="1"
        fill="#00C853"
        opacity="0.85"
      />
    </svg>
  );
}

/** Premium SVG illustration: floating donut + wallet + finance icons */
function PremiumIllustration() {
  const W = 280;
  const H = 300;
  const cx = 140;
  const cy = 155;
  const R = 72; // donut outer radius
  const sw = 22; // stroke width
  // circumference
  const circ = 2 * Math.PI * R;

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ filter: "drop-shadow(0 8px 40px rgba(0,200,83,0.10))" }}
    >
      <defs>
        <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00C853" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#00C853" stopOpacity="0" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="softGlow">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Ambient glow behind donut */}
      <ellipse cx={cx} cy={cy} rx={90} ry={85} fill="url(#glowGrad)" />

      {/* ── Wallet card (bottom, 3D tilt) ── */}
      <g filter="url(#softGlow)">
        {/* Card shadow layer */}
        <rect
          x={cx - 52}
          y={cy + 18}
          width={104}
          height={64}
          rx={14}
          fill="rgba(0,0,0,0.5)"
          transform={`rotate(-3 ${cx} ${cy + 50})`}
        />
        {/* Card back */}
        <rect
          x={cx - 52}
          y={cy + 14}
          width={104}
          height={64}
          rx={14}
          fill="#0a2e1a"
          stroke="rgba(0,200,83,0.2)"
          strokeWidth="1"
          transform={`rotate(-3 ${cx} ${cy + 46})`}
        />
        {/* Card front */}
        <rect
          x={cx - 50}
          y={cy + 16}
          width={100}
          height={62}
          rx={13}
          fill="linear-gradient(135deg, #0d3a20 0%, #0f2d1a 100%)"
          stroke="rgba(0,200,83,0.35)"
          strokeWidth="1"
        />
        {/* gradient fill for card front */}
        <defs>
          <linearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#113d22" />
            <stop offset="100%" stopColor="#0a1e12" />
          </linearGradient>
        </defs>
        <rect
          x={cx - 50}
          y={cy + 16}
          width={100}
          height={62}
          rx={13}
          fill="url(#cardGrad)"
          stroke="rgba(0,200,83,0.35)"
          strokeWidth="1"
        />
        {/* Card chip */}
        <rect
          x={cx - 38}
          y={cy + 28}
          width={18}
          height={13}
          rx={3}
          fill="rgba(0,200,83,0.25)"
          stroke="rgba(0,200,83,0.5)"
          strokeWidth="1"
        />
        {/* Card dots */}
        <circle cx={cx + 28} cy={cy + 35} r={3} fill="rgba(0,200,83,0.4)" />
        <circle cx={cx + 38} cy={cy + 35} r={3} fill="rgba(0,200,83,0.25)" />
        {/* Card label */}
        <text
          x={cx - 38}
          y={cy + 67}
          fill="rgba(255,255,255,0.5)"
          fontSize="8"
          fontFamily="system-ui"
          fontWeight="500"
          letterSpacing="1.5"
        >
          PE TRACKER
        </text>
        {/* Balance line */}
        <text
          x={cx + 10}
          y={cy + 67}
          fill="rgba(0,200,83,0.7)"
          fontSize="8"
          fontFamily="system-ui"
          fontWeight="700"
        >
          €3,240
        </text>
      </g>

      {/* ── Donut chart (floating above wallet) ── */}
      <g filter="url(#glow)">
        {/* Track */}
        <circle
          cx={cx}
          cy={cy - 8}
          r={R}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={sw}
          fill="none"
        />

        {/* Segment 1 — primary green 52% */}
        <circle
          cx={cx}
          cy={cy - 8}
          r={R}
          stroke="#00C853"
          strokeWidth={sw}
          fill="none"
          strokeDasharray={`${circ * 0.52} ${circ}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy - 8})`}
          opacity={0.95}
        />
        {/* Segment 2 — mid green 28% */}
        <circle
          cx={cx}
          cy={cy - 8}
          r={R}
          stroke="#34D399"
          strokeWidth={sw}
          fill="none"
          strokeDasharray={`${circ * 0.27} ${circ}`}
          strokeDashoffset={-(circ * 0.52)}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy - 8})`}
          opacity={0.75}
        />
        {/* Segment 3 — dark green 20% */}
        <circle
          cx={cx}
          cy={cy - 8}
          r={R}
          stroke="#059669"
          strokeWidth={sw}
          fill="none"
          strokeDasharray={`${circ * 0.18} ${circ}`}
          strokeDashoffset={-(circ * 0.79)}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy - 8})`}
          opacity={0.6}
        />

        {/* Donut center hole */}
        <circle cx={cx} cy={cy - 8} r={R - sw / 2 - 3} fill="#050f08" />
        {/* Center text */}
        <text
          x={cx}
          y={cy - 16}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(0,200,83,0.7)"
          fontSize="9"
          fontFamily="system-ui"
          fontWeight="600"
          letterSpacing="1.5"
        >
          TOTAL
        </text>
        <text
          x={cx}
          y={cy - 3}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="15"
          fontFamily="system-ui"
          fontWeight="800"
        >
          €3,240
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(255,255,255,0.35)"
          fontSize="7.5"
          fontFamily="system-ui"
          fontWeight="500"
        >
          this month
        </text>
      </g>

      {/* ── Floating icon chips ── */}

      {/* Top-left: Shopping bag */}
      <g transform="translate(14, 42)">
        <rect
          width="40"
          height="36"
          rx="10"
          fill="rgba(0,200,83,0.1)"
          stroke="rgba(0,200,83,0.25)"
          strokeWidth="1"
        />
        {/* bag shape */}
        <path
          d="M13 16 L27 16 L25 28 L15 28 Z"
          stroke="rgba(0,200,83,0.8)"
          strokeWidth="1.5"
          fill="none"
          strokeLinejoin="round"
        />
        <path
          d="M16 16 C16 13 24 13 24 16"
          stroke="rgba(0,200,83,0.8)"
          strokeWidth="1.5"
          fill="none"
        />
        <circle cx="20" cy="21" r="1.5" fill="rgba(0,200,83,0.6)" />
      </g>

      {/* Top-right: Receipt */}
      <g transform="translate(226, 38)">
        <rect
          width="40"
          height="36"
          rx="10"
          fill="rgba(0,200,83,0.1)"
          stroke="rgba(0,200,83,0.25)"
          strokeWidth="1"
        />
        {/* receipt */}
        <rect
          x="12"
          y="9"
          width="16"
          height="20"
          rx="2"
          fill="none"
          stroke="rgba(0,200,83,0.8)"
          strokeWidth="1.5"
        />
        <line
          x1="15"
          y1="14"
          x2="25"
          y2="14"
          stroke="rgba(0,200,83,0.5)"
          strokeWidth="1"
        />
        <line
          x1="15"
          y1="18"
          x2="25"
          y2="18"
          stroke="rgba(0,200,83,0.5)"
          strokeWidth="1"
        />
        <line
          x1="15"
          y1="22"
          x2="21"
          y2="22"
          stroke="rgba(0,200,83,0.5)"
          strokeWidth="1"
        />
        <path
          d="M12 29 L14 27 L16 29 L18 27 L20 29 L22 27 L24 29 L26 27 L28 29"
          stroke="rgba(0,200,83,0.6)"
          strokeWidth="1"
          fill="none"
        />
      </g>

      {/* Bottom-left: Coin */}
      <g transform="translate(22, 216)">
        <circle
          cx="18"
          cy="18"
          r="18"
          fill="rgba(0,200,83,0.1)"
          stroke="rgba(0,200,83,0.3)"
          strokeWidth="1"
        />
        <circle
          cx="18"
          cy="18"
          r="12"
          fill="none"
          stroke="rgba(0,200,83,0.5)"
          strokeWidth="1.5"
        />
        <text
          x="18"
          y="19"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#00C853"
          fontSize="11"
          fontFamily="system-ui"
          fontWeight="800"
        >
          €
        </text>
      </g>

      {/* Bottom-right: Recurring arrow */}
      <g transform="translate(224, 214)">
        <rect
          width="36"
          height="36"
          rx="10"
          fill="rgba(0,200,83,0.1)"
          stroke="rgba(0,200,83,0.25)"
          strokeWidth="1"
        />
        {/* circular arrows */}
        <path
          d="M18 10 A8 8 0 0 1 26 18"
          stroke="rgba(0,200,83,0.8)"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M18 26 A8 8 0 0 1 10 18"
          stroke="rgba(0,200,83,0.5)"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
        {/* arrowhead top */}
        <polygon points="18,7 22,13 14,13" fill="rgba(0,200,83,0.8)" />
        {/* arrowhead bottom */}
        <polygon points="18,29 14,23 22,23" fill="rgba(0,200,83,0.5)" />
      </g>

      {/* Sparkle dots */}
      <circle cx={cx + 76} cy={cy - 30} r="3" fill="rgba(0,200,83,0.5)" />
      <circle cx={cx + 84} cy={cy - 16} r="2" fill="rgba(0,200,83,0.3)" />
      <circle cx={cx + 74} cy={cy - 2} r="1.5" fill="rgba(0,200,83,0.2)" />
      <circle cx={cx - 76} cy={cy - 28} r="3" fill="rgba(0,200,83,0.5)" />
      <circle cx={cx - 84} cy={cy - 14} r="2" fill="rgba(0,200,83,0.3)" />
      <circle cx={cx - 74} cy={cy} r="1.5" fill="rgba(0,200,83,0.2)" />
    </svg>
  );
}

/** Minimal Internet Identity shield mark */
function InternetIdentityMark() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 2L3 5.5V10C3 13.87 6.13 17.5 10 18.5C13.87 17.5 17 13.87 17 10V5.5L10 2Z"
        fill="rgba(255,255,255,0.08)"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path
        d="M10 5L5.5 7.25V10C5.5 12.48 7.5 14.75 10 15.5C12.5 14.75 14.5 12.48 14.5 10V7.25L10 5Z"
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2" fill="rgba(255,255,255,0.5)" />
    </svg>
  );
}
