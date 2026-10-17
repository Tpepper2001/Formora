import React, { useState } from 'react';
import {
  Sparkles,
  FileUp,
  Sliders,
  Share2,
  BarChart3,
  Download,
  ArrowRight,
  Check,
  ChevronDown,
  Layers,
  Shield,
  FileSpreadsheet,
  HelpCircle,
  Play,
  Plus,
} from 'lucide-react';
import { FORM_TEMPLATES } from '../data/templates';

interface LandingPageProps {
  onStartCreate: (mode?: 'ai' | 'scratch' | 'upload' | 'template') => void;
  onSelectTemplate: (templateId: string) => void;
  onExploreDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartCreate,
  onSelectTemplate,
  onExploreDemo,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  const faqs = [
    {
      q: 'How does questionnaire creation work?',
      a: 'Formora provides an intuitive visual builder, pre-configured question sets for customer feedback, HR surveys, event registration, and instant parsing of question lists into structured forms with customizable validation and logic.',
    },
    {
      q: 'Can I upload Word documents or text to generate forms?',
      a: 'Yes. Formora accepts DOCX, PDF, and plain text files. The parser scans your content, extracts questions and rating criteria, and converts them into editable form fields with options you can customize.',
    },
    {
      q: 'Are respondents required to have an account to submit answers?',
      a: 'No. Formora forms are public by default and mobile-friendly. Respondents can fill out and submit responses immediately from any phone, tablet, or desktop browser without signing up.',
    },
    {
      q: 'How are response analytics and charts generated?',
      a: 'Charts and summary statistics are computed automatically from actual submission data stored in your database. Choice questions yield frequency distributions, numeric questions calculate means and medians, and open-ended text answers are grouped for analysis.',
    },
    {
      q: 'Is advanced statistical testing required to use the platform?',
      a: 'No. Advanced statistics (such as t-tests, ANOVA, Chi-Square, and Cronbach alpha) are located in an optional module for researchers and analysts who need them. Standard forms and dashboards remain simple and accessible.',
    },
    {
      q: 'What export formats are supported for reports and data?',
      a: 'You can download raw response datasets in CSV and JSON formats, export blank printable forms in Word DOC and PDF formats, and generate executive reports complete with charts and statistical summaries.',
    },
  ];

