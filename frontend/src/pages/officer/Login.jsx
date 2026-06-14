import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import AbclLogo from '../../components/common/AbclLogo';
import { Button, Input, Alert } from '../../components/common/UI';

export default function OfficerLogin() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(form.email, form.password);
    if (result.success) {
      navigate('/officer/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-[480px] flex-col bg-[#C8102E] text-white p-10 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white" style={{
              width: `${(i + 2) * 120}px`, height: `${(i + 2) * 120}px`,
              right: `-${(i + 1) * 40}px`, bottom: `-${(i + 1) * 40}px`,
            }} />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-between">
          <AbclLogo height={44} white />

          <div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-6">
              <Shield size={24} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-3 leading-tight">
              Self-PD<br />Management Portal
            </h1>
            <p className="text-red-100 text-base leading-relaxed">
              Credit officer dashboard for triggering and reviewing customer Self Personal Discussion forms.
            </p>

            <div className="mt-10 space-y-4">
              {['Trigger self-PD links via SMS', 'Real-time geo-tag verification', 'Instant PD outcome recording'].map(f => (
                <div key={f} className="flex items-center gap-3 text-sm text-red-100">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  {f}
                </div>
              ))}
            </div>
          </div>

          <p className="text-red-200 text-xs">
            © 2025 Aditya Birla Capital Ltd. All rights reserved.<br />
            RBI Registered NBFC | ISO 27001 Certified
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <AbclLogo height={40} />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Officer Sign In</h2>
            <p className="text-sm text-gray-500 mb-6">Enter your ABCL credentials to continue</p>

            {error && <Alert type="error" className="mb-4">{error}</Alert>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Corporate Email"
                type="email"
                placeholder="name@adityabirlacapital.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                autoComplete="email"
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-7 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <Button type="submit" loading={isLoading} className="w-full" size="lg">
                Sign In
              </Button>
            </form>

            <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
              <p className="text-xs text-amber-700 font-medium">Demo Credentials</p>
              <p className="text-xs text-amber-600 mt-1">rajesh.kumar@adityabirlacapital.com / Demo@1234</p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Authorised personnel only. Unauthorised access is prohibited.
          </p>
        </div>
      </div>
    </div>
  );
}
