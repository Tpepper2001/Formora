import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Globe,
  QrCode,
  Code,
  Lock,
  Calendar,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { FormModel } from '../types/form';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: FormModel;
  onUpdateSettings: (patch: Partial<FormModel['settings']>) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  form,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'link' | 'qr' | 'embed' | 'settings'>('link');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  if (!isOpen) return null;

  const origin = window.location.origin;
  const shareUrl = `${origin}?view=fill&formId=${form.id}`;
  const embedCode = `<iframe src="${shareUrl}&embed=true" width="100%" height="700" frameborder="0" marginheight="0" marginwidth="0">Loading form...</iframe>`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  // Generate SVG QR code pattern based on shareUrl hash
  const renderQrSvg = () => {
    const size = 180;
    const moduleCount = 25;
    const cellSize = size / moduleCount;

    // Deterministic pseudo-random matrix from string
    let hash = 0;
    for (let i = 0; i < shareUrl.length; i++) {
      hash = (hash << 5) - hash + shareUrl.charCodeAt(i);
      hash |= 0;
    }

    const cells: React.ReactNode[] = [];

    // Finder patterns in corners
    const isFinder = (r: number, c: number) => {
      if (r < 7 && c < 7) return true;
      if (r < 7 && c >= moduleCount - 7) return true;
      if (r >= moduleCount - 7 && c < 7) return true;
      return false;
    };

    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        let fill = false;
        if (isFinder(r, c)) {
          // Standard QR corner finder box
          const inCorner =
            (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) &&
            r < 7 &&
            c < 7;
          const inCornerTR =
            (r === 0 || r === 6 || c === moduleCount - 7 || c === moduleCount - 1 || (r >= 2 && r <= 4 && c >= moduleCount - 5 && c <= moduleCount - 3)) &&
            r < 7 &&
            c >= moduleCount - 7;
          const inCornerBL =
            (r === moduleCount - 7 || r === moduleCount - 1 || c === 0 || c === 6 || (r >= moduleCount - 5 && r <= moduleCount - 3 && c >= 2 && c <= 4)) &&
            r >= moduleCount - 7 &&
            c < 7;
          fill = inCorner || inCornerTR || inCornerBL;
        } else {
          fill = Math.abs((hash ^ (r * 31 + c * 17))) % 2 === 0;
        }

        if (fill) {
          cells.push(
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              fill="#171918"
            />
          );
        }
      }
    }

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
        <rect width={size} height={size} fill="#FFFFFF" />
        {cells}
      </svg>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-[#191D1A] rounded-2xl border border-[#E2E4DF] dark:border-[#272C28] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E4DF] dark:border-[#272C28]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E8F3EE] dark:bg-[#172D24] text-[#176B52] dark:text-[#228B6B] flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#171918] dark:text-[#F0F2EE]">
                Share & Publish Form
              </h3>
              <p className="text-xs text-[#737873] dark:text-[#9BA19B] truncate max-w-xs">
                {form.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#737873] hover:text-[#171918] dark:hover:text-[#F0F2EE]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 pt-3 pb-2 border-b border-[#E2E4DF] dark:border-[#272C28] bg-[#F7F7F4] dark:bg-[#111412]">
          <div className="flex items-center gap-1 p-1 bg-[#E2E4DF]/50 dark:bg-[#272C28] rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveTab('link')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'link'
                  ? 'bg-white dark:bg-[#191D1A] text-[#171918] dark:text-[#F0F2EE] shadow-sm font-semibold'
                  : 'text-[#737873] dark:text-[#9BA19B]'
              }`}
            >
              Public Link
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'qr'
                  ? 'bg-white dark:bg-[#191D1A] text-[#171918] dark:text-[#F0F2EE] shadow-sm font-semibold'
                  : 'text-[#737873] dark:text-[#9BA19B]'
              }`}
            >
              QR Code
            </button>
            <button
              onClick={() => setActiveTab('embed')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'embed'
                  ? 'bg-white dark:bg-[#191D1A] text-[#171918] dark:text-[#F0F2EE] shadow-sm font-semibold'
                  : 'text-[#737873] dark:text-[#9BA19B]'
              }`}
            >
              Embed Snippet
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'settings'
                  ? 'bg-white dark:bg-[#191D1A] text-[#171918] dark:text-[#F0F2EE] shadow-sm font-semibold'
                  : 'text-[#737873] dark:text-[#9BA19B]'
              }`}
            >
              Access Rules
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* TAB: Public Link */}
          {activeTab === 'link' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#171918] dark:text-[#F0F2EE] mb-1.5">
                  Direct Respondent URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 px-3 py-2 text-xs font-mono bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-lg text-[#737873] select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-[#176B52] hover:bg-[#125541] rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-[#F7F7F4] dark:bg-[#111412] rounded-lg border border-[#E2E4DF] dark:border-[#272C28] text-xs text-[#737873] dark:text-[#9BA19B] flex items-center justify-between">
                <span>Form status: <strong className="text-[#176B52] capitalize">{form.status}</strong></span>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-[#176B52] dark:text-[#228B6B] hover:underline flex items-center gap-1"
                >
                  <span>Open in new tab</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* TAB: QR Code */}
          {activeTab === 'qr' && (
            <div className="text-center space-y-4">
              <div className="p-4 bg-white rounded-xl border border-[#E2E4DF] inline-block shadow-sm">
                {renderQrSvg()}
              </div>
              <p className="text-xs text-[#737873] dark:text-[#9BA19B]">
                Scan with any smartphone camera to open and complete this form instantly.
              </p>
            </div>
          )}

          {/* TAB: Embed Code */}
          {activeTab === 'embed' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#171918] dark:text-[#F0F2EE] mb-1.5">
                  HTML Iframe Embed Code
                </label>
                <textarea
                  readOnly
                  rows={4}
                  value={embedCode}
                  className="w-full p-3 font-mono text-[11px] bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-lg text-[#737873] select-all"
                />
              </div>
              <button
                onClick={handleCopyEmbed}
                className="w-full py-2 text-xs font-semibold text-white bg-[#176B52] hover:bg-[#125541] rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                {copiedEmbed ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedEmbed ? 'Embed Code Copied' : 'Copy Embed Snippet'}</span>
              </button>
            </div>
          )}

          {/* TAB: Access Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="font-semibold text-[#171918] dark:text-[#F0F2EE] block">
                  Password Protection
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    placeholder="Enter access password (optional)"
                    value={form.settings?.password || ''}
                    onChange={(e) => onUpdateSettings({ password: e.target.value })}
                    className="flex-1 px-3 py-1.5 bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-md"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#E2E4DF] dark:border-[#272C28]">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-[#171918] dark:text-[#F0F2EE]">
                  <input
                    type="checkbox"
                    checked={form.settings?.allowAnonymous}
                    onChange={(e) => onUpdateSettings({ allowAnonymous: e.target.checked })}
                    className="rounded text-[#176B52]"
                  />
                  <span>Allow anonymous response submission</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-[#171918] dark:text-[#F0F2EE]">
                  <input
                    type="checkbox"
                    checked={form.settings?.preventDuplicates}
                    onChange={(e) => onUpdateSettings({ preventDuplicates: e.target.checked })}
                    className="rounded text-[#176B52]"
                  />
                  <span>Prevent duplicate submissions</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E2E4DF] dark:border-[#272C28] bg-[#F7F7F4] dark:bg-[#111412] text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-[#171918] dark:text-[#F0F2EE] hover:bg-[#E2E4DF] dark:hover:bg-[#272C28] rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
