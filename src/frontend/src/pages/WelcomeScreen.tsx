import { Loader2 } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const KEYFRAMES = `
  @keyframes draw-arc {
    from { stroke-dashoffset: var(--dash-len); }
    to   { stroke-dashoffset: 0; }
  }
  @keyframes float-a {
    0%,100% { transform: translateY(0px) rotate(-2deg); }
    50%      { transform: translateY(-14px) rotate(1deg); }
  }
  @keyframes float-b {
    0%,100% { transform: translateY(0px) rotate(2deg); }
    50%      { transform: translateY(-10px) rotate(-1.5deg); }
  }
  @keyframes float-c {
    0%,100% { transform: translateY(0px) rotate(-1deg); }
    50%      { transform: translateY(-8px) rotate(2deg); }
  }
  @keyframes pulse-dot {
    0%,100% { opacity: 0.2; transform: scale(1); }
    50%      { opacity: 0.8; transform: scale(1.6); }
  }
  @keyframes glow-ring {
    0%,100% { opacity: 0.15; transform: scale(1); }
    50%      { opacity: 0.35; transform: scale(1.04); }
  }
  @keyframes slide-in {
    from { opacity: 0; transform: translateY(32px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
`;

const DOTS: Array<{
  top: string;
  left: string;
  size: string;
  dur: number;
  delay: number;
}> = [
  { top: "8%", left: "8%", size: "5px", dur: 2.5, delay: 0 },
  { top: "15%", left: "78%", size: "4px", dur: 3.1, delay: 0.4 },
  { top: "22%", left: "55%", size: "3px", dur: 2.8, delay: 0.9 },
  { top: "60%", left: "6%", size: "6px", dur: 3.4, delay: 0.2 },
  { top: "70%", left: "88%", size: "4px", dur: 2.2, delay: 1.1 },
  { top: "80%", left: "42%", size: "3px", dur: 3.0, delay: 0.6 },
  { top: "88%", left: "15%", size: "5px", dur: 2.7, delay: 1.4 },
  { top: "5%", left: "45%", size: "3px", dur: 3.5, delay: 0.3 },
  { top: "45%", left: "92%", size: "4px", dur: 2.6, delay: 0.7 },
];

