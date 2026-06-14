import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings2, LogOut, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import AbclLogo from '../common/AbclLogo';

const navItems = [
  { to: '/officer/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/officer/applications', icon: FileText,         label: 'Applications' },
  { to: '/officer/demo-config',  icon: Settings2,        label: 'Demo Config', badge: 'Admin' },
];

export default function OfficerLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { officer, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/officer/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-gray-100">
          <AbclLogo height={38} />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, badge }) => {
            const active = location.pathname === to || location.pathname.startsWith(to + '/');
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${active
                    ? 'bg-[#F5E6E9] text-[#C8102E]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <Icon size={17} />
                <span className="flex-1">{label}</span>
                {badge && !active && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">{badge}</span>
                )}
                {active && <ChevronRight size={14} />}
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="px-3 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#C8102E] flex items-center justify-center text-white text-xs font-semibold">
              {officer?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{officer?.name}</p>
              <p className="text-xs text-gray-500 truncate">{officer?.branch}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="font-medium text-gray-800">Self-PD Portal</span>
            <ChevronRight size={14} />
            <span>{navItems.find(n => location.pathname.startsWith(n.to))?.label || 'Page'}</span>          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
            <span>Online</span>
            <span className="ml-2 text-gray-400">|</span>
            <span className="font-medium text-gray-600">{officer?.employeeId}</span>
          </div>
        </div>

        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
