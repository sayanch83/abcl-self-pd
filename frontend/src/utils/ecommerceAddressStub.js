// Intelligent e-commerce address stub
// Generates realistic variations of the same address — the way customers
// actually type their address differently across Swiggy, Amazon, Flipkart etc.
// Deterministic: same input address always produces the same output.

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// ── Address component parser ──────────────────────────────────────────────────
function parseAddress(address) {
  if (!address) return {};

  const parts = address.split(',').map(p => p.trim()).filter(Boolean);
  const raw   = address;

  // Extract PIN
  const pinMatch = raw.match(/\b(\d{6})\b/);
  const pin      = pinMatch ? pinMatch[1] : '';

  // Extract known city / state
  const CITIES = ['Mumbai', 'Delhi', 'Pune', 'Bangalore', 'Bengaluru', 'Chennai',
                  'Hyderabad', 'Kolkata', 'Ahmedabad', 'Dehradun', 'Haridwar',
                  'Noida', 'Gurgaon', 'Gurugram', 'Thane', 'Nashik', 'Surat',
                  'Jaipur', 'Lucknow', 'Bhopal', 'Indore', 'Vadodara', 'Nagpur'];
  const STATES = ['Maharashtra', 'Karnataka', 'Delhi', 'Uttar Pradesh', 'Uttarakhand',
                  'Tamil Nadu', 'West Bengal', 'Gujarat', 'Rajasthan', 'Telangana',
                  'Kerala', 'Madhya Pradesh', 'Bihar', 'Odisha', 'Punjab', 'Haryana'];

  let city = '', state = '';
  for (const p of parts) {
    const c = CITIES.find(c => p.toLowerCase().includes(c.toLowerCase()));
    const s = STATES.find(s => p.includes(s));
    if (c) city  = c;
    if (s) state = s;
  }

  // The first part is almost always the flat/unit identifier
  const flatRaw = parts[0] || '';

  // Parse the flat identifier into its components
  // Patterns: "Flat 302", "C-406", "B-12", "A-304", "H.No. 23", "45", "#304"
  const flatParsed = parseFlatIdentifier(flatRaw);

  const society = parts[1] || '';
  const area    = parts[2] || '';

  return { flatRaw, flatParsed, society, area, city, state, pin, parts };
}

// ── Flat identifier parser ────────────────────────────────────────────────────
function parseFlatIdentifier(flat) {
  // Pattern: "C-406 Pristine Prolife-III" → block=C, num=406, suffix="Pristine Prolife-III"
  const blockNum = flat.match(/^([A-Z])-?(\d{2,4})\b(.*)$/i);
  if (blockNum) {
    return {
      type: 'block_num',
      block:  blockNum[1].toUpperCase(),
      num:    blockNum[2],
      suffix: blockNum[3].trim(),
    };
  }

  // Pattern: "Flat 302" / "Flat No. 302" / "Flat No 302"
  const flatWord = flat.match(/^(?:Flat\.?\s*(?:No\.?\s*)?|Unit\s*)(\w+)\b(.*)$/i);
  if (flatWord) {
    return { type: 'flat_word', num: flatWord[1], suffix: flatWord[2].trim() };
  }

  // Pattern: "302" bare number
  const bareNum = flat.match(/^(\d{2,4})\b(.*)$/);
  if (bareNum) {
    return { type: 'bare_num', num: bareNum[1], suffix: bareNum[2].trim() };
  }

  // Pattern: "H.No. 45" / "House No 45"
  const houseNum = flat.match(/^(?:H\.?No\.?|House\s*No\.?)\s*(\d+)\b(.*)$/i);
  if (houseNum) {
    return { type: 'house_num', num: houseNum[1], suffix: houseNum[2].trim() };
  }

  // Pattern: "C/O 45" (care of)
  const careOf = flat.match(/^C\/O\s+(.+)$/i);
  if (careOf) {
    return { type: 'care_of', rest: careOf[1] };
  }

  return { type: 'unknown', raw: flat };
}