  return (
    <div className="w-full bg-[#F7F7F4] dark:bg-[#111412] text-[#171918] dark:text-[#F0F2EE] transition-colors">
      {/* 1. Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 border-b border-[#E2E4DF] dark:border-[#272C28] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#171918] dark:text-[#F0F2EE] mb-6 [text-wrap:balance]">
              Every form starts with an idea.
            </h1>
            <p className="text-lg sm:text-xl text-[#737873] dark:text-[#9BA19B] leading-relaxed mb-8 [text-wrap:balance]">
              Design questionnaires, collect live responses, and turn submissions into clear, actionable statistical insights with Formora.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onStartCreate('scratch')}
                className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-white bg-[#176B52] hover:bg-[#125541] rounded-lg shadow-sm transition-all whitespace-nowrap active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create your first form</span>
              </button>
              <button
                onClick={() => onStartCreate('template')}
                className="w-full sm:w-auto px-6 py-3.5 text-sm font-medium text-[#171918] dark:text-[#F0F2EE] bg-white dark:bg-[#191D1A] border border-[#E2E4DF] dark:border-[#272C28] hover:bg-[#F0F2ED] dark:hover:bg-[#222723] rounded-lg transition-colors whitespace-nowrap"
              >
                Explore templates
              </button>
              <button
                onClick={onExploreDemo}
                className="w-full sm:w-auto px-4 py-3.5 text-sm font-medium text-[#737873] hover:text-[#171918] dark:text-[#9BA19B] dark:hover:text-[#F0F2EE] transition-colors whitespace-nowrap flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Try live demo</span>
              </button>
            </div>
          </div>

          {/* Real Product Interface Preview using Generated Image */}
          <div className="relative max-w-5xl mx-auto rounded-xl border border-[#E2E4DF] dark:border-[#272C28] bg-white dark:bg-[#191D1A] shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-[#F7F7F4] dark:bg-[#191D1A] border-b border-[#E2E4DF] dark:border-[#272C28] text-xs text-[#737873] dark:text-[#9BA19B]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E2E4DF] dark:bg-[#272C28]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#E2E4DF] dark:bg-[#272C28]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#E2E4DF] dark:bg-[#272C28]"></span>
                <span className="ml-2 font-mono text-[11px] text-[#737873]">formora.app/form/customer-csat-2026</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <span>Respondent Experience</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#176B52] dark:text-[#228B6B]">Live Preview</span>
              </div>
            </div>
            <div className="relative aspect-[16/9] w-full bg-[#F0F2ED] dark:bg-[#111412]">
              <img
                src="/src/assets/images/hero_formora_workspace_1792094958320.jpg"
                alt="Formora interactive questionnaire builder interface"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Core Capabilities Section */}
      <section className="py-20 border-b border-[#E2E4DF] dark:border-[#272C28]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#171918] dark:text-[#F0F2EE] mb-4">
              Everything required to build, publish, and understand forms.
            </h2>
            <p className="text-[#737873] dark:text-[#9BA19B] text-base">
              From quick customer check-ins to deep academic surveys, Formora balances speed with comprehensive data controls.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28]">
              <div className="w-10 h-10 rounded-lg bg-[#E8F3EE] dark:bg-[#172D24] text-[#176B52] dark:text-[#228B6B] flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-[#171918] dark:text-[#F0F2EE] mb-2">
                Quick Form Setup
              </h3>
              <p className="text-sm text-[#737873] dark:text-[#9BA19B] leading-relaxed">
                Choose your purpose, target audience, and desired format. Formora drafts clear questions, Likert scales, and options in seconds.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28]">
              <div className="w-10 h-10 rounded-lg bg-[#E8F3EE] dark:bg-[#172D24] text-[#176B52] dark:text-[#228B6B] flex items-center justify-center mb-4">
                <FileUp className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-[#171918] dark:text-[#F0F2EE] mb-2">
                Document-to-Form Conversion
              </h3>
              <p className="text-sm text-[#737873] dark:text-[#9BA19B] leading-relaxed">
                Upload Word DOCX files, PDFs, or paste meeting briefs. The system parses text items and generates a structured digital form.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28]">
              <div className="w-10 h-10 rounded-lg bg-[#E8F3EE] dark:bg-[#172D24] text-[#176B52] dark:text-[#228B6B] flex items-center justify-center mb-4">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-[#171918] dark:text-[#F0F2EE] mb-2">
                Visual Form Editor
              </h3>
              <p className="text-sm text-[#737873] dark:text-[#9BA19B] leading-relaxed">
                Reorder questions, create multi-step sections, configure validation constraints, and preview desktop and mobile views in real time.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28]">
              <div className="w-10 h-10 rounded-lg bg-[#E8F3EE] dark:bg-[#172D24] text-[#176B52] dark:text-[#228B6B] flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-[#171918] dark:text-[#F0F2EE] mb-2">
                Conditional Logic & Branching
              </h3>
              <p className="text-sm text-[#737873] dark:text-[#9BA19B] leading-relaxed">
                Display follow-up fields dynamically based on respondent choices, route to specific sections, or conclude ineligible entries.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28]">
              <div className="w-10 h-10 rounded-lg bg-[#E8F3EE] dark:bg-[#172D24] text-[#176B52] dark:text-[#228B6B] flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-[#171918] dark:text-[#F0F2EE] mb-2">
                Automatic Response Analytics
              </h3>
              <p className="text-sm text-[#737873] dark:text-[#9BA19B] leading-relaxed">
                Real-time distributions, NPS score breakdowns, mean values for numeric ratings, and structured statistical metrics.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28]">
              <div className="w-10 h-10 rounded-lg bg-[#E8F3EE] dark:bg-[#172D24] text-[#176B52] dark:text-[#228B6B] flex items-center justify-center mb-4">
                <Download className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-[#171918] dark:text-[#F0F2EE] mb-2">
                Downloadable Reports & Datasets
              </h3>
              <p className="text-sm text-[#737873] dark:text-[#9BA19B] leading-relaxed">
                Export tidy CSV files, JSON structures, printable executive reports, and blank Word DOC forms for physical distribution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Analytics Spotlight Section with Generated Asset */}
      <section className="py-20 border-b border-[#E2E4DF] dark:border-[#272C28] bg-white dark:bg-[#191D1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#176B52] dark:text-[#228B6B]">
                Response Intelligence
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-[#171918] dark:text-[#F0F2EE] mt-2 mb-4 [text-wrap:balance]">
                Turn raw survey submissions into immediate clarity.
              </h2>
              <p className="text-[#737873] dark:text-[#9BA19B] text-base leading-relaxed mb-6">
                No manual spreadsheet formatting required. Every response stream automatically calculates completion times, choice frequencies, rating means, and Net Promoter Scores.
              </p>
              <ul className="space-y-3 text-sm text-[#171918] dark:text-[#F0F2EE] mb-8">
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#E8F3EE] dark:bg-[#172D24] text-[#176B52] dark:text-[#228B6B] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Real calculation engine grounded on actual database records</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#E8F3EE] dark:bg-[#172D24] text-[#176B52] dark:text-[#228B6B] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Ask natural language questions about your survey results</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#E8F3EE] dark:bg-[#172D24] text-[#176B52] dark:text-[#228B6B] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Optional statistics module with t-test, ANOVA, and Chi-Square</span>
                </li>
              </ul>
              <button
                onClick={onExploreDemo}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#176B52] hover:bg-[#125541] rounded-lg shadow-sm transition-all"
              >
                View sample analytics
              </button>
            </div>

            <div className="lg:col-span-7">
              <div className="rounded-xl border border-[#E2E4DF] dark:border-[#272C28] overflow-hidden shadow-md bg-[#F7F7F4] dark:bg-[#111412]">
                <img
                  src="/src/assets/images/feature_analytics_preview_1792094959466.jpg"
                  alt="Formora response analytics dashboard preview"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Template Gallery Showcase */}
      <section className="py-20 border-b border-[#E2E4DF] dark:border-[#272C28]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#176B52] dark:text-[#228B6B]">
                Ready to Deploy
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#171918] dark:text-[#F0F2EE] mt-2">
                Explore popular form templates
              </h2>
            </div>
            <button
              onClick={() => onStartCreate('template')}
              className="text-sm font-semibold text-[#176B52] dark:text-[#228B6B] hover:underline flex items-center gap-1.5 self-start"
            >
              <span>View all templates</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FORM_TEMPLATES.slice(0, 4).map((template) => (
              <div
                key={template.id}
                onClick={() => onSelectTemplate(template.id)}
                className="group cursor-pointer p-5 bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] hover:border-[#176B52] dark:hover:border-[#228B6B] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs font-medium text-[#737873] dark:text-[#9BA19B] mb-2">
                    {template.category}
                  </div>
                  <h3 className="text-base font-semibold text-[#171918] dark:text-[#F0F2EE] group-hover:text-[#176B52] dark:group-hover:text-[#228B6B] transition-colors mb-2">
                    {template.title}
                  </h3>
                  <p className="text-xs text-[#737873] dark:text-[#9BA19B] line-clamp-3 leading-relaxed mb-4">
                    {template.description}
                  </p>
                </div>
                <div className="pt-3 border-t border-[#E2E4DF] dark:border-[#272C28] flex items-center justify-between text-xs text-[#737873] dark:text-[#9BA19B]">
                  <span>{template.form.questions?.length || 5} questions</span>
                  <span className="font-medium text-[#176B52] dark:text-[#228B6B] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Use <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Pricing Section (Freemium Model) */}
      <section className="py-20 border-b border-[#E2E4DF] dark:border-[#272C28] bg-white dark:bg-[#191D1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[#171918] dark:text-[#F0F2EE] mb-4">
              Simple, transparent plans for every scale
            </h2>
            <p className="text-[#737873] dark:text-[#9BA19B] text-base mb-8">
              Start free, collect feedback immediately, and upgrade whenever you require higher response capacities or statistical testing.
            </p>
            {/* Billing cadence toggle */}
            <div className="inline-flex items-center p-1 bg-[#F0F2ED] dark:bg-[#111412] rounded-lg text-xs font-medium">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  billingPeriod === 'monthly'
                    ? 'bg-white dark:bg-[#191D1A] text-[#171918] dark:text-[#F0F2EE] shadow-sm'
                    : 'text-[#737873] dark:text-[#9BA19B]'
                }`}
              >
                Monthly billing
              </button>
              <button
                onClick={() => setBillingPeriod('annual')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  billingPeriod === 'annual'
                    ? 'bg-white dark:bg-[#191D1A] text-[#171918] dark:text-[#F0F2EE] shadow-sm'
                    : 'text-[#737873] dark:text-[#9BA19B]'
                }`}
              >
                Annual billing (Save 20%)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Free */}
            <div className="p-6 bg-[#F7F7F4] dark:bg-[#111412] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#171918] dark:text-[#F0F2EE]">Free</h3>
                <p className="text-xs text-[#737873] dark:text-[#9BA19B] mt-1 mb-4">
                  For individuals & basic forms
                </p>
                <div className="text-3xl font-bold text-[#171918] dark:text-[#F0F2EE] font-mono tabular-nums mb-6">
                  $0
                  <span className="text-xs font-normal text-[#737873] dark:text-[#9BA19B]"> /month</span>
                </div>
                <ul className="space-y-3 text-xs text-[#171918] dark:text-[#F0F2EE] mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#176B52]" />
                    <span>Up to 3 active forms</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#176B52]" />
                    <span>100 responses / month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#176B52]" />
                    <span>Quick form presets & templates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#176B52]" />
                    <span>Standard charts & CSV export</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => onStartCreate('scratch')}
                className="w-full py-2.5 text-xs font-semibold text-[#171918] dark:text-[#F0F2EE] bg-white dark:bg-[#191D1A] border border-[#E2E4DF] dark:border-[#272C28] hover:bg-[#F0F2ED] dark:hover:bg-[#222723] rounded-lg transition-colors"
              >
                Get started free
              </button>
            </div>

            {/* Pro */}
            <div className="relative p-6 bg-white dark:bg-[#191D1A] rounded-xl border-2 border-[#176B52] dark:border-[#228B6B] flex flex-col justify-between shadow-sm">
              <div>
                <div className="text-xs font-semibold text-[#176B52] dark:text-[#228B6B] uppercase tracking-wider mb-1">
                  Most Popular
                </div>
                <h3 className="text-lg font-bold text-[#171918] dark:text-[#F0F2EE]">Pro</h3>
                <p className="text-xs text-[#737873] dark:text-[#9BA19B] mt-1 mb-4">
                  For creators, researchers & teams
                </p>
                <div className="text-3xl font-bold text-[#171918] dark:text-[#F0F2EE] font-mono tabular-nums mb-6">
                  {billingPeriod === 'monthly' ? '$19' : '$15'}
                  <span className="text-xs font-normal text-[#737873] dark:text-[#9BA19B]"> /month</span>
                </div>
                <ul className="space-y-3 text-xs text-[#171918] dark:text-[#F0F2EE] mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#176B52]" />
                    <span>Unlimited forms</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#176B52]" />
                    <span>2,500 responses / month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#176B52]" />
                    <span>Conditional logic & branching</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#176B52]" />
                    <span>Word & PDF report downloads</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#176B52]" />
                    <span>Executive response metrics & reports</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => onStartCreate('ai')}
                className="w-full py-2.5 text-xs font-semibold text-white bg-[#176B52] hover:bg-[#125541] rounded-lg shadow-sm transition-colors"
              >
                Start Pro trial
              </button>
            </div>

            {/* Business */}
            <div className="p-6 bg-[#F7F7F4] dark:bg-[#111412] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#171918] dark:text-[#F0F2EE]">Business</h3>
                <p className="text-xs text-[#737873] dark:text-[#9BA19B] mt-1 mb-4">
                  For companies & organizations
                </p>
                <div className="text-3xl font-bold text-[#171918] dark:text-[#F0F2EE] font-mono tabular-nums mb-6">
                  {billingPeriod === 'monthly' ? '$49' : '$39'}
                  <span className="text-xs font-normal text-[#737873] dark:text-[#9BA19B]"> /month</span>
                </div>
                <ul className="space-y-3 text-xs text-[#171918] dark:text-[#F0F2EE] mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#176B52]" />
                    <span>15,000 responses / month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#176B52]" />
                    <span>Custom branding & white label</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#176B52]" />
                    <span>Team workspaces & permissions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#176B52]" />
                    <span>Advanced statistical testing module</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => onStartCreate('scratch')}
                className="w-full py-2.5 text-xs font-semibold text-[#171918] dark:text-[#F0F2EE] bg-white dark:bg-[#191D1A] border border-[#E2E4DF] dark:border-[#272C28] hover:bg-[#F0F2ED] dark:hover:bg-[#222723] rounded-lg transition-colors"
              >
                Choose Business
              </button>
            </div>

            {/* Enterprise */}
            <div className="p-6 bg-[#F7F7F4] dark:bg-[#111412] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#171918] dark:text-[#F0F2EE]">Enterprise</h3>
                <p className="text-xs text-[#737873] dark:text-[#9BA19B] mt-1 mb-4">
                  For institutions & high volume
                </p>
                <div className="text-3xl font-bold text-[#171918] dark:text-[#F0F2EE] font-mono tabular-nums mb-6">
                  Custom
                </div>
                <ul className="space-y-3 text-xs text-[#171918] dark:text-[#F0F2EE] mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#176B52]" />
                    <span>Custom response limits</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#176B52]" />
                    <span>SSO & strict data governance</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#176B52]" />
                    <span>Dedicated account manager</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#176B52]" />
                    <span>Custom API integrations</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => onStartCreate('scratch')}
                className="w-full py-2.5 text-xs font-semibold text-[#171918] dark:text-[#F0F2EE] bg-white dark:bg-[#191D1A] border border-[#E2E4DF] dark:border-[#272C28] hover:bg-[#F0F2ED] dark:hover:bg-[#222723] rounded-lg transition-colors"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Frequently Asked Questions */}
      <section className="py-20 border-b border-[#E2E4DF] dark:border-[#272C28]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#171918] dark:text-[#F0F2EE] mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-[#737873] dark:text-[#9BA19B]">
              Common questions about Formora creation workflows, data privacy, and exports.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-[#E2E4DF] dark:border-[#272C28] bg-white dark:bg-[#191D1A] overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 focus:outline-none"
                  >
                    <span className="text-sm font-semibold text-[#171918] dark:text-[#F0F2EE]">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#737873] transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-[#737873] dark:text-[#9BA19B] leading-relaxed border-t border-[#F0F2ED] dark:border-[#222723]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Bottom Call to Action */}
      <section className="py-20 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-[#171918] dark:text-[#F0F2EE] mb-4">
            Start building your form right now.
          </h2>
          <p className="text-base text-[#737873] dark:text-[#9BA19B] mb-8">
            Describe your requirements or paste your draft to receive an editable, shareable form in minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onStartCreate('ai')}
              className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-white bg-[#176B52] hover:bg-[#125541] rounded-lg shadow-sm transition-all"
            >
              Open Form Wizard
            </button>
            <button
              onClick={() => onStartCreate('scratch')}
              className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-[#171918] dark:text-[#F0F2EE] bg-white dark:bg-[#191D1A] border border-[#E2E4DF] dark:border-[#272C28] hover:bg-[#F0F2ED] dark:hover:bg-[#222723] rounded-lg transition-colors"
            >
              Start from scratch
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