export default function WelcomeScreen() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div
      data-ocid="welcome.page"
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        minHeight: "100svh",
        width: "100%",
        overflow: "hidden",
        background: "#0A0A0A",
      }}
    >
      <style>{KEYFRAMES}</style>

      {/* ── Background layers ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          overflow: "hidden",
        }}
      >
        {/* Diagonal green slab */}
        <div
          style={{
            position: "absolute",
            top: "28%",
            left: "-15%",
            width: "130%",
            height: "48%",
            background:
              "linear-gradient(135deg, rgba(0,200,83,0.09) 0%, rgba(0,200,83,0.04) 40%, transparent 70%)",
            transform: "skewY(-8deg)",
          }}
        />
        {/* Top-right accent slash */}
        <div
          style={{
            position: "absolute",
            top: "-10%",
            right: "-8%",
            width: "55%",
            height: "70%",
            background:
              "linear-gradient(220deg, rgba(0,200,83,0.13) 0%, rgba(0,200,83,0.05) 35%, transparent 60%)",
            borderRadius: "0 0 0 60%",
          }}
        />
        {/* Bottom glow */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "35%",
            background:
              "linear-gradient(to top, rgba(0,200,83,0.06) 0%, transparent 100%)",
          }}
        />
        {/* Scattered pulse dots */}
        {DOTS.map((d) => (
          <span
            key={`dot-${d.top}-${d.left}`}
            style={{
              position: "absolute",
              top: d.top,
              left: d.left,
              width: d.size,
              height: d.size,
              borderRadius: "50%",
              background: "#00C853",
              opacity: 0.2,
              animation: `pulse-dot ${d.dur}s ease-in-out ${d.delay}s infinite both`,
            }}
          />
        ))}
      </div>

      {/* ── Main content column ── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          maxWidth: 480,
          minHeight: "100svh",
          padding: "0 28px",
        }}
      >
        {/* ══ TOP SECTION ══ */}
        <div
          style={{
            paddingTop: "7vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
            width: "100%",
            animation: "slide-in 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s both",
          }}
        >
          {/* Logo badge */}
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 20,
              background: "linear-gradient(145deg, #0d3320 0%, #072010 100%)",
              border: "1.5px solid rgba(0,200,83,0.45)",
              boxShadow:
                "0 0 0 6px rgba(0,200,83,0.06), 0 0 32px rgba(0,200,83,0.22), 0 8px 24px rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <LogoIcon />
          </div>

          {/* Massive headline */}
          <h1
            style={{
              fontFamily: '"Cabinet Grotesk", "Figtree", sans-serif',
              fontSize: "clamp(52px, 15vw, 72px)",
              fontWeight: 900,
              letterSpacing: "-2px",
              lineHeight: 0.92,
              margin: 0,
              textAlign: "center",
              color: "#FFFFFF",
              textTransform: "uppercase",
            }}
          >
            PE <span style={{ color: "#00C853" }}>Tracker</span>
          </h1>

          {/* Tagline */}
          <p
            style={{
              fontFamily: '"Figtree", sans-serif',
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.38)",
              margin: "14px 0 0",
              textAlign: "center",
            }}
          >
            Track · Budget · Win
          </p>
        </div>

        {/* ══ CENTER HERO ══ */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            position: "relative",
            minHeight: 260,
            animation: "fade-up 0.9s cubic-bezier(0.22,1,0.36,1) 0.3s both",
          }}
        >
          <HeroIllustration />
        </div>

        {/* ══ BOTTOM ACTION AREA ══ */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            gap: 14,
            paddingBottom: "7vh",
            animation: "fade-up 0.8s cubic-bezier(0.22,1,0.36,1) 0.55s both",
          }}
        >
          {/* CTA button */}
          <button
            type="button"
            data-ocid="welcome.primary_button"
            onClick={() => login()}
            disabled={isLoggingIn}
            style={{
              width: "100%",
              height: 58,
              borderRadius: 14,
              border: "none",
              cursor: isLoggingIn ? "not-allowed" : "pointer",
              background: isLoggingIn
                ? "#009940"
                : "linear-gradient(135deg, #00C853 0%, #00a846 100%)",
              color: "#fff",
              fontSize: 17,
              fontFamily: '"Cabinet Grotesk", "Figtree", sans-serif',
              fontWeight: 800,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              boxShadow: isLoggingIn
                ? "none"
                : "0 4px 28px rgba(0,200,83,0.50), 0 2px 8px rgba(0,0,0,0.35)",
              transition:
                "transform 0.1s ease, box-shadow 0.15s ease, background 0.2s ease",
              opacity: isLoggingIn ? 0.75 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isLoggingIn)
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "scale(1.01)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform =
                "scale(1)";
            }}
            onMouseDown={(e) => {
              if (!isLoggingIn)
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "scale(0.97)";
            }}
            onMouseUp={(e) => {
              if (!isLoggingIn)
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "scale(1.01)";
            }}
          >
            {isLoggingIn ? (
              <>
                <Loader2
                  style={{
                    width: 20,
                    height: 20,
                    animation: "spin 1s linear infinite",
                  }}
                />
                <span>Connecting…</span>
              </>
            ) : (
              <>
                <span>Get Started</span>
                <ArrowRight />
              </>
            )}
          </button>

          {/* Internet Identity label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
            }}
          >
            <InternetIdentityMark />
            <span
              style={{
                fontFamily: '"Figtree", sans-serif',
                color: "rgba(255,255,255,0.38)",
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "0.02em",
              }}
            >
              Secure login with Internet Identity
            </span>
          </div>

          {/* Privacy footer */}
          <p
            style={{
              fontFamily: '"Figtree", sans-serif',
              textAlign: "center",
              color: "rgba(255,255,255,0.18)",
              fontSize: 11,
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            Your data is private and stored only in your personal canister on
            the Internet Computer.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── HERO ILLUSTRATION ───────────────────────────────────────────────────────

const ARC_DEFS = [
  { color: "#00C853", pct: 0.38, label: "food", delay: 0.4 },
  { color: "#FF6B6B", pct: 0.25, label: "rent", delay: 0.55 },
  { color: "#4E9FFF", pct: 0.2, label: "transport", delay: 0.7 },
  { color: "#FFD166", pct: 0.12, label: "shopping", delay: 0.85 },
];

function HeroIllustration() {
  const R = 90;
  const C = 2 * Math.PI * R;

  // pre-compute cumulative offsets
  let cumulative = 0;
  const arcs = ARC_DEFS.map((a) => {
    const dash = C * a.pct;
    const offset = cumulative;
    cumulative += dash;
    return { ...a, dash, offset };
  });

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 340,
        height: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Glow ring */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 240,
          height: 240,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,200,83,0.14) 0%, transparent 70%)",
          animation: "glow-ring 3s ease-in-out infinite both",
        }}
      />

      {/* Donut SVG */}
      <svg
        aria-hidden="true"
        width="220"
        height="220"
        viewBox="0 0 220 220"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* Track */}
        <circle
          cx="110"
          cy="110"
          r={R}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="22"
        />
        {/* Animated arcs */}
        {arcs.map((arc) => (
          <circle
            key={arc.label}
            cx="110"
            cy="110"
            r={R}
            fill="none"
            stroke={arc.color}
            strokeWidth="22"
            strokeLinecap="round"
            strokeDasharray={`${arc.dash} ${C - arc.dash}`}
            strokeDashoffset={-arc.offset}
            transform="rotate(-90 110 110)"
            style={
              {
                "--dash-len": `${arc.dash}`,
                animation: `draw-arc 1.2s cubic-bezier(0.22,1,0.36,1) ${arc.delay}s both`,
                opacity: 0.92,
              } as React.CSSProperties
            }
          />
        ))}
        {/* Center labels */}
        <text
          x="110"
          y="104"
          textAnchor="middle"
          fill="rgba(255,255,255,0.45)"
          fontSize="11"
          fontFamily='"Figtree", sans-serif'
          fontWeight="600"
          letterSpacing="0.1em"
        >
          TOTAL SPENT
        </text>
        <text
          x="110"
          y="124"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="20"
          fontFamily='"Cabinet Grotesk", "Figtree", sans-serif'
          fontWeight="900"
        >
          €1,934
        </text>
      </svg>

      {/* Floating transaction cards */}
      <FloatingCard
        top="4%"
        right="-2%"
        delay={0}
        animation="float-a"
        icon={<ShoppingIcon />}
        label="Shopping"
        amount="-€134"
        color="#FFD166"
      />
      <FloatingCard
        top="52%"
        right="-4%"
        delay={0.4}
        animation="float-b"
        icon={<HomeIcon />}
        label="Rent"
        amount="-€1,200"
        color="#FF6B6B"
      />
      <FloatingCard
        top="10%"
        left="-4%"
        delay={0.8}
        animation="float-c"
        icon={<BusIcon />}
        label="Transport"
        amount="-€180"
        color="#4E9FFF"
      />
    </div>
  );
}