// ── Variant generator for a flat identifier ───────────────────────────────────
// Returns an array of alternative representations of the same flat
function flatVariants(parsed, seed) {
  const s = seed % 6; // pick one of up to 6 styles

  if (parsed.type === 'block_num') {
    const { block, num, suffix } = parsed;
    // All plausible ways to write "C-406 Pristine Prolife-III"
    const opts = [
      `${block}-${num}${suffix ? ' ' + suffix : ''}`,          // C-406 Pristine...
      `${block}${num}${suffix ? ', ' + suffix : ''}`,           // C406, Pristine...
      `Flat ${block}-${num}${suffix ? ', ' + suffix : ''}`,     // Flat C-406, Pristine...
      `Flat No. ${num}, ${block} Wing${suffix ? ', ' + suffix : ''}`, // Flat No. 406, C Wing...
      `${block} Wing, Flat ${num}${suffix ? ', ' + suffix : ''}`,    // C Wing, Flat 406...
      `Bldg ${block}, Flat ${num}${suffix ? ', ' + suffix : ''}`,    // Bldg C, Flat 406...
    ];
    return opts[s % opts.length];
  }

  if (parsed.type === 'flat_word') {
    const { num, suffix } = parsed;
    const opts = [
      `Flat ${num}${suffix ? ', ' + suffix : ''}`,
      `Flat No. ${num}${suffix ? ', ' + suffix : ''}`,
      `Unit ${num}${suffix ? ', ' + suffix : ''}`,
      `Apartment ${num}${suffix ? ', ' + suffix : ''}`,
      `${num}${suffix ? ', ' + suffix : ''}`,
    ];
    return opts[s % opts.length];
  }

  if (parsed.type === 'bare_num') {
    const { num, suffix } = parsed;
    const opts = [
      `${num}${suffix ? ', ' + suffix : ''}`,
      `Flat No. ${num}${suffix ? ', ' + suffix : ''}`,
      `House No. ${num}${suffix ? ', ' + suffix : ''}`,
      `No. ${num}${suffix ? ', ' + suffix : ''}`,
    ];
    return opts[s % opts.length];
  }

  if (parsed.type === 'house_num') {
    const { num, suffix } = parsed;
    const opts = [
      `House No. ${num}${suffix ? ', ' + suffix : ''}`,
      `H.No. ${num}${suffix ? ', ' + suffix : ''}`,
      `${num}${suffix ? ', ' + suffix : ''}`,
      `Flat No. ${num}${suffix ? ', ' + suffix : ''}`,
    ];
    return opts[s % opts.length];
  }

  if (parsed.type === 'care_of') {
    return parsed.rest; // strip the C/O prefix
  }

  return parsed.raw || '';
}

// ── Society/landmark variations ───────────────────────────────────────────────
function societyVariants(society, area, seed) {
  const s = (seed >> 3) % 3;
  if (!society) return area || '';

  const opts = [
    society,                                           // exact
    society.replace(/\s*-\s*(I{1,3}|[IVX]+)$/, ''), // strip roman numeral suffix
    society.split(' ').slice(0, 2).join(' '),          // first 2 words only
  ];
  return opts[s % opts.length] || society;
}

// ── Main export ───────────────────────────────────────────────────────────────
export function generateEcommerceData(residenceAddress) {
  const addr = residenceAddress || '';
  const { flatRaw, flatParsed, society, area, city, state, pin, parts } = parseAddress(addr);
  const seed = hashString(addr);

  // ── Variant 1: high confidence — common, clean representation ──
  const flat1     = flatParsed ? flatVariants(flatParsed, seed) : flatRaw;
  const society1  = societyVariants(society, area, seed);
  const v1parts   = [flat1, society1, city].filter(Boolean);
  const variant1  = v1parts.join(', ') + (pin ? ` - ${pin}` : '');

  // ── Variant 2: medium confidence — different style, same location ──
  // Use a different variant style (offset seed by 3 to guarantee different pick)
  const flat2     = flatParsed ? flatVariants(flatParsed, seed + 3) : flatRaw;
  const society2  = societyVariants(society, area, seed + 5);
  // Sometimes drops society and uses area instead
  const mid2      = ((seed >> 6) % 2 === 0) ? (area || society2) : society2;
  const v2parts   = [flat2, mid2, city].filter(Boolean);
  const variant2  = v2parts.join(', ') + (pin ? `, ${pin}` : '');

  // ── Scores — deterministic from hash ──
  const conf1     = 85 + (seed         % 12);   // 85–96
  const conf2     = 68 + ((seed >> 4)  % 13);   // 68–80
  const stability = 78 + ((seed >> 2)  % 16);   // 78–93

  // ── Application address match ──
  const lower = addr.toLowerCase();
  const applicationAddressMatch =
    (city && lower.includes(city.toLowerCase())) ||
    (pin  && lower.includes(pin));

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
