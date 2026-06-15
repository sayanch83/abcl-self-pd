import { useEffect, useState } from 'react';import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronDown, ChevronUp, MapPin, CheckCircle, XCircle,
  Home, Building2, Users, FileText, Image, RefreshCw, Send, ShoppingBag
} from 'lucide-react';
import { applicationApi } from '../../api/client';
import OfficerLayout from '../../components/layout/OfficerLayout';
import { Badge, StatusBadge, Spinner, Alert, Textarea } from '../../components/common/UI';
import PdLinkModal from '../../components/common/PdLinkModal';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

// ── Collapsible Section (matches screenshot style) ────────────────────────────
function Section({ title, icon: Icon, children, defaultOpen = false, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {Icon && <Icon size={16} className="text-[#C8102E]" />}
          <span className="text-sm font-semibold text-gray-800">{title}</span>
          {badge && <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 font-medium">{badge}</span>}
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && (
        <div className="border-t border-gray-100 bg-white px-5 py-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Field Row ─────────────────────────────────────────────────────────────────
function Field({ label, value, wide }) {
  return (
    <div className={`flex items-start justify-between py-2 border-b border-gray-50 last:border-0 ${wide ? 'col-span-2' : ''}`}>
      <span className="text-xs text-[#C8102E] font-medium min-w-[160px]">{label}</span>
      <span className="text-sm text-gray-800 text-right">{value || <span className="text-gray-300 italic">—</span>}</span>
    </div>
  );
}

// ── Grid of fields ─────────────────────────────────────────────────────────────
function FieldGrid({ children }) {
  return <div className="space-y-0">{children}</div>;
}

// ── Geo Card ──────────────────────────────────────────────────────────────────
function GeoCard({ analysis }) {
  const risk = analysis.riskLevel;
  const colors = {
    low:    { border: 'border-emerald-200 bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
    medium: { border: 'border-amber-200 bg-amber-50',     text: 'text-amber-700',   badge: 'bg-amber-100 text-amber-700'    },
    high:   { border: 'border-red-200 bg-red-50',         text: 'text-red-700',     badge: 'bg-red-100 text-red-700'        },
  };
  const c = colors[risk] || colors.high;

  return (
    <div className={`border rounded-xl p-4 ${c.border}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {analysis.photoType === 'residence' || analysis.photoType === 'residence_building' || analysis.photoType === 'residence_door'
            ? <Home size={14} className={c.text} />
            : <Building2 size={14} className={c.text} />}
          <span className={`text-sm font-semibold ${c.text}`}>{analysis.photoTypeLabel || analysis.photoType}</span>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>
          {analysis.distanceKm} km away
        </span>
      </div>

      {analysis.photoUrl && (
        <img src={analysis.photoUrl} alt={analysis.photoType}
          className="w-full h-32 object-cover rounded-lg mb-3"
          onError={e => { e.target.style.display = 'none'; }}
        />
      )}

      <div className="space-y-2 text-xs">
        <div className="flex items-start gap-2">
          <MapPin size={11} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-gray-500">Photo captured at</p>
            <p className="font-medium text-gray-700">
              {analysis.photoCoords?.lat?.toFixed(5)}, {analysis.photoCoords?.lng?.toFixed(5)}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <MapPin size={11} className="text-[#C8102E] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-gray-500">Address on record</p>
            <p className="font-medium text-gray-700">{analysis.referenceAddress}</p>
          </div>
        </div>
        <p className={`font-semibold pt-1 border-t ${c.border.split(' ')[0]} ${c.text}`}>
          {analysis.distanceLabel} — {analysis.distanceKm} km from registered address
        </p>
      </div>
    </div>
  );
}

// ── Digital Footprint Intelligence Section (DS Authenticate) ─────────────────
function DigitalFootprintSection({ applicationId, employmentType }) {
  const [ds, setDs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applicationApi.getDsData(applicationId)
      .then(res => setDs(res.data.data))
      .catch(() => setDs(null))
      .finally(() => setLoading(false));
  }, [applicationId]);

  const isSalaried = employmentType === 'salaried';

  return (
    <Section title="Digital Footprint Intelligence" icon={ShoppingBag} defaultOpen>
      {loading ? (
        <div className="flex items-center gap-2 py-3 text-gray-400 text-xs">
          <Spinner size={14} /> Fetching intelligence data...
        </div>
      ) : !ds ? (
        <p className="text-xs text-gray-400 py-2">Intelligence data unavailable.</p>
      ) : (
        <div className="space-y-3">

          {/* ── 1. Trust Overview ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-2">
            {/* Trust Score */}
            {(() => {
              const score  = ds.dsTrustScore;
              const color  = score >= 650 ? 'text-emerald-600' : score >= 500 ? 'text-amber-600' : 'text-red-500';
              const bg     = score >= 650 ? 'bg-emerald-50 border-emerald-200' : score >= 500 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';
              return (
                <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${bg}`}>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">Trust Score</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Digital trust index</p>
                  </div>
                  <p className={`text-2xl font-bold ml-2 flex-shrink-0 ${color}`}>{score}<span className="text-xs font-normal text-gray-400"> /1000</span></p>
                </div>
              );
            })()}

            {/* Blacklist */}
            {(() => {
              const clean = !ds.enrichment.blackList;
              return (
                <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${clean ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">Blacklist</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Fraud / watchlist check</p>
                  </div>
                  <span className={`text-sm font-bold flex-shrink-0 ml-2 ${clean ? 'text-emerald-600' : 'text-red-600'}`}>
                    {clean ? '✓ Clean' : '⚠ Flagged'}
                  </span>
                </div>
              );
            })()}
          </div>

          {/* ── 2. Identity Signals ───────────────────────────────────────── */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide px-3 py-2 bg-gray-50 border-b border-gray-100">Identity Signals</p>
            <div className="divide-y divide-gray-50">
              {/* Name on record */}
              <DsRow label="Name on Record" value={ds.enrichment.panDetails?.fullName} />
              {/* Employment (salaried) */}
              {isSalaried && (
                <DsRow
                  label="Employment Confirmed"
                  value={ds.enrichment.employment?.isEmployed
                    ? (ds.enrichment.employment?.hasUan ? 'Yes — UAN present (EPFO)' : 'Yes')
                    : 'Not confirmed'}
                  positive={ds.enrichment.employment?.isEmployed}
                />
              )}
              {/* GST (self-employed) */}
              {!isSalaried && (
                <DsRow
                  label="GST Registration"
                  value={ds.enrichment.hasGst ? 'Registered' : 'Not Registered'}
                  positive={ds.enrichment.hasGst}
                  neutral={!ds.enrichment.hasGst}
                />
              )}
            </div>
          </div>

          {/* ── 3. Mobile Intelligence ────────────────────────────────────── */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide px-3 py-2 bg-gray-50 border-b border-gray-100">Mobile Intelligence</p>
            <div className="divide-y divide-gray-50">
              <DsRow label="Network Region" value={ds.enrichment.currentNetworkRegion} />
              <DsRow
                label="Region vs Declared Address"
                value={ds.enrichment._regionMatch ? 'Match' : 'Mismatch'}
                positive={ds.enrichment._regionMatch}
                negative={!ds.enrichment._regionMatch}
              />
              <DsRow label="Age of Number" value={ds.enrichment.aon?.aonBucket} />
            </div>
          </div>

          {/* ── 4. Platform Presence ──────────────────────────────────────── */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide px-3 py-2 bg-gray-50 border-b border-gray-100">Platform Presence</p>
            <div className="grid grid-cols-3 divide-x divide-gray-100">
              {[
                { label: 'Flipkart', val: ds.enrichment.digitalPlatformScrub?.phoneSocial?.flipkart },
                { label: 'Swiggy',   val: ds.enrichment.digitalPlatformScrub?.phoneSocial?.swiggy   },
                { label: 'WhatsApp', val: ds.enrichment.digitalPlatformScrub?.phoneSocial?.whatsapp  },
              ].map(({ label, val }) => (
                <div key={label} className="flex flex-col items-center justify-center py-3 px-2 gap-1">
                  <span className={`text-lg font-bold ${val ? 'text-emerald-500' : 'text-gray-300'}`}>
                    {val ? '✓' : '—'}
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-[10px] text-gray-400 leading-relaxed">
            * Intelligence derived from digital footprint data sources. For indicative use in credit assessment only.
          </p>
        </div>
      )}
    </Section>
  );
}

// ── DS Row helper ─────────────────────────────────────────────────────────────
function DsRow({ label, value, positive, negative, neutral }) {
  const valColor = positive ? 'text-emerald-600 font-semibold'
                 : negative ? 'text-red-500 font-semibold'
                 : 'text-gray-800';
  const prefix   = positive ? '✓ ' : negative ? '✗ ' : '';
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <span className="text-xs text-[#C8102E] font-medium">{label}</span>
      <span className={`text-xs text-right ml-4 ${valColor}`}>
        {value ? `${prefix}${value}` : <span className="text-gray-300 italic">—</span>}
      </span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [outcome, setOutcome] = useState('');
  const [remarks, setRemarks] = useState('');
  const [savingOutcome, setSavingOutcome] = useState(false);
  const [modal, setModal] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await applicationApi.getById(id);
      const d = res.data.data;
      setData(d);
      if (d.submission?.pd_outcome) {
        setOutcome(d.submission.pd_outcome);
        setRemarks(d.submission.outcome_remarks || '');
      }
    } catch {
      toast.error('Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      const res = await applicationApi.triggerPd(id);
      toast.success(res.data.message);
      if (res.data.data?.pdLink) {
        setModal({ link: res.data.data.pdLink, customerName: data.customer_name, appId: data.app_id, mobile: data.mobile_no });
      }
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send link');
    } finally {
      setTriggering(false);
    }
  };

  const handleSaveOutcome = async () => {
    if (!outcome) { toast.error('Please select an outcome'); return; }
    setSavingOutcome(true);
    try {
      await applicationApi.updateOutcome(id, { outcome, remarks });
      toast.success('PD outcome saved');
      fetchData();
    } catch {
      toast.error('Failed to save outcome');
    } finally {
      setSavingOutcome(false);
    }
  };

  if (loading) return (
    <OfficerLayout>
      <div className="flex items-center justify-center h-64"><Spinner size={32} /></div>
    </OfficerLayout>
  );

  if (!data) return (
    <OfficerLayout>
      <Alert type="error">Application not found</Alert>
    </OfficerLayout>
  );

  const { submission, links, geoAnalysis } = data;
  const isSalaried = data.employment_type === 'salaried';
  const isCompleted = data.status === 'completed';
  const s = submission; // shorthand

  return (
    <OfficerLayout appId={data.app_id}>
      {/* ── White info bar — matches existing screen two-row strip ── */}
      <div className="bg-white border border-gray-200 -mx-5 -mt-5 px-6 py-0 mb-0 shadow-sm">
        {/* Row 1 */}
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <div className="flex items-center gap-3 flex-wrap text-xs text-gray-700">
            <span className="font-semibold text-gray-900">
              {data.customer_name}
            </span>
            <span className="text-gray-300">|</span>
            <span>{data.product === 'Personal Loan' ? 'PL' : data.product === 'Business Loan' ? 'BL' : data.product === 'Home Loan' ? 'HL' : 'LAP'}</span>
            <span className="text-gray-300">|</span>
            <span>Unsecured Loan</span>
            <span className="text-gray-300">|</span>
            <span>Assigned To : <strong>{data.officer_name}</strong></span>
            <span className="text-gray-300">|</span>
            <span>Document Status : <strong>FTR</strong></span>
          </div>
          {/* Submit / Approve / Decline — matches existing screen exactly */}
          <div className="flex items-center gap-0 flex-shrink-0 ml-4">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold border border-gray-300 rounded-l hover:bg-gray-200 transition-colors">
              ⊠ Submit
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold border border-emerald-700 hover:bg-emerald-700 transition-colors">
              ✓ Approve
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold border border-red-700 rounded-r hover:bg-red-700 transition-colors">
              ✕ Decline
            </button>
            <button
              onClick={fetchData}
              className="ml-2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>
        {/* Row 2 */}
        <div className="flex items-center gap-3 flex-wrap py-1.5 text-xs text-gray-600">
          <span>Loan Amount : <strong>₹{data.loan_amount?.toLocaleString('en-IN')}</strong></span>
          <span className="text-gray-300">|</span>
          <span>Stage : <strong>CRDT</strong></span>
          <span className="text-gray-300">|</span>
          <span>Status : <strong>{data.status === 'completed' ? 'PD Done' : data.status === 'link_sent' ? 'Awaiting' : 'Queue'}</strong></span>
          <span className="text-gray-300">|</span>
          <span>Branch : <strong>{data.branch}</strong></span>
          <span className="text-gray-300">|</span>
          <span>GO/NO GO : <strong>N</strong></span>
          {s?.pd_outcome && (
            <>
              <span className="text-gray-300">|</span>
              <span className={`font-semibold ${s.pd_outcome === 'positive' ? 'text-emerald-600' : 'text-red-600'}`}>
                PD : {s.pd_outcome === 'positive' ? '✓ Positive' : '✗ Negative'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Main Layout ───────────────────────────────────────────────────── */}
      <div className="flex gap-4 items-start mt-4">
        {/* Left column — applicant summary */}
        <div className="w-56 flex-shrink-0 space-y-3">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Applicant</p>
            <div className="space-y-2 text-xs">
              <div>
                <p className="text-[#C8102E]">Customer Name</p>
                <p className="font-medium text-gray-800 mt-0.5">{data.customer_name}</p>
              </div>
              <div>
                <p className="text-[#C8102E]">Mobile No.</p>
                <p className="font-medium text-gray-800 mt-0.5 font-mono">
                  {data.mobile_no?.replace(/(\d{2})\d{6}(\d{2})/, '$1xxxxxx$2')}
                </p>
              </div>
              <div>
                <p className="text-[#C8102E]">Product</p>
                <p className="font-medium text-gray-800 mt-0.5">{data.product}</p>
              </div>
              <div>
                <p className="text-[#C8102E]">Location</p>
                <p className="font-medium text-gray-800 mt-0.5">{data.location || data.branch}</p>
              </div>
              <div>
                <p className="text-[#C8102E]">Employment</p>
                <p className="font-medium text-gray-800 mt-0.5 capitalize">{data.employment_type?.replace('_', ' ')}</p>
              </div>
            </div>
          </div>

          {/* Link history */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Link History</p>
            {links?.length === 0 ? (
              <p className="text-xs text-gray-400">No links sent</p>
            ) : (
              <div className="space-y-2">
                {links?.slice(0, 4).map((l, i) => (
                  <div key={l.id} className="text-xs">
                    <p className="font-medium text-gray-700">
                      {l.is_used === 1 ? '✓ Used' : l.is_used === 0 ? '🟢 Active' : '↺ Superseded'}
                    </p>
                    <p className="text-gray-400">{formatDistanceToNow(new Date(l.triggered_at), { addSuffix: true })}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column — collapsible sections */}
        <div className="flex-1 min-w-0">

          {/* Applicant Details (always open) */}
          <Section title="Applicant Details" icon={FileText} defaultOpen>
            <FieldGrid>
              <Field label="App. Id/Lead Id" value={data.app_id} />
              <Field label="Customer Name" value={data.customer_name} />
              <Field label="Bank/NBFC Name" value="Aditya Birla Capital Ltd." />
              <Field label="Product" value={data.product} />
              <Field label="Location" value={data.location} />
            </FieldGrid>
          </Section>

          {/* Residence Details */}
          <Section title="Residence Details" icon={Home} defaultOpen={isCompleted}>
            <FieldGrid>
              <Field label="Residence Address" value={data.residence_address} />
              <Field label="Type of Residence" value={s?.residence_type?.replace(/_/g, ' ')} />
              <Field label="Ownership Status" value={s?.residence_ownership?.replace(/_/g, ' ')} />
              <Field label="Years at Address" value={s?.years_at_residence?.replace(/_/g, ' ')} />
              <Field label="Locality Type" value={s?.locality_type?.replace(/_/g, ' ')} />
            </FieldGrid>
          </Section>

          {/* Employment / Business */}
          <Section
            title={isSalaried ? 'Employment Details' : 'Business Details'}
            icon={Building2}
            defaultOpen={isCompleted}
          >
            <FieldGrid>
              <Field
                label={isSalaried ? 'Office Address' : 'Business Address'}
                value={data.office_address}
              />
              {isSalaried ? (
                <>
                  <Field label="Employer Name" value={s?.employer_name} />
                  <Field label="Designation" value={s?.designation} />
                  <Field label="Years Employed" value={s?.years_employed?.replace(/_/g, ' ')} />
                  <Field label="Monthly Income" value={s?.monthly_income ? `₹${Number(s.monthly_income).toLocaleString('en-IN')}` : null} />
                </>
              ) : (
                <>
                  <Field label="Business Name" value={s?.business_name} />
                  <Field label="Business Type" value={s?.business_type?.replace(/_/g, ' ')} />
                  <Field label="Years in Business" value={s?.years_in_business?.replace(/_/g, ' ')} />
                  <Field label="Monthly Turnover" value={s?.monthly_turnover ? `₹${Number(s.monthly_turnover).toLocaleString('en-IN')}` : null} />
                </>
              )}
            </FieldGrid>
          </Section>

          {/* Personal Details */}
          <Section title="Personal Details" icon={Users} defaultOpen={isCompleted}>
            <FieldGrid>
              <Field label="Family Members" value={s?.family_members} />
              <Field label="Dependents" value={s?.dependents} />
              <Field label="Existing Loans" value={s?.existing_loans?.replace(/_/g, ' ')} />
              <Field label="Loan Purpose" value={s?.loan_purpose} />
              {s?.additional_notes && <Field label="Customer Remarks" value={s.additional_notes} />}
            </FieldGrid>
          </Section>

          {/* Uploaded Images — renamed, merged (was Geolocation Images + Uploaded Photographs) */}
          <Section title="Uploaded Images" icon={Image} defaultOpen={isCompleted}
            badge={geoAnalysis?.length > 0 ? `${geoAnalysis.length} photos` : undefined}>
            {!isCompleted ? (
              <p className="text-sm text-gray-400 py-2">Photos will appear after customer submits the form.</p>
            ) : geoAnalysis?.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {geoAnalysis.map((a, i) => <GeoCard key={i} analysis={a} />)}
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-2">No geo-tagged photos available.</p>
            )}
          </Section>

          {/* Digital Footprint Intelligence */}
          <DigitalFootprintSection
            applicationId={data.id}
            employmentType={data.employment_type}
          />

          {/* PD Outcome — only show after completion */}
          {isCompleted && (
            <Section title="PD Outcome" icon={FileText} defaultOpen>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setOutcome('positive')}
                    className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-all text-left ${
                      outcome === 'positive'
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                    }`}
                  >
                    <CheckCircle size={20} className={outcome === 'positive' ? 'text-emerald-600' : 'text-gray-300'} />
                    <div>
                      <p className={`font-semibold text-sm ${outcome === 'positive' ? 'text-emerald-700' : 'text-gray-700'}`}>Positive</p>
                      <p className="text-xs text-gray-400">Recommend to proceed</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setOutcome('negative')}
                    className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-all text-left ${
                      outcome === 'negative'
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                    }`}
                  >
                    <XCircle size={20} className={outcome === 'negative' ? 'text-red-500' : 'text-gray-300'} />
                    <div>
                      <p className={`font-semibold text-sm ${outcome === 'negative' ? 'text-red-600' : 'text-gray-700'}`}>Negative</p>
                      <p className="text-xs text-gray-400">Concerns identified</p>
                    </div>
                  </button>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1.5">Remarks</p>
                  <textarea
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    placeholder="Enter your observations and remarks about this PD..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 resize-none
                      focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveOutcome}
                    disabled={savingOutcome}
                    className="px-5 py-2 bg-[#C8102E] text-white text-sm font-medium rounded-lg hover:bg-[#A00D24] disabled:opacity-50 transition-colors"
                  >
                    {savingOutcome ? 'Saving...' : 'Save Outcome'}
                  </button>
                </div>
              </div>
            </Section>
          )}
        </div>
      </div>

      {/* ── Fixed bottom bar — Trigger Self-PD (matches FI Trigger position) ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2.5 flex items-center justify-end gap-2 z-40 shadow-lg">
        <span className="text-xs text-gray-400 mr-auto font-mono">
          Application ID : <span className="font-semibold text-gray-600">{data.app_id}</span>
        </span>
        {data.status !== 'completed' ? (
          <button
            onClick={handleTrigger}
            disabled={triggering}
            className="flex items-center gap-2 px-5 py-2 bg-[#C8102E] text-white text-sm font-semibold rounded hover:bg-[#A00D24] disabled:opacity-60 transition-colors shadow-sm"
          >
            <Send size={13} />
            {triggering ? 'Sending...' : data.status === 'link_sent' ? 'Re-trigger Self-PD' : 'Trigger Self-PD'}
          </button>
        ) : (
          <span className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded">
            <CheckCircle size={14} />
            Self-PD Completed
          </span>
        )}
      </div>

      {/* Spacer for fixed bottom bar */}
      <div className="h-14" />

      <PdLinkModal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        link={modal?.link}
        customerName={modal?.customerName}
        appId={modal?.appId}
        mobile={modal?.mobile}
      />
    </OfficerLayout>
  );
}
