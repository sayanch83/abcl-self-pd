import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronDown, ChevronUp, MapPin, CheckCircle, XCircle,
  Home, Building2, Users, FileText, Image, RefreshCw, Send
} from 'lucide-react';
import { applicationApi } from '../../api/client';
import api from '../../api/client';
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
          {analysis.photoType === 'residence'
            ? <Home size={14} className={c.text} />
            : <Building2 size={14} className={c.text} />}
          <span className={`text-sm font-semibold capitalize ${c.text}`}>{analysis.photoType} Photo</span>
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
  const [appMode, setAppMode] = useState('live');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [res, modeRes] = await Promise.all([
        applicationApi.getById(id),
        api.get('/mode'),
      ]);
      const d = res.data.data;
      setData(d);
      setAppMode(modeRes.data.mode);
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
    <OfficerLayout>
      {/* ── Top Info Bar (matches screenshot) ─────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-lg px-5 py-3 mb-4 text-xs text-gray-600">
        <div className="flex items-center flex-wrap gap-x-5 gap-y-1">
          <span>
            <span className="font-semibold text-gray-800">{data.customer_name}</span>
            {' · '}<span className="capitalize">{data.employment_type?.replace('_', ' ')}</span>
          </span>
          <span>
            <span className="text-[#C8102E] font-mono font-semibold">{data.app_id}</span>
          </span>
          <span>Unsecured Loan</span>
          <span>Amount : {data.loan_amount ? `₹${data.loan_amount.toLocaleString('en-IN')}` : '—'}</span>
          <span>Stage : CRDT</span>
          <span>Status : {data.status === 'completed' ? 'PD Completed' : data.status === 'link_sent' ? 'Awaiting Customer' : 'Pending PD'}</span>
          <span>Branch : {data.branch}</span>
          <div className="ml-auto flex items-center gap-2">
            <StatusBadge status={data.status} />
            {s?.pd_outcome && (
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${s.pd_outcome === 'positive' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {s.pd_outcome === 'positive' ? '✓ Positive PD' : '✗ Negative PD'}
              </span>
            )}
            <button onClick={fetchData} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
              <RefreshCw size={13} />
            </button>
          </div>
        </div>
        {data.officer_name && (
          <div className="mt-1.5 pt-1.5 border-t border-gray-100 text-gray-400">
            Assigned to : <span className="text-gray-600">{data.officer_name}</span>
          </div>
        )}
      </div>

      {/* ── Main Layout ───────────────────────────────────────────────────── */}
      <div className="flex gap-4 items-start">
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

          {/* Geolocation Images */}
          <Section title="Geolocation Images" icon={MapPin} defaultOpen={isCompleted}
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

          {/* Uploaded Photographs */}
          <Section title="Uploaded Photographs" icon={Image} defaultOpen={isCompleted}
            badge={s?.photos?.length > 0 ? `${s.photos.length} photos` : undefined}>
            {!isCompleted ? (
              <p className="text-sm text-gray-400 py-2">Photos will appear after customer submits the form.</p>
            ) : s?.photos?.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {s.photos.map((photo, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden border border-gray-100">
                    <img
                      src={photo.url}
                      alt={photo.type}
                      className="w-full h-36 object-cover"
                      onError={e => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150"><rect fill="%23f3f4f6" width="200" height="150"/><text fill="%239ca3af" x="50%" y="50%" text-anchor="middle" dy=".3em">No preview</text></svg>'; }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 capitalize">{photo.type}</div>
                    {photo.lat && (
                      <div className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <MapPin size={8} />{photo.lat.toFixed(3)}, {photo.lng.toFixed(3)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-2">No photos uploaded.</p>
            )}
          </Section>

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

      {/* ── Bottom Trigger Bar (matches "FI Trigger" in screenshot) ──────── */}
      <div className="fixed bottom-0 left-60 right-0 bg-white border-t border-gray-200 px-8 py-3 flex items-center justify-end gap-3 z-10">
        <span className="text-xs text-gray-500 mr-auto">
          Application ID : <span className="font-mono font-semibold text-gray-700">{data.app_id}</span>
        </span>
        {data.status !== 'completed' && (
          <button
            onClick={handleTrigger}
            disabled={triggering}
            className="flex items-center gap-2 px-5 py-2 bg-[#C8102E] text-white text-sm font-semibold rounded-lg hover:bg-[#A00D24] disabled:opacity-60 transition-colors shadow-sm"
          >
            <Send size={14} />
            {triggering ? 'Sending...' : data.status === 'link_sent' ? 'Re-trigger Self-PD' : 'Trigger Self-PD'}
          </button>
        )}
        {data.status === 'completed' && (
          <span className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg border border-emerald-200">
            <CheckCircle size={14} />
            PD Completed
          </span>
        )}
      </div>

      {/* Bottom spacer so content isn't hidden behind fixed bar */}
      <div className="h-16" />

      <PdLinkModal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        link={modal?.link}
        customerName={modal?.customerName}
        appId={modal?.appId}
        mobile={modal?.mobile}
        demoMode={appMode === 'demo'}
      />
    </OfficerLayout>
  );
}
