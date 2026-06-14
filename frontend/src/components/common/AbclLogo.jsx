// Accurate Aditya Birla Capital logo recreation:
// Landscape rectangle with geometric triangular facets (dark red, red, orange, yellow)
// + "ADITYA BIRLA" small caps + "CAPITAL" bold red

export default function AbclLogo({ height = 40, white = false }) {
  // Icon is landscape rectangle: 1.25× wider than tall
  const ih = height;               // icon height
  const iw = Math.round(ih * 1.25); // icon width (landscape)
  const gap = 10;
  const textAreaW = Math.round(height * 3.2);
  const totalW = iw + gap + textAreaW;

  const textDark  = white ? '#ffffff'           : '#1a1a1a';
  const textRed   = white ? '#ffffff'           : '#C8102E';

  // The geometric square/rectangle icon colours from the actual logo:
  // Deep burgundy, crimson red, orange-red, amber orange, golden yellow
  const c1 = white ? 'rgba(255,255,255,0.9)' : '#7B1020'; // deep red (large left triangle)
  const c2 = white ? 'rgba(255,255,255,0.7)' : '#C8102E'; // bright red (top right area)
  const c3 = white ? 'rgba(255,255,255,0.5)' : '#D4500A'; // orange-red
  const c4 = white ? 'rgba(255,255,255,0.6)' : '#E8891A'; // amber orange
  const c5 = white ? 'rgba(255,255,255,0.4)' : '#F2B400'; // golden yellow
  const c6 = white ? 'rgba(255,255,255,0.3)' : '#B03010'; // dark orange-red

  // Icon bounding box
  const x0 = 0, y0 = 0;
  const x1 = iw, y1 = ih;
  const cx = iw / 2, cy = ih / 2;
  // Centre point slightly left and up (matches the logo's visual weight)
  const px = iw * 0.42, py = ih * 0.52;

  // Text positioning
  const tx = iw + gap;
  const topY  = ih * 0.40;
  const botY  = ih * 0.88;
  const fTop  = ih * 0.26;
  const fBot  = ih * 0.42;

  return (
    <svg
      width={totalW}
      height={ih}
      viewBox={`0 0 ${totalW} ${ih}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Aditya Birla Capital"
    >
      {/* ── Geometric icon: pinwheel of triangles from centre point ── */}

      {/* Background rect */}
      <rect x={x0} y={y0} width={iw} height={ih} rx="1.5"
        fill={white ? 'rgba(255,255,255,0.12)' : '#8B1A1A'} />

      {/* Top-left triangle — dark red */}
      <polygon points={`${x0},${y0} ${x1},${y0} ${px},${py}`} fill={c2} />

      {/* Top-right triangle — orange */}
      <polygon points={`${x1},${y0} ${x1},${y1} ${px},${py}`} fill={c3} />

      {/* Bottom-right triangle — golden yellow */}
      <polygon points={`${x1},${y1} ${x0},${y1} ${px},${py}`} fill={c4} />

      {/* Bottom-left big triangle — deep red (dominant, matches logo) */}
      <polygon points={`${x0},${y1} ${x0},${y0} ${px},${py}`} fill={c1} />

      {/* Inner highlight facets to give depth */}
      {/* Upper central triangle */}
      <polygon points={`${x0},${y0} ${x1},${y0} ${px},${py}`} fill={c2} opacity="0.6" />
      {/* Lower right accent */}
      <polygon points={`${x1*0.6},${y1} ${x1},${y1} ${px},${py}`} fill={c5} />
      {/* Upper right accent */}
      <polygon points={`${x1},${y0} ${x1},${y1*0.45} ${px},${py}`} fill={c3} opacity="0.8"/>
      {/* Small yellow triangle bottom centre */}
      <polygon points={`${x0+iw*0.3},${y1} ${x0+iw*0.65},${y1} ${px},${py}`} fill={c5} opacity="0.9"/>

      {/* Thin white separator lines suggesting facets */}
      <line x1={x0} y1={y0} x2={px} y2={py} stroke="rgba(255,255,255,0.18)" strokeWidth="0.8"/>
      <line x1={x1} y1={y0} x2={px} y2={py} stroke="rgba(255,255,255,0.18)" strokeWidth="0.8"/>
      <line x1={x1} y1={y1} x2={px} y2={py} stroke="rgba(255,255,255,0.18)" strokeWidth="0.8"/>
      <line x1={x0} y1={y1} x2={px} y2={py} stroke="rgba(255,255,255,0.18)" strokeWidth="0.8"/>
      <line x1={iw*0.6} y1={y1} x2={px} y2={py} stroke="rgba(255,255,255,0.12)" strokeWidth="0.6"/>

      {/* ── Text ── */}
      <text
        x={tx} y={topY}
        fontFamily="'Inter', 'Arial', sans-serif"
        fontSize={fTop}
        fontWeight="600"
        letterSpacing={ih * 0.06}
        fill={textDark}
      >ADITYA BIRLA</text>

      <text
        x={tx} y={botY}
        fontFamily="'Inter', 'Arial', sans-serif"
        fontSize={fBot}
        fontWeight="800"
        letterSpacing={ih * 0.02}
        fill={textRed}
      >CAPITAL</text>
    </svg>
  );
}
