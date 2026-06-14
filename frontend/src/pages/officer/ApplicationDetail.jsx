import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Send, MapPin, CheckCircle, XCircle, Image, User,
  Building2, Home, Phone, FileText, AlertTriangle, Clock, RefreshCw
} from 'lucide-react';
import { applicationApi } from '../../api/client';
import OfficerLayout from '../../components/layout/OfficerLayout';
import {
  Card, Button, Badge, StatusBadge, Spinner, Alert,
  DetailRow, SectionHeader, Textarea
} from '../../components/common/UI';
import { formatDistanceToNow } from 'date-fns';
import PdLinkModal from '../../components/common/PdLinkModal';
import toast from 'react-hot-toast';

function GeoCard({ analysis }) {
  const riskColors = {
    low: 'border-emerald-200 bg-emerald-50',
    medium: 'border-amber-200 bg-amber-50',
    high: 'border-red-200 bg-red-50',
  };
  const riskText = { low: 'text-emerald-700', medium: 'text-amber-700', high: 'text-red-700' };

  return (
    <div className={`border rounded-xl p-4 ${riskColors[analysis.riskLevel]}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {analysis.photoType === 'residence' ? <Home size={16} className={riskText[analysis.riskLevel]} /> : <Building2 size={16} className={riskText[analysis.riskLevel]} />}
          <span className={`text-sm font-semibold capitalize ${riskText[analysis.riskLevel]}`}>
            {analysis.photoType} Photo
          </span>
        </div>
        <Badge variant={analysis.riskLevel === 'low' ? 'success' : analysis.riskLevel === 'medium' ? 'warning' : 'danger'}>
          {analysis.distanceKm} km away
        </Badge>
      </div>

      {analysis.photoUrl && (
        <img
          src={analysis.photoUrl}
          alt={`${analysis.photoType} photo`}
          className="w-full h-32 object-cover rounded-lg mb-3"
        />
      )}

      <div className="space-y-1.5 text-xs">
        <div className="flex items-start gap-2">
          <MapPin size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-gray-500">Photo captured at</p>
            <p className="font-medium text-gray-700">{analysis.photoCoords.lat.toFixed(5)}, {analysis.photoCoords.lng.toFixed(5)}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <MapPin size={12} className="text-[#C8102E] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-gray-500">Address on record</p>
            <p className="font-medium text-gray-700">{analysis.referenceAddress}</p>
          </div>
        </div>
        <div className={`mt-2 pt-2 border-t ${analysis.riskLevel === 'low' ? 'border-emerald-200' : analysis.riskLevel === 'medium' ? 'border-amber-200' : 'border-red-200'}`}>
          <span className={`font-semibold ${riskText[analysis.riskLevel]}`}>
            {analysis.distanceLabel} — {analysis.distanceKm} km from registered address
          </span>
        </div>
      </div>
    </div>
  );
}

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
      const appData = res.data.data;
      setData(appData);
      if (appData.submission?.pd_outcome) {
        setOutcome(appData.submission.pd_outcome);
        setRemarks(appData.submission.outcome_remarks || '');
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

  return (
    <OfficerLayout>
      <div className="animate-fadeIn max-w-5xl">
        {/* Back + header */}
        <div className="flex items-start gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mt-1">
            <ArrowLeft size={16} />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{data.customer_name}</h1>
              <StatusBadge status={data.status} />
              {submission?.pd_outcome && (
                <Badge variant={submission.pd_outcome}>{submission.pd_outcome === 'positive' ? '✓ Positive PD' : '✗ Negative PD'}</Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5 font-mono">{data.app_id} · {data.product} · ₹{(data.loan_amount / 100000).toFixed(1)}L</p>
          </div>
          <div className="flex gap-2">
            {data.status !== 'completed' && (
              <Button loading={triggering} onClick={handleTrigger} size="sm">
                <Send size={14} />
                {data.status === 'link_sent' ? 'Re-trigger Link' : 'Send PD Link'}
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={fetchData}>
              <RefreshCw size={14} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left column */}
          <div className="col-span-1 space-y-4">
            {/* Applicant Details */}
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                <User size={15} className="text-[#C8102E]" /> Applicant Details
              </h3>
              <DetailRow label="App ID" value={<span className="font-mono text-xs">{data.app_id}</span>} />
              <DetailRow label="Customer" value={data.customer_name} />
              <DetailRow label="Mobile" value={
                <span className="font-mono">{data.mobile_no.replace(/(\d{2})\d{6}(\d{2})/, '$1xxxxxx$2')}</span>
              } />
              <DetailRow label="Product" value={data.product} />
              <DetailRow label="Loan Amount" value={`₹${data.loan_amount?.toLocaleString('en-IN')}`} />
              <DetailRow label="Branch" value={data.branch} />
              <DetailRow label="Location" value={data.location} />
              <DetailRow label="Employment" value={
                <span className="capitalize">{data.employment_type?.replace('_', ' ')}</span>
              } />
            </Card>

            {/* Addresses */}
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                <MapPin size={15} className="text-[#C8102E]" /> Addresses
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Residence</p>
                  <p className="text-xs text-gray-700 leading-relaxed">{data.residence_address || '—'}</p>
                </div>
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">
                    {data.employment_type === 'self_employed' ? 'Business' : 'Office'}
                  </p>
                  <p className="text-xs text-gray-700 leading-relaxed">{data.office_address || '—'}</p>
                </div>
              </div>
            </Card>

            {/* Link History */}
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                <Clock size={15} className="text-[#C8102E]" /> Link History
              </h3>
              {links.length === 0 ? (
                <p className="text-xs text-gray-400">No links sent yet</p>
              ) : (
                <div className="space-y-2">
                  {links.slice(0, 5).map((link, i) => (
                    <div key={link.id} className="flex items-start justify-between text-xs">
                      <div>
                        <p className="font-medium text-gray-700">
                          {i === 0 && link.is_used === 0 ? '🟢 Active' : link.is_used === 1 ? '✓ Used' : '⟲ Superseded'}
                        </p>
                        <p className="text-gray-400">{formatDistanceToNow(new Date(link.triggered_at), { addSuffix: true })}</p>
                      </div>
                      <span className="text-gray-400">by {link.triggered_by_name?.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right column */}
          <div className="col-span-2 space-y-4">
            {data.status !== 'completed' && data.status !== 'link_sent' && (
              <Alert type="info">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">PD not yet initiated</p>
                    <p className="text-sm mt-0.5">Send the self-PD link to the customer's registered mobile number to begin the personal discussion process.</p>
                  </div>
                </div>
              </Alert>
            )}

            {data.status === 'link_sent' && !submission && (
              <Alert type="warning">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="flex-shrink-0" />
                  <p>Self-PD link has been sent. Waiting for customer to complete the form.</p>
                </div>
              </Alert>
            )}

            {submission && (
              <>
                {/* PD Responses */}
                <Card className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
                    <FileText size={15} className="text-[#C8102E]" /> Customer Responses
                    <span className="text-xs text-gray-400 font-normal ml-auto">
                      Submitted {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
                    </span>
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Residence */}
                    <div className="border border-gray-100 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <Home size={12} /> Residence Details
                      </p>
                      <DetailRow label="Type" value={submission.residence_type} />
                      <DetailRow label="Years at address" value={submission.years_at_residence} />
                      <DetailRow label="Ownership" value={submission.residence_ownership} />
                      <DetailRow label="Locality" value={submission.locality_type} />
                    </div>

                    {/* Employment/Business */}
                    <div className="border border-gray-100 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <Building2 size={12} />
                        {data.employment_type === 'salaried' ? 'Employment Details' : 'Business Details'}
                      </p>
                      {data.employment_type === 'salaried' ? (
                        <>
                          <DetailRow label="Employer" value={submission.employer_name} />
                          <DetailRow label="Designation" value={submission.designation} />
                          <DetailRow label="Years employed" value={submission.years_employed} />
                          <DetailRow label="Monthly income" value={submission.monthly_income ? `₹${parseInt(submission.monthly_income).toLocaleString('en-IN')}` : null} />
                        </>
                      ) : (
                        <>
                          <DetailRow label="Business name" value={submission.business_name} />
                          <DetailRow label="Business type" value={submission.business_type} />
                          <DetailRow label="Years in business" value={submission.years_in_business} />
                          <DetailRow label="Monthly turnover" value={submission.monthly_turnover ? `₹${parseInt(submission.monthly_turnover).toLocaleString('en-IN')}` : null} />
                        </>
                      )}
                    </div>

                    {/* Personal */}
                    <div className="border border-gray-100 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Personal Details</p>
                      <DetailRow label="Family members" value={submission.family_members} />
                      <DetailRow label="Dependents" value={submission.dependents} />
                      <DetailRow label="Existing loans" value={submission.existing_loans} />
                      <DetailRow label="Loan purpose" value={submission.loan_purpose} />
                    </div>

                    {/* General */}
                    <div className="border border-gray-100 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">General Assessment</p>
                      <DetailRow label="Interaction quality" value={submission.interaction_quality} />
                      <DetailRow label="Co-operative" value={submission.customer_cooperative ? 'Yes' : 'No'} />
                      {submission.additional_notes && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-400 mb-1">Additional Notes</p>
                          <p className="text-xs text-gray-700 leading-relaxed">{submission.additional_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Geo Analysis */}
                {geoAnalysis && geoAnalysis.length > 0 && (
                  <Card className="p-4">
                    <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
                      <MapPin size={15} className="text-[#C8102E]" /> Geo-tag Verification
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {geoAnalysis.map((analysis, i) => (
                        <GeoCard key={i} analysis={analysis} />
                      ))}
                    </div>
                  </Card>
                )}

                {/* Photos */}
                {submission.photos && submission.photos.length > 0 && (
                  <Card className="p-4">
                    <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                      <Image size={15} className="text-[#C8102E]" /> Uploaded Photographs
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {submission.photos.map((photo, i) => (
                        <div key={i} className="relative group rounded-xl overflow-hidden border border-gray-100">
                          <img src={photo.url} alt={photo.type} className="w-full h-36 object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute bottom-0 left-0 right-0 p-2 text-white text-xs translate-y-full group-hover:translate-y-0 transition-transform">
                            <p className="font-medium capitalize">{photo.type}</p>
                            {photo.lat && <p className="opacity-75">{photo.lat.toFixed(4)}, {photo.lng.toFixed(4)}</p>}
                          </div>
                          <div className="absolute top-2 left-2">
                            <Badge variant="default" size="xs">
                              <span className="capitalize">{photo.type}</span>
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* PD Outcome */}
                <Card className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
                    {outcome === 'positive' ? <CheckCircle size={15} className="text-emerald-600" /> : outcome === 'negative' ? <XCircle size={15} className="text-red-500" /> : <FileText size={15} className="text-[#C8102E]" />}
                    PD Outcome
                  </h3>

                  <div className="grid grid-cols-2 gap-3 mb-4">
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

                  <Textarea
                    label="Remarks"
                    placeholder="Enter your observations and remarks about this PD..."
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    rows={3}
                  />

                  <div className="flex items-center justify-between mt-4">
                    {submission.reviewed_at && (
                      <p className="text-xs text-gray-400">
                        Last reviewed {formatDistanceToNow(new Date(submission.reviewed_at), { addSuffix: true })} by {submission.reviewer_name || 'officer'}
                      </p>
                    )}
                    <Button loading={savingOutcome} onClick={handleSaveOutcome} size="sm" className="ml-auto">
                      Save Outcome
                    </Button>
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>

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
