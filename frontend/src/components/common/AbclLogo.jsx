// Aditya Birla Capital — actual logo file
// Logo is portrait (280x300) with red background
// Works on both red header and white backgrounds

export default function AbclLogo({ height = 40 }) {
  const width = Math.round(height * (280 / 300));

  return (
    <img
      src="/abcl-logo.png"
      height={height}
      width={width}
      alt="Aditya Birla Capital"
      style={{ height, width, objectFit: 'contain', display: 'block' }}
      onError={(e) => {
        // Fallback: hide if image fails to load
        e.target.style.display = 'none';
      }}
    />
  );
}
