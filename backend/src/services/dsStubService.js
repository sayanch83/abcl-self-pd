// DS Authenticate Stub Service
// Generates a deterministic, realistic mock of the Data Sutram DS Authenticate
// API response, derived from the actual application data.
// When the real DS API is available, replace this file's exported function
// with a real HTTP call — the controller and frontend stay unchanged.

const logger = require('../utils/logger');

// Simple deterministic hash
function hash(str) {
  let h = 0;
  for (let i = 0; i < (str || '').length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// ── City → State/Region mapping ──────────────────────────────────────────────
const CITY_STATE = {
  'dehradun':   'Uttarakhand',
  'haridwar':   'Uttarakhand',
  'mumbai':     'Maharashtra',
  'pune':       'Maharashtra',
  'thane':      'Maharashtra',
  'nashik':     'Maharashtra',
  'nagpur':     'Maharashtra',
  'delhi':      'Delhi',
  'noida':      'Delhi',
  'gurgaon':    'Delhi',
  'gurugram':   'Delhi',
  'bangalore':  'Karnataka',
  'bengaluru':  'Karnataka',
  'chennai':    'Tamil Nadu',
  'hyderabad':  'Telangana',
  'kolkata':    'West Bengal',
  'ahmedabad':  'Gujarat',
  'surat':      'Gujarat',
  'vadodara':   'Gujarat',
  'jaipur':     'Rajasthan',
  'lucknow':    'Uttar Pradesh',
  'bhopal':     'Madhya Pradesh',
  'indore':     'Madhya Pradesh',
};

// Derive state from address string
function stateFromAddress(address) {
  const lower = (address || '').toLowerCase();
  for (const [city, state] of Object.entries(CITY_STATE)) {
    if (lower.includes(city)) return state;
  }
  // Fallback: check if state name is directly in address
  const STATES = ['Maharashtra', 'Karnataka', 'Delhi', 'Uttar Pradesh', 'Uttarakhand',
                  'Tamil Nadu', 'West Bengal', 'Gujarat', 'Rajasthan', 'Telangana',
                  'Kerala', 'Madhya Pradesh', 'Bihar', 'Odisha', 'Punjab', 'Haryana'];
  for (const s of STATES) {
    if ((address || '').includes(s)) return s;
  }
  return 'Unknown';
}

// Derive telecom region name from state (matches DS API format)
const STATE_TELECOM_REGION = {
  'Uttarakhand':    'Uttarakhand',
  'Maharashtra':    'Maharashtra',
  'Delhi':          'Delhi',
  'Karnataka':      'Karnataka',
  'Tamil Nadu':     'Tamil Nadu',
  'Telangana':      'Andhra Pradesh & Telangana',
  'West Bengal':    'West Bengal',
  'Gujarat':        'Gujarat',
  'Rajasthan':      'Rajasthan',
  'Uttar Pradesh':  'Uttar Pradesh',
  'Madhya Pradesh': 'Madhya Pradesh',
  'Kerala':         'Kerala',
  'Punjab':         'Punjab',
  'Haryana':        'Haryana',
  'Bihar':          'Bihar',
};

// Networks pool — pick deterministically
const NETWORKS = ['JIO', 'AIRTEL', 'VI', 'BSNL'];
const PORTED_FROM = { JIO: 'AIRTEL', AIRTEL: 'JIO', VI: 'AIRTEL', BSNL: null };

function generateDsData(application) {
  const {
    customer_name, mobile_no, employment_type,
    residence_address, office_address, location, branch,
  } = application;

  const seed     = hash(mobile_no + customer_name);
  const addrSeed = hash(residence_address || '');

  const isSalaried = employment_type === 'salaried';
  const blackList  = false; // stub always clean for demo

  // ── Mobile intelligence ──
  const networkIdx    = seed % NETWORKS.length;
  const network       = NETWORKS[networkIdx];
  const portedFrom    = PORTED_FROM[network];
  const hasPorting    = !!portedFrom;

  // Region — derived from address
  const declaredState  = stateFromAddress(residence_address || location || branch || '');
  const networkRegion  = STATE_TELECOM_REGION[declaredState] || declaredState || 'Maharashtra';
  const regionMatch    = declaredState !== 'Unknown' &&
    (networkRegion.includes(declaredState) || declaredState.includes(networkRegion.split(' ')[0]));

  // Age of number — 3–14 years from seed
  const firstSeenYear  = 2024 - (3 + (seed % 12));
  const aonYears       = 2024 - firstSeenYear;
  const aonBucket      = aonYears <= 3   ? 'Less than 3 Years'
                       : aonYears <= 5   ? '3 to 5 Years'
                       : aonYears <= 8   ? '5 to 8 Years'
                       : aonYears <= 11  ? '8 to 11 Years'
                       : '11+ Years';

  // ── Identity signals ──
  const nameOnRecord  = (customer_name || '')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  const isEmployed    = isSalaried;
  const hasUan        = isSalaried && (seed % 10) < 8;     // 80% have UAN
  const hasGst        = !isSalaried && (seed % 10) < 6;    // 60% have GST

  // ── Platform presence ──
  const hasFlipkart   = (seed % 10) < 8;                   // 80% on Flipkart
  const hasSwiggy     = (seed % 10) < 7;                   // 70% on Swiggy
  const hasWhatsapp   = (seed % 10) < 9;                   // 90% on WhatsApp

  // ── Trust Score — composite of signals (mirrors DS model logic) ──
  // Base: 400. Each positive signal adds points. Small noise from seed.
  let trustScore = 400;

  // Identity (up to 200 pts)
  if (isEmployed)                                   trustScore += 80;
  if (hasUan)                                       trustScore += 60;   // strong EPFO signal
  if (!isSalaried && hasGst)                        trustScore += 70;   // GST = formal business
  if (!isSalaried && !hasGst)                       trustScore += 20;   // informal SE, weaker

  // Mobile stability (up to 180 pts)
  if (regionMatch)                                  trustScore += 60;
  if (aonYears >= 8)                               trustScore += 80;
  else if (aonYears >= 5)                          trustScore += 55;
  else if (aonYears >= 3)                          trustScore += 30;
  else                                              trustScore += 10;

  // Platform presence (up to 120 pts)
  if (hasFlipkart)                                  trustScore += 40;
  if (hasSwiggy)                                    trustScore += 40;
  if (hasWhatsapp)                                  trustScore += 40;

  // Small deterministic noise ±30 to avoid every "all green" profile being identical
  trustScore += ((seed >> 8) % 31) - 10;

  // Clamp to realistic range
  trustScore = Math.max(400, Math.min(920, trustScore));

  return {
    // Exactly mirrors DS API structure — frontend reads these fields
    dsTrustScore: trustScore,
    enrichment: {
      blackList,
      employment: {
        isEmployed,
        hasUan,
      },
      hasGst,
      panDetails: {
        fullName: nameOnRecord,
      },
      currentNetworkName:        network,
      currentNetworkRegion:      networkRegion,
      numberHasPortingHistory:   hasPorting,
      portedFromNetworkName:     portedFrom,
      phoneFirstSeenYear:        firstSeenYear,
      aon: {
        aonBucket,
      },
      digitalPlatformScrub: {
        phoneSocial: {
          flipkart:         hasFlipkart,
          swiggy:           hasSwiggy,
          whatsapp:         hasWhatsapp,
          whatsappBusiness: false,
        },
      },
      // Internal fields used only by backend for region match
      _declaredState:  declaredState,
      _regionMatch:    regionMatch,
    },
  };
}

// ── Main export — drop-in replacement for real DS API call ────────────────────
async function fetchDsAuthenticate(application) {
  try {
    // When real DS API is available, replace the block below with:
    //
    // const response = await axios.post(process.env.DS_API_URL, {
    //   mobile: application.mobile_no,
    //   name:   application.customer_name,
    //   pan:    application.pan_number,
    // }, { headers: { 'x-api-key': process.env.DS_API_KEY } });
    // return response.data.data;

    const data = generateDsData(application);
    logger.info(`DS stub generated for ${application.app_id} (trust: ${data.dsTrustScore})`);
    return { success: true, data };
  } catch (err) {
    logger.error(`DS fetch error: ${err.message}`);
    return { success: false, error: err.message };
  }
}

module.exports = { fetchDsAuthenticate };