// ─── FLOATING CARD ────────────────────────────────────────────────────────────

function FloatingCard({
  top,
  right,
  left,
  delay,
  animation,
  icon,
  label,
  amount,
  color,
}: {
  top?: string;
  right?: string;
  left?: string;
  delay: number;
  animation: string;
  icon: React.ReactNode;
  label: string;
  amount: string;
  color: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top,
        right,
        left,
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(20,20,20,0.88)",
        border: `1px solid ${color}44`,
        borderRadius: 12,
        padding: "8px 12px",
        boxShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 12px ${color}22`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        minWidth: 128,
        animation: `${animation} ${3.5 + delay}s ease-in-out ${delay}s infinite both`,
        zIndex: 2,
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: `${color}22`,
          border: `1px solid ${color}44`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <span
          style={{
            fontFamily: '"Figtree", sans-serif',
            fontSize: 10,
            fontWeight: 600,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: '"Cabinet Grotesk", "Figtree", sans-serif',
            fontSize: 14,
            fontWeight: 800,
            color,
            letterSpacing: "-0.3px",
          }}
        >
          {amount}
        </span>
      </div>
    </div>
  );
}

// ─── SVG ICONS ────────────────────────────────────────────────────────────────

function LogoIcon() {
  return (
    <svg
      aria-hidden="true"
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
    >
      <rect
        x="3"
        y="11"
        width="22"
        height="16"
        rx="4"
        fill="none"
        stroke="#00C853"
        strokeWidth="1.8"
      />
      <rect
        x="3"
        y="8"
        width="22"
        height="8"
        rx="3"
        fill="rgba(0,200,83,0.12)"
        stroke="#00C853"
        strokeWidth="1.4"
      />
      <circle
        cx="21"
        cy="19"
        r="2.5"
        fill="rgba(0,200,83,0.2)"
        stroke="#00C853"
        strokeWidth="1.4"
      />
      <rect
        x="24"
        y="20"
        width="4"
        height="7"
        rx="1.5"
        fill="#00C853"
        opacity="0.55"
      />
      <rect
        x="29"
        y="16"
        width="4"
        height="11"
        rx="1.5"
        fill="#00C853"
        opacity="0.85"
      />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
    >
      <path
        d="M3 9h12M9.5 4.5L15 9l-5.5 4.5"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShoppingIcon() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
    >
      <path
        d="M2 2h1.5l2 6h6l1.5-4H5"
        stroke="#FFD166"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6.5" cy="12.5" r="1" fill="#FFD166" />
      <circle cx="11" cy="12.5" r="1" fill="#FFD166" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
    >
      <path
        d="M2 7.5L8 2.5l6 5V13.5a1 1 0 01-1 1H3a1 1 0 01-1-1V7.5z"
        stroke="#FF6B6B"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="5.5"
        y="9.5"
        width="5"
        height="5"
        rx="0.5"
        stroke="#FF6B6B"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function BusIcon() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
    >
      <rect
        x="2"
        y="3"
        width="12"
        height="9"
        rx="2"
        stroke="#4E9FFF"
        strokeWidth="1.4"
      />
      <path d="M2 6h12" stroke="#4E9FFF" strokeWidth="1.3" />
      <circle cx="5" cy="13.5" r="1" fill="#4E9FFF" />
      <circle cx="11" cy="13.5" r="1" fill="#4E9FFF" />
      <path
        d="M5 3V1.5M11 3V1.5"
        stroke="#4E9FFF"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InternetIdentityMark() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        d="M10 2L3 5.5V10C3 13.87 6.13 17.5 10 18.5C13.87 17.5 17 13.87 17 10V5.5L10 2Z"
        fill="rgba(0,200,83,0.1)"
        stroke="rgba(0,200,83,0.5)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M10 5L5.5 7.25V10C5.5 12.48 7.5 14.75 10 15.5C12.5 14.75 14.5 12.48 14.5 10V7.25L10 5Z"
        fill="rgba(0,200,83,0.07)"
        stroke="rgba(0,200,83,0.3)"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2" fill="rgba(0,200,83,0.8)" />
    </svg>
  );
}
