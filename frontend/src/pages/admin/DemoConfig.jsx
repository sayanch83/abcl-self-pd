import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, RotateCcw, Save, X, ChevronDown, ChevronUp,
  User, Phone, Briefcase, MapPin, Building2, AlertTriangle, CheckCircle,
  Info, Search, Copy, Check
} from 'lucide-react';
import { demoConfigApi } from '../../api/client';
import AdminLayout from '../../components/layout/AdminLayout';
import { Card, Button, Input, Select, Textarea, Badge, StatusBadge, Alert, Spinner } from '../../components/common/UI';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────────
const PRODUCTS = ['Personal Loan', 'Business Loan', 'Home Loan', 'LAP'];
const BRANCHES = ['Dehradun', 'Mumbai', 'Pune', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Ahmedabad', 'Haridwar'];
const EMPLOYMENT_TYPES = [
  { value: 'salaried', label: 'Salaried' },
  { value: 'self_employed', label: 'Self Employed' },
];

const EMPTY_FORM = {
  app_id: '', customer_name: '', mobile_no: '', product: 'Personal Loan',
  loan_amount: '', branch: 'Mumbai', location: '',
  employment_type: 'salaried', residence_address: '', office_address: '',
  assigned_officer_id: '',
};

// ── Mobile copy helper ────────────────────────────────────────────────────────
function CopyMobile({ mobile }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(mobile).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handle} className="flex items-center gap-1 font-mono text-xs text-gray-600 hover:text-[#C8102E] transition-colors group">
      {mobile}
      {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} className="opacity-0 group-hover:opacity-100" />}
    </button>
  );
}

