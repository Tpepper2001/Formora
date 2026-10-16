import React, { useState } from 'react';
import {
  X,
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  FileDown,
  Check,
  Eye,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { FormModel, FormResponse, AIResponseInsight } from '../types/form';
import {
  exportResponsesToCSV,
  exportResponsesToJSON,
  exportBlankFormWord,
  exportReportWord,
} from '../utils/exports';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: FormModel;
  responses: FormResponse[];
  aiInsight?: AIResponseInsight | null;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen,
  onClose,
  form,
  responses,
  aiInsight,
}) => {
  // Configurable sections for the report builder
  const [includeOverview, setIncludeOverview] = useState(true);
  const [includeQuestionCharts, setIncludeQuestionCharts] = useState(true);
  const [includeAiInsights, setIncludeAiInsights] = useState(true);
  const [includeStatisticalTests, setIncludeStatisticalTests] = useState(true);
  const [includeRawDataSample, setIncludeRawDataSample] = useState(false);

  // Preview Mode
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  if (!isOpen) return null;

  const validResponses = responses.filter((r) => r.status !== 'excluded');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-[#191D1A] rounded-2xl border border-[#E2E4DF] dark:border-[#272C28] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E4DF] dark:border-[#272C28]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E8F3EE] dark:bg-[#172D24] text-[#176B52] dark:text-[#228B6B] flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#171918] dark:text-[#F0F2EE]">
                Report Builder & Export Suite
              </h3>
              <p className="text-xs text-[#737873] dark:text-[#9BA19B]">
                Configure and download executive summaries, datasets, and blank questionnaires
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Section 1: Report Configuration Checkboxes */}
          <div>
            <h4 className="text-xs font-semibold text-[#171918] dark:text-[#F0F2EE] uppercase tracking-wider mb-3">
              1. Customize Report Content Sections
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-[#E2E4DF] dark:border-[#272C28] cursor-pointer hover:bg-[#F7F7F4] dark:hover:bg-[#111412] transition-colors">
                <input
                  type="checkbox"
                  checked={includeOverview}
                  onChange={(e) => setIncludeOverview(e.target.checked)}
                  className="rounded text-[#176B52]"
                />
                <span className="font-medium text-[#171918] dark:text-[#F0F2EE]">Executive KPI Overview</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-[#E2E4DF] dark:border-[#272C28] cursor-pointer hover:bg-[#F7F7F4] dark:hover:bg-[#111412] transition-colors">
                <input
                  type="checkbox"
                  checked={includeQuestionCharts}
                  onChange={(e) => setIncludeQuestionCharts(e.target.checked)}
                  className="rounded text-[#176B52]"
                />
                <span className="font-medium text-[#171918] dark:text-[#F0F2EE]">Question-Level Breakdown</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-[#E2E4DF] dark:border-[#272C28] cursor-pointer hover:bg-[#F7F7F4] dark:hover:bg-[#111412] transition-colors">
                <input
                  type="checkbox"
                  checked={includeAiInsights}
                  onChange={(e) => setIncludeAiInsights(e.target.checked)}
                  className="rounded text-[#176B52]"
                />
                <span className="font-medium text-[#171918] dark:text-[#F0F2EE]">AI Insights & Sentiment Synthesis</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-[#E2E4DF] dark:border-[#272C28] cursor-pointer hover:bg-[#F7F7F4] dark:hover:bg-[#111412] transition-colors">
                <input
                  type="checkbox"
                  checked={includeStatisticalTests}
                  onChange={(e) => setIncludeStatisticalTests(e.target.checked)}
                  className="rounded text-[#176B52]"
                />
                <span className="font-medium text-[#171918] dark:text-[#F0F2EE]">Statistical Summary (t-test / ANOVA)</span>
              </label>
            </div>
          </div>

          {/* Section 2: Download Format Actions */}
          <div className="pt-4 border-t border-[#E2E4DF] dark:border-[#272C28]">
            <h4 className="text-xs font-semibold text-[#171918] dark:text-[#F0F2EE] uppercase tracking-wider mb-3">
              2. Download Formats
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Word Executive Report */}
              <button
                onClick={() => exportReportWord(form, validResponses, aiInsight?.summary)}
                className="p-3.5 bg-[#F7F7F4] dark:bg-[#111412] hover:bg-[#F0F2ED] dark:hover:bg-[#222723] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] text-left transition-colors flex items-start gap-3"
              >
                <FileText className="w-5 h-5 text-[#176B52] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-[#171918] dark:text-[#F0F2EE]">
                    Word Executive Report (.doc)
                  </div>
                  <div className="text-[11px] text-[#737873] dark:text-[#9BA19B]">
                    Formatted report with charts, stats & AI summary
                  </div>
                </div>
              </button>

              {/* Printable PDF Preview */}
              <button
                onClick={() => setShowPrintPreview(true)}
                className="p-3.5 bg-[#F7F7F4] dark:bg-[#111412] hover:bg-[#F0F2ED] dark:hover:bg-[#222723] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] text-left transition-colors flex items-start gap-3"
              >
                <Printer className="w-5 h-5 text-[#176B52] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-[#171918] dark:text-[#F0F2EE]">
                    Print / Save to PDF
                  </div>
                  <div className="text-[11px] text-[#737873] dark:text-[#9BA19B]">
                    Clean printable executive layout with page breaks
                  </div>
                </div>
              </button>

              {/* CSV Raw Data */}
              <button
                onClick={() => exportResponsesToCSV(form, validResponses)}
                className="p-3.5 bg-[#F7F7F4] dark:bg-[#111412] hover:bg-[#F0F2ED] dark:hover:bg-[#222723] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] text-left transition-colors flex items-start gap-3"
              >
                <FileSpreadsheet className="w-5 h-5 text-[#176B52] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-[#171918] dark:text-[#F0F2EE]">
                    Raw Responses (CSV)
                  </div>
                  <div className="text-[11px] text-[#737873] dark:text-[#9BA19B]">
                    Tidy tabular data for Excel, SPSS, or Python
                  </div>
                </div>
              </button>

              {/* Blank Questionnaire Word */}
              <button
                onClick={() => exportBlankFormWord(form)}
                className="p-3.5 bg-[#F7F7F4] dark:bg-[#111412] hover:bg-[#F0F2ED] dark:hover:bg-[#222723] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] text-left transition-colors flex items-start gap-3"
              >
                <FileDown className="w-5 h-5 text-[#176B52] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-[#171918] dark:text-[#F0F2EE]">
                    Blank Form (Word DOC)
                  </div>
                  <div className="text-[11px] text-[#737873] dark:text-[#9BA19B]">
                    Printable paper questionnaire for offline field collection
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Section 3: Live Printable Preview Modal */}
          {showPrintPreview && (
            <div className="p-4 bg-[#F7F7F4] dark:bg-[#111412] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#171918] dark:text-[#F0F2EE]">
                  Live Report Print View
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-[#176B52] hover:bg-[#125541] rounded-md shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / Save PDF</span>
                  </button>
                  <button
                    onClick={() => setShowPrintPreview(false)}
                    className="text-xs text-[#737873] hover:underline"
                  >
                    Dismiss Preview
                  </button>
                </div>
              </div>

              {/* Document Preview Box */}
              <div className="bg-white text-black p-6 rounded-lg border border-[#E2E4DF] shadow-sm max-h-64 overflow-y-auto font-sans text-xs space-y-4">
                <div className="border-b pb-3">
                  <h2 className="text-lg font-bold text-[#176B52]">{form.title}</h2>
                  <p className="text-[10px] text-gray-500">Executive Report · Formora Intelligence</p>
                </div>

                {includeOverview && (
                  <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded border text-center">
                    <div>
                      <div className="text-base font-bold text-[#176B52]">{validResponses.length}</div>
                      <div className="text-[9px] uppercase text-gray-500">Submissions</div>
                    </div>
                    <div>
                      <div className="text-base font-bold text-[#176B52]">100%</div>
                      <div className="text-[9px] uppercase text-gray-500">Completion Rate</div>
                    </div>
                    <div>
                      <div className="text-base font-bold text-[#176B52]">
                        {Math.round(validResponses.reduce((a, b) => a + (b.completionTimeSeconds || 60), 0) / (validResponses.length || 1))}s
                      </div>
                      <div className="text-[9px] uppercase text-gray-500">Avg. Duration</div>
                    </div>
                  </div>
                )}

                {includeAiInsights && aiInsight && (
                  <div className="p-3 bg-emerald-50 border-l-2 border-[#176B52] rounded text-[11px] leading-relaxed">
                    <strong className="block text-[#176B52] mb-0.5">Executive Findings:</strong>
                    {aiInsight.summary}
                  </div>
                )}

                {includeQuestionCharts && (
                  <div className="space-y-2">
                    <strong className="block text-[11px]">Question Breakdown:</strong>
                    {form.questions.slice(0, 4).map((q, i) => (
                      <div key={q.id} className="p-2 border rounded">
                        <span className="font-semibold">{i + 1}. {q.title}</span>
                      </div>
                    ))}
                  </div>
                )}
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
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
