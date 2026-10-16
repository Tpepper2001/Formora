import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Upload,
  ArrowRight,
  Info,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { FormModel, FormResponse } from '../types/form';
import {
  calculateDescriptiveStats,
  calculateChiSquare,
  calculateIndependentTTest,
  calculateOneWayAnova,
  calculateCorrelation,
  calculateCronbachAlpha,
  DescriptiveStats,
  ChiSquareResult,
  TTestResult,
  AnovaResult,
  CorrelationResult,
  CronbachAlphaResult,
} from '../utils/statistics';

interface StatisticsWorkspaceProps {
  form: FormModel;
  responses: FormResponse[];
}

export const StatisticsWorkspace: React.FC<StatisticsWorkspaceProps> = ({ form, responses }) => {
  const [selectedModule, setSelectedModule] = useState<
    'descriptive' | 'crosstab' | 'ttest' | 'anova' | 'correlation' | 'cronbach' | 'external'
  >('descriptive');

  // Filter valid responses
  const activeResponses = useMemo(() => {
    return responses.filter((r) => r.status !== 'excluded');
  }, [responses]);

  // Extract numeric and categorical questions
  const numericQuestions = useMemo(() => {
    return form.questions.filter((q) =>
      ['likert_5', 'likert_7', 'nps', 'number', 'star_rating', 'satisfaction', 'agreement'].includes(
        q.type
      )
    );
  }, [form.questions]);

  const categoricalQuestions = useMemo(() => {
    return form.questions.filter((q) =>
      ['single_choice', 'dropdown', 'yes_no', 'true_false'].includes(q.type)
    );
  }, [form.questions]);

  // Module 1: Descriptive State
  const [selectedDescQ, setSelectedDescQ] = useState<string>(numericQuestions[0]?.id || '');
  const descStats = useMemo<DescriptiveStats | null>(() => {
    if (!selectedDescQ) return null;
    const values = activeResponses
      .map((r) => Number(r.answers[selectedDescQ]))
      .filter((v) => !isNaN(v) && v > 0);
    return calculateDescriptiveStats(values);
  }, [selectedDescQ, activeResponses]);

  // Module 2: Chi-Square State
  const [rowVar, setRowVar] = useState<string>(categoricalQuestions[0]?.id || '');
  const [colVar, setColVar] = useState<string>(categoricalQuestions[1]?.id || categoricalQuestions[0]?.id || '');
  const chiSquareResult = useMemo<ChiSquareResult | null>(() => {
    const qRow = form.questions.find((q) => q.id === rowVar);
    const qCol = form.questions.find((q) => q.id === colVar);
    if (!qRow || !qCol || !qRow.options || !qCol.options) return null;

    const rowLabels = qRow.options.map((o) => o.label);
    const colLabels = qCol.options.map((o) => o.label);
    const rowValues = qRow.options.map((o) => o.value);
    const colValues = qCol.options.map((o) => o.value);

    const table: number[][] = rowValues.map(() => colValues.map(() => 0));

    for (const r of activeResponses) {
      const rAns = r.answers[rowVar];
      const cAns = r.answers[colVar];
      const rIdx = rowValues.indexOf(rAns);
      const cIdx = colValues.indexOf(cAns);
      if (rIdx >= 0 && cIdx >= 0) {
        table[rIdx][cIdx] += 1;
      }
    }

    return calculateChiSquare(rowLabels, colLabels, table);
  }, [rowVar, colVar, form.questions, activeResponses]);

  // Module 3: T-Test State (Group by categorical question with 2 options)
  const [ttestGroupingQ, setTtestGroupingQ] = useState<string>(categoricalQuestions[0]?.id || '');
  const [ttestOutcomeQ, setTtestOutcomeQ] = useState<string>(numericQuestions[0]?.id || '');
  const ttestResult = useMemo<TTestResult | null>(() => {
    const groupQ = form.questions.find((q) => q.id === ttestGroupingQ);
    if (!groupQ || !groupQ.options || groupQ.options.length < 2) return null;

    const g1Opt = groupQ.options[0];
    const g2Opt = groupQ.options[1];

    const g1Data: number[] = [];
    const g2Data: number[] = [];

    for (const r of activeResponses) {
      const gVal = r.answers[ttestGroupingQ];
      const numVal = Number(r.answers[ttestOutcomeQ]);
      if (isNaN(numVal) || numVal <= 0) continue;

      if (gVal === g1Opt.value) g1Data.push(numVal);
      else if (gVal === g2Opt.value) g2Data.push(numVal);
    }

    return calculateIndependentTTest(g1Opt.label, g1Data, g2Opt.label, g2Data);
  }, [ttestGroupingQ, ttestOutcomeQ, form.questions, activeResponses]);

  // Module 4: ANOVA State (Group by category with >= 2 groups)
  const [anovaGroupingQ, setAnovaGroupingQ] = useState<string>(categoricalQuestions[0]?.id || '');
  const [anovaOutcomeQ, setAnovaOutcomeQ] = useState<string>(numericQuestions[0]?.id || '');
  const anovaResult = useMemo<AnovaResult | null>(() => {
    const groupQ = form.questions.find((q) => q.id === anovaGroupingQ);
    if (!groupQ || !groupQ.options || groupQ.options.length < 2) return null;

    const groups = groupQ.options.map((opt) => {
      const data = activeResponses
        .filter((r) => r.answers[anovaGroupingQ] === opt.value)
        .map((r) => Number(r.answers[anovaOutcomeQ]))
        .filter((n) => !isNaN(n) && n > 0);
      return { name: opt.label, data };
    });

    return calculateOneWayAnova(groups);
  }, [anovaGroupingQ, anovaOutcomeQ, form.questions, activeResponses]);

  // Module 5: Correlation State
  const [corrVar1, setCorrVar1] = useState<string>(numericQuestions[0]?.id || '');
  const [corrVar2, setCorrVar2] = useState<string>(numericQuestions[1]?.id || numericQuestions[0]?.id || '');
  const correlationResult = useMemo<CorrelationResult | null>(() => {
    const q1 = form.questions.find((q) => q.id === corrVar1);
    const q2 = form.questions.find((q) => q.id === corrVar2);
    if (!q1 || !q2) return null;

    const x: number[] = [];
    const y: number[] = [];

    for (const r of activeResponses) {
      const xVal = Number(r.answers[corrVar1]);
      const yVal = Number(r.answers[corrVar2]);
      if (!isNaN(xVal) && !isNaN(yVal) && xVal > 0 && yVal > 0) {
        x.push(xVal);
        y.push(yVal);
      }
    }

    return calculateCorrelation(q1.title, x, q2.title, y);
  }, [corrVar1, corrVar2, form.questions, activeResponses]);

  // Module 6: Cronbach's Alpha (Scale Reliability)
  const cronbachResult = useMemo<CronbachAlphaResult | null>(() => {
    if (numericQuestions.length < 2) return null;

    const items = numericQuestions.map((q) => {
      const scores = activeResponses.map((r) => {
        const val = Number(r.answers[q.id]);
        return isNaN(val) ? 0 : val;
      });
      return { id: q.id, title: q.title, scores };
    });

    return calculateCronbachAlpha(form.title, items);
  }, [numericQuestions, activeResponses, form.title]);

  // External CSV upload for ad-hoc tests
  const [externalFileName, setExternalFileName] = useState('');
  const [externalRowCount, setExternalRowCount] = useState(0);

  const handleExternalCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExternalFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      setExternalRowCount(Math.max(0, lines.length - 1));
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Notice Header */}
      <div className="p-4 bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#176B52] dark:text-[#228B6B]" />
            <h2 className="text-base font-bold text-[#171918] dark:text-[#F0F2EE]">
              Statistical Analysis Workspace
            </h2>
          </div>
          <p className="text-xs text-[#737873] dark:text-[#9BA19B] mt-1">
            Real mathematical computation engine. Calculations include degrees of freedom, effect sizes, and p-values.
          </p>
        </div>

        {/* External CSV Import */}
        <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#171918] dark:text-[#F0F2EE] bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-lg cursor-pointer hover:bg-[#F0F2ED] transition-colors shrink-0">
          <Upload className="w-3.5 h-3.5 text-[#176B52]" />
          <span>{externalFileName ? `${externalFileName} (${externalRowCount} rows)` : 'Import External CSV'}</span>
          <input type="file" accept=".csv" onChange={handleExternalCsv} className="hidden" />
        </label>
      </div>

      {/* Module Selector Navigation (Segmented buttons) */}
      <div className="flex items-center gap-1 p-1 bg-[#F0F2ED] dark:bg-[#191D1A] border border-[#E2E4DF] dark:border-[#272C28] rounded-lg text-xs font-medium overflow-x-auto">
        <button
          onClick={() => setSelectedModule('descriptive')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
            selectedModule === 'descriptive'
              ? 'bg-white dark:bg-[#222723] text-[#171918] dark:text-[#F0F2EE] shadow-sm font-semibold'
              : 'text-[#737873] dark:text-[#9BA19B]'
          }`}
        >
          Descriptive Statistics
        </button>
        <button
          onClick={() => setSelectedModule('crosstab')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
            selectedModule === 'crosstab'
              ? 'bg-white dark:bg-[#222723] text-[#171918] dark:text-[#F0F2EE] shadow-sm font-semibold'
              : 'text-[#737873] dark:text-[#9BA19B]'
          }`}
        >
          Chi-Square (χ²)
        </button>
        <button
          onClick={() => setSelectedModule('ttest')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
            selectedModule === 'ttest'
              ? 'bg-white dark:bg-[#222723] text-[#171918] dark:text-[#F0F2EE] shadow-sm font-semibold'
              : 'text-[#737873] dark:text-[#9BA19B]'
          }`}
        >
          Two-Sample t-Test
        </button>
        <button
          onClick={() => setSelectedModule('anova')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
            selectedModule === 'anova'
              ? 'bg-white dark:bg-[#222723] text-[#171918] dark:text-[#F0F2EE] shadow-sm font-semibold'
              : 'text-[#737873] dark:text-[#9BA19B]'
          }`}
        >
          One-Way ANOVA
        </button>
        <button
          onClick={() => setSelectedModule('correlation')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
            selectedModule === 'correlation'
              ? 'bg-white dark:bg-[#222723] text-[#171918] dark:text-[#F0F2EE] shadow-sm font-semibold'
              : 'text-[#737873] dark:text-[#9BA19B]'
          }`}
        >
          Pearson & Spearman Correlation
        </button>
        <button
          onClick={() => setSelectedModule('cronbach')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
            selectedModule === 'cronbach'
              ? 'bg-white dark:bg-[#222723] text-[#171918] dark:text-[#F0F2EE] shadow-sm font-semibold'
              : 'text-[#737873] dark:text-[#9BA19B]'
          }`}
        >
          Cronbach's Alpha (Reliability)
        </button>
      </div>

      {/* MODULE 1: Descriptive Statistics */}
      {selectedModule === 'descriptive' && (
        <div className="bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-[#171918] dark:text-[#F0F2EE]">
                Descriptive Statistical Distribution
              </h3>
              <p className="text-xs text-[#737873] dark:text-[#9BA19B]">
                Parametric and non-parametric summary measures of central tendency and dispersion.
              </p>
            </div>

            <select
              value={selectedDescQ}
              onChange={(e) => setSelectedDescQ(e.target.value)}
              className="px-3 py-1.5 text-xs bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-md font-medium"
            >
              {numericQuestions.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title}
                </option>
              ))}
            </select>
          </div>

          {descStats ? (
            <div className="space-y-6">
              {/* Stat Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3.5 bg-[#F7F7F4] dark:bg-[#111412] rounded-lg border border-[#E2E4DF] dark:border-[#272C28]">
                  <span className="text-[10px] text-[#737873] uppercase block">Mean (μ)</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-[#171918] dark:text-[#F0F2EE]">
                    {descStats.mean}
                  </span>
                </div>
                <div className="p-3.5 bg-[#F7F7F4] dark:bg-[#111412] rounded-lg border border-[#E2E4DF] dark:border-[#272C28]">
                  <span className="text-[10px] text-[#737873] uppercase block">Median</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-[#171918] dark:text-[#F0F2EE]">
                    {descStats.median}
                  </span>
                </div>
                <div className="p-3.5 bg-[#F7F7F4] dark:bg-[#111412] rounded-lg border border-[#E2E4DF] dark:border-[#272C28]">
                  <span className="text-[10px] text-[#737873] uppercase block">Std Deviation (σ)</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-[#171918] dark:text-[#F0F2EE]">
                    {descStats.standardDeviation}
                  </span>
                </div>
                <div className="p-3.5 bg-[#F7F7F4] dark:bg-[#111412] rounded-lg border border-[#E2E4DF] dark:border-[#272C28]">
                  <span className="text-[10px] text-[#737873] uppercase block">Variance (s²)</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-[#171918] dark:text-[#F0F2EE]">
                    {descStats.variance}
                  </span>
                </div>
              </div>

              {/* Extended Metrics Table */}
              <div className="border border-[#E2E4DF] dark:border-[#272C28] rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-[#E2E4DF] dark:divide-[#272C28]">
                    <tr>
                      <td className="p-3 font-medium text-[#737873]">Sample Size (n)</td>
                      <td className="p-3 font-mono tabular-nums font-semibold">{descStats.count}</td>
                      <td className="p-3 font-medium text-[#737873]">Range (Max - Min)</td>
                      <td className="p-3 font-mono tabular-nums font-semibold">{descStats.range} ({descStats.min} to {descStats.max})</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-[#737873]">Interquartile Range (IQR)</td>
                      <td className="p-3 font-mono tabular-nums font-semibold">{descStats.iqr} (Q1: {descStats.q1}, Q3: {descStats.q3})</td>
                      <td className="p-3 font-medium text-[#737873]">Skewness</td>
                      <td className="p-3 font-mono tabular-nums font-semibold">{descStats.skewness}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-[#737873]">Kurtosis (Excess)</td>
                      <td className="p-3 font-mono tabular-nums font-semibold">{descStats.kurtosis}</td>
                      <td className="p-3 font-medium text-[#737873]">95% Confidence Interval</td>
                      <td className="p-3 font-mono tabular-nums font-semibold">[{descStats.confidenceInterval95[0]}, {descStats.confidenceInterval95[1]}]</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#737873]">
              Select a valid numeric or rating question with responses to calculate descriptive statistics.
            </div>
          )}
        </div>
      )}

      {/* MODULE 2: Chi-Square Test */}
      {selectedModule === 'crosstab' && (
        <div className="bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-[#E2E4DF] dark:border-[#272C28]">
            <div>
              <label className="block text-xs font-semibold text-[#171918] dark:text-[#F0F2EE] mb-1">
                Row Variable (Categorical)
              </label>
              <select
                value={rowVar}
                onChange={(e) => setRowVar(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-md font-medium"
              >
                {categoricalQuestions.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171918] dark:text-[#F0F2EE] mb-1">
                Column Variable (Categorical)
              </label>
              <select
                value={colVar}
                onChange={(e) => setColVar(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-md font-medium"
              >
                {categoricalQuestions.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {chiSquareResult ? (
            <div className="space-y-6">
              {/* Test Summary Pill */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3.5 bg-[#F7F7F4] dark:bg-[#111412] rounded-lg border border-[#E2E4DF] dark:border-[#272C28]">
                  <span className="text-[10px] text-[#737873] uppercase block">Chi-Square (χ²)</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-[#176B52] dark:text-[#228B6B]">
                    {chiSquareResult.chiSquare}
                  </span>
                </div>
                <div className="p-3.5 bg-[#F7F7F4] dark:bg-[#111412] rounded-lg border border-[#E2E4DF] dark:border-[#272C28]">
                  <span className="text-[10px] text-[#737873] uppercase block">Degrees of Freedom (df)</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-[#171918] dark:text-[#F0F2EE]">
                    {chiSquareResult.degreesOfFreedom}
                  </span>
                </div>
                <div className="p-3.5 bg-[#F7F7F4] dark:bg-[#111412] rounded-lg border border-[#E2E4DF] dark:border-[#272C28]">
                  <span className="text-[10px] text-[#737873] uppercase block">p-value</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-[#171918] dark:text-[#F0F2EE]">
                    {chiSquareResult.pValue < 0.001 ? '< .001' : chiSquareResult.pValue}
                  </span>
                </div>
                <div className="p-3.5 bg-[#F7F7F4] dark:bg-[#111412] rounded-lg border border-[#E2E4DF] dark:border-[#272C28]">
                  <span className="text-[10px] text-[#737873] uppercase block">Cramer's V (Effect Size)</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-[#171918] dark:text-[#F0F2EE]">
                    {chiSquareResult.cramersV}
                  </span>
                </div>
              </div>

              {/* Observed vs Expected Contingency Matrix */}
              <div className="border border-[#E2E4DF] dark:border-[#272C28] rounded-xl overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[#F7F7F4] dark:bg-[#111412] border-b border-[#E2E4DF] dark:border-[#272C28]">
                    <tr>
                      <th className="p-3 font-semibold">Row \ Col</th>
                      {chiSquareResult.columns.map((c) => (
                        <th key={c} className="p-3 font-semibold text-center">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E4DF] dark:divide-[#272C28]">
                    {chiSquareResult.rows.map((rowName, rIdx) => (
                      <tr key={rowName}>
                        <td className="p-3 font-medium text-[#171918] dark:text-[#F0F2EE]">{rowName}</td>
                        {chiSquareResult.columns.map((_, cIdx) => (
                          <td key={cIdx} className="p-3 text-center font-mono tabular-nums">
                            <span className="font-semibold">{chiSquareResult.observed[rIdx][cIdx]}</span>
                            <span className="text-[10px] text-[#737873] block">
                              exp: {chiSquareResult.expected[rIdx][cIdx]}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Plain Language Interpretation */}
              <div className="p-4 bg-[#E8F3EE] dark:bg-[#172D24] rounded-xl text-xs text-[#171918] dark:text-[#F0F2EE] leading-relaxed">
                <strong className="text-[#176B52] dark:text-[#228B6B] block mb-1">
                  Statistical Interpretation:
                </strong>
                {chiSquareResult.interpretation}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#737873]">
              Select two categorical variables with sufficient response counts.
            </div>
          )}
        </div>
      )}

      {/* MODULE 3: Independent Two-Sample T-Test */}
      {selectedModule === 'ttest' && (
        <div className="bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-[#E2E4DF] dark:border-[#272C28]">
            <div>
              <label className="block text-xs font-semibold text-[#171918] dark:text-[#F0F2EE] mb-1">
                Grouping Variable (2-group factor)
              </label>
              <select
                value={ttestGroupingQ}
                onChange={(e) => setTtestGroupingQ(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-md font-medium"
              >
                {categoricalQuestions.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171918] dark:text-[#F0F2EE] mb-1">
                Dependent Metric (Continuous or Likert)
              </label>
              <select
                value={ttestOutcomeQ}
                onChange={(e) => setTtestOutcomeQ(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-md font-medium"
              >
                {numericQuestions.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {ttestResult ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3.5 bg-[#F7F7F4] dark:bg-[#111412] rounded-lg border border-[#E2E4DF] dark:border-[#272C28]">
                  <span className="text-[10px] text-[#737873] uppercase block">t-Statistic</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-[#176B52] dark:text-[#228B6B]">
                    {ttestResult.tStatistic}
                  </span>
                </div>
                <div className="p-3.5 bg-[#F7F7F4] dark:bg-[#111412] rounded-lg border border-[#E2E4DF] dark:border-[#272C28]">
                  <span className="text-[10px] text-[#737873] uppercase block">Degrees of Freedom</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-[#171918] dark:text-[#F0F2EE]">
                    {ttestResult.degreesOfFreedom}
                  </span>
                </div>
                <div className="p-3.5 bg-[#F7F7F4] dark:bg-[#111412] rounded-lg border border-[#E2E4DF] dark:border-[#272C28]">
                  <span className="text-[10px] text-[#737873] uppercase block">p-value</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-[#171918] dark:text-[#F0F2EE]">
                    {ttestResult.pValue < 0.001 ? '< .001' : ttestResult.pValue}
                  </span>
                </div>
                <div className="p-3.5 bg-[#F7F7F4] dark:bg-[#111412] rounded-lg border border-[#E2E4DF] dark:border-[#272C28]">
                  <span className="text-[10px] text-[#737873] uppercase block">Cohen's d</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-[#171918] dark:text-[#F0F2EE]">
                    {ttestResult.cohensD}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-[#F7F7F4] dark:bg-[#111412] rounded-lg border border-[#E2E4DF] dark:border-[#272C28]">
                  <span className="font-semibold block mb-1">{ttestResult.group1.name}</span>
                  <div className="font-mono tabular-nums text-[#737873]">
                    Mean = {ttestResult.group1.mean} · SD = {ttestResult.group1.sd} · n = {ttestResult.group1.n}
                  </div>
                </div>
                <div className="p-4 bg-[#F7F7F4] dark:bg-[#111412] rounded-lg border border-[#E2E4DF] dark:border-[#272C28]">
                  <span className="font-semibold block mb-1">{ttestResult.group2.name}</span>
                  <div className="font-mono tabular-nums text-[#737873]">
                    Mean = {ttestResult.group2.mean} · SD = {ttestResult.group2.sd} · n = {ttestResult.group2.n}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#E8F3EE] dark:bg-[#172D24] rounded-xl text-xs text-[#171918] dark:text-[#F0F2EE] leading-relaxed">
                <strong className="text-[#176B52] dark:text-[#228B6B] block mb-1">
                  Plain-Language Result:
                </strong>
                {ttestResult.interpretation}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#737873]">
              Select a grouping variable with at least 2 distinct response categories.
            </div>
          )}
        </div>
      )}

      {/* MODULE 4: One-Way ANOVA */}
      {selectedModule === 'anova' && (
        <div className="bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-[#E2E4DF] dark:border-[#272C28]">
            <div>
              <label className="block text-xs font-semibold text-[#171918] dark:text-[#F0F2EE] mb-1">
                Factor Variable (Multi-group)
              </label>
              <select
                value={anovaGroupingQ}
                onChange={(e) => setAnovaGroupingQ(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-md font-medium"
              >
                {categoricalQuestions.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171918] dark:text-[#F0F2EE] mb-1">
                Dependent Metric
              </label>
              <select
                value={anovaOutcomeQ}
                onChange={(e) => setAnovaOutcomeQ(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-md font-medium"
              >
                {numericQuestions.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {anovaResult ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3.5 bg-[#F7F7F4] dark:bg-[#111412] rounded-lg border border-[#E2E4DF] dark:border-[#272C28]">
                  <span className="text-[10px] text-[#737873] uppercase block">F-Statistic</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-[#176B52] dark:text-[#228B6B]">
                    {anovaResult.fStatistic}
                  </span>
                </div>
                <div className="p-3.5 bg-[#F7F7F4] dark:bg-[#111412] rounded-lg border border-[#E2E4DF] dark:border-[#272C28]">
                  <span className="text-[10px] text-[#737873] uppercase block">df (Between, Within)</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-[#171918] dark:text-[#F0F2EE]">
                    {anovaResult.dfBetween}, {anovaResult.dfWithin}
                  </span>
                </div>
                <div className="p-3.5 bg-[#F7F7F4] dark:bg-[#111412] rounded-lg border border-[#E2E4DF] dark:border-[#272C28]">
                  <span className="text-[10px] text-[#737873] uppercase block">p-value</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-[#171918] dark:text-[#F0F2EE]">
                    {anovaResult.pValue < 0.001 ? '< .001' : anovaResult.pValue}
                  </span>
                </div>
                <div className="p-3.5 bg-[#F7F7F4] dark:bg-[#111412] rounded-lg border border-[#E2E4DF] dark:border-[#272C28]">
                  <span className="text-[10px] text-[#737873] uppercase block">Eta-Squared (η²)</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-[#171918] dark:text-[#F0F2EE]">
                    {anovaResult.etaSquared}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-[#E8F3EE] dark:bg-[#172D24] rounded-xl text-xs text-[#171918] dark:text-[#F0F2EE] leading-relaxed">
                <strong className="text-[#176B52] dark:text-[#228B6B] block mb-1">
                  ANOVA Conclusion:
                </strong>
                {anovaResult.interpretation}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#737873]">
              Select a valid factor with data across multiple groups.
            </div>
          )}
        </div>
      )}

      {/* MODULE 5: Correlation */}
      {selectedModule === 'correlation' && (
        <div className="bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-[#E2E4DF] dark:border-[#272C28]">
            <div>
              <label className="block text-xs font-semibold text-[#171918] dark:text-[#F0F2EE] mb-1">
                Variable 1 (Numeric / Likert)
              </label>
              <select
                value={corrVar1}
                onChange={(e) => setCorrVar1(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-md font-medium"
              >
                {numericQuestions.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171918] dark:text-[#F0F2EE] mb-1">
                Variable 2 (Numeric / Likert)
              </label>
              <select
                value={corrVar2}
                onChange={(e) => setCorrVar2(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-md font-medium"
              >
                {numericQuestions.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {correlationResult ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3.5 bg-[#F7F7F4] dark:bg-[#111412] rounded-lg border border-[#E2E4DF] dark:border-[#272C28]">
                  <span className="text-[10px] text-[#737873] uppercase block">Pearson r</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-[#176B52] dark:text-[#228B6B]">
                    {correlationResult.pearsonR}
                  </span>
                </div>
                <div className="p-3.5 bg-[#F7F7F4] dark:bg-[#111412] rounded-lg border border-[#E2E4DF] dark:border-[#272C28]">
                  <span className="text-[10px] text-[#737873] uppercase block">Pearson p-value</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-[#171918] dark:text-[#F0F2EE]">
                    {correlationResult.pearsonPValue < 0.001 ? '< .001' : correlationResult.pearsonPValue}
                  </span>
                </div>
                <div className="p-3.5 bg-[#F7F7F4] dark:bg-[#111412] rounded-lg border border-[#E2E4DF] dark:border-[#272C28]">
                  <span className="text-[10px] text-[#737873] uppercase block">Spearman Rho (ρ)</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-[#171918] dark:text-[#F0F2EE]">
                    {correlationResult.spearmanRho}
                  </span>
                </div>
                <div className="p-3.5 bg-[#F7F7F4] dark:bg-[#111412] rounded-lg border border-[#E2E4DF] dark:border-[#272C28]">
                  <span className="text-[10px] text-[#737873] uppercase block">Sample Size (n)</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-[#171918] dark:text-[#F0F2EE]">
                    {correlationResult.sampleSize}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-[#E8F3EE] dark:bg-[#172D24] rounded-xl text-xs text-[#171918] dark:text-[#F0F2EE] leading-relaxed">
                <strong className="text-[#176B52] dark:text-[#228B6B] block mb-1">
                  Correlation Strength:
                </strong>
                {correlationResult.interpretation}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#737873]">
              Select two continuous or rating questions with paired numeric data.
            </div>
          )}
        </div>
      )}

      {/* MODULE 6: Cronbach's Alpha */}
      {selectedModule === 'cronbach' && (
        <div className="bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-[#171918] dark:text-[#F0F2EE]">
              Survey Scale Internal Consistency (Cronbach's Alpha)
            </h3>
            <p className="text-xs text-[#737873] dark:text-[#9BA19B]">
              Evaluates whether multiple Likert rating items reliably measure the same underlying construct.
            </p>
          </div>

          {cronbachResult ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3.5 bg-[#F7F7F4] dark:bg-[#111412] rounded-lg border border-[#E2E4DF] dark:border-[#272C28]">
                  <span className="text-[10px] text-[#737873] uppercase block">Cronbach's Alpha (α)</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-[#176B52] dark:text-[#228B6B]">
                    {cronbachResult.alpha}
                  </span>
                </div>
                <div className="p-3.5 bg-[#F7F7F4] dark:bg-[#111412] rounded-lg border border-[#E2E4DF] dark:border-[#272C28]">
                  <span className="text-[10px] text-[#737873] uppercase block">Reliability Level</span>
                  <span className="text-xl font-bold text-[#171918] dark:text-[#F0F2EE]">
                    {cronbachResult.reliabilityLevel}
                  </span>
                </div>
                <div className="p-3.5 bg-[#F7F7F4] dark:bg-[#111412] rounded-lg border border-[#E2E4DF] dark:border-[#272C28]">
                  <span className="text-[10px] text-[#737873] uppercase block">Scale Items (k)</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-[#171918] dark:text-[#F0F2EE]">
                    {cronbachResult.itemCount}
                  </span>
                </div>
                <div className="p-3.5 bg-[#F7F7F4] dark:bg-[#111412] rounded-lg border border-[#E2E4DF] dark:border-[#272C28]">
                  <span className="text-[10px] text-[#737873] uppercase block">Sample Size (n)</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-[#171918] dark:text-[#F0F2EE]">
                    {cronbachResult.sampleSize}
                  </span>
                </div>
              </div>

              {/* Item-Total Statistics */}
              <div className="border border-[#E2E4DF] dark:border-[#272C28] rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[#F7F7F4] dark:bg-[#111412] border-b border-[#E2E4DF] dark:border-[#272C28]">
                    <tr>
                      <th className="p-3 font-semibold">Item Title</th>
                      <th className="p-3 font-semibold text-center">Item Mean</th>
                      <th className="p-3 font-semibold text-center">Item Variance</th>
                      <th className="p-3 font-semibold text-center">Alpha if Item Deleted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E4DF] dark:divide-[#272C28]">
                    {cronbachResult.itemStats.map((it) => (
                      <tr key={it.questionId}>
                        <td className="p-3 font-medium text-[#171918] dark:text-[#F0F2EE] truncate max-w-xs">
                          {it.questionTitle}
                        </td>
                        <td className="p-3 text-center font-mono tabular-nums">{it.itemMean}</td>
                        <td className="p-3 text-center font-mono tabular-nums">{it.itemVariance}</td>
                        <td className="p-3 text-center font-mono tabular-nums font-semibold text-[#176B52]">
                          {it.alphaIfDeleted}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-[#E8F3EE] dark:bg-[#172D24] rounded-xl text-xs text-[#171918] dark:text-[#F0F2EE] leading-relaxed">
                <strong className="text-[#176B52] dark:text-[#228B6B] block mb-1">
                  Psychometric Assessment:
                </strong>
                {cronbachResult.interpretation}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#737873]">
              At least two Likert scale items with response values are needed to measure Cronbach's alpha.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
