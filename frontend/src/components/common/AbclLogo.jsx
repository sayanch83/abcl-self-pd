export default function AbclLogo({ height = 36, white = false }) {
  const textColor = white ? '#fff' : '#1F2937';
  const redColor = white ? '#fff' : '#C8102E';

  return (
    <svg height={height} viewBox="0 0 200 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Aditya Birla Capital">
      {/* Red swoosh emblem */}
      <path d="M4 34 C4 34 8 8 22 8 C16 14 14 22 18 28 C12 26 8 30 4 34Z" fill={redColor} />
      <path d="M22 8 C28 2 36 2 40 8 C36 10 30 14 26 20 C24 14 22 8 22 8Z" fill={redColor} opacity="0.7" />
      <path d="M18 28 C22 32 28 34 34 32 C30 28 26 24 26 20 C22 24 18 28 18 28Z" fill={redColor} opacity="0.5" />

      {/* ADITYA BIRLA */}
      <text x="46" y="17" fontFamily="Inter, sans-serif" fontSize="9" fontWeight="600" letterSpacing="1.2" fill={textColor}>
        ADITYA BIRLA
      </text>
      {/* CAPITAL */}
      <text x="46" y="30" fontFamily="Inter, sans-serif" fontSize="13" fontWeight="700" letterSpacing="0.5" fill={redColor}>
        CAPITAL
      </text>
      {/* Tagline */}
      <text x="46" y="40" fontFamily="Inter, sans-serif" fontSize="7" fontWeight="400" letterSpacing="0.3" fill={white ? 'rgba(255,255,255,0.7)' : '#6B7280'}>
        Loans · Insurance · Investments
      </text>
    </svg>
  );
}
