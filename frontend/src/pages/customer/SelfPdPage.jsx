import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  ShieldCheck, Phone, CheckCircle, ChevronRight, ChevronLeft,
  Upload, MapPin, AlertCircle, Loader2, Home, Building2, Users, X, Camera
} from 'lucide-react';
import { pdApi } from '../../api/client';
import AbclLogo from '../../components/common/AbclLogo';
import { Button, Input, Select, Textarea, Alert } from '../../components/common/UI';
import toast from 'react-hot-toast';

// ── Helpers ──────────────────────────────────────────────────────────────────
function StepIndicator({ steps, current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs font-bold transition-all ${
            i < current ? 'bg-[#C8102E] border-[#C8102E] text-white' :
            i === current ? 'border-[#C8102E] text-[#C8102E] bg-white' :
            'border-gray-200 text-gray-400 bg-white'
          }`}>
            {i < current ? <CheckCircle size={14} /> : i + 1}
          </div>
          {i < steps.length - 1 && (
            <div className={`w-12 h-0.5 ${i < current ? 'bg-[#C8102E]' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function PhotoUploader({ label, type, sessionToken, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef();

  const getGeoLocation = () => new Promise((resolve) => {
    if (!navigator.geolocation) { resolve({ lat: null, lng: null }); return; }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({ lat: null, lng: null }),
      { timeout: 10000, enableHighAccuracy: true }
    );
  });

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    setUploading(true);

    try {
      const { lat, lng } = await getGeoLocation();

      const formData = new FormData();
      formData.append('photo', file);
      formData.append('photoType', type);
      if (lat) formData.append('lat', lat);
      if (lng) formData.append('lng', lng);

      const res = await pdApi.uploadPhoto(sessionToken, formData);
      const photoData = res.data.data;
      const previewUrl = URL.createObjectURL(file);

      // Store preview on the photoData object so parent state keeps it across steps
      const photoWithPreview = { ...photoData, preview: previewUrl };
      setPhoto(photoWithPreview);
      onUploaded(photoWithPreview);

      if (!lat) toast('Location not captured. Please allow location access for geo-tagging.', { icon: '⚠️' });
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-[#C8102E] transition-colors">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => handleFile(e.target.files[0])}
      />

      {photo ? (
        <div className="relative">
          <img src={photo.preview || photo.url} alt={label} className="w-full h-40 object-cover rounded-lg" />
          <div className="absolute top-2 right-2">
            <button
              onClick={() => { setPhoto(null); onUploaded(null); }}
              className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
            >
              <X size={12} />
            </button>
          </div>
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
            {photo.lat ? (
              <><MapPin size={10} />{photo.lat.toFixed(4)}, {photo.lng.toFixed(4)}</>
            ) : (
              <><AlertCircle size={10} /> Location not captured</>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full flex flex-col items-center justify-center gap-2 py-6 text-gray-400 hover:text-[#C8102E] transition-colors"
        >
          {uploading ? (
            <><Loader2 size={24} className="animate-spin text-[#C8102E]" /><span className="text-xs">Uploading...</span></>
          ) : (
            <><Camera size={24} /><span className="text-sm font-medium text-gray-600">{label}</span><span className="text-xs">Tap to take photo or choose from gallery</span></>
          )}
        </button>
      )}
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const STEPS = ['Verify', 'Residence', 'Employment', 'Personal', 'Photos', 'Review'];

export default function CustomerPdPage() {
  const { token } = useParams();
  const [step, setStep] = useState(0); // 0 = OTP, 1-5 = form steps, 6 = done
  const [linkInfo, setLinkInfo] = useState(null);
  const [linkError, setLinkError] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [appInfo, setAppInfo] = useState(null);
  const [demoMode, setDemoMode] = useState(false);

  // OTP state
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Form state
  const [form, setForm] = useState({
    residenceType: '', yearsAtResidence: '', residenceOwnership: '', localityType: '',
    employerName: '', designation: '', yearsEmployed: '', monthlyIncome: '',
    businessName: '', businessType: '', yearsInBusiness: '', monthlyTurnover: '',
    familyMembers: '', dependents: '', existingLoans: '', loanPurpose: '',
    interactionQuality: 'good', customerCooperative: true, additionalNotes: '',
  });
  const [photos, setPhotos] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLinkInfo();
    pdApi.getMode().then(res => setDemoMode(res.data.mode === 'demo')).catch(() => {});
  }, [token]);

  const fetchLinkInfo = async () => {
    try {
      const res = await pdApi.getLinkInfo(token);
      setLinkInfo(res.data.data);
    } catch (err) {
      setLinkError(err.response?.data?.error || 'This link is invalid or has expired.');
    }
  };

  const handleSendOtp = async () => {
    if (!mobile || mobile.length !== 10) { setOtpError('Enter a valid 10-digit mobile number'); return; }
    setSendingOtp(true);
    setOtpError('');
    try {
      const res = await pdApi.requestOtp(token, { mobile });
      setOtpSent(true);
      toast.success(res.data.message);
    } catch (err) {
      setOtpError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleOtpChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handleOtpKey = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpStr = otp.join('');
    if (otpStr.length !== 6) { setOtpError('Enter the complete 6-digit OTP'); return; }
    setVerifyingOtp(true);
    setOtpError('');
    try {
      const res = await pdApi.validateOtp(token, { mobile, otp: otpStr });
      setSessionToken(res.data.data.sessionToken);
      setAppInfo(res.data.data.applicationInfo);
      setStep(1);
    } catch (err) {
      setOtpError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Strip client-only 'preview' blob URLs before sending to backend
      const cleanPhotos = Object.values(photos)
        .filter(Boolean)
        .map(({ preview, ...rest }) => rest);

      await pdApi.submit(sessionToken, {
        ...form,
        photos: cleanPhotos,
      });
      setStep(6);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render states ───────────────────────────────────────────────────────────

  const wrapper = (children) => (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ABCL Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <AbclLogo height={32} />
          {step > 0 && step < 6 && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              Step {step} of {STEPS.length - 1}
            </span>
          )}
        </div>
      </header>
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {children}
      </div>
      <footer className="text-center text-xs text-gray-400 py-4">
        © 2025 Aditya Birla Capital Ltd. · Secure Self-PD Portal
      </footer>
    </div>
  );

  // Link error
  if (linkError) return wrapper(
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertCircle size={32} className="text-red-400" />
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">Link Unavailable</h2>
      <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{linkError}</p>
      <p className="text-xs text-gray-400 mt-4">Please contact your loan officer for assistance.</p>
    </div>
  );

  // Loading
  if (!linkInfo) return wrapper(
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Loader2 size={32} className="animate-spin text-[#C8102E] mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading your form...</p>
      </div>
    </div>
  );

  // Submitted
  if (step === 6) return wrapper(
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fadeIn">
      <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
        <CheckCircle size={40} className="text-emerald-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Form Submitted!</h2>
      <p className="text-gray-500 leading-relaxed max-w-sm">
        Your Personal Discussion form has been submitted successfully. Your loan officer will review your responses.
      </p>
      <div className="mt-6 bg-gray-50 border border-gray-100 rounded-xl p-4 text-left w-full max-w-sm">
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Application Reference</p>
        <p className="font-mono font-semibold text-[#C8102E]">{appInfo?.appId || linkInfo?.applicationId}</p>
        <p className="text-sm text-gray-600 mt-1">{appInfo?.customerName}</p>
      </div>
      <p className="text-xs text-gray-400 mt-6">You may close this window. This link is no longer valid.</p>
    </div>
  );

  // OTP Step
  if (step === 0) return wrapper(
    <div className="animate-fadeIn">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-[#F5E6E9] flex items-center justify-center mx-auto mb-4">
          <ShieldCheck size={28} className="text-[#C8102E]" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Verify Your Identity</h1>
        <p className="text-sm text-gray-500 mt-2">
          Self Personal Discussion for <span className="font-semibold text-gray-700">{linkInfo.applicationId}</span>
        </p>
      </div>

      {/* Application summary card */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 mb-6">
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">Application Details</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-xs text-gray-400">Customer</p><p className="font-medium">{linkInfo.customerName}</p></div>
          <div><p className="text-xs text-gray-400">Product</p><p className="font-medium">{linkInfo.product}</p></div>
          <div><p className="text-xs text-gray-400">Amount</p><p className="font-medium">₹{(linkInfo.loanAmount / 100000).toFixed(1)}L</p></div>
          <div><p className="text-xs text-gray-400">Registered Mobile</p><p className="font-medium font-mono">{linkInfo.maskedMobile}</p></div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-5">
        {!otpSent ? (
          <div className="space-y-4">
            <Input
              label="Your Mobile Number"
              type="tel"
              placeholder="Enter 10-digit number"
              maxLength={10}
              value={mobile}
              onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
              hint="Must match the mobile number registered with your loan application"
            />
            {otpError && <Alert type="error">{otpError}</Alert>}
            <Button className="w-full" size="lg" loading={sendingOtp} onClick={handleSendOtp}>
              <Phone size={16} />
              Send OTP
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-3">
                Enter 6-digit OTP sent to {mobile.replace(/(\d{2})\d{6}(\d{2})/, '$1xxxxxx$2')}
              </p>
              <div className="flex gap-2 justify-center">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKey(i, e)}
                    className="w-10 h-12 border-2 rounded-lg text-center text-lg font-bold text-gray-900
                      focus:outline-none focus:border-[#C8102E] transition-colors
                      border-gray-200"
                  />
                ))}
              </div>
            </div>

            {otpError && <Alert type="error">{otpError}</Alert>}

            {demoMode && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-amber-700 font-medium">
                  Demo mode — enter <span className="font-mono font-bold tracking-widest">1 2 3 4 5 6</span>
                </p>
              </div>
            )}

            <Button className="w-full" size="lg" loading={verifyingOtp} onClick={handleVerifyOtp}>
              <ShieldCheck size={16} />
              Verify & Continue
            </Button>

            <button onClick={() => { setOtpSent(false); setOtp(['','','','','','']); setOtpError(''); }}
              className="w-full text-sm text-gray-500 hover:text-[#C8102E] transition-colors">
              ← Change mobile number
            </button>
            <button onClick={handleSendOtp} disabled={sendingOtp}
              className="w-full text-sm text-[#C8102E] hover:underline disabled:opacity-50">
              Resend OTP
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const isSalaried = appInfo?.employmentType === 'salaried';

  // Step 1 — Residence
  const renderStep1 = () => (
    <div className="animate-fadeIn space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#F5E6E9] flex items-center justify-center"><Home size={18} className="text-[#C8102E]" /></div>
        <div><h2 className="font-bold text-gray-900">Residence Details</h2><p className="text-xs text-gray-400">Tell us about your current home</p></div>
      </div>
      <div className="bg-white border border-gray-100 rounded-xl p-4 mb-3">
        <p className="text-xs text-gray-400 mb-1">Address on Record</p>
        <p className="text-sm text-gray-700 font-medium">{appInfo?.residenceAddress}</p>
      </div>
      <Select label="Type of Residence" value={form.residenceType} onChange={e => setField('residenceType', e.target.value)}>
        <option value="">Select...</option>
        <option value="apartment">Apartment / Flat</option>
        <option value="independent_house">Independent House / Villa</option>
        <option value="row_house">Row House / Townhouse</option>
        <option value="pg">PG / Paying Guest</option>
        <option value="company_accommodation">Company Accommodation</option>
      </Select>
      <Select label="Ownership Status" value={form.residenceOwnership} onChange={e => setField('residenceOwnership', e.target.value)}>
        <option value="">Select...</option>
        <option value="self_owned">Self Owned</option>
        <option value="rented">Rented</option>
        <option value="family_owned">Family Owned</option>
        <option value="company_provided">Company Provided</option>
      </Select>
      <Select label="Years at Current Address" value={form.yearsAtResidence} onChange={e => setField('yearsAtResidence', e.target.value)}>
        <option value="">Select...</option>
        <option value="less_than_1">Less than 1 year</option>
        <option value="1_2">1–2 years</option>
        <option value="3_5">3–5 years</option>
        <option value="5_10">5–10 years</option>
        <option value="more_than_10">More than 10 years</option>
      </Select>
      <Select label="Locality Type" value={form.localityType} onChange={e => setField('localityType', e.target.value)}>
        <option value="">Select...</option>
        <option value="urban">Urban / City</option>
        <option value="semi_urban">Semi-Urban</option>
        <option value="rural">Rural</option>
        <option value="gated_community">Gated Community / Society</option>
      </Select>
    </div>
  );

  // Step 2 — Employment / Business
  const renderStep2 = () => (
    <div className="animate-fadeIn space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#F5E6E9] flex items-center justify-center"><Building2 size={18} className="text-[#C8102E]" /></div>
        <div>
          <h2 className="font-bold text-gray-900">{isSalaried ? 'Employment Details' : 'Business Details'}</h2>
          <p className="text-xs text-gray-400">{isSalaried ? 'About your job' : 'About your business'}</p>
        </div>
      </div>
      <div className="bg-white border border-gray-100 rounded-xl p-4 mb-3">
        <p className="text-xs text-gray-400 mb-1">{isSalaried ? 'Office' : 'Business'} Address on Record</p>
        <p className="text-sm text-gray-700 font-medium">{appInfo?.officeAddress}</p>
      </div>
      {isSalaried ? (
        <>
          <Input label="Employer / Company Name" placeholder="e.g. Infosys Limited" value={form.employerName} onChange={e => setField('employerName', e.target.value)} />
          <Input label="Designation / Role" placeholder="e.g. Senior Software Engineer" value={form.designation} onChange={e => setField('designation', e.target.value)} />
          <Select label="Years in Current Employment" value={form.yearsEmployed} onChange={e => setField('yearsEmployed', e.target.value)}>
            <option value="">Select...</option>
            <option value="less_than_1">Less than 1 year</option>
            <option value="1_2">1–2 years</option>
            <option value="3_5">3–5 years</option>
            <option value="5_10">5–10 years</option>
            <option value="more_than_10">More than 10 years</option>
          </Select>
          <Input label="Monthly Net Income (₹)" type="number" placeholder="e.g. 75000" value={form.monthlyIncome} onChange={e => setField('monthlyIncome', e.target.value)} />
        </>
      ) : (
        <>
          <Input label="Business / Firm Name" placeholder="e.g. Agarwal Medical Store" value={form.businessName} onChange={e => setField('businessName', e.target.value)} />
          <Select label="Nature of Business" value={form.businessType} onChange={e => setField('businessType', e.target.value)}>
            <option value="">Select...</option>
            <option value="retail_trading">Retail / Trading</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="services">Services</option>
            <option value="professional">Professional (Doctor, CA, etc.)</option>
            <option value="agriculture">Agriculture / Farming</option>
            <option value="construction">Construction / Real Estate</option>
          </Select>
          <Select label="Years in Business" value={form.yearsInBusiness} onChange={e => setField('yearsInBusiness', e.target.value)}>
            <option value="">Select...</option>
            <option value="less_than_1">Less than 1 year</option>
            <option value="1_3">1–3 years</option>
            <option value="3_5">3–5 years</option>
            <option value="5_10">5–10 years</option>
            <option value="more_than_10">More than 10 years</option>
          </Select>
          <Input label="Approximate Monthly Turnover (₹)" type="number" placeholder="e.g. 500000" value={form.monthlyTurnover} onChange={e => setField('monthlyTurnover', e.target.value)} />
        </>
      )}
    </div>
  );

  // Step 3 — Personal
  const renderStep3 = () => (
    <div className="animate-fadeIn space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#F5E6E9] flex items-center justify-center"><Users size={18} className="text-[#C8102E]" /></div>
        <div><h2 className="font-bold text-gray-900">Personal Details</h2><p className="text-xs text-gray-400">Family & financial information</p></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Total Family Members" type="number" min={1} max={20} placeholder="e.g. 4" value={form.familyMembers} onChange={e => setField('familyMembers', e.target.value)} />
        <Input label="Number of Dependents" type="number" min={0} max={20} placeholder="e.g. 2" value={form.dependents} onChange={e => setField('dependents', e.target.value)} />
      </div>
      <Select label="Existing Loan Obligations" value={form.existingLoans} onChange={e => setField('existingLoans', e.target.value)}>
        <option value="">Select...</option>
        <option value="none">None</option>
        <option value="home_loan">Home Loan</option>
        <option value="vehicle_loan">Vehicle / Auto Loan</option>
        <option value="personal_loan">Personal Loan</option>
        <option value="business_loan">Business Loan</option>
        <option value="multiple">Multiple Loans</option>
      </Select>
      <Textarea
        label="Purpose of This Loan"
        placeholder="Briefly describe how you plan to use this loan..."
        value={form.loanPurpose}
        onChange={e => setField('loanPurpose', e.target.value)}
        rows={3}
      />
      <Textarea
        label="Additional Remarks (Optional)"
        placeholder="Any other information you'd like to share with us..."
        value={form.additionalNotes}
        onChange={e => setField('additionalNotes', e.target.value)}
        rows={2}
      />
    </div>
  );

  // Step 4 — Photos
  const renderStep4 = () => (
    <div className="animate-fadeIn space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-[#F5E6E9] flex items-center justify-center"><Camera size={18} className="text-[#C8102E]" /></div>
        <div><h2 className="font-bold text-gray-900">Photographs</h2><p className="text-xs text-gray-400">Please take photos at your actual location</p></div>
      </div>

      <Alert type="info" className="text-xs">
        📍 Allow location access when prompted — photos will be geo-tagged automatically to verify address.
      </Alert>

      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5"><Home size={14} className="text-[#C8102E]" /> Residence Photo</p>
          <p className="text-xs text-gray-400 mb-2">Take a photo from inside or outside your home</p>
          <PhotoUploader
            label="Take Residence Photo"
            type="residence"
            sessionToken={sessionToken}
            onUploaded={photo => setPhotos(p => ({ ...p, residence: photo }))}
          />
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
            <Building2 size={14} className="text-[#C8102E]" />
            {isSalaried ? 'Office' : 'Business'} Photo
          </p>
          <p className="text-xs text-gray-400 mb-2">Take a photo at your {isSalaried ? 'workplace' : 'business premises'}</p>
          <PhotoUploader
            label={`Take ${isSalaried ? 'Office' : 'Business'} Photo`}
            type={isSalaried ? 'office' : 'business'}
            sessionToken={sessionToken}
            onUploaded={photo => setPhotos(p => ({ ...p, office: photo }))}
          />
        </div>
      </div>
    </div>
  );

  // Step 5 — Review
  const renderStep5 = () => {
    const sections = [
      { title: 'Residence', items: [
        ['Type', form.residenceType?.replace('_', ' ')],
        ['Ownership', form.residenceOwnership?.replace('_', ' ')],
        ['Years at address', form.yearsAtResidence],
        ['Locality', form.localityType?.replace('_', ' ')],
      ]},
      { title: isSalaried ? 'Employment' : 'Business', items: isSalaried ? [
        ['Employer', form.employerName],
        ['Designation', form.designation],
        ['Years employed', form.yearsEmployed],
        ['Monthly income', form.monthlyIncome ? `₹${parseInt(form.monthlyIncome).toLocaleString('en-IN')}` : ''],
      ] : [
        ['Business name', form.businessName],
        ['Type', form.businessType?.replace('_', ' ')],
        ['Years in business', form.yearsInBusiness],
        ['Monthly turnover', form.monthlyTurnover ? `₹${parseInt(form.monthlyTurnover).toLocaleString('en-IN')}` : ''],
      ]},
      { title: 'Personal', items: [
        ['Family members', form.familyMembers],
        ['Dependents', form.dependents],
        ['Existing loans', form.existingLoans],
        ['Loan purpose', form.loanPurpose],
      ]},
    ];

    return (
      <div className="animate-fadeIn space-y-4">
        <div className="mb-6">
          <h2 className="font-bold text-gray-900">Review & Submit</h2>
          <p className="text-xs text-gray-400">Please review your information before submitting</p>
        </div>

        {sections.map(section => (
          <div key={section.title} className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-[#C8102E] uppercase tracking-wide mb-3">{section.title}</p>
            <div className="divide-y divide-gray-50">
              {section.items.map(([label, val]) => (
                <div key={label} className="flex justify-between py-2 text-sm">
                  <span className="text-gray-400">{label}</span>
                  <span className="font-medium text-gray-700 capitalize">{val || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-[#C8102E] uppercase tracking-wide mb-3">Photos</p>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(photos).map(([type, photo]) => photo && (
              <div key={type} className="relative">
                <img src={photo.preview || photo.url} alt={type} className="w-full h-28 object-cover rounded-lg" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1.5 rounded-b-lg capitalize">{type}</div>
              </div>
            ))}
          </div>
          {Object.values(photos).filter(Boolean).length === 0 && (
            <p className="text-xs text-amber-600">⚠ No photos uploaded. Photos help verify your address.</p>
          )}
        </div>

        <Alert type="warning" className="text-xs">
          By submitting, you confirm that all information provided is accurate and true. False information may result in loan rejection.
        </Alert>
      </div>
    );
  };

  const stepContent = [null, renderStep1, renderStep2, renderStep3, renderStep4, renderStep5];

  return wrapper(
    <div>
      <StepIndicator steps={STEPS.slice(1)} current={step - 1} />

      {stepContent[step]?.()}

      <div className="flex gap-3 mt-8">
        {step > 1 && (
          <Button variant="secondary" className="flex-1" onClick={() => setStep(s => s - 1)}>
            <ChevronLeft size={16} />
            Back
          </Button>
        )}
        {step < 5 ? (
          <Button className="flex-1" onClick={() => setStep(s => s + 1)}>
            Continue
            <ChevronRight size={16} />
          </Button>
        ) : (
          <Button className="flex-1" loading={submitting} onClick={handleSubmit}>
            <CheckCircle size={16} />
            Submit PD Form
          </Button>
        )}
      </div>
    </div>
  );
}
