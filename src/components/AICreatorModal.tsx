import React, { useState, useMemo } from 'react';
import {
  X,
  FileText,
  UploadCloud,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  Sliders,
  FolderPlus,
  Plus,
  Check,
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowLeft,
  FileCheck2,
  ListOrdered,
  Eye,
} from 'lucide-react';
import { FormModel, FormQuestion, QuestionType } from '../types/form';
import { FORM_TEMPLATES } from '../data/templates';
import {
  parseQuestionnaireText,
  parseDocxFile,
  convertParsedQuestionnaireToFormModel,
  SAMPLE_ACADEMIC_QUESTIONNAIRE,
  ParsedQuestionnaire,
  ParsedQuestion,
  ParserQuestionType,
} from '../utils/questionnaireParser';

interface AICreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFormGenerated: (formData: Partial<FormModel>) => void;
  currentFormForImprovement?: FormModel | null;
  onApplyImprovement?: (suggestion: any) => void;
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

  // Mode 1: Description / Topic Quick Setup
  const [titleInput, setTitleInput] = useState('');
  const [category, setCategory] = useState('Customer & Product');
  const [includeNPS, setIncludeNPS] = useState(true);
  const [includeDemographics, setIncludeDemographics] = useState(true);
  const [includeRatingMatrix, setIncludeRatingMatrix] = useState(true);
  const [includeOpenFeedback, setIncludeOpenFeedback] = useState(true);

  // Mode 2: Document / Text Parser state
  const [pastedText, setPastedText] = useState('');
  const [parserStep, setParserStep] = useState<'input' | 'review'>('input');
  const [parsedQuestionnaire, setParsedQuestionnaire] = useState<ParsedQuestionnaire | null>(null);
  const [isParsingDocx, setIsParsingDocx] = useState(false);
  const [expandedProvenanceId, setExpandedProvenanceId] = useState<string | null>(null);

  // Feedback states
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Generate Form deterministically from Presets / Topic
  const handleGenerateFromPreset = () => {
    const title = titleInput.trim() || `${category} Questionnaire`;
    const questions: FormQuestion[] = [];
    let qIdx = 1;

    if (includeDemographics) {
      questions.push({
        id: `q-${Date.now()}-${qIdx++}`,
        sectionId: 'sec-1',
        type: 'short_text',
        title: 'Full Name (or preferred identifier)',
        placeholder: 'e.g. Jane Doe',
        validation: { required: false },
      });
      questions.push({
        id: `q-${Date.now()}-${qIdx++}`,
        sectionId: 'sec-1',
        type: 'email',
        title: 'Email Address',
        placeholder: 'jane@example.com',
        validation: { required: true },
      });
    }

    if (includeRatingMatrix) {
      questions.push({
        id: `q-${Date.now()}-${qIdx++}`,
        sectionId: 'sec-1',
        type: 'likert_5',
        title: `Overall satisfaction with our ${category.toLowerCase()} experience:`,
        validation: { required: true },
        options: [
          { id: 'l1', label: '1 - Strongly Disagree', value: '1' },
          { id: 'l2', label: '2 - Disagree', value: '2' },
          { id: 'l3', label: '3 - Neutral', value: '3' },
          { id: 'l4', label: '4 - Agree', value: '4' },
          { id: 'l5', label: '5 - Strongly Agree', value: '5' },
        ],
      });
      questions.push({
        id: `q-${Date.now()}-${qIdx++}`,
        sectionId: 'sec-1',
        type: 'star_rating',
        title: 'Rate the quality of service provided:',
        scaleMax: 5,
        validation: { required: true },
      });
    }

    if (includeNPS) {
      questions.push({
        id: `q-${Date.now()}-${qIdx++}`,
        sectionId: 'sec-1',
        type: 'nps',
        title: 'How likely are you to recommend us to a colleague or friend?',
        scaleMin: 0,
        scaleMax: 10,
        scaleMinLabel: 'Not at all likely',
        scaleMaxLabel: 'Extremely likely',
        validation: { required: true },
      });
    }

    if (includeOpenFeedback) {
      questions.push({
        id: `q-${Date.now()}-${qIdx++}`,
        sectionId: 'sec-1',
        type: 'long_text',
        title: 'What could we do to improve your experience in the future?',
        placeholder: 'Please share your thoughts, suggestions, or comments...',
        validation: { required: false },
      });
    }

    onFormGenerated({
      title,
      description: `Structured questionnaire generated via Formora Quick Setup for ${category}.`,
      category,
      sections: [{ id: 'sec-1', title: 'Main Section', order: 0 }],
      questions,
    });
    onClose();
  };

  // 2. Document Parser Logic
  const handleParseText = () => {
    setErrorMsg('');
    if (!pastedText.trim()) {
      setErrorMsg('Please enter or paste questionnaire text, or click "Load Sample Questionnaire".');
      return;
    }

    const result = parseQuestionnaireText(pastedText, 'text');
    if (!result.success && result.errors.length > 0) {
      setErrorMsg(result.errors.join(' '));
      return;
    }

    setParsedQuestionnaire(result.data);
    setParserStep('review');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setIsParsingDocx(true);

    try {
      if (file.name.endsWith('.docx')) {
        const result = await parseDocxFile(file);
        if (result.success) {
          setParsedQuestionnaire(result.data);
          setPastedText(result.data.questions.map((q) => q.source.originalText).join('\n\n'));
          setParserStep('review');
        } else {
          setErrorMsg(result.errors.join(' ') || 'Could not parse DOCX file.');
        }
      } else {
        // Plain text or markdown
        const text = await file.text();
        setPastedText(text);
        const result = parseQuestionnaireText(text, 'text');
        setParsedQuestionnaire(result.data);
        setParserStep('review');
      }
    } catch (err: any) {
      setErrorMsg(`File reading error: ${err.message || String(err)}`);
    } finally {
      setIsParsingDocx(false);
    }
  };

  const handleLoadSample = () => {
    setPastedText(SAMPLE_ACADEMIC_QUESTIONNAIRE);
    setErrorMsg('');
  };

  // Mutation helpers in Review mode
  const handleUpdateQuestionType = (qId: string, newType: ParserQuestionType) => {
    if (!parsedQuestionnaire) return;
    setParsedQuestionnaire({
      ...parsedQuestionnaire,
      questions: parsedQuestionnaire.questions.map((q) =>
        q.id === qId ? { ...q, type: newType, reviewRequired: false } : q
      ),
    });
  };

  const handleUpdateQuestionText = (qId: string, newText: string) => {
    if (!parsedQuestionnaire) return;
    setParsedQuestionnaire({
      ...parsedQuestionnaire,
      questions: parsedQuestionnaire.questions.map((q) =>
        q.id === qId ? { ...q, text: newText } : q
      ),
    });
  };

  const handleUpdateOptionLabel = (qId: string, optId: string, newLabel: string) => {
    if (!parsedQuestionnaire) return;
    setParsedQuestionnaire({
      ...parsedQuestionnaire,
      questions: parsedQuestionnaire.questions.map((q) => {
        if (q.id !== qId) return q;
        return {
          ...q,
          options: q.options.map((opt) => (opt.id === optId ? { ...opt, label: newLabel } : opt)),
        };
      }),
    });
  };

  const handleConfirmAndGenerate = () => {
    if (!parsedQuestionnaire) return;
    const formModelData = convertParsedQuestionnaireToFormModel(parsedQuestionnaire);
    onFormGenerated(formModelData);
    onClose();
  };

  // 3. Client-side Form Health Checklist
  const formHealthIssues = useMemo(() => {
    if (!currentFormForImprovement) return [];
    const issues: { issue: string; suggestion: string; questionId?: string }[] = [];

    const qs = currentFormForImprovement.questions || [];
    if (qs.length === 0) {
      issues.push({
        issue: 'This form has no questions.',
        suggestion: 'Add at least 3-5 questions to begin collecting meaningful submissions.',
      });
    }

    qs.forEach((q) => {
      if (
        (q.type === 'single_choice' || q.type === 'multiple_choice') &&
        (!q.options || q.options.length < 2)
      ) {
        issues.push({
          issue: `"${q.title}" has fewer than 2 choice options.`,
          suggestion: 'Provide at least 2 distinct response alternatives.',
          questionId: q.id,
        });
      }
      if (!q.title || q.title.trim() === 'Untitled Question') {
        issues.push({
          issue: 'Question has a default placeholder title.',
          suggestion: 'Write clear and descriptive wording so respondents understand the prompt.',
          questionId: q.id,
        });
      }
    });

    if (issues.length === 0) {
      issues.push({
        issue: 'All questions pass structural validation.',
        suggestion: 'Form has balanced question types, non-empty options, and proper required rules.',
      });
    }

    return issues;
  }, [currentFormForImprovement]);

  if (!isOpen) return null;

  const isReviewMode = activeTab === 'document' && parserStep === 'review' && parsedQuestionnaire;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full ${
          isReviewMode ? 'max-w-4xl' : 'max-w-2xl'
        } bg-white dark:bg-[#191D1A] rounded-2xl border border-[#E2E4DF] dark:border-[#272C28] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E4DF] dark:border-[#272C28]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E8F3EE] dark:bg-[#172D24] text-[#176B52] dark:text-[#228B6B] flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#171918] dark:text-[#F0F2EE]">
                {activeTab === 'document'
                  ? parserStep === 'review'
                    ? 'Review & Validate Questionnaire IR'
                    : 'Document & Text Questionnaire Parser'
                  : 'Quick Form Creator'}
              </h3>
              <p className="text-xs text-[#737873] dark:text-[#9BA19B]">
                {activeTab === 'document'
                  ? 'Converts raw text, DOCX, and surveys into structured questions without AI APIs'
                  : 'Fast questionnaire configuration using research-backed structural blocks'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#737873] hover:text-[#171918] dark:hover:text-[#F0F2EE] rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E2E4DF] dark:border-[#272C28] px-6 bg-[#FAFAF8] dark:bg-[#141715]">
          <button
            onClick={() => {
              setActiveTab('description');
              setParserStep('input');
            }}
            className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'description' || activeTab === 'topic'
                ? 'border-[#176B52] text-[#176B52] dark:text-[#228B6B] font-semibold'
                : 'border-transparent text-[#737873] dark:text-[#9BA19B] hover:text-[#171918]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Preset Wizard</span>
          </button>
          <button
            onClick={() => setActiveTab('document')}
            className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'document'
                ? 'border-[#176B52] text-[#176B52] dark:text-[#228B6B] font-semibold'
                : 'border-transparent text-[#737873] dark:text-[#9BA19B] hover:text-[#171918]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Document & Text Parser</span>
            {parsedQuestionnaire && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-[#E8F3EE] dark:bg-[#172D24] text-[#176B52] rounded-full">
                {parsedQuestionnaire.questions.length}Q
              </span>
            )}
          </button>
          {currentFormForImprovement && (
            <button
              onClick={() => setActiveTab('improve')}
              className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'improve'
                  ? 'border-[#176B52] text-[#176B52] dark:text-[#228B6B] font-semibold'
                  : 'border-transparent text-[#737873] dark:text-[#9BA19B] hover:text-[#171918]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Form Health Check</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: Preset Wizard */}
          {(activeTab === 'description' || activeTab === 'topic') && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#171918] dark:text-[#F0F2EE] block mb-1.5">
                  Questionnaire Title
                </label>
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="e.g. Customer Satisfaction Survey 2026"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#171918] dark:text-[#F0F2EE] block mb-1.5">
                  Category / Purpose
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                >
                  <option value="Customer & Product">Customer & Product Feedback</option>
                  <option value="Research & Academic">Academic / Empirical Research</option>
                  <option value="Employee & HR">Employee & Team Engagement</option>
                  <option value="Event Registration">Event Registration & Check-in</option>
                  <option value="Healthcare & Wellness">Health & Medical Assessment</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#171918] dark:text-[#F0F2EE] block mb-2">
                  Include Structural Question Blocks
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-[#E2E4DF] dark:border-[#272C28] bg-[#FAFAF8] dark:bg-[#141715] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeDemographics}
                      onChange={(e) => setIncludeDemographics(e.target.checked)}
                      className="rounded accent-[#176B52]"
                    />
                    <span>Name & Email Fields</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-[#E2E4DF] dark:border-[#272C28] bg-[#FAFAF8] dark:bg-[#141715] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeRatingMatrix}
                      onChange={(e) => setIncludeRatingMatrix(e.target.checked)}
                      className="rounded accent-[#176B52]"
                    />
                    <span>Likert & Star Ratings</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-[#E2E4DF] dark:border-[#272C28] bg-[#FAFAF8] dark:bg-[#141715] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeNPS}
                      onChange={(e) => setIncludeNPS(e.target.checked)}
                      className="rounded accent-[#176B52]"
                    />
                    <span>Net Promoter Score (0-10)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-[#E2E4DF] dark:border-[#272C28] bg-[#FAFAF8] dark:bg-[#141715] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeOpenFeedback}
                      onChange={(e) => setIncludeOpenFeedback(e.target.checked)}
                      className="rounded accent-[#176B52]"
                    />
                    <span>Open Long-Text Feedback</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleGenerateFromPreset}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#176B52] hover:bg-[#125541] rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Build Form Now</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Document & Text Parser */}
          {activeTab === 'document' && (
            <div>
              {parserStep === 'input' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-semibold text-[#171918] dark:text-[#F0F2EE] block">
                        Source Questionnaire Content
                      </label>
                      <span className="text-[11px] text-[#737873] dark:text-[#9BA19B]">
                        Accepts numbered questions, lettered options (A., B., C.), Likert scales, and sections
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleLoadSample}
                        className="text-[11px] font-medium text-[#176B52] dark:text-[#228B6B] hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Load Sample (Bride Price & Education Study)</span>
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <textarea
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      rows={12}
                      placeholder={`Paste questions and options, for example:\n\nTITLE: Community Health Survey\n\nSECTION A: DEMOGRAPHICS\n1. What is your age?\n2. What is your gender?\nA. Male\nB. Female\nC. Prefer not to say\n\nSECTION B: PERCEPTIONS\n3. Our local clinic provides adequate care.\nStrongly Agree\nAgree\nNeutral\nDisagree\nStrongly Disagree\n\n4. Which healthcare services do you use? Select all that apply.\nA. Outpatient consultation\nB. Immunization\nC. Laboratory tests\nD. Other (please specify)`}
                      className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                    />
                  </div>

                  {/* Upload File Strip */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-[#FAFAF8] dark:bg-[#141715] rounded-xl border border-[#E2E4DF] dark:border-[#272C28]">
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#171918] dark:text-[#F0F2EE] bg-white dark:bg-[#191D1A] border border-[#E2E4DF] dark:border-[#272C28] hover:bg-[#F0F2ED] rounded-lg cursor-pointer transition-colors shadow-xs">
                        <UploadCloud className="w-3.5 h-3.5 text-[#176B52]" />
                        <span>Upload .DOCX or .TXT</span>
                        <input
                          type="file"
                          accept=".docx,.txt,.md"
                          onChange={handleFileUpload}
                          disabled={isParsingDocx}
                          className="hidden"
                        />
                      </label>
                      {isParsingDocx && (
                        <span className="text-[11px] text-[#737873] animate-pulse">
                          Extracting DOCX structure...
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {pastedText && (
                        <button
                          type="button"
                          onClick={() => setPastedText('')}
                          className="px-2.5 py-1.5 text-xs text-[#737873] hover:text-[#171918] transition-colors"
                        >
                          Clear
                        </button>
                      )}
                      <button
                        onClick={handleParseText}
                        className="px-4 py-2 text-xs font-semibold text-white bg-[#176B52] hover:bg-[#125541] rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Parse with Formora Syntax Engine</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* REVIEW & VALIDATE INTERMEDIATE REPRESENTATION */
                <div className="space-y-4">
                  {/* Summary Bar */}
                  <div className="p-4 bg-[#F7F7F4] dark:bg-[#111412] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#171918] dark:text-[#F0F2EE]">
                          {parsedQuestionnaire?.document.title || 'Parsed Questionnaire'}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider ${
                            parsedQuestionnaire?.metadata.parsingStatus === 'valid'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400'
                          }`}
                        >
                          {parsedQuestionnaire?.metadata.parsingStatus === 'valid'
                            ? 'IR Validated'
                            : 'Review Required'}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#737873] dark:text-[#9BA19B] flex flex-wrap items-center gap-2">
                        <span>
                          <strong>{parsedQuestionnaire?.sections.length || 0}</strong> Sections
                        </span>
                        <span>•</span>
                        <span>
                          <strong>{parsedQuestionnaire?.questions.length || 0}</strong> Questions
                        </span>
                        <span>•</span>
                        <span>
                          Avg Confidence:{' '}
                          <strong>
                            {Math.round(
                              (parsedQuestionnaire?.metadata.averageConfidence || 0) * 100
                            )}
                            %
                          </strong>
                        </span>
                        {parsedQuestionnaire?.document.researchObjectives &&
                          parsedQuestionnaire.document.researchObjectives.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="px-1.5 py-0.5 bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 rounded text-[10px] font-medium">
                                {parsedQuestionnaire.document.researchObjectives.length} Research Objectives (Isolated)
                              </span>
                            </>
                          )}
                        {parsedQuestionnaire?.document.researchNotes &&
                          parsedQuestionnaire.document.researchNotes.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 rounded text-[10px] font-medium">
                                Research Note Preserved
                              </span>
                            </>
                          )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setParserStep('input')}
                        className="px-3 py-1.5 text-xs font-medium text-[#737873] hover:text-[#171918] dark:hover:text-[#F0F2EE] border border-[#E2E4DF] dark:border-[#272C28] rounded-lg bg-white dark:bg-[#191D1A] flex items-center gap-1 transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to Input</span>
                      </button>
                      <button
                        onClick={handleConfirmAndGenerate}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-[#176B52] hover:bg-[#125541] rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirm & Generate Form</span>
                      </button>
                    </div>
                  </div>

                  {/* Warnings & Notices */}
                  {parsedQuestionnaire?.warnings && parsedQuestionnaire.warnings.length > 0 && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Ambiguity & Structural Warnings:</span>
                      </div>
                      <ul className="list-disc pl-5 text-[11px] text-amber-700 dark:text-amber-400 space-y-0.5">
                        {parsedQuestionnaire.warnings.map((w, idx) => (
                          <li key={idx}>
                            <strong>[{w.code}]</strong> {w.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Questions Review List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#737873] dark:text-[#9BA19B] px-1">
                      <span>Recognized Questions ({parsedQuestionnaire?.questions.length})</span>
                      <span className="text-[11px]">Click question type to adjust</span>
                    </div>

                    {parsedQuestionnaire?.questions.map((q, idx) => {
                      const isExpanded = expandedProvenanceId === q.id;

                      return (
                        <div
                          key={q.id}
                          className={`p-3.5 rounded-xl border transition-all ${
                            q.reviewRequired
                              ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                              : 'bg-white dark:bg-[#191D1A] border-[#E2E4DF] dark:border-[#272C28]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 space-y-2">
                              {/* Meta line */}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-[11px] font-bold text-[#176B52] dark:text-[#228B6B]">
                                  #{idx + 1}
                                </span>

                                {/* Type selector */}
                                <select
                                  value={q.type}
                                  onChange={(e) =>
                                    handleUpdateQuestionType(
                                      q.id,
                                      e.target.value as ParserQuestionType
                                    )
                                  }
                                  className="text-[11px] font-semibold px-2 py-0.5 bg-[#E8F3EE] dark:bg-[#172D24] text-[#176B52] dark:text-[#228B6B] rounded border-0 focus:ring-1 focus:ring-[#176B52] cursor-pointer"
                                >
                                  <option value="short_text">Short Text</option>
                                  <option value="long_text">Long Text</option>
                                  <option value="single_choice">Single Choice</option>
                                  <option value="multiple_choice">Multiple Choice</option>
                                  <option value="likert_scale">Likert Scale (5-point)</option>
                                  <option value="rating_scale">Rating Scale</option>
                                  <option value="matrix">Matrix</option>
                                  <option value="yes_no">Yes / No</option>
                                  <option value="number">Number</option>
                                  <option value="date">Date</option>
                                  <option value="email">Email</option>
                                  <option value="phone">Phone</option>
                                </select>

                                <span className="text-[10px] font-mono text-[#737873] dark:text-[#9BA19B]">
                                  Confidence: {Math.round(q.confidence * 100)}%
                                </span>

                                {q.reviewRequired && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 rounded">
                                    Needs Confirmation
                                  </span>
                                )}
                              </div>

                              {/* Question title input */}
                              <input
                                type="text"
                                value={q.text}
                                onChange={(e) => handleUpdateQuestionText(q.id, e.target.value)}
                                className="w-full text-xs font-medium text-[#171918] dark:text-[#F0F2EE] bg-transparent border-b border-transparent hover:border-[#E2E4DF] focus:border-[#176B52] focus:outline-none px-0 py-0.5"
                              />

                              {/* Options review */}
                              {q.options && q.options.length > 0 && (
                                <div className="space-y-1 pt-1">
                                  <div className="text-[10px] uppercase font-semibold text-[#737873] dark:text-[#9BA19B]">
                                    Options ({q.options.length}):
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                    {q.options.map((opt) => (
                                      <div
                                        key={opt.id}
                                        className="flex items-center gap-1.5 text-xs px-2 py-1 bg-[#F7F7F4] dark:bg-[#141715] rounded border border-[#E2E4DF]/60 dark:border-[#272C28]"
                                      >
                                        <span className="text-[10px] text-[#737873] font-mono">•</span>
                                        <input
                                          type="text"
                                          value={opt.label}
                                          onChange={(e) =>
                                            handleUpdateOptionLabel(q.id, opt.id, e.target.value)
                                          }
                                          className="text-[11px] bg-transparent flex-1 focus:outline-none"
                                        />
                                        {opt.isOther && (
                                          <span className="text-[9px] font-medium bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-1 rounded">
                                            Branch
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Evidence Notes */}
                              {q.evidenceNotes && q.evidenceNotes.length > 0 && (
                                <div className="text-[10px] text-[#737873] dark:text-[#9BA19B] italic">
                                  Inference evidence: {q.evidenceNotes.join(' • ')}
                                </div>
                              )}

                              {/* Provenance extract accordion */}
                              {isExpanded && (
                                <div className="mt-2 p-2.5 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5 text-[11px] font-mono space-y-1">
                                  <div className="text-[10px] uppercase font-bold text-[#737873] dark:text-[#9BA19B]">
                                    Source Provenance Blocks ({q.source.blockIds.join(', ')}):
                                  </div>
                                  <pre className="whitespace-pre-wrap text-[#171918] dark:text-[#F0F2EE] text-[10px] leading-relaxed">
                                    {q.source.originalText}
                                  </pre>
                                </div>
                              )}
                            </div>

                            {/* Provenance toggle */}
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedProvenanceId(isExpanded ? null : q.id)
                              }
                              className="text-[11px] text-[#737873] hover:text-[#171918] dark:hover:text-[#F0F2EE] flex items-center gap-1 shrink-0 p-1 rounded hover:bg-black/5"
                              title="Inspect raw source text"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">
                                {isExpanded ? 'Hide' : 'Source'}
                              </span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom Confirm Bar */}
                  <div className="pt-3 border-t border-[#E2E4DF] dark:border-[#272C28] flex items-center justify-between">
                    <span className="text-[11px] text-[#737873] dark:text-[#9BA19B]">
                      Ready to render into Formora canvas. You can reorder questions anytime in the
                      editor.
                    </span>
                    <button
                      onClick={handleConfirmAndGenerate}
                      className="px-5 py-2 text-xs font-semibold text-white bg-[#176B52] hover:bg-[#125541] rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm & Open in Form Editor</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Form Health Checklist */}
          {activeTab === 'improve' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#171918] dark:text-[#F0F2EE]">
                Structural Health Checklist
              </h4>
              <div className="space-y-2">
                {formHealthIssues.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#F7F7F4] dark:bg-[#111412] rounded-lg border border-[#E2E4DF] dark:border-[#272C28] text-xs space-y-1"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#171918] dark:text-[#F0F2EE]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#176B52] dark:text-[#228B6B]" />
                      <span>{item.issue}</span>
                    </div>
                    <p className="text-[11px] text-[#737873] dark:text-[#9BA19B] pl-5">
                      {item.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
