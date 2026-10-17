import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
  HelpCircle,
  GraduationCap,
} from 'lucide-react';
import { FormModel, ResearchObjective, ResearchHypothesis } from '../types/form';

interface ResearchAlignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: FormModel;
}

export const ResearchAlignmentModal: React.FC<ResearchAlignmentModalProps> = ({
  isOpen,
  onClose,
  form,
}) => {
  const [objectives, setObjectives] = useState<ResearchObjective[]>([
    {
      id: 'obj-1',
      title: 'Perceived Ease of Use',
      description: 'Evaluate respondent perceptions of cognitive friction and intuitive navigation.',
      mappedQuestionIds: [form.questions[0]?.id || ''],
    },
    {
      id: 'obj-2',
      title: 'Adoption Intention & Recommendation',
      description: 'Measure respondent likelihood to integrate the system in daily workflows.',
      mappedQuestionIds: [form.questions[1]?.id || ''],
    },
  ]);

  const [hypotheses, setHypotheses] = useState<ResearchHypothesis[]>([
    {
      id: 'hyp-1',
      statement: 'Higher perceived ease of use correlates positively with overall recommendation intention.',
      independentVariable: 'Ease of Use',
      dependentVariable: 'NPS / Recommendation',
      mappedQuestionIds: [form.questions[0]?.id || '', form.questions[1]?.id || ''],
      proposedTest: 'Pearson Correlation & Simple Linear Regression',
    },
  ]);

  const [alignmentResult, setAlignmentResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  if (!isOpen) return null;

  const handleAddObjective = () => {
    const newObj: ResearchObjective = {
      id: `obj-${Date.now()}`,
      title: 'New Research Objective',
      description: 'Operational definition...',
      mappedQuestionIds: [],
    };
    setObjectives([...objectives, newObj]);
  };

  const handleDeleteObjective = (id: string) => {
    setObjectives(objectives.filter((o) => o.id !== id));
  };

  const handleToggleMapping = (objId: string, qId: string) => {
    setObjectives(
      objectives.map((o) => {
        if (o.id !== objId) return o;
        const exists = o.mappedQuestionIds.includes(qId);
        return {
          ...o,
          mappedQuestionIds: exists
            ? o.mappedQuestionIds.filter((id) => id !== qId)
            : [...o.mappedQuestionIds, qId],
        };
      })
    );
  };

  const handleRunAlignmentCheck = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const totalObjs = objectives.length;
      const mappedObjs = objectives.filter((o) => o.mappedQuestionIds.length > 0).length;
      const coveragePct = totalObjs > 0 ? Math.round((mappedObjs / totalObjs) * 100) : 100;

      const unmappedObjectives = objectives
        .filter((o) => o.mappedQuestionIds.length === 0)
        .map((o) => ({
          construct: o.title,
          issue: 'No questionnaire items currently mapped to this research objective.',
        }));

      const allMappedQIds = new Set(objectives.flatMap((o) => o.mappedQuestionIds));
      const unmappedQuestions = form.questions
        .filter((q) => !allMappedQIds.has(q.id))
        .map((q) => ({
          questionId: q.id,
          title: q.title,
          reason: 'Item is not linked to any specified objective.',
        }));

      setAlignmentResult({
        overallScore: coveragePct,
        status: coveragePct >= 90 ? 'Strongly Aligned' : coveragePct >= 60 ? 'Moderately Aligned' : 'Needs Revision',
        alignmentGaps: unmappedObjectives,
        redundantQuestions: unmappedQuestions.slice(0, 3),
        recommendations: [
          `Coverage rate: ${coveragePct}% of defined objectives have mapped questions.`,
          unmappedObjectives.length > 0
            ? 'Map at least one measurement question to each unfilled objective.'
            : 'All objectives have associated measurement variables.',
        ],
      });
      setIsAnalyzing(false);
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-[#191D1A] rounded-2xl border border-[#E2E4DF] dark:border-[#272C28] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E4DF] dark:border-[#272C28]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E8F3EE] dark:bg-[#172D24] text-[#176B52] dark:text-[#228B6B] flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#171918] dark:text-[#F0F2EE]">
                Research Alignment Checker (Optional)
              </h3>
              <p className="text-xs text-[#737873] dark:text-[#9BA19B]">
                Verify whether your questionnaire items cover your research variables without gaps
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Objectives Manager */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-[#171918] dark:text-[#F0F2EE] uppercase tracking-wider text-[11px]">
                Research Objectives & Constructs
              </span>
              <button
                onClick={handleAddObjective}
                className="text-xs font-semibold text-[#176B52] dark:text-[#228B6B] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Objective</span>
              </button>
            </div>

            <div className="space-y-3">
              {objectives.map((obj) => (
                <div
                  key={obj.id}
                  className="p-3.5 bg-[#F7F7F4] dark:bg-[#111412] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={obj.title}
                      onChange={(e) =>
                        setObjectives(
                          objectives.map((o) => (o.id === obj.id ? { ...o, title: e.target.value } : o))
                        )
                      }
                      className="font-semibold text-xs bg-transparent border-b border-transparent hover:border-[#E2E4DF] focus:border-[#176B52] focus:outline-none flex-1 text-[#171918] dark:text-[#F0F2EE]"
                    />
                    <button
                      onClick={() => handleDeleteObjective(obj.id)}
                      className="text-[#737873] hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Mapping Pills */}
                  <div>
                    <span className="text-[10px] text-[#737873] block mb-1">
                      Mapped Questionnaire Items:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {form.questions.map((q) => {
                        const isMapped = obj.mappedQuestionIds.includes(q.id);
                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => handleToggleMapping(obj.id, q.id)}
                            className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                              isMapped
                                ? 'bg-[#176B52] text-white font-medium'
                                : 'bg-white dark:bg-[#191D1A] border border-[#E2E4DF] dark:border-[#272C28] text-[#737873]'
                            }`}
                          >
                            {q.title.slice(0, 30)}...
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alignment Run Trigger */}
          <div className="pt-2">
            <button
              onClick={handleRunAlignmentCheck}
              disabled={isAnalyzing}
              className="w-full py-2.5 text-xs font-semibold text-white bg-[#176B52] hover:bg-[#125541] rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Checking alignment matrix...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Evaluate Questionnaire Alignment</span>
                </>
              )}
            </button>
          </div>

          {/* Alignment Result Summary */}
          {alignmentResult && (
            <div className="p-4 bg-[#E8F3EE] dark:bg-[#172D24] rounded-xl border border-[#176B52]/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#176B52] dark:text-[#228B6B]">
                  Alignment Score: {alignmentResult.overallScore}% · {alignmentResult.status}
                </span>
              </div>
              <ul className="space-y-1.5 text-[#171918] dark:text-[#F0F2EE]">
                {alignmentResult.recommendations?.map((rec: string, i: number) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-[#176B52] font-bold">✓</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
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
