import { useState } from 'react';
import { Copy, Check, CheckCircle, X, MessageSquare } from 'lucide-react';

export default function PdLinkModal({ isOpen, onClose, link, customerName, appId, mobile }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !link) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const el = document.createElement('textarea');
      el.value = link;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const maskedMobile = mobile?.replace(/(\d{2})\d{6}(\d{2})/, '$1xxxxxx$2');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle size={20} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Self-PD Link Sent</h3>
              <p className="text-xs text-gray-400 mt-0.5">{appId} · {customerName}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* SMS confirmation */}
          <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
            <MessageSquare size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-emerald-800 text-sm">Link sent to {maskedMobile}</p>
              <p className="text-emerald-700 text-xs mt-1 leading-relaxed">
                The customer will receive an SMS with the Self-PD link. The link is valid for 24 hours.
              </p>
            </div>
          </div>

          {/* What happens next */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">What happens next</p>
            <div className="space-y-2.5">
              {[
                'Customer taps the link in the SMS on their phone',
                'They enter their registered mobile number to receive an OTP',
                'After OTP verification, they complete the Self-PD form and upload photos',
                'Status here updates to Completed once the customer submits',
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#F5E6E9] text-[#C8102E] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-gray-600">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Link for reference */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Link for reference</p>
            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <p className="text-xs text-gray-600 font-mono flex-1 break-all leading-relaxed">{link}</p>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 transition-all ${
                  copied ? 'bg-emerald-100 text-emerald-700' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Share via WhatsApp if the customer did not receive the SMS.
            </p>
          </div>
        </div>

        <div className="px-5 pb-5">
          <button onClick={onClose}
            className="w-full py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
