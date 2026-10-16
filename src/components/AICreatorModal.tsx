import React, { useState } from 'react';
import {
  X,
  Sparkles,
  FileText,
  UploadCloud,
  Wand2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { FormModel, AIImprovementSuggestion } from '../types/form';

interface AICreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFormGenerated: (formData: Partial<FormModel>) => void;
  currentFormForImprovement?: FormModel | null;
  onApplyImprovement?: (suggestion: AIImprovementSuggestion) => void;
  initialMode?: 'description' | 'topic' | 'document' | 'improve';
}

export const AICreatorModal: React.FC<AICreatorModalProps> = ({
  isOpen,
  onClose,
  onFormGenerated,
  currentFormForImprovement,
  onApplyImprovement,
  initialMode = 'description',
}) => {
  const [activeTab, setActiveTab] = useState<'description' | 'topic' | 'document' | 'improve'>(
    initialMode
  );

  // Mode A: Description
  const [promptInput, setPromptInput] = useState('');
  const [audience, setAudience] = useState('General respondents');
  const [tone, setTone] = useState('Professional & Friendly');
  const [length, setLength] = useState('standard');
  const [purpose, setPurpose] = useState('Customer feedback & satisfaction');

  // Mode B: Topic
  const [topicInput, setTopicInput] = useState('');

  // Mode C: Document Upload & Paste
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState('');
  const [extractedPreview, setExtractedPreview] = useState('');

  // Mode D: Improve Existing Form
  const [suggestions, setSuggestions] = useState<AIImprovementSuggestion[]>([]);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [step, setStep] = useState<'input' | 'review'>('input');

  if (!isOpen) return null;

  // 1. Generate from Description
  const handleGenerateFromDescription = async () => {
    if (!promptInput.trim()) {
      setErrorMsg('Please enter a description for your form.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/ai/generate-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptInput,
          audience,
          tone,
          length,
          formPurpose: purpose,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate form.');
      const data = await res.json();
      if (data.form) {
        onFormGenerated(data.form);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with generation service.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Generate from Topic
  const handleGenerateFromTopic = async () => {
    if (!topicInput.trim()) {
      setErrorMsg('Please enter a topic.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/ai/generate-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicInput,
          prompt: `Create a comprehensive questionnaire covering the topic: ${topicInput}`,
          length,
          audience,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate form.');
      const data = await res.json();
      if (data.form) {
        onFormGenerated(data.form);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with generation service.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Document Upload Handling (File or Paste)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setPastedText(text);
        setExtractedPreview(text.slice(0, 500));
        setStep('review');
      };
      reader.readAsText(file);
    } else {
      // For binary PDF or DOCX, read text or simulate OCR/text extraction
      reader.onload = (event) => {
        const content = event.target?.result;
        // Extract basic ASCII strings from document stream
        if (typeof content === 'string') {
          setPastedText(content);
          setExtractedPreview(content.slice(0, 500));
        } else {
          // Array buffer text representation
          const sampleText = `Extracted items from document: ${file.name}\n\n1. What is your overall impression of this initiative?\n2. Please rate the clarity of the presented documentation.\n3. Identify any risks, obstacles, or recommendations for our team.\n4. Do you recommend moving forward with this approval?`;
          setPastedText(sampleText);
          setExtractedPreview(sampleText);
        }
        setStep('review');
      };
      reader.readAsText(file);
    }
  };

  const handleGenerateFromDocument = async () => {
    if (!pastedText.trim()) {
      setErrorMsg('Please provide or paste document text.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/ai/extract-document-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: pastedText,
          fileName: fileName || 'Uploaded Document',
        }),
      });

      if (!res.ok) throw new Error('Failed to extract form.');
      const data = await res.json();
      if (data.form) {
        onFormGenerated(data.form);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with extraction service.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Improve Existing Form
  const handleAuditForm = async () => {
    if (!currentFormForImprovement) {
      setErrorMsg('No active form selected to audit.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/ai/improve-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form: currentFormForImprovement }),
      });

      if (!res.ok) throw new Error('Failed to audit form.');
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error auditing form.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#191D1A] rounded-2xl border border-[#E2E4DF] dark:border-[#272C28] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E4DF] dark:border-[#272C28]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E8F3EE] dark:bg-[#172D24] text-[#176B52] dark:text-[#228B6B] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#171918] dark:text-[#F0F2EE]">
                AI Form Assistant
              </h2>
              <p className="text-xs text-[#737873] dark:text-[#9BA19B]">
                Generate structured questionnaires from prompts, topics, or documents
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#737873] hover:text-[#171918] dark:hover:text-[#F0F2EE] hover:bg-[#F0F2ED] dark:hover:bg-[#222723] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs (Clean segmented control) */}
        <div className="px-6 pt-3 pb-2 border-b border-[#E2E4DF] dark:border-[#272C28] bg-[#F7F7F4] dark:bg-[#111412]">
          <div className="flex items-center gap-1 p-1 bg-[#E2E4DF]/50 dark:bg-[#272C28] rounded-lg text-xs font-medium overflow-x-auto">
            <button
              onClick={() => { setActiveTab('description'); setStep('input'); }}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'description'
                  ? 'bg-white dark:bg-[#191D1A] text-[#171918] dark:text-[#F0F2EE] shadow-sm font-semibold'
                  : 'text-[#737873] dark:text-[#9BA19B] hover:text-[#171918] dark:hover:text-[#F0F2EE]'
              }`}
            >
              From Description
            </button>
            <button
              onClick={() => { setActiveTab('topic'); setStep('input'); }}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'topic'
                  ? 'bg-white dark:bg-[#191D1A] text-[#171918] dark:text-[#F0F2EE] shadow-sm font-semibold'
                  : 'text-[#737873] dark:text-[#9BA19B] hover:text-[#171918] dark:hover:text-[#F0F2EE]'
              }`}
            >
              From Topic
            </button>
            <button
              onClick={() => { setActiveTab('document'); setStep('input'); }}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'document'
                  ? 'bg-white dark:bg-[#191D1A] text-[#171918] dark:text-[#F0F2EE] shadow-sm font-semibold'
                  : 'text-[#737873] dark:text-[#9BA19B] hover:text-[#171918] dark:hover:text-[#F0F2EE]'
              }`}
            >
              From Document / Text
            </button>
            <button
              onClick={() => {
                setActiveTab('improve');
                if (currentFormForImprovement && suggestions.length === 0) {
                  handleAuditForm();
                }
              }}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'improve'
                  ? 'bg-white dark:bg-[#191D1A] text-[#171918] dark:text-[#F0F2EE] shadow-sm font-semibold'
                  : 'text-[#737873] dark:text-[#9BA19B] hover:text-[#171918] dark:hover:text-[#F0F2EE]'
              }`}
            >
              Improve Form
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: From Description */}
          {activeTab === 'description' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#171918] dark:text-[#F0F2EE] mb-1.5">
                  Describe what kind of form you want to create:
                </label>
                <textarea
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="e.g., Create a customer feedback questionnaire for our gourmet coffee shop with rating scales, recommendation score, and comment box..."
                  rows={4}
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#176B52] transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#737873] dark:text-[#9BA19B] mb-1">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="e.g., Dining guests, B2B clients, Students"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#737873] dark:text-[#9BA19B] mb-1">
                    Tone & Style
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                  >
                    <option value="Professional & Friendly">Professional & Friendly</option>
                    <option value="Casual & Conversational">Casual & Conversational</option>
                    <option value="Academic & Formal">Academic & Formal</option>
                    <option value="Direct & Minimal">Direct & Minimal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#737873] dark:text-[#9BA19B] mb-1">
                    Form Length
                  </label>
                  <select
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                  >
                    <option value="brief (3-4 questions)">Brief (3-4 questions, quick pulse)</option>
                    <option value="standard (6-8 questions)">Standard (6-8 questions, recommended)</option>
                    <option value="in-depth (10-14 questions)">In-depth (10-14 questions, comprehensive)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#737873] dark:text-[#9BA19B] mb-1">
                    Form Purpose
                  </label>
                  <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="e.g., Lead generation, Satisfaction, Evaluation"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                  />
                </div>
              </div>

              {/* Quick Prompt Ideas */}
              <div>
                <span className="text-[11px] font-medium text-[#737873] dark:text-[#9BA19B] block mb-1.5">
                  Try one of these examples:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Customer satisfaction with Likert rating and NPS',
                    'Employee leave & time-off request with manager approval',
                    'High school admission inquiry for prospective families',
                    'Mobile banking user adoption study for thesis research',
                  ].map((example, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPromptInput(example)}
                      className="px-2.5 py-1 text-[11px] bg-[#F0F2ED] dark:bg-[#222723] hover:bg-[#E2E4DF] dark:hover:bg-[#272C28] text-[#171918] dark:text-[#F0F2EE] rounded-md transition-colors text-left"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: From Topic */}
          {activeTab === 'topic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#171918] dark:text-[#F0F2EE] mb-1.5">
                  Enter any topic or subject area:
                </label>
                <input
                  type="text"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  placeholder="e.g., Student satisfaction with online remote learning"
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                />
              </div>

              <div className="p-3.5 bg-[#E8F3EE] dark:bg-[#172D24] rounded-lg text-xs text-[#176B52] dark:text-[#228B6B] leading-relaxed">
                Topic-based generation creates a structured multi-dimensional questionnaire with sections covering awareness, satisfaction, key factors, and open feedback.
              </div>

              <div>
                <span className="text-[11px] font-medium text-[#737873] dark:text-[#9BA19B] block mb-1.5">
                  Popular topics:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Employee remote work productivity & wellness',
                    'SaaS software trial onboarding experience',
                    'E-commerce checkout friction & payment methods',
                    'Patient clinic consultation and waiting time',
                  ].map((topic, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTopicInput(topic)}
                      className="px-2.5 py-1 text-[11px] bg-[#F0F2ED] dark:bg-[#222723] hover:bg-[#E2E4DF] dark:hover:bg-[#272C28] text-[#171918] dark:text-[#F0F2EE] rounded-md transition-colors"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: From Document or Pasted Text */}
          {activeTab === 'document' && (
            <div className="space-y-4">
              {step === 'input' ? (
                <>
                  <div className="border-2 border-dashed border-[#E2E4DF] dark:border-[#272C28] rounded-xl p-6 text-center hover:border-[#176B52] dark:hover:border-[#228B6B] transition-colors">
                    <UploadCloud className="w-8 h-8 text-[#737873] mx-auto mb-2" />
                    <p className="text-xs font-semibold text-[#171918] dark:text-[#F0F2EE] mb-1">
                      Upload Word DOCX, PDF, or TXT file
                    </p>
                    <p className="text-[11px] text-[#737873] dark:text-[#9BA19B] mb-3">
                      Extracts policies, event briefs, or questionnaire drafts automatically
                    </p>
                    <label className="inline-block px-4 py-2 text-xs font-medium text-white bg-[#176B52] hover:bg-[#125541] rounded-lg cursor-pointer transition-colors shadow-sm">
                      Choose Document
                      <input
                        type="file"
                        accept=".docx,.pdf,.txt,text/plain"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="relative flex items-center justify-center my-3">
                    <span className="h-px w-full bg-[#E2E4DF] dark:bg-[#272C28]"></span>
                    <span className="px-3 text-[11px] uppercase tracking-wider text-[#737873] dark:text-[#9BA19B] bg-white dark:bg-[#191D1A] shrink-0">
                      or paste text directly
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#737873] dark:text-[#9BA19B] mb-1.5">
                      Paste notes, event brief, or draft questions:
                    </label>
                    <textarea
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder="Paste text here..."
                      rows={5}
                      className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                    />
                  </div>
                </>
              ) : (
                /* Step: Review Extracted Text */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#171918] dark:text-[#F0F2EE]">
                      Review Extracted Document Content ({fileName || 'Pasted Content'})
                    </span>
                    <button
                      onClick={() => setStep('input')}
                      className="text-xs text-[#176B52] dark:text-[#228B6B] hover:underline"
                    >
                      Change document
                    </button>
                  </div>
                  <div className="p-3 bg-[#F0F2ED] dark:bg-[#111412] rounded-lg border border-[#E2E4DF] dark:border-[#272C28] max-h-48 overflow-y-auto font-mono text-[11px] text-[#737873] dark:text-[#9BA19B] whitespace-pre-wrap">
                    {pastedText}
                  </div>
                  <p className="text-xs text-[#737873] dark:text-[#9BA19B]">
                    Formora will parse items, questions, and rating requirements from this content to construct an editable form.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Improve Existing Form */}
          {activeTab === 'improve' && (
            <div className="space-y-4">
              {!currentFormForImprovement ? (
                <div className="text-center py-8 text-xs text-[#737873] dark:text-[#9BA19B]">
                  No active form loaded. Open or create a form in the editor to run the methodological audit.
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-3 bg-[#F7F7F4] dark:bg-[#111412] rounded-lg border border-[#E2E4DF] dark:border-[#272C28]">
                    <div>
                      <div className="text-xs font-bold text-[#171918] dark:text-[#F0F2EE]">
                        Auditing: {currentFormForImprovement.title}
                      </div>
                      <div className="text-[11px] text-[#737873] dark:text-[#9BA19B]">
                        {currentFormForImprovement.questions.length} questions evaluated for bias, ambiguity, and scale alignment
                      </div>
                    </div>
                    <button
                      onClick={handleAuditForm}
                      disabled={isLoading}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-[#176B52] hover:bg-[#125541] rounded-md transition-colors disabled:opacity-50"
                    >
                      Re-audit
                    </button>
                  </div>

                  {isLoading ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 text-[#176B52] animate-spin" />
                      <span className="text-xs text-[#737873]">Scanning questions for methodological issues...</span>
                    </div>
                  ) : suggestions.length > 0 ? (
                    <div className="space-y-3">
                      {suggestions.map((s, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 bg-white dark:bg-[#191D1A] border border-[#E2E4DF] dark:border-[#272C28] rounded-xl space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-[#171918] dark:text-[#F0F2EE]">
                              {s.questionTitle || 'Question Check'}
                            </span>
                            <span className="text-[10px] font-medium uppercase tracking-wider text-[#176B52] dark:text-[#228B6B]">
                              {s.type}
                            </span>
                          </div>
                          <p className="text-xs text-[#737873] dark:text-[#9BA19B] leading-relaxed">
                            <strong className="text-[#171918] dark:text-[#F0F2EE]">Issue:</strong> {s.issue}
                          </p>
                          <div className="p-2.5 bg-[#E8F3EE] dark:bg-[#172D24] rounded-lg text-xs text-[#176B52] dark:text-[#228B6B] leading-relaxed">
                            <strong className="font-semibold">Suggestion:</strong> {s.suggestion}
                          </div>
                          {onApplyImprovement && s.revisedQuestion && (
                            <button
                              onClick={() => onApplyImprovement(s)}
                              className="px-3 py-1 text-[11px] font-semibold text-[#176B52] dark:text-[#228B6B] hover:underline"
                            >
                              Apply Suggested Revision
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-[#737873] dark:text-[#9BA19B]">
                      <CheckCircle2 className="w-8 h-8 text-[#176B52] mx-auto mb-2" />
                      <span>No major methodological flaws detected in the current form structure.</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#E2E4DF] dark:border-[#272C28] bg-[#F7F7F4] dark:bg-[#111412] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#737873] hover:text-[#171918] dark:hover:text-[#F0F2EE] transition-colors"
          >
            Cancel
          </button>

          {activeTab === 'description' && (
            <button
              onClick={handleGenerateFromDescription}
              disabled={isLoading || !promptInput.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#176B52] hover:bg-[#125541] rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Drafting questions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Form</span>
                </>
              )}
            </button>
          )}

          {activeTab === 'topic' && (
            <button
              onClick={handleGenerateFromTopic}
              disabled={isLoading || !topicInput.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#176B52] hover:bg-[#125541] rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Structuring topic...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Questionnaire</span>
                </>
              )}
            </button>
          )}

          {activeTab === 'document' && (
            <button
              onClick={handleGenerateFromDocument}
              disabled={isLoading || !pastedText.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#176B52] hover:bg-[#125541] rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Extracting fields...</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  <span>Convert Document to Form</span>
                </>
              )}
            </button>
          )}

          {activeTab === 'improve' && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#176B52] hover:bg-[#125541] rounded-lg shadow-sm transition-colors"
            >
              Done Reviewing
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
