import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Eye,
  Sliders,
  Sparkles,
  Save,
  Undo2,
  Redo2,
  Share2,
  Download,
  Settings,
  ChevronDown,
  Check,
  Smartphone,
  Tablet,
  Monitor,
  GitBranch,
  Layers,
  HelpCircle,
  AlertCircle,
  FileDown,
} from 'lucide-react';
import {
  FormModel,
  FormQuestion,
  FormSection,
  QuestionType,
  LogicRule,
  LogicOperator,
  LogicAction,
} from '../types/form';
import { exportBlankFormWord } from '../utils/exports';

interface FormEditorProps {
  form: FormModel;
  onSaveForm: (updated: FormModel) => Promise<void>;
  onOpenShareModal: () => void;
  onOpenAICreator: (mode: 'improve') => void;
  onOpenPreview: () => void;
}

export const FormEditor: React.FC<FormEditorProps> = ({
  form,
  onSaveForm,
  onOpenShareModal,
  onOpenAICreator,
  onOpenPreview,
}) => {
  const [currentForm, setCurrentForm] = useState<FormModel>(form);
  const [activeTab, setActiveTab] = useState<'questions' | 'logic' | 'settings'>('questions');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(
    form.questions[0]?.id || ''
  );
  const [history, setHistory] = useState<FormModel[]>([form]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>('Saved');

  // Push to undo stack
  const updateFormWithHistory = (newForm: FormModel) => {
    const updatedHistory = history.slice(0, historyIdx + 1);
    updatedHistory.push(newForm);
    setHistory(updatedHistory);
    setHistoryIdx(updatedHistory.length - 1);
    setCurrentForm(newForm);
    setSaveStatus('Unsaved changes');
  };

  const handleUndo = () => {
    if (historyIdx > 0) {
      setHistoryIdx(historyIdx - 1);
      setCurrentForm(history[historyIdx - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      setHistoryIdx(historyIdx + 1);
      setCurrentForm(history[historyIdx + 1]);
    }
  };

  const handleManualSave = async () => {
    setIsSaving(true);
    try {
      await onSaveForm(currentForm);
      setSaveStatus('All changes saved');
    } catch (e) {
      setSaveStatus('Save error');
    } finally {
      setIsSaving(false);
    }
  };

  // Add Question
  const handleAddQuestion = (type: QuestionType = 'short_text') => {
    const newId = `q-${Date.now()}`;
    const newQuestion: FormQuestion = {
      id: newId,
      sectionId: currentForm.sections[0]?.id || 'sec-1',
      type,
      title: 'Untitled Question',
      description: '',
      validation: { required: false },
      options:
        type === 'single_choice' || type === 'multiple_choice' || type === 'dropdown'
          ? [
              { id: 'opt-1', label: 'Option 1', value: 'option_1' },
              { id: 'opt-2', label: 'Option 2', value: 'option_2' },
              { id: 'opt-3', label: 'Option 3', value: 'option_3' },
            ]
          : type === 'likert_5'
          ? [
              { id: 'l1', label: 'Strongly Disagree', value: '1' },
              { id: 'l2', label: 'Disagree', value: '2' },
              { id: 'l3', label: 'Neutral', value: '3' },
              { id: 'l4', label: 'Agree', value: '4' },
              { id: 'l5', label: 'Strongly Agree', value: '5' },
            ]
          : undefined,
      matrixRows: type === 'matrix' ? ['Row 1', 'Row 2', 'Row 3'] : undefined,
      matrixColumns: type === 'matrix' ? ['Poor', 'Fair', 'Good', 'Excellent'] : undefined,
      scaleMin: type === 'nps' ? 0 : 1,
      scaleMax: type === 'nps' ? 10 : 5,
      scaleMinLabel: type === 'nps' ? 'Not likely' : 'Low',
      scaleMaxLabel: type === 'nps' ? 'Extremely likely' : 'High',
    };

    const updated = {
      ...currentForm,
      questions: [...currentForm.questions, newQuestion],
    };
    updateFormWithHistory(updated);
    setSelectedQuestionId(newId);
  };

  // Delete Question
  const handleDeleteQuestion = (qId: string) => {
    const updated = {
      ...currentForm,
      questions: currentForm.questions.filter((q) => q.id !== qId),
    };
    updateFormWithHistory(updated);
    if (selectedQuestionId === qId) {
      setSelectedQuestionId(updated.questions[0]?.id || '');
    }
  };

  // Duplicate Question
  const handleDuplicateQuestion = (qId: string) => {
    const q = currentForm.questions.find((x) => x.id === qId);
    if (!q) return;
    const duplicated: FormQuestion = {
      ...q,
      id: `q-${Date.now()}`,
      title: `${q.title} (Copy)`,
    };
    const idx = currentForm.questions.findIndex((x) => x.id === qId);
    const newQuestions = [...currentForm.questions];
    newQuestions.splice(idx + 1, 0, duplicated);
    updateFormWithHistory({ ...currentForm, questions: newQuestions });
    setSelectedQuestionId(duplicated.id);
  };

  // Move Question Up/Down
  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= currentForm.questions.length) return;
    const newQuestions = [...currentForm.questions];
    const [moved] = newQuestions.splice(index, 1);
    newQuestions.splice(targetIdx, 0, moved);
    updateFormWithHistory({ ...currentForm, questions: newQuestions });
  };

  // Update specific question field
  const handleUpdateQuestion = (qId: string, patch: Partial<FormQuestion>) => {
    const updated = {
      ...currentForm,
      questions: currentForm.questions.map((q) => (q.id === qId ? { ...q, ...patch } : q)),
    };
    updateFormWithHistory(updated);
  };

  // Selected Question Reference
  const selectedQuestion = currentForm.questions.find((q) => q.id === selectedQuestionId);

  // Add Option to choice question
  const handleAddOption = (qId: string) => {
    if (!selectedQuestion) return;
    const options = selectedQuestion.options || [];
    const newOpt = {
      id: `opt-${Date.now()}`,
      label: `Option ${options.length + 1}`,
      value: `option_${options.length + 1}`,
    };
    handleUpdateQuestion(qId, { options: [...options, newOpt] });
  };

  const handleUpdateOption = (qId: string, optId: string, label: string) => {
    if (!selectedQuestion || !selectedQuestion.options) return;
    const updatedOpts = selectedQuestion.options.map((o) =>
      o.id === optId ? { ...o, label, value: label.toLowerCase().replace(/\s+/g, '_') } : o
    );
    handleUpdateQuestion(qId, { options: updatedOpts });
  };

  const handleDeleteOption = (qId: string, optId: string) => {
    if (!selectedQuestion || !selectedQuestion.options) return;
    const updatedOpts = selectedQuestion.options.filter((o) => o.id !== optId);
    handleUpdateQuestion(qId, { options: updatedOpts });
  };

  // Logic Rules Management
  const handleAddLogicRule = (sourceQuestionId: string) => {
    const q = currentForm.questions.find((x) => x.id === sourceQuestionId);
    if (!q) return;
    const newRule: LogicRule = {
      id: `rule-${Date.now()}`,
      sourceQuestionId,
      operator: 'equals',
      value: q.options?.[0]?.label || 'Yes',
      action: 'show',
      targetId: currentForm.questions.find((x) => x.id !== sourceQuestionId)?.id || '',
    };
    const rules = q.logicRules || [];
    handleUpdateQuestion(sourceQuestionId, { logicRules: [...rules, newRule] });
  };

  const handleDeleteLogicRule = (sourceQuestionId: string, ruleId: string) => {
    const q = currentForm.questions.find((x) => x.id === sourceQuestionId);
    if (!q || !q.logicRules) return;
    handleUpdateQuestion(sourceQuestionId, {
      logicRules: q.logicRules.filter((r) => r.id !== ruleId),
    });
  };

  const handleUpdateLogicRule = (
    sourceQuestionId: string,
    ruleId: string,
    patch: Partial<LogicRule>
  ) => {
    const q = currentForm.questions.find((x) => x.id === sourceQuestionId);
    if (!q || !q.logicRules) return;
    handleUpdateQuestion(sourceQuestionId, {
      logicRules: q.logicRules.map((r) => (r.id === ruleId ? { ...r, ...patch } : r)),
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#F7F7F4] dark:bg-[#111412] text-[#171918] dark:text-[#F0F2EE]">
      {/* Editor Subheader & Action Bar */}
      <div className="h-14 px-4 sm:px-6 bg-white dark:bg-[#191D1A] border-b border-[#E2E4DF] dark:border-[#272C28] flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          {/* Form Title Quick Edit */}
          <input
            type="text"
            value={currentForm.title}
            onChange={(e) => updateFormWithHistory({ ...currentForm, title: e.target.value })}
            className="text-sm font-bold bg-transparent border-b border-transparent hover:border-[#E2E4DF] dark:hover:border-[#272C28] focus:border-[#176B52] focus:outline-none px-1 py-0.5 rounded truncate max-w-xs sm:max-w-md"
          />

          <span className="text-[11px] text-[#737873] dark:text-[#9BA19B] hidden sm:inline">
            {saveStatus}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5 mr-2 border-r border-[#E2E4DF] dark:border-[#272C28] pr-2">
            <button
              onClick={handleUndo}
              disabled={historyIdx === 0}
              className="p-1.5 rounded text-[#737873] hover:text-[#171918] dark:hover:text-[#F0F2EE] disabled:opacity-30 transition-colors"
              title="Undo"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIdx >= history.length - 1}
              className="p-1.5 rounded text-[#737873] hover:text-[#171918] dark:hover:text-[#F0F2EE] disabled:opacity-30 transition-colors"
              title="Redo"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* AI Audit / Improve */}
          <button
            onClick={() => onOpenAICreator('improve')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#176B52] dark:text-[#228B6B] bg-[#E8F3EE] dark:bg-[#172D24] hover:bg-[#D5EADB] dark:hover:bg-[#1C3B2E] rounded-md transition-colors whitespace-nowrap"
            title="Audit question clarity, scales, and bias"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Audit</span>
          </button>

          {/* Blank Word Export */}
          <button
            onClick={() => exportBlankFormWord(currentForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#737873] dark:text-[#9BA19B] hover:text-[#171918] dark:hover:text-[#F0F2EE] border border-[#E2E4DF] dark:border-[#272C28] rounded-md transition-colors whitespace-nowrap"
            title="Download blank printable Word document"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Blank Form</span>
          </button>

          {/* Live Preview Toggle */}
          <button
            onClick={onOpenPreview}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#171918] dark:text-[#F0F2EE] bg-[#F0F2ED] dark:bg-[#222723] hover:bg-[#E2E4DF] dark:hover:bg-[#272C28] rounded-md transition-colors whitespace-nowrap"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>

          {/* Share / Publish */}
          <button
            onClick={onOpenShareModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#171918] dark:text-[#F0F2EE] border border-[#E2E4DF] dark:border-[#272C28] rounded-md hover:bg-[#F0F2ED] dark:hover:bg-[#222723] transition-colors whitespace-nowrap"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Publish & Share</span>
          </button>

          {/* Manual Save */}
          <button
            onClick={handleManualSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#176B52] hover:bg-[#125541] rounded-md shadow-sm transition-colors whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Editor Main Canvas (3-column layout) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Question & Section Tree */}
        <aside className="w-64 sm:w-72 bg-white dark:bg-[#191D1A] border-r border-[#E2E4DF] dark:border-[#272C28] flex flex-col shrink-0">
          <div className="p-3 border-b border-[#E2E4DF] dark:border-[#272C28] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#171918] dark:text-[#F0F2EE]">
              Questions ({currentForm.questions.length})
            </span>
            <button
              onClick={() => handleAddQuestion('short_text')}
              className="p-1 rounded text-[#176B52] hover:bg-[#E8F3EE] dark:hover:bg-[#172D24] transition-colors"
              title="Add Question"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {currentForm.questions.map((q, idx) => {
              const isSelected = q.id === selectedQuestionId;
              return (
                <div
                  key={q.id}
                  onClick={() => setSelectedQuestionId(q.id)}
                  className={`group p-2.5 rounded-lg text-xs cursor-pointer transition-colors border ${
                    isSelected
                      ? 'bg-[#E8F3EE] dark:bg-[#172D24] border-[#176B52] dark:border-[#228B6B] text-[#176B52] dark:text-[#228B6B] font-medium'
                      : 'bg-transparent border-transparent text-[#171918] dark:text-[#F0F2EE] hover:bg-[#F0F2ED] dark:hover:bg-[#222723]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate flex-1">
                      {idx + 1}. {q.title || 'Untitled Question'}
                    </span>
                    <span className="text-[10px] text-[#737873] dark:text-[#9BA19B] uppercase font-mono shrink-0">
                      {q.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 border-t border-[#E2E4DF] dark:border-[#272C28]">
            <button
              onClick={() => handleAddQuestion('short_text')}
              className="w-full py-2 text-xs font-semibold text-[#176B52] dark:text-[#228B6B] bg-[#E8F3EE] dark:bg-[#172D24] hover:bg-[#D5EADB] dark:hover:bg-[#1C3B2E] rounded-md transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Question</span>
            </button>
          </div>
        </aside>

        {/* Center Column: Question Detail & Options Editor */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-3xl mx-auto w-full">
          {/* Navigation Mode Bar (Questions / Conditional Logic / Settings) */}
          <div className="flex items-center gap-1 p-1 bg-[#F0F2ED] dark:bg-[#191D1A] border border-[#E2E4DF] dark:border-[#272C28] rounded-lg text-xs font-medium mb-6 w-fit">
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-3.5 py-1.5 rounded-md transition-colors ${
                activeTab === 'questions'
                  ? 'bg-white dark:bg-[#222723] text-[#171918] dark:text-[#F0F2EE] shadow-sm font-semibold'
                  : 'text-[#737873] dark:text-[#9BA19B]'
              }`}
            >
              Question Builder
            </button>
            <button
              onClick={() => setActiveTab('logic')}
              className={`px-3.5 py-1.5 rounded-md transition-colors ${
                activeTab === 'logic'
                  ? 'bg-white dark:bg-[#222723] text-[#171918] dark:text-[#F0F2EE] shadow-sm font-semibold'
                  : 'text-[#737873] dark:text-[#9BA19B]'
              }`}
            >
              Conditional Logic
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-1.5 rounded-md transition-colors ${
                activeTab === 'settings'
                  ? 'bg-white dark:bg-[#222723] text-[#171918] dark:text-[#F0F2EE] shadow-sm font-semibold'
                  : 'text-[#737873] dark:text-[#9BA19B]'
              }`}
            >
              Form Settings & Theme
            </button>
          </div>

          {/* TAB 1: Questions Editor */}
          {activeTab === 'questions' && (
            <>
              {selectedQuestion ? (
                <div className="bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] p-6 space-y-6 shadow-sm">
                  {/* Question Header & Type Selector */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E4DF] dark:border-[#272C28]">
                    <div className="flex-1">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#737873] dark:text-[#9BA19B] mb-1">
                        Question Type
                      </label>
                      <select
                        value={selectedQuestion.type}
                        onChange={(e) =>
                          handleUpdateQuestion(selectedQuestion.id, {
                            type: e.target.value as QuestionType,
                          })
                        }
                        className="px-3 py-1.5 text-xs bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-md font-medium focus:ring-1 focus:ring-[#176B52]"
                      >
                        <optgroup label="Basic Input Fields">
                          <option value="short_text">Short Text</option>
                          <option value="long_text">Long Paragraph</option>
                          <option value="email">Email Address</option>
                          <option value="phone">Phone Number</option>
                          <option value="number">Numeric Value</option>
                          <option value="date">Date</option>
                          <option value="time">Time</option>
                          <option value="url">Website URL</option>
                          <option value="dropdown">Dropdown Select</option>
                          <option value="single_choice">Single Choice (Radio)</option>
                          <option value="multiple_choice">Multiple Choice (Checkboxes)</option>
                          <option value="yes_no">Yes / No</option>
                          <option value="true_false">True / False</option>
                        </optgroup>
                        <optgroup label="Rating & Feedback">
                          <option value="likert_5">5-Point Likert Scale</option>
                          <option value="likert_7">7-Point Likert Scale</option>
                          <option value="nps">Net Promoter Score (0-10)</option>
                          <option value="star_rating">Star Rating</option>
                          <option value="satisfaction">Satisfaction Scale</option>
                          <option value="agreement">Agreement Scale</option>
                        </optgroup>
                        <optgroup label="Advanced Fields">
                          <option value="matrix">Matrix / Grid Questions</option>
                          <option value="ranking">Ranking & Ordering</option>
                          <option value="signature">Signature Acknowledgement</option>
                          <option value="consent">Consent Checkbox</option>
                          <option value="section_break">Section Header</option>
                          <option value="info_text">Informational Text</option>
                        </optgroup>
                      </select>
                    </div>

                    {/* Question Toolbar Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          const idx = currentForm.questions.findIndex((q) => q.id === selectedQuestion.id);
                          handleMoveQuestion(idx, 'up');
                        }}
                        className="p-1.5 rounded hover:bg-[#F0F2ED] dark:hover:bg-[#222723] text-[#737873] hover:text-[#171918]"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          const idx = currentForm.questions.findIndex((q) => q.id === selectedQuestion.id);
                          handleMoveQuestion(idx, 'down');
                        }}
                        className="p-1.5 rounded hover:bg-[#F0F2ED] dark:hover:bg-[#222723] text-[#737873] hover:text-[#171918]"
                        title="Move Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicateQuestion(selectedQuestion.id)}
                        className="p-1.5 rounded hover:bg-[#F0F2ED] dark:hover:bg-[#222723] text-[#737873] hover:text-[#171918]"
                        title="Duplicate Question"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(selectedQuestion.id)}
                        className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-[#737873] hover:text-red-600"
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question Title & Description */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#171918] dark:text-[#F0F2EE] mb-1">
                        Question Title
                      </label>
                      <input
                        type="text"
                        value={selectedQuestion.title}
                        onChange={(e) =>
                          handleUpdateQuestion(selectedQuestion.id, { title: e.target.value })
                        }
                        placeholder="e.g., How satisfied are you with our service?"
                        className="w-full px-3.5 py-2 text-sm bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#737873] dark:text-[#9BA19B] mb-1">
                        Instructions or Description (Optional)
                      </label>
                      <input
                        type="text"
                        value={selectedQuestion.description || ''}
                        onChange={(e) =>
                          handleUpdateQuestion(selectedQuestion.id, {
                            description: e.target.value,
                          })
                        }
                        placeholder="Provide additional clarity or instructions for respondents..."
                        className="w-full px-3 py-1.5 text-xs bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                      />
                    </div>
                  </div>

                  {/* Choice Options Manager */}
                  {(selectedQuestion.type === 'single_choice' ||
                    selectedQuestion.type === 'multiple_choice' ||
                    selectedQuestion.type === 'dropdown' ||
                    selectedQuestion.type === 'likert_5' ||
                    selectedQuestion.type === 'likert_7') && (
                    <div className="space-y-3 pt-3 border-t border-[#E2E4DF] dark:border-[#272C28]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#171918] dark:text-[#F0F2EE]">
                          Response Options
                        </span>
                        <button
                          onClick={() => handleAddOption(selectedQuestion.id)}
                          className="text-xs font-medium text-[#176B52] dark:text-[#228B6B] hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Option</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {selectedQuestion.options?.map((opt, i) => (
                          <div key={opt.id} className="flex items-center gap-2">
                            <span className="text-xs text-[#737873] w-4">{i + 1}.</span>
                            <input
                              type="text"
                              value={opt.label}
                              onChange={(e) =>
                                handleUpdateOption(selectedQuestion.id, opt.id, e.target.value)
                              }
                              className="flex-1 px-3 py-1.5 text-xs bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-md focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                            />
                            {selectedQuestion.options!.length > 2 && (
                              <button
                                onClick={() => handleDeleteOption(selectedQuestion.id, opt.id)}
                                className="p-1 text-[#737873] hover:text-red-600 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matrix Configuration */}
                  {selectedQuestion.type === 'matrix' && (
                    <div className="space-y-4 pt-3 border-t border-[#E2E4DF] dark:border-[#272C28]">
                      <div>
                        <label className="block text-xs font-semibold text-[#171918] dark:text-[#F0F2EE] mb-1">
                          Matrix Rows (Items to Evaluate)
                        </label>
                        <textarea
                          rows={3}
                          value={selectedQuestion.matrixRows?.join('\n') || ''}
                          onChange={(e) =>
                            handleUpdateQuestion(selectedQuestion.id, {
                              matrixRows: e.target.value.split('\n').filter((l) => l.trim()),
                            })
                          }
                          placeholder="One row per line..."
                          className="w-full px-3 py-2 text-xs bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#171918] dark:text-[#F0F2EE] mb-1">
                          Matrix Columns (Rating Scale Labels)
                        </label>
                        <input
                          type="text"
                          value={selectedQuestion.matrixColumns?.join(', ') || ''}
                          onChange={(e) =>
                            handleUpdateQuestion(selectedQuestion.id, {
                              matrixColumns: e.target.value
                                .split(',')
                                .map((c) => c.trim())
                                .filter(Boolean),
                            })
                          }
                          placeholder="Poor, Fair, Good, Excellent"
                          className="w-full px-3 py-2 text-xs bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-md"
                        />
                      </div>
                    </div>
                  )}

                  {/* NPS / Scale Settings */}
                  {(selectedQuestion.type === 'nps' || selectedQuestion.type === 'star_rating') && (
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#E2E4DF] dark:border-[#272C28]">
                      <div>
                        <label className="block text-xs font-medium text-[#737873] dark:text-[#9BA19B] mb-1">
                          Min Label
                        </label>
                        <input
                          type="text"
                          value={selectedQuestion.scaleMinLabel || ''}
                          onChange={(e) =>
                            handleUpdateQuestion(selectedQuestion.id, {
                              scaleMinLabel: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 text-xs bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#737873] dark:text-[#9BA19B] mb-1">
                          Max Label
                        </label>
                        <input
                          type="text"
                          value={selectedQuestion.scaleMaxLabel || ''}
                          onChange={(e) =>
                            handleUpdateQuestion(selectedQuestion.id, {
                              scaleMaxLabel: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 text-xs bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-md"
                        />
                      </div>
                    </div>
                  )}

                  {/* Validation Rules */}
                  <div className="pt-4 border-t border-[#E2E4DF] dark:border-[#272C28] flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#171918] dark:text-[#F0F2EE]">
                      <input
                        type="checkbox"
                        checked={selectedQuestion.validation.required || false}
                        onChange={(e) =>
                          handleUpdateQuestion(selectedQuestion.id, {
                            validation: {
                              ...selectedQuestion.validation,
                              required: e.target.checked,
                            },
                          })
                        }
                        className="rounded border-[#E2E4DF] text-[#176B52] focus:ring-[#176B52]"
                      />
                      <span>Required field (respondent cannot skip)</span>
                    </label>

                    {selectedQuestion.type === 'multiple_choice' && (
                      <div className="flex items-center gap-2 text-xs text-[#737873]">
                        <span>Min select:</span>
                        <input
                          type="number"
                          min="0"
                          value={selectedQuestion.validation.minSelect || 0}
                          onChange={(e) =>
                            handleUpdateQuestion(selectedQuestion.id, {
                              validation: {
                                ...selectedQuestion.validation,
                                minSelect: Number(e.target.value),
                              },
                            })
                          }
                          className="w-14 px-2 py-1 text-xs bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-xs text-[#737873] dark:text-[#9BA19B] bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28]">
                  Select a question from the left sidebar or click "Add Question" to begin editing.
                </div>
              )}
            </>
          )}

          {/* TAB 2: Conditional Logic Rules */}
          {activeTab === 'logic' && (
            <div className="bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] p-6 space-y-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-[#E2E4DF] dark:border-[#272C28]">
                <div>
                  <h3 className="text-sm font-bold text-[#171918] dark:text-[#F0F2EE]">
                    Branching & Conditional Logic
                  </h3>
                  <p className="text-xs text-[#737873] dark:text-[#9BA19B]">
                    Dynamically display questions or skip sections based on earlier respondent choices.
                  </p>
                </div>
              </div>

              {selectedQuestion ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#171918] dark:text-[#F0F2EE]">
                      Rules for: {selectedQuestion.title}
                    </span>
                    <button
                      onClick={() => handleAddLogicRule(selectedQuestion.id)}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-[#176B52] hover:bg-[#125541] rounded-md transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Rule</span>
                    </button>
                  </div>

                  {selectedQuestion.logicRules && selectedQuestion.logicRules.length > 0 ? (
                    <div className="space-y-3">
                      {selectedQuestion.logicRules.map((rule) => (
                        <div
                          key={rule.id}
                          className="p-4 bg-[#F7F7F4] dark:bg-[#111412] rounded-lg border border-[#E2E4DF] dark:border-[#272C28] space-y-3 text-xs"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-[#176B52]">IF answer</span>
                            <select
                              value={rule.operator}
                              onChange={(e) =>
                                handleUpdateLogicRule(selectedQuestion.id, rule.id, {
                                  operator: e.target.value as LogicOperator,
                                })
                              }
                              className="px-2 py-1 bg-white dark:bg-[#191D1A] border border-[#E2E4DF] dark:border-[#272C28] rounded font-medium"
                            >
                              <option value="equals">equals</option>
                              <option value="not_equals">does not equal</option>
                              <option value="contains">contains</option>
                              <option value="greater_than">is greater than</option>
                              <option value="less_than">is less than</option>
                            </select>

                            <input
                              type="text"
                              value={rule.value}
                              onChange={(e) =>
                                handleUpdateLogicRule(selectedQuestion.id, rule.id, {
                                  value: e.target.value,
                                })
                              }
                              placeholder="Value..."
                              className="px-2.5 py-1 bg-white dark:bg-[#191D1A] border border-[#E2E4DF] dark:border-[#272C28] rounded w-32"
                            />

                            <span className="font-semibold text-[#176B52]">THEN</span>
                            <select
                              value={rule.action}
                              onChange={(e) =>
                                handleUpdateLogicRule(selectedQuestion.id, rule.id, {
                                  action: e.target.value as LogicAction,
                                })
                              }
                              className="px-2 py-1 bg-white dark:bg-[#191D1A] border border-[#E2E4DF] dark:border-[#272C28] rounded font-medium"
                            >
                              <option value="show">Show Question</option>
                              <option value="hide">Hide Question</option>
                              <option value="end_form">End Form Early</option>
                            </select>

                            {rule.action !== 'end_form' && (
                              <select
                                value={rule.targetId}
                                onChange={(e) =>
                                  handleUpdateLogicRule(selectedQuestion.id, rule.id, {
                                    targetId: e.target.value,
                                  })
                                }
                                className="px-2 py-1 bg-white dark:bg-[#191D1A] border border-[#E2E4DF] dark:border-[#272C28] rounded max-w-[180px] truncate"
                              >
                                {currentForm.questions
                                  .filter((q) => q.id !== selectedQuestion.id)
                                  .map((targetQ) => (
                                    <option key={targetQ.id} value={targetQ.id}>
                                      {targetQ.title}
                                    </option>
                                  ))}
                              </select>
                            )}

                            <button
                              onClick={() => handleDeleteLogicRule(selectedQuestion.id, rule.id)}
                              className="p-1 text-[#737873] hover:text-red-600 rounded ml-auto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-[#737873] dark:text-[#9BA19B] border border-dashed border-[#E2E4DF] dark:border-[#272C28] rounded-lg">
                      No logic rules configured for this question. Add a rule to show/hide follow-up questions.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-[#737873]">
                  Select a question to configure branching logic.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Settings & Branding */}
          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] p-6 space-y-6 shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-[#171918] dark:text-[#F0F2EE]">
                  Form Theme & Appearance
                </h3>
                <p className="text-xs text-[#737873] dark:text-[#9BA19B]">
                  Customize button labels, theme accent, and confirmation messages.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#737873] dark:text-[#9BA19B] mb-1">
                    Primary Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentForm.branding.accentColor || '#176B52'}
                      onChange={(e) =>
                        updateFormWithHistory({
                          ...currentForm,
                          branding: { ...currentForm.branding, accentColor: e.target.value },
                        })
                      }
                      className="w-8 h-8 rounded border-none cursor-pointer"
                    />
                    <span className="font-mono text-xs text-[#737873]">
                      {currentForm.branding.accentColor || '#176B52'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#737873] dark:text-[#9BA19B] mb-1">
                    Submit Button Text
                  </label>
                  <input
                    type="text"
                    value={currentForm.branding.submitButtonText || 'Submit'}
                    onChange={(e) =>
                      updateFormWithHistory({
                        ...currentForm,
                        branding: { ...currentForm.branding, submitButtonText: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#737873] dark:text-[#9BA19B] mb-1">
                    Thank You Title
                  </label>
                  <input
                    type="text"
                    value={currentForm.branding.thankYouTitle || 'Thank you!'}
                    onChange={(e) =>
                      updateFormWithHistory({
                        ...currentForm,
                        branding: { ...currentForm.branding, thankYouTitle: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#737873] dark:text-[#9BA19B] mb-1">
                    Thank You Message
                  </label>
                  <input
                    type="text"
                    value={currentForm.branding.thankYouMessage || 'Your response has been recorded.'}
                    onChange={(e) =>
                      updateFormWithHistory({
                        ...currentForm,
                        branding: { ...currentForm.branding, thankYouMessage: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-md"
                  />
                </div>
              </div>

              {/* Progress Bar Toggle */}
              <div className="pt-4 border-t border-[#E2E4DF] dark:border-[#272C28]">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#171918] dark:text-[#F0F2EE]">
                  <input
                    type="checkbox"
                    checked={currentForm.branding.showProgressBar}
                    onChange={(e) =>
                      updateFormWithHistory({
                        ...currentForm,
                        branding: {
                          ...currentForm.branding,
                          showProgressBar: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-[#E2E4DF] text-[#176B52] focus:ring-[#176B52]"
                  />
                  <span>Show progress bar to respondents as they complete sections</span>
                </label>
              </div>

              {/* Publication Settings */}
              <div className="pt-4 border-t border-[#E2E4DF] dark:border-[#272C28] space-y-3">
                <h4 className="text-xs font-bold text-[#171918] dark:text-[#F0F2EE]">
                  Access & Submission Limits
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#737873] dark:text-[#9BA19B] mb-1">
                      Response Limit (Max Submissions)
                    </label>
                    <input
                      type="number"
                      value={currentForm.settings.responseLimit || ''}
                      onChange={(e) =>
                        updateFormWithHistory({
                          ...currentForm,
                          settings: {
                            ...currentForm.settings,
                            responseLimit: e.target.value ? Number(e.target.value) : undefined,
                          },
                        })
                      }
                      placeholder="Unlimited"
                      className="w-full px-3 py-1.5 text-xs bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#737873] dark:text-[#9BA19B] mb-1">
                      Closing Date
                    </label>
                    <input
                      type="date"
                      value={currentForm.settings.closeDate || ''}
                      onChange={(e) =>
                        updateFormWithHistory({
                          ...currentForm,
                          settings: {
                            ...currentForm.settings,
                            closeDate: e.target.value || undefined,
                          },
                        })
                      }
                      className="w-full px-3 py-1.5 text-xs bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-md"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#171918] dark:text-[#F0F2EE]">
                    <input
                      type="checkbox"
                      checked={currentForm.settings.allowAnonymous}
                      onChange={(e) =>
                        updateFormWithHistory({
                          ...currentForm,
                          settings: {
                            ...currentForm.settings,
                            allowAnonymous: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-[#E2E4DF] text-[#176B52]"
                    />
                    <span>Allow anonymous responses without identifying metadata</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#171918] dark:text-[#F0F2EE]">
                    <input
                      type="checkbox"
                      checked={currentForm.settings.preventDuplicates}
                      onChange={(e) =>
                        updateFormWithHistory({
                          ...currentForm,
                          settings: {
                            ...currentForm.settings,
                            preventDuplicates: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-[#E2E4DF] text-[#176B52]"
                    />
                    <span>Prevent duplicate submissions from the same browser</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
