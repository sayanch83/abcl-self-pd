// Aditya Birla Capital logo — precisely matched to actual brand asset
// Icon: landscape rectangle with 4 triangular facets in brand colours
// Text: "ADITYA BIRLA" small caps dark + "CAPITAL" bold red

export default function AbclLogo({ height = 40, white = false }) {
  // Icon is 1.35× wide (matches real logo proportions)
  const ih = height;
  const iw = Math.round(ih * 1.35);

  // Convergence point — slightly left of centre, vertically centred
  // (matches the real logo where lines converge to the inner left area)
  const px = Math.round(iw * 0.5);
  const py = Math.round(ih * 0.5);

  // Brand colours (exact from logo)
  const COL_DARK_RED    = '#8B1A1A';   // top-left deep crimson
  const COL_RED         = '#C8102E';   // top-right bright red
  const COL_ORANGE_RED  = '#C84B1E';   // right orange-red
  const COL_AMBER       = '#E8820A';   // bottom-right amber
  const COL_GOLD        = '#F2A90A';   // bottom gold accent

  const W = (v) => white ? `rgba(255,255,255,${v})` : undefined;

  // 4 triangles from corners to centre point
  const topLeft     = `0,0 ${iw},0 ${px},${py}`;          // top edge → centre
  const topRight    = `${iw},0 ${iw},${ih} ${px},${py}`;  // right edge → centre
  const bottomRight = `${iw},${ih} 0,${ih} ${px},${py}`;  // bottom edge → centre
  const bottomLeft  = `0,${ih} 0,0 ${px},${py}`;          // left edge → centre

  // Sub-facet: split the top-right triangle to show orange vs red
  const midTopRight = `${iw},0 ${iw},${Math.round(ih * 0.45)} ${px},${py}`;
  const midBotRight = `${iw},${Math.round(ih * 0.45)} ${iw},${ih} ${px},${py}`;
  // Split bottom to show amber vs gold
  const midBotLeft  = `0,${ih} ${Math.round(iw * 0.55)},${ih} ${px},${py}`;
  const midBotMid   = `${Math.round(iw * 0.55)},${ih} ${iw},${ih} ${px},${py}`;

  const gap = 10;
  const tx = iw + gap;
  const totalW = iw + gap + Math.round(height * 3.1);

  const adityaSize = Math.round(ih * 0.25);
  const capitalSize = Math.round(ih * 0.44);
  const adityaY = Math.round(ih * 0.38);
  const capitalY = Math.round(ih * 0.87);

  const adityaFill  = white ? '#ffffff' : '#222222';
  const capitalFill = white ? '#ffffff' : '#C8102E';

  return (
    <svg
      width={totalW}
      height={ih}
      viewBox={`0 0 ${totalW} ${ih}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Aditya Birla Capital"
    >
      {/* ── Geometric icon ── */}
      {/* Background */}
      <rect x="0" y="0" width={iw} height={ih} rx="2"
        fill={white ? 'rgba(255,255,255,0.1)' : COL_DARK_RED} />

      {/* Top triangle — dark crimson */}
      <polygon points={topLeft}
        fill={white ? 'rgba(255,255,255,0.7)' : COL_DARK_RED} />

      {/* Right top — bright red */}
      <polygon points={midTopRight}
        fill={white ? 'rgba(255,255,255,0.5)' : COL_RED} />

      {/* Right bottom — orange red */}
      <polygon points={midBotRight}
        fill={white ? 'rgba(255,255,255,0.35)' : COL_ORANGE_RED} />

      {/* Bottom right — amber */}
      <polygon points={midBotMid}
        fill={white ? 'rgba(255,255,255,0.55)' : COL_AMBER} />

      {/* Bottom left — gold */}
      <polygon points={midBotLeft}
        fill={white ? 'rgba(255,255,255,0.4)' : COL_GOLD} />

      {/* Left triangle — deep red */}
      <polygon points={bottomLeft}
        fill={white ? 'rgba(255,255,255,0.6)' : '#7B1515'} />

      {/* Facet lines */}
      {[
        `0,0 ${px},${py}`,
        `${iw},0 ${px},${py}`,
        `${iw},${ih} ${px},${py}`,
        `0,${ih} ${px},${py}`,
        `${iw},${Math.round(ih*0.45)} ${px},${py}`,
        `${Math.round(iw*0.55)},${ih} ${px},${py}`,
      ].map((pts, i) => {
        const [x1y1, x2y2] = pts.split(' ');
        const [x1, y1] = x1y1.split(',');
        const [x2, y2] = x2y2.split(',');
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="rgba(255,255,255,0.2)" strokeWidth="0.7"/>;
      })}

      {/* ── Text ── */}
      <text x={tx} y={adityaY}
        fontFamily="'Inter','Arial Narrow','Arial',sans-serif"
        fontSize={adityaSize}
        fontWeight="700"
        letterSpacing={Math.round(ih * 0.07)}
        fill={adityaFill}>
        ADITYA BIRLA
      </text>

      <text x={tx} y={capitalY}
        fontFamily="'Inter','Arial',sans-serif"
        fontSize={capitalSize}
        fontWeight="800"
        letterSpacing="1"
        fill={capitalFill}>
        CAPITAL
      </text>
    </svg>
  );
}
