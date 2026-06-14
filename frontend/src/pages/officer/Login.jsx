import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, Lock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import AbclLogo from '../../components/common/AbclLogo';
import { Button, Alert } from '../../components/common/UI';

export default function OfficerLogin() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(form.username, form.password);
    if (result.success) {
      navigate('/officer/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-[460px] flex-col bg-[#C8102E] text-white p-10 relative overflow-hidden flex-shrink-0">
        {/* Decorative circles */}
        <div className="absolute inset-0 pointer-events-none">
          {[200, 320, 440, 560].map((size, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white/10"
              style={{ width: size, height: size, right: -(size / 2.5), bottom: -(size / 2.5) }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col h-full">
          {/* Logo on red bg */}
          <AbclLogo height={44} />

          <div className="flex-1 flex flex-col justify-center">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mb-6">
              <ShieldCheck size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold leading-snug mb-4">
              Self-PD<br />Management Portal
            </h1>
            <p className="text-red-100 text-sm leading-relaxed max-w-xs">
              Secure portal for credit officers to initiate and review customer Self Personal Discussion workflows.
            </p>

            <div className="mt-10 space-y-3">
              {[
                'Trigger self-PD links via SMS',
                'Real-time geo-tag address verification',
                'Instant PD outcome recording',
              ].map(f => (
                <div key={f} className="flex items-center gap-3 text-sm text-red-100">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  {f}
                </div>
              ))}
            </div>
          </div>

          <p className="text-red-200/70 text-xs relative z-10">
            © 2025 Aditya Birla Capital Ltd. · RBI Registered NBFC · ISO 27001 Certified
          </p>
        </div>
      </div>

      {/* ── Right login panel ── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <AbclLogo height={40} />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8">
            <div className="mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#F5E6E9] flex items-center justify-center mb-4">
                <Lock size={18} className="text-[#C8102E]" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Officer Sign In</h2>
              <p className="text-sm text-gray-500 mt-1">Enter your ABCL credentials to continue</p>
            </div>

            {error && <Alert type="error" className="mb-4">{error}</Alert>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Employee ID field */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Employee ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. ABCL001"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  required
                  autoComplete="username"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800
                    focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent
                    hover:border-gray-300 transition-colors"
                />
              </div>

              {/* Password field */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                    autoComplete="current-password"
                    className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm text-gray-800
                      focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent
                      hover:border-gray-300 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button type="submit" loading={isLoading} className="w-full mt-2" size="lg">
                Sign In
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Authorised ABCL personnel only. Unauthorised access is prohibited and monitored.
          </p>
        </div>
      </div>
    </div>
  );
}
