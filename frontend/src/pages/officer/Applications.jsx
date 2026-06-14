import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Send, RefreshCw, Filter } from 'lucide-react';
import { applicationApi } from '../../api/client';
import OfficerLayout from '../../components/layout/OfficerLayout';
import { Card, Button, StatusBadge, Spinner, Input } from '../../components/common/UI';
import PdLinkModal from '../../components/common/PdLinkModal';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'link_sent', label: 'Link Sent' },
  { value: 'completed', label: 'Completed' },
];

export default function Applications() {
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [triggering, setTriggering] = useState({});
  const [modal, setModal] = useState(null);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const res = await applicationApi.getAll({ search: search || undefined, status: statusFilter || undefined });
      setApps(res.data.data);
    } catch {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchApps, 300);
    return () => clearTimeout(t);
  }, [search, statusFilter]);

  const handleTrigger = async (app, e) => {
    e.stopPropagation();
    setTriggering(t => ({ ...t, [app.id]: true }));
    try {
      const res = await applicationApi.triggerPd(app.id);
      toast.success(res.data.message);
      if (res.data.data?.pdLink) {
        setModal({ link: res.data.data.pdLink, customerName: app.customer_name, appId: app.app_id, mobile: app.mobile_no });
      }
      fetchApps();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to trigger link');
    } finally {
      setTriggering(t => ({ ...t, [app.id]: false }));
    }
  };

  return (
    <OfficerLayout>
      <div className="animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Applications</h1>
            <p className="text-sm text-gray-500 mt-0.5">{apps.length} application{apps.length !== 1 ? 's' : ''}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchApps}>
            <RefreshCw size={14} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by app ID, name, mobile..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-gray-400" />
              {STATUS_FILTERS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    statusFilter === f.value
                      ? 'bg-[#C8102E] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Spinner size={28} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['App ID', 'Customer Name', 'Mobile', 'Product', 'Amount', 'Location', 'Employment', 'Status', 'Link Sent', 'Action'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {apps.map(app => (
                    <tr
                      key={app.id}
                      onClick={() => navigate(`/officer/applications/${app.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-[#C8102E] font-medium">{app.app_id}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{app.customer_name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {app.mobile_no.replace(/(\d{2})\d{6}(\d{2})/, '$1xxxxxx$2')}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{app.product}</td>
                      <td className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">
                        ₹{(app.loan_amount / 100000).toFixed(1)}L
                      </td>
                      <td className="px-4 py-3 text-gray-500">{app.location}</td>
                      <td className="px-4 py-3 text-gray-500 capitalize whitespace-nowrap">
                        {app.employment_type?.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {app.last_link_sent
                          ? formatDistanceToNow(new Date(app.last_link_sent), { addSuffix: true })
                          : '—'}
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        {app.status === 'completed' ? (
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/officer/applications/${app.id}`)}>
                            View PD
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant={app.status === 'link_sent' ? 'secondary' : 'primary'}
                            loading={triggering[app.id]}
                            onClick={e => handleTrigger(app, e)}
                          >
                            <Send size={12} />
                            {app.status === 'link_sent' ? 'Re-send' : 'Send Link'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {apps.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <Search size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No applications found</p>
                  <p className="text-sm mt-1">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          )}
        </Card>
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
