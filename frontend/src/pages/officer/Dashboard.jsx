import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, CheckCircle, Send, RefreshCw, Zap, Radio } from 'lucide-react';
import { applicationApi } from '../../api/client';
import api from '../../api/client';
import OfficerLayout from '../../components/layout/OfficerLayout';
import { Card, StatusBadge, Spinner, Button } from '../../components/common/UI';
import PdLinkModal from '../../components/common/PdLinkModal';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

function StatCard({ icon: Icon, label, value, color, bgColor }) {
  return (
    <Card className="p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${bgColor}`}>
        <Icon size={20} className={color} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </Card>
  );
}

export default function OfficerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState({});
  const [modal, setModal] = useState(null); // { link, customerName, appId, mobile }
  const [appMode, setAppMode] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, appsRes, modeRes] = await Promise.all([
        applicationApi.getStats(),
        applicationApi.getAll(),
        api.get('/mode'),
      ]);
      setStats(statsRes.data.data.stats);
      setApplications(appsRes.data.data);
      setAppMode(modeRes.data.mode);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleTriggerPd = async (app, e) => {
    e.stopPropagation();
    setTriggering(t => ({ ...t, [app.id]: true }));
    try {
      const res = await applicationApi.triggerPd(app.id);
      toast.success(res.data.message);
      // Show modal with the link
      if (res.data.data?.pdLink) {
        setModal({
          link: res.data.data.pdLink,
          customerName: app.customer_name,
          appId: app.app_id,
          mobile: app.mobile_no,
        });
      }
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to trigger PD link');
    } finally {
      setTriggering(t => ({ ...t, [app.id]: false }));
    }
  };

  if (loading) {
    return (
      <OfficerLayout>
        <div className="flex items-center justify-center h-64">
          <Spinner size={32} />
        </div>
      </OfficerLayout>
    );
  }

  return (
    <OfficerLayout>
      <div className="animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Self-PD status overview</p>
          </div>
          <div className="flex items-center gap-3">
            {appMode && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                appMode === 'demo'
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}>
                {appMode === 'demo' ? <Zap size={11} /> : <Radio size={11} />}
                {appMode === 'demo' ? 'Demo Mode — OTP: 123456' : 'Live Mode — Real SMS'}
              </div>
            )}
            <Button variant="secondary" size="sm" onClick={fetchData} className="gap-2">
              <RefreshCw size={14} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <StatCard icon={FileText}     label="Total Applications" value={stats?.total     || 0} color="text-gray-600"    bgColor="bg-gray-100"    />
          <StatCard icon={Clock}        label="Pending PD"         value={stats?.pending   || 0} color="text-amber-600"   bgColor="bg-amber-50"    />
          <StatCard icon={Send}         label="Link Sent"          value={stats?.link_sent || 0} color="text-blue-600"    bgColor="bg-blue-50"     />
          <StatCard icon={CheckCircle}  label="Completed"          value={stats?.completed || 0} color="text-emerald-600" bgColor="bg-emerald-50"  />
        </div>

        {/* Applications Table */}
        <Card>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">All Applications</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/officer/applications')}>
              View All
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['App ID', 'Customer', 'Mobile', 'Product', 'Loan Amount', 'PD Status', 'Last Action', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {applications.map(app => (
                  <tr
                    key={app.id}
                    onClick={() => navigate(`/officer/applications/${app.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-[#C8102E] font-medium">{app.app_id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 whitespace-nowrap">{app.customer_name}</p>
                      <p className="text-xs text-gray-400 capitalize">{app.employment_type?.replace('_', ' ')}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                      {app.mobile_no.replace(/(\d{2})\d{6}(\d{2})/, '$1xxxxxx$2')}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{app.product}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                      ₹{(app.loan_amount / 100000).toFixed(1)}L
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {app.last_link_sent
                        ? formatDistanceToNow(new Date(app.last_link_sent), { addSuffix: true })
                        : '—'}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      {app.status === 'completed' ? (
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/officer/applications/${app.id}`)}>
                          View
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant={app.status === 'link_sent' ? 'secondary' : 'primary'}
                          loading={triggering[app.id]}
                          onClick={e => handleTriggerPd(app, e)}
                        >
                          <Send size={12} />
                          {app.status === 'link_sent' ? 'Re-trigger' : 'Send Link'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {applications.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <FileText size={32} className="mx-auto mb-2 opacity-50" />
                <p>No applications found</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* PD Link Modal */}
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
