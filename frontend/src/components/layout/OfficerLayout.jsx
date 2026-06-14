import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Wifi, UserCircle, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import AbclLogo from '../common/AbclLogo';

const navItems = [
  { to: '/officer/dashboard',    label: 'Dashboard', icon: LayoutDashboard },
  { to: '/officer/applications', label: 'Applications', icon: FileText },
];

export default function OfficerLayout({ children, appId }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { officer, logout } = useAuthStore();

  const handleLogout = () => { logout(); navigate('/officer/login'); };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* ── Red top navigation bar — matches existing screen exactly ── */}
      <header className="bg-[#C8102E] text-white flex-shrink-0 sticky top-0 z-50 shadow-md">
        <div className="flex items-center h-12 px-4 gap-6">

          {/* Logo area */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <AbclLogo height={36} />
          </div>

          {/* Vertical divider */}
          <div className="h-6 w-px bg-white/30" />

          {/* Nav links */}
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || location.pathname.startsWith(to + '/');
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded transition-all whitespace-nowrap
                  ${active ? 'bg-white/20 text-white' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
              >
                <Icon size={13} />
                {label}
              </Link>
            );
          })}

          {/* Application ID — shown when on a detail page */}
          {appId && (
            <>
              <div className="h-6 w-px bg-white/30" />
              <span className="text-xs text-white/90 font-medium whitespace-nowrap">
                Application ID : <span className="font-bold">{appId}</span>
              </span>
            </>
          )}

          {/* Right side */}
          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-white/80">
              <Wifi size={13} />
              <span>Online</span>
            </div>
            <div className="h-4 w-px bg-white/30" />
            {/* User menu */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 text-xs text-white/90 hover:text-white">
                <UserCircle size={20} />
              </button>
              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-800">{officer?.name}</p>
                  <p className="text-xs text-gray-500">{officer?.employeeId} · {officer?.branch}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={13} />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-5">
          {children}
        </div>
      </main>
    </div>
  );
}
