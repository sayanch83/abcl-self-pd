// Intelligent e-commerce address stub
// Generates realistic address variants deterministically from the application's
// residence_address. The same address always produces the same output, and a
// new address in Demo Config automatically gets its own plausible variants.

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function parseAddress(address) {
  if (!address) return { flat: '', society: '', area: '', city: '', state: '', pin: '' };

  const parts  = address.split(',').map(p => p.trim());
  const pinMatch = address.match(/\b(\d{6})\b/);
  const pin    = pinMatch ? pinMatch[1] : '';

  const STATES = ['Maharashtra', 'Karnataka', 'Delhi', 'Uttar Pradesh', 'Uttarakhand',
                  'Tamil Nadu', 'West Bengal', 'Gujarat', 'Rajasthan', 'Telangana',
                  'Kerala', 'Madhya Pradesh', 'Bihar', 'Odisha', 'Punjab'];
  const CITIES = ['Mumbai', 'Delhi', 'Pune', 'Bangalore', 'Bengaluru', 'Chennai',
                  'Hyderabad', 'Kolkata', 'Ahmedabad', 'Dehradun', 'Haridwar',
                  'Noida', 'Gurgaon', 'Gurugram', 'Thane', 'Nashik', 'Surat'];

  let state = '', city = '';
  for (const p of parts) {
    const s = STATES.find(s => p.includes(s));
    const c = CITIES.find(c => p.toLowerCase().includes(c.toLowerCase()));
    if (s) state = s;
    if (c) city  = c;
  }

  const flat    = parts[0] || '';
  const society = parts[1] || '';
  const area    = parts[2] || '';

  return { flat, society, area, city, state, pin, parts };
}

export function generateEcommerceData(residenceAddress) {
  const { flat, society, area, city, state, pin } = parseAddress(residenceAddress || '');
  const seed = hashString(residenceAddress || 'default');

  // Scores — deterministic, always same for same address
  const conf1     = 85 + (seed % 12);          // 85–96
  const conf2     = 70 + ((seed >>> 4) % 12);  // 70–81
  const stability = 78 + ((seed >>> 2) % 16);  // 78–93

  // ── Variant 1: close match, minor formatting change ──
  // Expand abbreviations and tighten up formatting
  let flatV1 = flat
    .replace(/^C\/O\s+/i,   '')
    .replace(/^Flat\s+/i,   'Flat No. ')
    .replace(/^H\.No\.\s+/i,'House No. ')
    .replace(/^(\d+)\s*,\s*/,'$1, ');
  if (!flatV1.trim()) flatV1 = flat;

  const v1parts = [flatV1, society, area, city].filter(Boolean);
  const variant1 = v1parts.join(', ') + (pin ? ` - ${pin}` : '');

  // ── Variant 2: area-level, slightly different unit ──
  // Increment or alter the flat/unit number for a "nearby" address feel
  const flatV2 = flat.replace(/(\d+)/, m => {
    const n = parseInt(m, 10);
    return isNaN(n) ? m : String(n + 1 + (seed % 3));
  });
  const v2parts = [flatV2 || flat, area || society, city, state].filter(Boolean);
  const variant2 = v2parts.join(', ') + (pin ? ` ${pin}` : '');

  // ── Application address match ──
  const lower = (residenceAddress || '').toLowerCase();
  const applicationAddressMatch =
    (city  && lower.includes(city.toLowerCase())) ||
    (pin   && lower.includes(pin));

  return {
    mobile: '98XXXXXXXX',
    known_addresses: [
      { address: variant1, confidence: conf1, type: 'RESIDENTIAL', rank: 1 },
      { address: variant2, confidence: conf2, type: 'RESIDENTIAL', rank: 2 },
    ],
    address_stability_score: stability,
    application_address_match: applicationAddressMatch,
  };
}
