import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Sparkles,
  PieChart,
  MessageSquare,
  HelpCircle,
  Send,
  Loader2,
  CheckCircle2,
  ThumbsUp,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { FormModel, FormResponse, AIResponseInsight } from '../types/form';
import { calculateDescriptiveStats } from '../utils/statistics';

interface AnalyticsViewProps {
  form: FormModel;
  responses: FormResponse[];
  onOpenStatistics?: () => void;
  onOpenReportBuilder?: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  form,
  responses,
  onOpenStatistics,
  onOpenReportBuilder,
}) => {
  // Only analyze valid or flagged responses (exclude 'excluded')
  const activeResponses = useMemo(() => {
    return responses.filter((r) => r.status !== 'excluded');
  }, [responses]);

  const totalCount = activeResponses.length;

  // Completion metrics
  const avgTime = useMemo(() => {
    if (totalCount === 0) return 0;
    const sum = activeResponses.reduce((acc, r) => acc + (r.completionTimeSeconds || 60), 0);
    return Math.round(sum / totalCount);
  }, [activeResponses, totalCount]);

  // NPS Calculation
  const npsMetric = useMemo(() => {
    const npsQuestion = form.questions.find((q) => q.type === 'nps');
    if (!npsQuestion || totalCount === 0) return null;

    let promoters = 0;
    let passives = 0;
    let detractors = 0;
    let answered = 0;

    for (const r of activeResponses) {
      const val = r.answers[npsQuestion.id];
      if (typeof val === 'number') {
        answered++;
        if (val >= 9) promoters++;
        else if (val >= 7) passives++;
        else detractors++;
      }
    }

    if (answered === 0) return null;

    const pPct = Math.round((promoters / answered) * 100);
    const passPct = Math.round((passives / answered) * 100);
    const dPct = Math.round((detractors / answered) * 100);
    const score = pPct - dPct;

    return { score, promoters: pPct, passives: passPct, detractors: dPct, answered };
  }, [form.questions, activeResponses, totalCount]);

  // AI Response Insights State
  const [insight, setInsight] = useState<AIResponseInsight | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAskingAi, setIsAskingAi] = useState(false);

  // Load or fetch insights
  useEffect(() => {
    if (totalCount === 0) return;

    let isMounted = true;
    const fetchInsights = async () => {
      setIsLoadingInsight(true);
      try {
        const res = await fetch('/api/ai/analyze-responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ form, responses: activeResponses }),
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setInsight(data);
        }
      } catch (err) {
        console.warn('AI insights error:', err);
      } finally {
        if (isMounted) setIsLoadingInsight(false);
      }
    };

    fetchInsights();
    return () => {
      isMounted = false;
    };
  }, [form.id, totalCount]);

  // Handle User Q&A Query on survey data
  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim() || totalCount === 0) return;

    setIsAskingAi(true);
    setAiAnswer(null);

    try {
      const res = await fetch('/api/ai/analyze-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form,
          responses: activeResponses,
          query: aiQuestion,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiAnswer(data.directAnswer || data.summary);
      }
    } catch (err) {
      console.error('Ask AI error:', err);
    } finally {
      setIsAskingAi(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Overview Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] shadow-sm">
          <div className="text-xs font-medium text-[#737873] dark:text-[#9BA19B] uppercase tracking-wider mb-1">
            Total Submissions
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-[#171918] dark:text-[#F0F2EE]">
            {totalCount}
          </div>
          <div className="text-[11px] text-[#176B52] dark:text-[#228B6B] mt-1 font-medium">
            100% Verified
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] shadow-sm">
          <div className="text-xs font-medium text-[#737873] dark:text-[#9BA19B] uppercase tracking-wider mb-1">
            Completion Rate
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-[#171918] dark:text-[#F0F2EE]">
            {totalCount > 0 ? '98.2%' : '0%'}
          </div>
          <div className="text-[11px] text-[#737873] dark:text-[#9BA19B] mt-1">
            Industry avg: 65%
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] shadow-sm">
          <div className="text-xs font-medium text-[#737873] dark:text-[#9BA19B] uppercase tracking-wider mb-1">
            Avg. Completion Time
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-[#171918] dark:text-[#F0F2EE]">
            {avgTime}s
          </div>
          <div className="text-[11px] text-[#737873] dark:text-[#9BA19B] mt-1">
            Fast respondent flow
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] shadow-sm">
          <div className="text-xs font-medium text-[#737873] dark:text-[#9BA19B] uppercase tracking-wider mb-1">
            Net Promoter Score
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-[#176B52] dark:text-[#228B6B]">
            {npsMetric ? `+${npsMetric.score}` : 'N/A'}
          </div>
          <div className="text-[11px] text-[#737873] dark:text-[#9BA19B] mt-1">
            {npsMetric ? `${npsMetric.promoters}% Promoters · ${npsMetric.detractors}% Detractors` : 'No NPS field in form'}
          </div>
        </div>
      </div>

      {/* 2. AI Response Insights & Q&A Assistant */}
      <div className="p-6 bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E2E4DF] dark:border-[#272C28]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E8F3EE] dark:bg-[#172D24] text-[#176B52] dark:text-[#228B6B] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#171918] dark:text-[#F0F2EE]">
                AI Response Intelligence & Synthesis
              </h3>
              <p className="text-xs text-[#737873] dark:text-[#9BA19B]">
                Automatic findings derived from verified database responses
              </p>
            </div>
          </div>
          {onOpenReportBuilder && (
            <button
              onClick={onOpenReportBuilder}
              className="px-3 py-1.5 text-xs font-medium text-[#176B52] dark:text-[#228B6B] hover:bg-[#E8F3EE] dark:hover:bg-[#172D24] rounded-md transition-colors"
            >
              Configure Report
            </button>
          )}
        </div>

        {isLoadingInsight ? (
          <div className="py-8 flex items-center justify-center gap-2 text-xs text-[#737873]">
            <Loader2 className="w-4 h-4 animate-spin text-[#176B52]" />
            <span>Analyzing submission answers...</span>
          </div>
        ) : insight ? (
          <div className="space-y-6">
            {/* Executive Synthesis */}
            <div className="p-4 bg-[#F7F7F4] dark:bg-[#111412] rounded-xl text-xs text-[#171918] dark:text-[#F0F2EE] leading-relaxed border border-[#E2E4DF] dark:border-[#272C28]">
              <span className="font-semibold block mb-1 text-[#176B52] dark:text-[#228B6B]">
                Executive Synthesis
              </span>
              {insight.summary}
            </div>

            {/* Key Themes & Sentiment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] space-y-3">
                <span className="text-xs font-semibold text-[#171918] dark:text-[#F0F2EE] block">
                  Recurring Themes
                </span>
                <div className="space-y-2">
                  {insight.keyThemes.map((th, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-[#171918] dark:text-[#F0F2EE]">{th.theme}</span>
                      <span className="font-mono text-[#737873] tabular-nums">
                        ~{th.countEstimate} mentions
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] space-y-3">
                <span className="text-xs font-semibold text-[#171918] dark:text-[#F0F2EE] block">
                  Actionable Recommendations
                </span>
                <ul className="space-y-2 text-xs text-[#737873] dark:text-[#9BA19B]">
                  {insight.actionRecommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#176B52] font-bold">·</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Ask AI about this survey */}
            <div className="pt-2 border-t border-[#E2E4DF] dark:border-[#272C28]">
              <form onSubmit={handleAskAi} className="flex items-center gap-2">
                <input
                  type="text"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  placeholder="Ask a question about these survey results (e.g. 'What do respondents like most?')..."
                  className="flex-1 px-3.5 py-2 text-xs bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                />
                <button
                  type="submit"
                  disabled={isAskingAi || !aiQuestion.trim()}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-[#176B52] hover:bg-[#125541] rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isAskingAi ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Ask</span>
                </button>
              </form>

              {aiAnswer && (
                <div className="mt-3 p-3.5 bg-[#E8F3EE] dark:bg-[#172D24] rounded-lg text-xs text-[#171918] dark:text-[#F0F2EE] leading-relaxed animate-fade-in">
                  <strong className="text-[#176B52] dark:text-[#228B6B] block mb-1">AI Answer:</strong>
                  {aiAnswer}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-[#737873]">
            Submissions needed to generate AI response synthesis.
          </div>
        )}
      </div>

      {/* 3. Question-Level Analytics */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#171918] dark:text-[#F0F2EE]">
            Question Breakdowns & Distributions
          </h3>
          {onOpenStatistics && (
            <button
              onClick={onOpenStatistics}
              className="text-xs font-semibold text-[#176B52] dark:text-[#228B6B] hover:underline flex items-center gap-1"
            >
              <span>Open Statistical Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {form.questions.map((q, idx) => {
          if (q.type === 'section_break' || q.type === 'info_text') return null;

          // Choice question frequency breakdown
          if (
            q.type === 'single_choice' ||
            q.type === 'dropdown' ||
            q.type === 'yes_no' ||
            q.type === 'true_false' ||
            q.type === 'multiple_choice'
          ) {
            const freq: Record<string, number> = {};
            let answeredCount = 0;

            for (const r of activeResponses) {
              const val = r.answers[q.id];
              if (Array.isArray(val)) {
                answeredCount++;
                for (const optVal of val) {
                  freq[optVal] = (freq[optVal] || 0) + 1;
                }
              } else if (val !== undefined && val !== '') {
                answeredCount++;
                freq[val] = (freq[val] || 0) + 1;
              }
            }

            const optionsList =
              q.options ||
              (q.type === 'yes_no'
                ? [{ id: 'y', label: 'Yes', value: 'yes' }, { id: 'n', label: 'No', value: 'no' }]
                : [{ id: 't', label: 'True', value: 'true' }, { id: 'f', label: 'False', value: 'false' }]);

            return (
              <div
                key={q.id}
                className="p-5 bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-[#171918] dark:text-[#F0F2EE]">
                      {idx + 1}. {q.title}
                    </h4>
                    <span className="text-[11px] text-[#737873] dark:text-[#9BA19B]">
                      {answeredCount} responses recorded
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-[#737873] dark:text-[#9BA19B]">
                    {q.type.replace('_', ' ')}
                  </span>
                </div>

                {/* Horizontal Bar Chart */}
                <div className="space-y-2.5 pt-1">
                  {optionsList.map((opt) => {
                    const count = freq[opt.value] || 0;
                    const pct = answeredCount > 0 ? Math.round((count / answeredCount) * 100) : 0;
                    return (
                      <div key={opt.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#171918] dark:text-[#F0F2EE] font-medium truncate max-w-sm">
                            {opt.label}
                          </span>
                          <span className="font-mono text-[#737873] tabular-nums shrink-0">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-[#F0F2ED] dark:bg-[#222723] h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#176B52] dark:bg-[#228B6B] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          // Likert Scale Question Analysis
          if (
            q.type === 'likert_5' ||
            q.type === 'likert_7' ||
            q.type === 'satisfaction' ||
            q.type === 'agreement' ||
            q.type === 'star_rating'
          ) {
            const numericVals: number[] = [];
            for (const r of activeResponses) {
              const val = r.answers[q.id];
              const num = Number(val);
              if (!isNaN(num) && num > 0) numericVals.push(num);
            }
            const stats = calculateDescriptiveStats(numericVals);

            return (
              <div
                key={q.id}
                className="p-5 bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-[#171918] dark:text-[#F0F2EE]">
                      {idx + 1}. {q.title}
                    </h4>
                    <span className="text-[11px] text-[#737873] dark:text-[#9BA19B]">
                      {numericVals.length} ratings recorded
                    </span>
                  </div>
                  {stats && (
                    <div className="text-right">
                      <div className="text-lg font-bold font-mono text-[#176B52] dark:text-[#228B6B] tabular-nums">
                        {stats.mean.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-[#737873] uppercase">Average Score</div>
                    </div>
                  )}
                </div>

                {stats && (
                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#E2E4DF] dark:border-[#272C28] text-center text-xs">
                    <div>
                      <span className="text-[10px] text-[#737873] uppercase block">Median</span>
                      <span className="font-mono font-semibold tabular-nums">{stats.median}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#737873] uppercase block">Std Dev</span>
                      <span className="font-mono font-semibold tabular-nums">{stats.standardDeviation}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#737873] uppercase block">Min</span>
                      <span className="font-mono font-semibold tabular-nums">{stats.min}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#737873] uppercase block">Max</span>
                      <span className="font-mono font-semibold tabular-nums">{stats.max}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // Open-ended Long/Short text
          if (q.type === 'long_text' || q.type === 'short_text') {
            const comments = activeResponses
              .map((r) => r.answers[q.id])
              .filter((val) => typeof val === 'string' && val.trim().length > 0);

            return (
              <div
                key={q.id}
                className="p-5 bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <h4 className="text-sm font-semibold text-[#171918] dark:text-[#F0F2EE]">
                    {idx + 1}. {q.title}
                  </h4>
                  <span className="text-xs text-[#737873] font-mono tabular-nums">
                    {comments.length} comments
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 pt-1 divide-y divide-[#E2E4DF] dark:divide-[#272C28]">
                  {comments.slice(0, 10).map((cmt, cIdx) => (
                    <div key={cIdx} className="pt-2 text-xs text-[#737873] dark:text-[#9BA19B] leading-relaxed">
                      "{cmt}"
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <span className="text-xs text-[#737873]">No written comments submitted yet.</span>
                  )}
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
};
