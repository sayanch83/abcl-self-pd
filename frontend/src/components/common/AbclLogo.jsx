// Matches the Aditya Birla Capital logo from the screenshot:
// Red circular icon with "aditya birla capital" text below/beside it.
export default function AbclLogo({ height = 40, white = false }) {
  const textPrimary   = white ? '#ffffff' : '#1a1a1a';
  const textSecondary = white ? 'rgba(255,255,255,0.85)' : '#C8102E';
  const iconBg        = white ? 'rgba(255,255,255,0.25)' : '#C8102E';
  const iconFg        = '#ffffff';

  // Scale everything from a 160×44 viewBox
  const scale = height / 44;

  return (
    <svg
      width={Math.round(160 * scale)}
      height={height}
      viewBox="0 0 160 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Aditya Birla Capital"
    >
      {/* ── Red circle icon ── */}
      <circle cx="22" cy="22" r="20" fill={iconBg} />

      {/* Stylised "AB" mark inside circle — simplified swoosh matching real logo */}
      {/* Outer arc */}
      <path
        d="M13 28 C13 18 17 13 22 13 C27 13 31 18 31 28"
        stroke={iconFg} strokeWidth="2.5" strokeLinecap="round" fill="none"
      />
      {/* Inner leaf / drop */}
      <path
        d="M22 13 C22 13 26 17 26 22 C26 26 24 29 22 29 C20 29 18 26 18 22 C18 17 22 13 22 13Z"
        fill={iconFg} opacity="0.9"
      />
      {/* Bottom dot */}
      <circle cx="22" cy="31" r="1.8" fill={iconFg} />

      {/* ── Text block ── */}
      {/* "aditya birla" — small caps */}
      <text
        x="48" y="18"
        fontFamily="Inter, Arial, sans-serif"
        fontSize="10"
        fontWeight="600"
        letterSpacing="1.5"
        fill={textPrimary}
        textAnchor="start"
      >
        ADITYA BIRLA
      </text>

      {/* "capital" — larger red */}
      <text
        x="48" y="33"
        fontFamily="Inter, Arial, sans-serif"
        fontSize="16"
        fontWeight="700"
        letterSpacing="0.5"
        fill={textSecondary}
        textAnchor="start"
      >
        Capital
      </text>

      {/* Thin separator line between icon and text */}
      <line x1="44" y1="8" x2="44" y2="36" stroke={white ? 'rgba(255,255,255,0.3)' : '#e0e0e0'} strokeWidth="1" />
    </svg>
  );
}
