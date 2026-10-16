import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Trash2,
  Bookmark,
  Eye,
  FileSpreadsheet,
  FileText,
  X,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowUpDown,
} from 'lucide-react';
import { FormModel, FormResponse } from '../types/form';
import { exportResponsesToCSV, exportResponsesToJSON } from '../utils/exports';

interface ResponsesWorkspaceProps {
  form: FormModel;
  responses: FormResponse[];
  onUpdateResponseStatus: (responseId: string, status: 'valid' | 'flagged' | 'excluded') => Promise<void>;
  onUpdateResponseNotes: (responseId: string, notes: string) => Promise<void>;
  onDeleteResponse: (responseId: string) => Promise<void>;
}

export const ResponsesWorkspace: React.FC<ResponsesWorkspaceProps> = ({
  form,
  responses,
  onUpdateResponseStatus,
  onUpdateResponseNotes,
  onDeleteResponse,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'flagged' | 'excluded'>('all');
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null);
  const [notesInput, setNotesInput] = useState('');

  // Filtered responses
  const filteredResponses = useMemo(() => {
    return responses.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesId = r.id.toLowerCase().includes(query);
        const matchesAnswers = Object.values(r.answers).some((val) =>
          String(val).toLowerCase().includes(query)
        );
        const matchesNotes = r.internalNotes?.toLowerCase().includes(query);
        return matchesId || matchesAnswers || matchesNotes;
      }
      return true;
    });
  }, [responses, statusFilter, searchTerm]);

  const openDetailModal = (r: FormResponse) => {
    setSelectedResponse(r);
    setNotesInput(r.internalNotes || '');
  };

  const handleSaveNotes = async () => {
    if (!selectedResponse) return;
    await onUpdateResponseNotes(selectedResponse.id, notesInput);
    setSelectedResponse((prev) => (prev ? { ...prev, internalNotes: notesInput } : null));
  };

  const handleToggleExclude = async (r: FormResponse) => {
    const nextStatus = r.status === 'excluded' ? 'valid' : 'excluded';
    await onUpdateResponseStatus(r.id, nextStatus);
    if (selectedResponse && selectedResponse.id === r.id) {
      setSelectedResponse((prev) => (prev ? { ...prev, status: nextStatus } : null));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28]">
        {/* Search & Status Filters */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#737873]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search answers or IDs..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#176B52]"
            />
          </div>

          {/* Segmented Filter */}
          <div className="flex items-center gap-1 p-1 bg-[#F0F2ED] dark:bg-[#111412] rounded-lg text-xs font-medium">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-[#191D1A] text-[#171918] dark:text-[#F0F2EE] shadow-sm font-semibold'
                  : 'text-[#737873] dark:text-[#9BA19B]'
              }`}
            >
              All ({responses.length})
            </button>
            <button
              onClick={() => setStatusFilter('valid')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'valid'
                  ? 'bg-white dark:bg-[#191D1A] text-[#171918] dark:text-[#F0F2EE] shadow-sm font-semibold'
                  : 'text-[#737873] dark:text-[#9BA19B]'
              }`}
            >
              Valid
            </button>
            <button
              onClick={() => setStatusFilter('flagged')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'flagged'
                  ? 'bg-white dark:bg-[#191D1A] text-[#171918] dark:text-[#F0F2EE] shadow-sm font-semibold'
                  : 'text-[#737873] dark:text-[#9BA19B]'
              }`}
            >
              Flagged
            </button>
            <button
              onClick={() => setStatusFilter('excluded')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'excluded'
                  ? 'bg-white dark:bg-[#191D1A] text-[#171918] dark:text-[#F0F2EE] shadow-sm font-semibold'
                  : 'text-[#737873] dark:text-[#9BA19B]'
              }`}
            >
              Excluded
            </button>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportResponsesToCSV(form, filteredResponses)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#171918] dark:text-[#F0F2EE] bg-white dark:bg-[#191D1A] border border-[#E2E4DF] dark:border-[#272C28] hover:bg-[#F0F2ED] dark:hover:bg-[#222723] rounded-md transition-colors whitespace-nowrap"
            title="Download CSV dataset"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#176B52]" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => exportResponsesToJSON(form, filteredResponses)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#737873] dark:text-[#9BA19B] border border-[#E2E4DF] dark:border-[#272C28] hover:bg-[#F0F2ED] dark:hover:bg-[#222723] rounded-md transition-colors whitespace-nowrap"
            title="Download JSON structure"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F7F7F4] dark:bg-[#111412] border-b border-[#E2E4DF] dark:border-[#272C28] text-[#737873] dark:text-[#9BA19B]">
              <tr>
                <th className="p-3.5 font-semibold">Submission ID</th>
                <th className="p-3.5 font-semibold">Submitted</th>
                <th className="p-3.5 font-semibold">Duration</th>
                <th className="p-3.5 font-semibold">Status</th>
                {form.questions.slice(0, 3).map((q) => (
                  <th key={q.id} className="p-3.5 font-semibold truncate max-w-[150px]">
                    {q.title}
                  </th>
                ))}
                <th className="p-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E4DF] dark:divide-[#272C28]">
              {filteredResponses.length > 0 ? (
                filteredResponses.map((resp) => {
                  return (
                    <tr
                      key={resp.id}
                      className={`hover:bg-[#F0F2ED]/50 dark:hover:bg-[#222723]/30 transition-colors ${
                        resp.status === 'excluded' ? 'opacity-60 bg-slate-50 dark:bg-slate-900/20' : ''
                      }`}
                    >
                      <td className="p-3.5 font-mono text-[11px] text-[#171918] dark:text-[#F0F2EE]">
                        {resp.id.slice(0, 14)}
                      </td>
                      <td className="p-3.5 text-[#737873] dark:text-[#9BA19B] whitespace-nowrap">
                        {new Date(resp.submittedAt).toLocaleDateString()} ·{' '}
                        {new Date(resp.submittedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-3.5 font-mono tabular-nums text-[#737873]">
                        {resp.completionTimeSeconds || 60}s
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`text-[11px] font-medium capitalize ${
                            resp.status === 'valid'
                              ? 'text-[#176B52] dark:text-[#228B6B]'
                              : resp.status === 'flagged'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-500'
                          }`}
                        >
                          {resp.status}
                        </span>
                      </td>
                      {form.questions.slice(0, 3).map((q) => {
                        const ans = resp.answers[q.id];
                        let display = '';
                        if (typeof ans === 'object' && ans !== null) {
                          display = Array.isArray(ans) ? ans.join(', ') : JSON.stringify(ans);
                        } else if (ans !== undefined) {
                          display = String(ans);
                        }
                        return (
                          <td key={q.id} className="p-3.5 truncate max-w-[150px] text-[#171918] dark:text-[#F0F2EE]">
                            {display || '—'}
                          </td>
                        );
                      })}
                      <td className="p-3.5 text-right whitespace-nowrap space-x-1">
                        <button
                          onClick={() => openDetailModal(resp)}
                          className="px-2.5 py-1 text-[11px] font-medium text-[#176B52] dark:text-[#228B6B] hover:bg-[#E8F3EE] dark:hover:bg-[#172D24] rounded transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleToggleExclude(resp)}
                          className="px-2 py-1 text-[11px] text-[#737873] hover:text-[#171918] dark:hover:text-[#F0F2EE] rounded transition-colors"
                          title={resp.status === 'excluded' ? 'Include in analysis' : 'Exclude from analysis'}
                        >
                          {resp.status === 'excluded' ? 'Include' : 'Exclude'}
                        </button>
                        <button
                          onClick={() => onDeleteResponse(resp.id)}
                          className="p-1 text-[#737873] hover:text-red-600 rounded transition-colors"
                          title="Delete response"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-[#737873] dark:text-[#9BA19B]">
                    No matching submissions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Response Detail & Notes Modal */}
      {selectedResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white dark:bg-[#191D1A] rounded-2xl border border-[#E2E4DF] dark:border-[#272C28] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E4DF] dark:border-[#272C28]">
              <div>
                <h3 className="text-sm font-bold text-[#171918] dark:text-[#F0F2EE]">
                  Submission Details
                </h3>
                <div className="text-[11px] text-[#737873] dark:text-[#9BA19B] flex items-center gap-2 mt-0.5 font-mono">
                  <span>{selectedResponse.id}</span>
                  <span aria-hidden="true">·</span>
                  <span>{new Date(selectedResponse.submittedAt).toLocaleString()}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedResponse(null)}
                className="p-1.5 rounded-lg text-[#737873] hover:text-[#171918] dark:hover:text-[#F0F2EE]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Question Answers */}
              <div className="space-y-4">
                {form.questions.map((q, idx) => {
                  if (q.type === 'section_break' || q.type === 'info_text') return null;
                  const ans = selectedResponse.answers[q.id];
                  let displayValue = '—';
                  if (ans !== undefined && ans !== null) {
                    if (Array.isArray(ans)) {
                      displayValue = ans.join(', ');
                    } else if (typeof ans === 'object') {
                      displayValue = Object.entries(ans)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' | ');
                    } else {
                      displayValue = String(ans);
                    }
                  }

                  return (
                    <div key={q.id} className="p-3 bg-[#F7F7F4] dark:bg-[#111412] rounded-lg border border-[#E2E4DF] dark:border-[#272C28]">
                      <span className="text-xs font-semibold text-[#171918] dark:text-[#F0F2EE] block mb-1">
                        {idx + 1}. {q.title}
                      </span>
                      <p className="text-xs text-[#737873] dark:text-[#9BA19B] whitespace-pre-wrap">
                        {displayValue}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Status and Notes */}
              <div className="pt-4 border-t border-[#E2E4DF] dark:border-[#272C28] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#171918] dark:text-[#F0F2EE]">
                    Submission Status
                  </span>
                  <div className="flex items-center gap-1">
                    {(['valid', 'flagged', 'excluded'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => onUpdateResponseStatus(selectedResponse.id, st)}
                        className={`px-2.5 py-1 text-xs rounded-md capitalize transition-colors ${
                          selectedResponse.status === st
                            ? 'bg-[#176B52] text-white font-medium'
                            : 'bg-[#F0F2ED] dark:bg-[#222723] text-[#737873]'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#171918] dark:text-[#F0F2EE] mb-1">
                    Internal Reviewer Notes
                  </label>
                  <textarea
                    rows={3}
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    placeholder="Add observations, follow-up notes, or verification details..."
                    className="w-full px-3 py-2 text-xs bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                  />
                  <button
                    onClick={handleSaveNotes}
                    className="mt-2 px-3 py-1.5 text-xs font-semibold text-white bg-[#176B52] hover:bg-[#125541] rounded-md transition-colors"
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
