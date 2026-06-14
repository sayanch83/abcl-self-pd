// Matches the actual Aditya Birla Capital logo:
// Geometric square icon (triangular facets in red/orange/yellow) + ADITYA BIRLA / CAPITAL text
export default function AbclLogo({ height = 40, white = false }) {
  const h = height;
  const iconSize = h;                      // square icon is same height as total
  const textX = iconSize + 10;
  const totalWidth = iconSize + 10 + 110;

  // On red background: icon becomes white outline, text becomes white
  const captialColor  = white ? '#ffffff' : '#C8102E';
  const adityaColor   = white ? 'rgba(255,255,255,0.9)' : '#1a1a1a';
  const bgOpacity     = white ? 0 : 1;    // icon bg is transparent on red bg

  // Icon dimensions (drawn in a square)
  const s = iconSize;
  const cx = s / 2;
  const cy = s / 2;

  return (
    <svg
      width={totalWidth}
      height={h}
      viewBox={`0 0 ${totalWidth} ${h}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Aditya Birla Capital"
    >
      {/* ── Geometric square icon ── */}
      {/* Outer square background */}
      <rect x="0" y="0" width={s} height={s} rx="2"
        fill={white ? 'rgba(255,255,255,0.15)' : '#7B1E1E'} />

      {/* Triangular facets — approximating the geometric diamond/sunburst pattern */}
      {/* Top-left triangle: dark red */}
      <polygon points={`0,0 ${cx},0 ${cx},${cy}`} fill={white ? 'rgba(255,255,255,0.5)' : '#9B2335'} />
      {/* Top-right triangle: medium red */}
      <polygon points={`${cx},0 ${s},0 ${cx},${cy}`} fill={white ? 'rgba(255,255,255,0.35)' : '#C8102E'} />
      {/* Right triangle: orange */}
      <polygon points={`${s},0 ${s},${cy} ${cx},${cy}`} fill={white ? 'rgba(255,255,255,0.55)' : '#D4500A'} />
      {/* Bottom-right triangle: golden orange */}
      <polygon points={`${s},${cy} ${s},${s} ${cx},${cy}`} fill={white ? 'rgba(255,255,255,0.25)' : '#E8891A'} />
      {/* Bottom triangle: amber/yellow */}
      <polygon points={`${cx},${cy} ${s},${s} ${cx},${s}`} fill={white ? 'rgba(255,255,255,0.4)' : '#D4750A'} />
      {/* Bottom-left triangle: orange-red */}
      <polygon points={`0,${s} ${cx},${s} ${cx},${cy}`} fill={white ? 'rgba(255,255,255,0.3)' : '#B84210'} />
      {/* Left triangle: deep red */}
      <polygon points={`0,0 ${cx},${cy} 0,${cy}`} fill={white ? 'rgba(255,255,255,0.45)' : '#8B1A1A'} />
      {/* Left-bottom triangle: red */}
      <polygon points={`0,${cy} ${cx},${cy} 0,${s}`} fill={white ? 'rgba(255,255,255,0.2)' : '#A52020'} />

      {/* Inner highlight lines — thin white lines suggesting facets */}
      <line x1={cx} y1="0" x2={cx} y2={s} stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/>
      <line x1="0" y1={cy} x2={s} y2={cy} stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/>
      <line x1="0" y1="0" x2={s} y2={s} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
      <line x1={s} y1="0" x2="0" y2={s} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>

      {/* ── Text ── */}
      {/* "ADITYA BIRLA" — dark, small, wide letter-spacing */}
      <text
        x={textX}
        y={h * 0.38}
        fontFamily="Inter, Arial, sans-serif"
        fontSize={h * 0.24}
        fontWeight="600"
        letterSpacing="2"
        fill={adityaColor}
      >
        ADITYA BIRLA
      </text>

      {/* "CAPITAL" — bold red, larger */}
      <text
        x={textX}
        y={h * 0.82}
        fontFamily="Inter, Arial, sans-serif"
        fontSize={h * 0.38}
        fontWeight="800"
        letterSpacing="1"
        fill={captialColor}
      >
        CAPITAL
      </text>
    </svg>
  );
}
