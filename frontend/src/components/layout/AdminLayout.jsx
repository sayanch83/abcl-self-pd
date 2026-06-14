import { useNavigate } from 'react-router-dom';
import { Settings2, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import AbclLogo from '../common/AbclLogo';

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const { officer, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <AbclLogo height={34} />
            <div className="h-5 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <Settings2 size={15} className="text-amber-600" />
              <span className="text-sm font-semibold text-gray-700">Demo Config</span>
              <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full">Admin</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-700">{officer?.name}</p>
              <p className="text-xs text-gray-400">{officer?.employeeId} · {officer?.branch}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500
                hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-200"
            >
              <LogOut size={13} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
