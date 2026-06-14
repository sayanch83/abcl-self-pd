import { Loader2 } from 'lucide-react';

// ── Button ──────────────────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', size = 'md', loading, className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants = {
    primary:   'bg-[#C8102E] text-white hover:bg-[#A00D24] focus:ring-[#C8102E] shadow-sm',
    secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 focus:ring-gray-300 shadow-sm',
    ghost:     'text-gray-600 hover:bg-gray-100 focus:ring-gray-200',
    danger:    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm',
    success:   'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm',
    outline:   'border-2 border-[#C8102E] text-[#C8102E] hover:bg-[#F5E6E9] focus:ring-[#C8102E]',
  };

  const sizes = {
    sm:  'px-3 py-1.5 text-xs',
    md:  'px-4 py-2 text-sm',
    lg:  'px-6 py-2.5 text-base',
    xl:  'px-8 py-3 text-base',
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

// ── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, error, hint, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">{label}</label>}
      <input
        className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-800 bg-white transition-colors
          focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent
          ${error ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 flex items-center gap-1">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

// ── Select ───────────────────────────────────────────────────────────────────
export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">{label}</label>}
      <select
        className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-800 bg-white transition-colors
          focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent
          ${error ? 'border-red-400' : 'border-gray-200 hover:border-gray-300'}
          ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Textarea ─────────────────────────────────────────────────────────────────
export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">{label}</label>}
      <textarea
        className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-800 bg-white transition-colors resize-none
          focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent
          ${error ? 'border-red-400' : 'border-gray-200 hover:border-gray-300'}
          ${className}`}
        rows={3}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', ...props }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm ${className}`} {...props}>
      {children}
    </div>
  );
}

// ── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ children, variant = 'default', size = 'sm' }) {
  const variants = {
    default:   'bg-gray-100 text-gray-600',
    success:   'bg-emerald-50 text-emerald-700',
    warning:   'bg-amber-50 text-amber-700',
    danger:    'bg-red-50 text-red-700',
    info:      'bg-blue-50 text-blue-700',
    primary:   'bg-[#F5E6E9] text-[#C8102E]',
    completed: 'bg-emerald-50 text-emerald-700',
    pending:   'bg-gray-100 text-gray-600',
    link_sent: 'bg-blue-50 text-blue-700',
    positive:  'bg-emerald-50 text-emerald-700',
    negative:  'bg-red-50 text-red-700',
  };

  const sizes = { xs: 'px-1.5 py-0.5 text-xs', sm: 'px-2 py-0.5 text-xs', md: 'px-2.5 py-1 text-sm' };

  return (
    <span className={`inline-flex items-center font-medium rounded-full whitespace-nowrap ${variants[variant] || variants.default} ${sizes[size]}`}>
      {children}
    </span>
  );
}

// ── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 24, className = '' }) {
  return <Loader2 size={size} className={`animate-spin text-[#C8102E] ${className}`} />;
}

// ── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ── Alert ────────────────────────────────────────────────────────────────────
export function Alert({ type = 'info', children, className = '' }) {
  const styles = {
    info:    'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    error:   'bg-red-50 border-red-200 text-red-800',
  };
  return (
    <div className={`p-3 rounded-lg border text-sm ${styles[type]} ${className}`}>
      {children}
    </div>
  );
}

// ── Detail Row ───────────────────────────────────────────────────────────────
export function DetailRow({ label, value, className = '' }) {
  return (
    <div className={`flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0 ${className}`}>
      <span className="text-xs text-gray-500 font-medium uppercase tracking-wide min-w-[140px]">{label}</span>
      <span className="text-sm text-gray-800 text-right">{value || '—'}</span>
    </div>
  );
}

// ── Status Badge ─────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    pending:   { label: 'Pending',   variant: 'default' },
    link_sent: { label: 'Link Sent', variant: 'info' },
    completed: { label: 'Completed', variant: 'success' },
    positive:  { label: 'Positive',  variant: 'success' },
    negative:  { label: 'Negative',  variant: 'danger' },
  };
  const { label, variant } = map[status] || { label: status, variant: 'default' };
  return <Badge variant={variant}>{label}</Badge>;
}