// ── Application Form (used for both Add and Edit) ─────────────────────────────
function AppForm({ initial = EMPTY_FORM, officers = [], onSave, onCancel, isNew }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.customer_name.trim()) e.customer_name = 'Required';
    if (!form.mobile_no.trim()) e.mobile_no = 'Required';
    else if (form.mobile_no.replace(/\D/g, '').length !== 10) e.mobile_no = 'Must be 10 digits';
    if (!form.product) e.product = 'Required';
    if (!form.employment_type) e.employment_type = 'Required';
    if (form.loan_amount && isNaN(Number(form.loan_amount))) e.loan_amount = 'Must be a number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Row 1 — identity */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Customer Name *"
          placeholder="e.g. Ashwini Dharpale"
          value={form.customer_name}
          onChange={e => set('customer_name', e.target.value)}
          error={errors.customer_name}
        />
        <Input
          label="Mobile Number * (10 digits)"
          placeholder="e.g. 9876543210"
          maxLength={10}
          value={form.mobile_no}
          onChange={e => set('mobile_no', e.target.value.replace(/\D/g, ''))}
          error={errors.mobile_no}
          hint="Must be Twilio-verified for real SMS"
        />
      </div>

      {/* Row 2 — loan */}
      <div className="grid grid-cols-3 gap-4">
        <Select label="Product *" value={form.product} onChange={e => set('product', e.target.value)} error={errors.product}>
          {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
        </Select>
        <Input
          label="Loan Amount (₹)"
          type="number"
          placeholder="e.g. 1500000"
          value={form.loan_amount}
          onChange={e => set('loan_amount', e.target.value)}
          error={errors.loan_amount}
          hint={form.loan_amount ? `₹${(Number(form.loan_amount)/100000).toFixed(1)}L` : ''}
        />
        <Select label="Employment Type *" value={form.employment_type} onChange={e => set('employment_type', e.target.value)}>
          {EMPLOYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Select>
      </div>

      {/* Row 3 — location */}
      <div className="grid grid-cols-3 gap-4">
        <Select label="Branch" value={form.branch} onChange={e => set('branch', e.target.value)}>
          {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
        </Select>
        <Input
          label="City / Location"
          placeholder="e.g. Pune"
          value={form.location}
          onChange={e => set('location', e.target.value)}
        />
        <Select label="Assigned Officer" value={form.assigned_officer_id} onChange={e => set('assigned_officer_id', e.target.value)}>
          <option value="">Auto (your account)</option>
          {officers.map(o => <option key={o.id} value={o.id}>{o.name} — {o.branch}</option>)}
        </Select>
      </div>

      {/* Row 4 — addresses */}
      <div className="grid grid-cols-2 gap-4">
        <Textarea
          label="Residence Address"
          placeholder="Full address including city, state, PIN"
          value={form.residence_address}
          onChange={e => set('residence_address', e.target.value)}
          rows={2}
        />
        <Textarea
          label={form.employment_type === 'salaried' ? 'Office Address' : 'Business Address'}
          placeholder="Full address including city, state, PIN"
          value={form.office_address}
          onChange={e => set('office_address', e.target.value)}
          rows={2}
        />
      </div>

      {/* App ID (optional override) */}
      {isNew && (
        <Input
          label="App ID (optional — auto-generated if blank)"
          placeholder="e.g. PL00001234567"
          value={form.app_id}
          onChange={e => set('app_id', e.target.value.toUpperCase())}
          hint="Leave blank to auto-generate based on product type"
        />
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <Button variant="secondary" onClick={onCancel}>
          <X size={14} /> Cancel
        </Button>
        <Button loading={saving} onClick={handleSave}>
          <Save size={14} /> {isNew ? 'Add Application' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

// ── Single Application Row ────────────────────────────────────────────────────
function AppRow({ app, officers, onUpdated, onDeleted }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = async (form) => {
    try {
      const res = await demoConfigApi.update(app.id, form);
      toast.success(`${res.data.data.customer_name} updated`);
      setEditing(false);
      onUpdated(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await demoConfigApi.remove(app.id);
      toast.success(`${app.app_id} deleted`);
      onDeleted(app.id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await demoConfigApi.resetStatus(app.id);
      toast.success(`${app.app_id} reset to Pending`);
      onUpdated({ ...app, status: 'pending' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reset failed');
    } finally {
      setResetting(false);
    }
  };

  const statusColors = {
    pending:   'border-l-gray-300',
    link_sent: 'border-l-blue-400',
    completed: 'border-l-emerald-400',
  };

  return (
    <div className={`border border-gray-100 rounded-xl overflow-hidden border-l-4 ${statusColors[app.status] || 'border-l-gray-200'} transition-all`}>
      {/* Summary row */}
      <div className="flex items-center gap-4 px-4 py-3 bg-white">
        {/* Status dot */}
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
          app.status === 'completed' ? 'bg-emerald-400' :
          app.status === 'link_sent' ? 'bg-blue-400' : 'bg-gray-300'
        }`} />

        {/* App ID */}
        <span className="font-mono text-xs font-semibold text-[#C8102E] w-32 flex-shrink-0">{app.app_id}</span>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm truncate">{app.customer_name}</p>
          <p className="text-xs text-gray-400 capitalize">{app.employment_type?.replace('_', ' ')} · {app.product}</p>
        </div>

        {/* Mobile */}
        <div className="w-28 flex-shrink-0">
          <CopyMobile mobile={app.mobile_no} />
          <p className="text-xs text-gray-400 mt-0.5">tap to copy</p>
        </div>

        {/* Amount */}
        <div className="w-16 flex-shrink-0 text-right">
          <p className="text-sm font-semibold text-gray-700">₹{app.loan_amount ? (app.loan_amount/100000).toFixed(1)+'L' : '—'}</p>
        </div>

        {/* Status */}
        <div className="w-24 flex-shrink-0 flex justify-center">
          <StatusBadge status={app.status} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Reset — only if not pending */}
          {app.status !== 'pending' && (
            <button
              onClick={handleReset}
              disabled={resetting}
              title="Reset to Pending (clear PD submission)"
              className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-40"
            >
              <RotateCcw size={14} className={resetting ? 'animate-spin' : ''} />
            </button>
          )}

          {/* Edit */}
          <button
            onClick={() => { setEditing(e => !e); setExpanded(true); setConfirmDelete(false); }}
            title="Edit application"
            className={`p-1.5 rounded-lg transition-colors ${editing ? 'text-[#C8102E] bg-[#F5E6E9]' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
          >
            <Pencil size={14} />
          </button>

          {/* Delete */}
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button onClick={handleDelete} disabled={deleting}
                className="px-2 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg disabled:opacity-50 transition-colors">
                {deleting ? '...' : 'Confirm'}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded-lg">
                No
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} title="Delete application"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 size={14} />
            </button>
          )}

          {/* Expand toggle */}
          <button onClick={() => { setExpanded(e => !e); if (expanded) setEditing(false); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded detail / edit form */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
          {editing ? (
            <AppForm
              initial={{
                customer_name: app.customer_name,
                mobile_no: app.mobile_no,
                product: app.product,
                loan_amount: app.loan_amount || '',
                branch: app.branch || '',
                location: app.location || '',
                employment_type: app.employment_type,
                residence_address: app.residence_address || '',
                office_address: app.office_address || '',
                assigned_officer_id: app.assigned_officer_id || '',
              }}
              officers={officers}
              onSave={handleSave}
              onCancel={() => setEditing(false)}
              isNew={false}
            />
          ) : (
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div className="space-y-2">
                <div className="flex gap-2"><span className="text-xs text-gray-400 w-32">Branch</span><span className="text-gray-700">{app.branch || '—'}</span></div>
                <div className="flex gap-2"><span className="text-xs text-gray-400 w-32">Location</span><span className="text-gray-700">{app.location || '—'}</span></div>
                <div className="flex gap-2"><span className="text-xs text-gray-400 w-32">Assigned Officer</span><span className="text-gray-700">{app.officer_name || '—'}</span></div>
              </div>
              <div className="space-y-2">
                <div className="flex gap-2"><span className="text-xs text-gray-400 w-32">Residence</span><span className="text-gray-700 text-xs leading-relaxed">{app.residence_address || '—'}</span></div>
                <div className="flex gap-2"><span className="text-xs text-gray-400 w-32">{app.employment_type === 'salaried' ? 'Office' : 'Business'}</span><span className="text-gray-700 text-xs leading-relaxed">{app.office_address || '—'}</span></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DemoConfig() {
  const [applications, setApplications] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await demoConfigApi.getAll();
      setApplications(res.data.data.applications);
      setOfficers(res.data.data.officers);
    } catch {
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (form) => {
    try {
      const res = await demoConfigApi.create(form);
      setApplications(prev => [...prev, res.data.data]);
      setShowAddForm(false);
      toast.success(`${res.data.data.app_id} created successfully`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create application');
      throw err;
    }
  };

  const handleUpdated = (updated) => {
    setApplications(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a));
  };

  const handleDeleted = (id) => {
    setApplications(prev => prev.filter(a => a.id !== id));
  };

  const filtered = applications.filter(a =>
    !search ||
    a.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    a.app_id.toLowerCase().includes(search.toLowerCase()) ||
    a.mobile_no.includes(search)
  );

  const counts = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    link_sent: applications.filter(a => a.status === 'link_sent').length,
    completed: applications.filter(a => a.status === 'completed').length,
  };

  return (
    <AdminLayout>
      <div className="animate-fadeIn max-w-5xl">

        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900">Demo Configuration</h1>
              <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full">Admin</span>
            </div>
            <p className="text-sm text-gray-500">
              Manage demo applicants in real time. Changes reflect instantly in the officer dashboard.
            </p>
          </div>
          <Button onClick={() => { setShowAddForm(s => !s); }} variant={showAddForm ? 'secondary' : 'primary'}>
            {showAddForm ? <><X size={15} /> Cancel</> : <><Plus size={15} /> Add Applicant</>}
          </Button>
        </div>

        {/* Tips banner */}
        <Alert type="info" className="mb-5 text-xs">
          <div className="flex gap-2">
            <Info size={15} className="flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Demo tip:</span> Set each applicant's mobile to a Twilio-verified number.
              Click the mobile number in the table to copy it. Use <strong>Reset</strong> (↺) to re-run a completed demo case from scratch.
            </div>
          </div>
        </Alert>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total', value: counts.total, color: 'text-gray-700', bg: 'bg-gray-100' },
            { label: 'Pending', value: counts.pending, color: 'text-amber-700', bg: 'bg-amber-50' },
            { label: 'Link Sent', value: counts.link_sent, color: 'text-blue-700', bg: 'bg-blue-50' },
            { label: 'Completed', value: counts.completed, color: 'text-emerald-700', bg: 'bg-emerald-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl px-4 py-3 flex items-center justify-between`}>
              <span className="text-xs font-medium text-gray-500">{s.label}</span>
              <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Add form */}
        {showAddForm && (
          <Card className="p-5 mb-5 border-2 border-[#C8102E]/20 bg-[#FFF8F8]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[#C8102E] flex items-center justify-center">
                <Plus size={14} className="text-white" />
              </div>
              <h3 className="font-bold text-gray-900">New Applicant</h3>
            </div>
            <AppForm
              officers={officers}
              onSave={handleCreate}
              onCancel={() => setShowAddForm(false)}
              isNew
            />
          </Card>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, App ID, or mobile..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] bg-white"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Column headers */}
        <div className="flex items-center gap-4 px-4 py-2 mb-2">
          <div className="w-2 flex-shrink-0" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-32 flex-shrink-0">App ID</span>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex-1">Customer</span>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-28 flex-shrink-0">Mobile</span>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-16 flex-shrink-0 text-right">Amount</span>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-24 flex-shrink-0 text-center">Status</span>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-28 flex-shrink-0 text-right">Actions</span>
        </div>

        {/* Application list */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Spinner size={28} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <User size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">{search ? 'No matches found' : 'No applications yet'}</p>
            {!search && <p className="text-sm mt-1">Click "Add Applicant" to create your first demo case</p>}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(app => (
              <AppRow
                key={app.id}
                app={app}
                officers={officers}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
              />
            ))}
          </div>
        )}

        {/* Footer note */}
        {applications.length > 0 && (
          <p className="text-center text-xs text-gray-400 mt-6">
            {filtered.length} of {applications.length} application{applications.length !== 1 ? 's' : ''} shown
            {counts.completed > 0 && ` · ${counts.completed} completed — use ↺ Reset to re-demo`}
          </p>
        )}
      </div>
    </AdminLayout>
  );
}
