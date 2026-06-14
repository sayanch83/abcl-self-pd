require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDatabase, runMigrations } = require('./database');

async function seed() {
  process.env.DATABASE_URL = process.env.DATABASE_URL || './data/abcl_pd.db';
  runMigrations();
  const db = getDatabase();

  console.log('Seeding demo data...');

  db.exec(`
    DELETE FROM audit_log;
    DELETE FROM pd_submissions;
    DELETE FROM otp_sessions;
    DELETE FROM pd_links;
    DELETE FROM applications;
    DELETE FROM officers;
  `);

  const officers = [
    { id: uuidv4(), employee_id: 'ABCL001', name: 'Rajesh Kumar',  email: 'rajesh.kumar@adityabirlacapital.com',  password: 'Demo@1234', branch: 'Dehradun', role: 'credit_officer' },
    { id: uuidv4(), employee_id: 'ABCL002', name: 'Priya Sharma',  email: 'priya.sharma@adityabirlacapital.com',  password: 'Demo@1234', branch: 'Mumbai',    role: 'credit_officer' },
    { id: uuidv4(), employee_id: 'ABCL003', name: 'Mukund K',      email: 'mukund.k@adityabirlacapital.com',     password: 'Demo@1234', branch: 'Dehradun', role: 'senior_officer' },
  ];

  const insOfficer = db.prepare(
    `INSERT INTO officers (id,employee_id,name,email,password_hash,branch,role) VALUES (?,?,?,?,?,?,?)`
  );
  for (const o of officers) {
    insOfficer.run(o.id, o.employee_id, o.name, o.email, bcrypt.hashSync(o.password, 10), o.branch, o.role);
  }

  // ── DEMO CONFIG ─────────────────────────────────────────────────────────────
  // Replace these with real verified Twilio numbers for live SMS demo.
  // Format: 10-digit Indian mobile without country code (e.g. '9876543210')
  const DEMO_MOBILE_1 = process.env.DEMO_MOBILE_1 || '9876543210'; // Ashwini / Rajesh
  const DEMO_MOBILE_2 = process.env.DEMO_MOBILE_2 || '9876543211'; // Vaibhav
  const DEMO_MOBILE_3 = process.env.DEMO_MOBILE_3 || '9876543212'; // Sunita (completed)
  const DEMO_MOBILE_4 = process.env.DEMO_MOBILE_4 || '9876543213'; // Ramesh
  const DEMO_MOBILE_5 = process.env.DEMO_MOBILE_5 || '9876543214'; // Deepa
  // ─────────────────────────────────────────────────────────────────────────────

  const applications = [
    {
      id: uuidv4(), app_id: 'PL00000701762', customer_name: 'Ashwini Dharpale',
      mobile_no: DEMO_MOBILE_1, product: 'Personal Loan', loan_amount: 1030000,
      branch: 'Dehradun', location: 'Dehradun', employment_type: 'salaried',
      residence_address: 'C/O 45, Rajpur Road, Dehradun, Uttarakhand 248001',
      office_address: '12, Industrial Area, Phase 2, Dehradun, Uttarakhand 248003',
      status: 'pending', officer: officers[0].id,
    },
    {
      id: uuidv4(), app_id: 'BL00000801234', customer_name: 'Vaibhav Kumbhar',
      mobile_no: DEMO_MOBILE_2, product: 'Business Loan', loan_amount: 2500000,
      branch: 'Mumbai', location: 'Mumbai', employment_type: 'self_employed',
      residence_address: 'Flat 302, Shivaji Park, Dadar, Mumbai 400028',
      office_address: 'Shop 5, Linking Road, Bandra West, Mumbai 400050',
      status: 'link_sent', officer: officers[1].id,
    },
    {
      id: uuidv4(), app_id: 'PL00000901567', customer_name: 'Sunita Patel',
      mobile_no: DEMO_MOBILE_3, product: 'Personal Loan', loan_amount: 500000,
      branch: 'Mumbai', location: 'Pune', employment_type: 'salaried',
      residence_address: 'B-12, Koregaon Park, Pune, Maharashtra 411001',
      office_address: 'IT Park, Hinjewadi, Pune, Maharashtra 411057',
      status: 'completed', officer: officers[1].id,
    },
    {
      id: uuidv4(), app_id: 'HL00001002890', customer_name: 'Ramesh Agarwal',
      mobile_no: DEMO_MOBILE_4, product: 'Home Loan', loan_amount: 7500000,
      branch: 'Dehradun', location: 'Haridwar', employment_type: 'self_employed',
      residence_address: '23, Shanti Nagar, Haridwar, Uttarakhand 249401',
      office_address: 'Bharat Medical Store, Railway Road, Haridwar 249401',
      status: 'pending', officer: officers[2].id,
    },
    {
      id: uuidv4(), app_id: 'PL00001103456', customer_name: 'Deepa Menon',
      mobile_no: DEMO_MOBILE_5, product: 'Personal Loan', loan_amount: 800000,
      branch: 'Mumbai', location: 'Mumbai', employment_type: 'salaried',
      residence_address: 'A-304, Powai Lake View, Mumbai 400076',
      office_address: 'Hiranandani Business Park, Powai, Mumbai 400076',
      status: 'link_sent', officer: officers[1].id,
    },
  ];

  const insApp = db.prepare(
    `INSERT INTO applications (id,app_id,customer_name,mobile_no,product,loan_amount,branch,location,employment_type,residence_address,office_address,status,assigned_officer_id)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
  );
  for (const a of applications) {
    insApp.run(a.id, a.app_id, a.customer_name, a.mobile_no, a.product, a.loan_amount,
               a.branch, a.location, a.employment_type, a.residence_address, a.office_address,
               a.status, a.officer);
  }

  // ── Completed PD for Sunita Patel ──────────────────────────────────────────
  const completedApp = applications[2];
  const pdLinkId = uuidv4();
  const usedToken = uuidv4();

  db.prepare(
    `INSERT INTO pd_links (id,application_id,token,mobile_no,expires_at,is_used,triggered_by)
     VALUES (?,?,?,?,?,1,?)`
  ).run(pdLinkId, completedApp.id, usedToken, completedApp.mobile_no,
        new Date(Date.now() + 86400000).toISOString(), officers[1].id);

  const demoPhotos = JSON.stringify([
    {
      url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
      lat: 18.5196, lng: 73.8553, type: 'residence',
      timestamp: new Date().toISOString(),
    },
    {
      url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
      lat: 18.5912, lng: 73.7389, type: 'office',
      timestamp: new Date().toISOString(),
    },
  ]);

  db.prepare(`
    INSERT INTO pd_submissions (
      id, application_id, pd_link_id,
      residence_type, years_at_residence, residence_ownership, locality_type,
      employer_name, designation, years_employed, monthly_income,
      family_members, dependents, existing_loans, loan_purpose,
      interaction_quality, customer_cooperative, additional_notes,
      photos, submitted_at,
      pd_outcome, outcome_remarks, reviewed_by, reviewed_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),?,?,?,datetime('now'))
  `).run(
    uuidv4(), completedApp.id, pdLinkId,
    'apartment', '3-5 years', 'rented', 'urban',
    'Infosys Ltd', 'Senior Software Engineer', '5-10 years', '85000',
    4, 1, 'home_loan', 'Home renovation and furniture purchase',
    'good', 1, 'Customer was well-prepared and cooperative throughout.',
    demoPhotos,
    'positive', 'Strong profile — stable employment, good repayment capacity. Address verified via geo-tags.',
    officers[1].id
  );

  // ── Active link for Vaibhav Kumbhar ────────────────────────────────────────
  const activeToken = uuidv4();
  db.prepare(
    `INSERT INTO pd_links (id,application_id,token,mobile_no,expires_at,is_used,triggered_by)
     VALUES (?,?,?,?,?,0,?)`
  ).run(uuidv4(), applications[1].id, activeToken, applications[1].mobile_no,
        new Date(Date.now() + 86400000).toISOString(), officers[1].id);

  // ── Active link for Deepa Menon ────────────────────────────────────────────
  const deepaToken = uuidv4();
  db.prepare(
    `INSERT INTO pd_links (id,application_id,token,mobile_no,expires_at,is_used,triggered_by)
     VALUES (?,?,?,?,?,0,?)`
  ).run(uuidv4(), applications[4].id, deepaToken, applications[4].mobile_no,
        new Date(Date.now() + 86400000).toISOString(), officers[1].id);

  console.log('\n✅ Demo data seeded successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('OFFICER LOGIN CREDENTIALS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  for (const o of officers) {
    console.log(`  ${o.name.padEnd(16)} ${o.email}`);
    console.log(`  ${''.padEnd(16)} Password: Demo@1234\n`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nDEMO SELF-PD LINKS (use after starting server):');
  const base = process.env.BASE_URL || 'http://localhost:5173';
  console.log(`  Vaibhav Kumbhar (Business Loan):  ${base}/pd/${activeToken}`);
  console.log(`  Deepa Menon     (Personal Loan):  ${base}/pd/${deepaToken}`);
  console.log('\n  Mobile: 9876543211 (Vaibhav) | 9876543214 (Deepa)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

seed().catch(err => { console.error(err); process.exit(1); });
