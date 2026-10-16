import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Star, Send } from 'lucide-react';
import { FormModel, FormQuestion, LogicRule } from '../types/form';

interface PublicFormViewProps {
  form: FormModel;
  onSubmitResponse?: (answers: Record<string, any>, completionSeconds: number) => Promise<{ receiptId: string }>;
  isEmbedded?: boolean;
}

export const PublicFormView: React.FC<PublicFormViewProps> = ({
  form,
  onSubmitResponse,
  isEmbedded = false,
}) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [receiptId, setReceiptId] = useState<string>('');
  const [startTime] = useState<number>(Date.now());

  // Evaluate which questions are visible based on conditional logic
  const getVisibleQuestionIds = (): Set<string> => {
    const visible = new Set<string>();
    const hiddenByLogic = new Set<string>();

    // Initial pass: all questions visible unless hidden by a triggered rule
    for (const q of form.questions) {
      if (q.logicRules && q.logicRules.length > 0) {
        for (const rule of q.logicRules) {
          const ans = answers[rule.sourceQuestionId];
          let conditionMet = false;

          if (rule.operator === 'equals') {
            conditionMet = String(ans).toLowerCase() === String(rule.value).toLowerCase();
          } else if (rule.operator === 'not_equals') {
            conditionMet = String(ans).toLowerCase() !== String(rule.value).toLowerCase();
          } else if (rule.operator === 'contains') {
            conditionMet = String(ans).toLowerCase().includes(String(rule.value).toLowerCase());
          } else if (rule.operator === 'greater_than') {
            conditionMet = Number(ans) > Number(rule.value);
          } else if (rule.operator === 'less_than') {
            conditionMet = Number(ans) < Number(rule.value);
          }

          if (conditionMet) {
            if (rule.action === 'hide' && rule.targetId) {
              hiddenByLogic.add(rule.targetId);
            }
          } else {
            // If condition was to show target, and condition NOT met, hide target
            if (rule.action === 'show' && rule.targetId) {
              hiddenByLogic.add(rule.targetId);
            }
          }
        }
      }
    }

    for (const q of form.questions) {
      if (!hiddenByLogic.has(q.id)) {
        visible.add(q.id);
      }
    }
    return visible;
  };

  const visibleQuestionIds = getVisibleQuestionIds();
  const visibleQuestions = form.questions.filter((q) => visibleQuestionIds.has(q.id));

  // Progress calculation
  const answeredCount = visibleQuestions.filter((q) => {
    const a = answers[q.id];
    return a !== undefined && a !== '' && (Array.isArray(a) ? a.length > 0 : true);
  }).length;
  const progressPercent =
    visibleQuestions.length > 0 ? Math.round((answeredCount / visibleQuestions.length) * 100) : 0;

  const handleAnswerChange = (qId: string, val: any) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
    if (errors[qId]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[qId];
        return copy;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    for (const q of visibleQuestions) {
      if (q.type === 'section_break' || q.type === 'info_text') continue;

      const val = answers[q.id];
      if (q.validation?.required) {
        if (
          val === undefined ||
          val === null ||
          val === '' ||
          (Array.isArray(val) && val.length === 0)
        ) {
          newErrors[q.id] = 'This question requires an answer.';
          continue;
        }
      }

      if (q.type === 'email' && val) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) {
          newErrors[q.id] = 'Please enter a valid email address.';
        }
      }

      if (q.type === 'number' && val !== undefined && val !== '') {
        const num = Number(val);
        if (isNaN(num)) {
          newErrors[q.id] = 'Please enter a valid numeric value.';
        } else if (q.validation?.minValue !== undefined && num < q.validation.minValue) {
          newErrors[q.id] = `Value cannot be less than ${q.validation.minValue}.`;
        } else if (q.validation?.maxValue !== undefined && num > q.validation.maxValue) {
          newErrors[q.id] = `Value cannot exceed ${q.validation.maxValue}.`;
        }
      }

      if (q.type === 'multiple_choice' && Array.isArray(val)) {
        if (q.validation?.minSelect && val.length < q.validation.minSelect) {
          newErrors[q.id] = `Please select at least ${q.validation.minSelect} options.`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    const completionSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));

    try {
      if (onSubmitResponse) {
        const res = await onSubmitResponse(answers, completionSeconds);
        setReceiptId(res.receiptId || `REC-${Date.now().toString(36).toUpperCase()}`);
      } else {
        // Fallback direct submission to backend endpoint
        const res = await fetch(`/api/forms/${form.id}/responses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers, completionTimeSeconds: completionSeconds }),
        });
        const data = await res.json();
        setReceiptId(data.receiptId || `REC-${Date.now().toString(36).toUpperCase()}`);
      }
      setIsSubmitted(true);
    } catch (err) {
      console.error('Submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-6 bg-white dark:bg-[#191D1A] rounded-2xl border border-[#E2E4DF] dark:border-[#272C28] text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#E8F3EE] dark:bg-[#172D24] text-[#176B52] dark:text-[#228B6B] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#171918] dark:text-[#F0F2EE]">
            {form.branding?.thankYouTitle || 'Thank you!'}
          </h2>
          <p className="text-sm text-[#737873] dark:text-[#9BA19B] leading-relaxed">
            {form.branding?.thankYouMessage || 'Your response has been securely recorded.'}
          </p>
          <div className="pt-4 border-t border-[#E2E4DF] dark:border-[#272C28] text-xs text-[#737873] dark:text-[#9BA19B] font-mono">
            Submission Receipt: <span className="font-semibold text-[#171918] dark:text-[#F0F2EE]">{receiptId}</span>
          </div>
          {form.settings?.allowMultipleSubmissions && (
            <button
              onClick={() => {
                setAnswers({});
                setIsSubmitted(false);
              }}
              className="text-xs font-semibold text-[#176B52] dark:text-[#228B6B] hover:underline pt-2 block mx-auto"
            >
              Submit another response
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-2xl mx-auto ${isEmbedded ? '' : 'py-10 px-4 sm:px-6'}`}>
      {/* Form Container */}
      <div className="bg-white dark:bg-[#191D1A] rounded-2xl border border-[#E2E4DF] dark:border-[#272C28] shadow-sm overflow-hidden">
        {/* Decorative Top Accent Bar */}
        <div
          className="h-2 w-full"
          style={{ backgroundColor: form.branding?.accentColor || '#176B52' }}
        />

        {/* Progress Bar */}
        {form.branding?.showProgressBar && (
          <div className="w-full bg-[#F0F2ED] dark:bg-[#222723] h-1.5">
            <div
              className="h-1.5 transition-all duration-300"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: form.branding?.accentColor || '#176B52',
              }}
            />
          </div>
        )}

        <div className="p-6 sm:p-10">
          {/* Header */}
          <div className="mb-8 pb-6 border-b border-[#E2E4DF] dark:border-[#272C28]">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#171918] dark:text-[#F0F2EE] mb-2 [text-wrap:balance]">
              {form.title}
            </h1>
            {form.description && (
              <p className="text-sm text-[#737873] dark:text-[#9BA19B] leading-relaxed [text-wrap:balance]">
                {form.description}
              </p>
            )}
            {form.settings?.allowAnonymous && (
              <div className="mt-3 text-[11px] text-[#737873] dark:text-[#9BA19B]">
                Anonymous submission · No user identifier is recorded
              </div>
            )}
          </div>

          {/* Form Questions Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {visibleQuestions.map((q, idx) => {
              const error = errors[q.id];
              const value = answers[q.id];

              if (q.type === 'section_break') {
                return (
                  <div key={q.id} className="pt-6 pb-2 border-b border-[#E2E4DF] dark:border-[#272C28]">
                    <h2 className="text-lg font-bold text-[#171918] dark:text-[#F0F2EE]">
                      {q.title}
                    </h2>
                    {q.description && (
                      <p className="text-xs text-[#737873] dark:text-[#9BA19B] mt-1">{q.description}</p>
                    )}
                  </div>
                );
              }

              if (q.type === 'info_text') {
                return (
                  <div
                    key={q.id}
                    className="p-4 bg-[#F7F7F4] dark:bg-[#111412] rounded-xl text-xs text-[#737873] dark:text-[#9BA19B] leading-relaxed border border-[#E2E4DF] dark:border-[#272C28]"
                  >
                    <span className="font-semibold text-[#171918] dark:text-[#F0F2EE] block mb-1">
                      {q.title}
                    </span>
                    {q.description}
                  </div>
                );
              }

              return (
                <div key={q.id} className="space-y-2">
                  <label className="block text-sm font-semibold text-[#171918] dark:text-[#F0F2EE]">
                    <span>{idx + 1}. {q.title}</span>
                    {q.validation?.required && (
                      <span className="text-red-500 ml-1 font-bold">*</span>
                    )}
                  </label>

                  {q.description && (
                    <p className="text-xs text-[#737873] dark:text-[#9BA19B] leading-relaxed">
                      {q.description}
                    </p>
                  )}

                  {/* Input Types */}
                  <div className="pt-1">
                    {/* Short Text */}
                    {q.type === 'short_text' && (
                      <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        placeholder={q.placeholder || 'Your answer'}
                        className="w-full px-3.5 py-2.5 text-sm bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                      />
                    )}

                    {/* Long Text */}
                    {q.type === 'long_text' && (
                      <textarea
                        rows={4}
                        value={value || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        placeholder={q.placeholder || 'Your answer'}
                        className="w-full px-3.5 py-2.5 text-sm bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                      />
                    )}

                    {/* Email */}
                    {q.type === 'email' && (
                      <input
                        type="email"
                        value={value || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        placeholder={q.placeholder || 'name@example.com'}
                        className="w-full px-3.5 py-2.5 text-sm bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                      />
                    )}

                    {/* Phone */}
                    {q.type === 'phone' && (
                      <input
                        type="tel"
                        value={value || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        placeholder={q.placeholder || '+1 (555) 000-0000'}
                        className="w-full px-3.5 py-2.5 text-sm bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                      />
                    )}

                    {/* Number */}
                    {q.type === 'number' && (
                      <input
                        type="number"
                        value={value || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        placeholder={q.placeholder || '0'}
                        className="w-full px-3.5 py-2.5 text-sm bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                      />
                    )}

                    {/* Date */}
                    {q.type === 'date' && (
                      <input
                        type="date"
                        value={value || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                      />
                    )}

                    {/* URL */}
                    {q.type === 'url' && (
                      <input
                        type="url"
                        value={value || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        placeholder={q.placeholder || 'https://'}
                        className="w-full px-3.5 py-2.5 text-sm bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                      />
                    )}

                    {/* Dropdown */}
                    {q.type === 'dropdown' && (
                      <select
                        value={value || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                      >
                        <option value="">Select an option...</option>
                        {q.options?.map((opt) => (
                          <option key={opt.id} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Single Choice (Radio) */}
                    {(q.type === 'single_choice' || q.type === 'yes_no' || q.type === 'true_false') && (
                      <div className="space-y-2">
                        {(q.options || (q.type === 'yes_no' ? [{ id: 'y', label: 'Yes', value: 'yes' }, { id: 'n', label: 'No', value: 'no' }] : [{ id: 't', label: 'True', value: 'true' }, { id: 'f', label: 'False', value: 'false' }])).map((opt) => {
                          const isChecked = value === opt.value;
                          return (
                            <label
                              key={opt.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                isChecked
                                  ? 'bg-[#E8F3EE] dark:bg-[#172D24] border-[#176B52] dark:border-[#228B6B] text-[#171918] dark:text-[#F0F2EE]'
                                  : 'bg-[#F7F7F4] dark:bg-[#111412] border-[#E2E4DF] dark:border-[#272C28] hover:bg-[#F0F2ED] dark:hover:bg-[#222723]'
                              }`}
                            >
                              <input
                                type="radio"
                                name={q.id}
                                value={opt.value}
                                checked={isChecked}
                                onChange={() => handleAnswerChange(q.id, opt.value)}
                                className="text-[#176B52] focus:ring-[#176B52]"
                              />
                              <span className="text-xs font-medium">{opt.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* Multiple Choice Checkboxes */}
                    {q.type === 'multiple_choice' && (
                      <div className="space-y-2">
                        {q.options?.map((opt) => {
                          const selectedList: string[] = Array.isArray(value) ? value : [];
                          const isChecked = selectedList.includes(opt.value);
                          return (
                            <label
                              key={opt.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                isChecked
                                  ? 'bg-[#E8F3EE] dark:bg-[#172D24] border-[#176B52] dark:border-[#228B6B] text-[#171918] dark:text-[#F0F2EE]'
                                  : 'bg-[#F7F7F4] dark:bg-[#111412] border-[#E2E4DF] dark:border-[#272C28] hover:bg-[#F0F2ED] dark:hover:bg-[#222723]'
                              }`}
                            >
                              <input
                                type="checkbox"
                                value={opt.value}
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handleAnswerChange(q.id, [...selectedList, opt.value]);
                                  } else {
                                    handleAnswerChange(
                                      q.id,
                                      selectedList.filter((v) => v !== opt.value)
                                    );
                                  }
                                }}
                                className="rounded text-[#176B52] focus:ring-[#176B52]"
                              />
                              <span className="text-xs font-medium">{opt.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* Likert Scale & Rating */}
                    {(q.type === 'likert_5' || q.type === 'likert_7' || q.type === 'satisfaction' || q.type === 'agreement') && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {(q.options || [
                          { id: '1', label: '1 - Strongly Disagree', value: '1' },
                          { id: '2', label: '2 - Disagree', value: '2' },
                          { id: '3', label: '3 - Neutral', value: '3' },
                          { id: '4', label: '4 - Agree', value: '4' },
                          { id: '5', label: '5 - Strongly Agree', value: '5' },
                        ]).map((opt) => {
                          const isSelected = value === opt.value;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleAnswerChange(q.id, opt.value)}
                              className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                                isSelected
                                  ? 'bg-[#176B52] text-white border-[#176B52] font-semibold'
                                  : 'bg-[#F7F7F4] dark:bg-[#111412] border-[#E2E4DF] dark:border-[#272C28] text-[#171918] dark:text-[#F0F2EE] hover:bg-[#F0F2ED] dark:hover:bg-[#222723]'
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Net Promoter Score (0 to 10) */}
                    {q.type === 'nps' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-[#737873] dark:text-[#9BA19B] px-1">
                          <span>{q.scaleMinLabel || '0 - Not likely'}</span>
                          <span>{q.scaleMaxLabel || '10 - Extremely likely'}</span>
                        </div>
                        <div className="grid grid-cols-11 gap-1">
                          {Array.from({ length: 11 }, (_, i) => i).map((score) => {
                            const isSelected = value === score;
                            return (
                              <button
                                key={score}
                                type="button"
                                onClick={() => handleAnswerChange(q.id, score)}
                                className={`py-2 text-xs font-mono font-medium rounded-md border transition-colors ${
                                  isSelected
                                    ? 'bg-[#176B52] text-white border-[#176B52] font-bold'
                                    : 'bg-[#F7F7F4] dark:bg-[#111412] border-[#E2E4DF] dark:border-[#272C28] text-[#171918] dark:text-[#F0F2EE] hover:bg-[#F0F2ED] dark:hover:bg-[#222723]'
                                }`}
                              >
                                {score}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Star Rating */}
                    {q.type === 'star_rating' && (
                      <div className="flex items-center gap-1.5 py-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleAnswerChange(q.id, star)}
                            className="p-1 text-[#E2E4DF] hover:text-amber-400 transition-colors focus:outline-none"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                (value || 0) >= star
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-[#737873]/30'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Matrix / Grid */}
                    {q.type === 'matrix' && q.matrixRows && q.matrixColumns && (
                      <div className="overflow-x-auto border border-[#E2E4DF] dark:border-[#272C28] rounded-xl">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-[#F7F7F4] dark:bg-[#111412] border-b border-[#E2E4DF] dark:border-[#272C28]">
                            <tr>
                              <th className="p-3 font-semibold text-[#171918] dark:text-[#F0F2EE]">Item</th>
                              {q.matrixColumns.map((col) => (
                                <th key={col} className="p-3 text-center font-medium text-[#737873]">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E2E4DF] dark:divide-[#272C28]">
                            {q.matrixRows.map((row) => (
                              <tr key={row} className="hover:bg-[#F0F2ED]/50 dark:hover:bg-[#222723]/30">
                                <td className="p-3 font-medium text-[#171918] dark:text-[#F0F2EE]">
                                  {row}
                                </td>
                                {q.matrixColumns!.map((col) => {
                                  const rowAns = (value && value[row]) === col;
                                  return (
                                    <td key={col} className="p-3 text-center">
                                      <input
                                        type="radio"
                                        name={`${q.id}_${row}`}
                                        checked={rowAns}
                                        onChange={() =>
                                          handleAnswerChange(q.id, {
                                            ...(value || {}),
                                            [row]: col,
                                          })
                                        }
                                        className="text-[#176B52] focus:ring-[#176B52]"
                                      />
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Signature */}
                    {q.type === 'signature' && (
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={value || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          placeholder="Type your legal full name to sign"
                          className="w-full px-3.5 py-2.5 text-sm font-serif italic bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#176B52]"
                        />
                        <span className="text-[11px] text-[#737873] block">
                          This constitutes an electronic signature and verification.
                        </span>
                      </div>
                    )}

                    {/* Consent Checkbox */}
                    {q.type === 'consent' && (
                      <label className="flex items-start gap-2.5 cursor-pointer text-xs leading-relaxed text-[#171918] dark:text-[#F0F2EE]">
                        <input
                          type="checkbox"
                          checked={!!value}
                          onChange={(e) => handleAnswerChange(q.id, e.target.checked)}
                          className="mt-0.5 rounded text-[#176B52] focus:ring-[#176B52]"
                        />
                        <span>I understand and voluntarily provide my consent.</span>
                      </label>
                    )}
                  </div>

                  {/* Error Indicator */}
                  {error && (
                    <div className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 pt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Submit Button */}
            <div className="pt-6 border-t border-[#E2E4DF] dark:border-[#272C28]">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 text-sm font-semibold text-white rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                style={{ backgroundColor: form.branding?.accentColor || '#176B52' }}
              >
                {isSubmitting ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{form.branding?.submitButtonText || 'Submit'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
