import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Settings2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import AbclLogo from '../../components/common/AbclLogo';
import { Button, Alert } from '../../components/common/UI';

export default function AdminLogin() {
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
      navigate('/admin/demo-config');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <AbclLogo height={44} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Settings2 size={18} className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Demo Admin</h2>
              <p className="text-xs text-gray-500">Configuration panel access</p>
            </div>
          </div>

          {error && <Alert type="error" className="mb-4">{error}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Employee ID</label>
              <input
                type="text"
                placeholder="e.g. ABCL001"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required
                autoComplete="username"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                  focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent
                  hover:border-gray-300 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  autoComplete="current-password"
                  className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm
                    focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent
                    hover:border-gray-300 transition-colors"
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium
                rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {isLoading ? 'Signing in...' : 'Sign In to Admin'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Demo configuration panel · Authorised personnel only
        </p>
      </div>
    </div>
  );
}
