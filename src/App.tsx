/**
 * Formora Application
 * AI-Powered Form Builder, Questionnaire Creator, Survey Platform and Analytics Tool
 */

import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { FormEditor } from './components/FormEditor';
import { PublicFormView } from './components/PublicFormView';
import { ResponsesWorkspace } from './components/ResponsesWorkspace';
import { AnalyticsView } from './components/AnalyticsView';
import { StatisticsWorkspace } from './components/StatisticsWorkspace';
import { TemplateGallery } from './components/TemplateGallery';
import { AICreatorModal } from './components/AICreatorModal';
import { ShareModal } from './components/ShareModal';
import { ReportExportModal } from './components/ReportExportModal';
import { ResearchAlignmentModal } from './components/ResearchAlignmentModal';
import { AuthModal } from './components/AuthModal';
import { FormModel, FormResponse } from './types/form';
import { FORM_TEMPLATES } from './data/templates';
import { useAuth } from './context/AuthContext';
import {
  subscribeUserForms,
  saveFormToFirestore,
  deleteFormFromFirestore,
  subscribeFormResponses,
  submitResponseToFirestore,
  updateResponseStatusInFirestore,
  updateResponseNotesInFirestore,
  deleteResponseFromFirestore,
} from './services/firestoreService';
import {
  Smartphone,
  Tablet,
  Monitor,
  X,
  Plus,
  BarChart3,
  FileSpreadsheet,
  Settings,
  Sparkles,
  GraduationCap,
  Download,
} from 'lucide-react';

export default function App() {
  const { user, profile } = useAuth();

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('formora_theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('formora_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('formora_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  // Forms and responses state
  const [forms, setForms] = useState<FormModel[]>([]);
  const [responsesMap, setResponsesMap] = useState<Record<string, FormResponse[]>>({});
  const [isLoadingForms, setIsLoadingForms] = useState(true);

  // Current view routing
  const [currentView, setCurrentView] = useState<
    'landing' | 'dashboard' | 'editor' | 'responses' | 'analytics' | 'analytics-hub' | 'statistics' | 'templates'
  >('dashboard');

  const [activeFormId, setActiveFormId] = useState<string>('');

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAICreatorOpen, setIsAICreatorOpen] = useState(false);
  const [aiCreatorInitialMode, setAiCreatorInitialMode] = useState<
    'description' | 'topic' | 'document' | 'improve'
  >('description');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAlignmentModalOpen, setIsAlignmentModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Load Forms from backend API
  const loadForms = async () => {
    try {
      const res = await fetch('/api/forms');
      if (res.ok) {
        const data = await res.json();
        setForms(data.forms || []);
        if (data.forms && data.forms.length > 0 && !activeFormId) {
          setActiveFormId(data.forms[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load forms from API:', e);
    } finally {
      setIsLoadingForms(false);
    }
  };

  useEffect(() => {
    loadForms();
  }, []);

  // When user is authenticated, listen to real-time forms from Firestore
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeUserForms(
      user.uid,
      (remoteForms) => {
        if (remoteForms && remoteForms.length > 0) {
          setForms(remoteForms);
          if (!activeFormId) {
            setActiveFormId(remoteForms[0].id);
          }
        }
      },
      (err) => {
        console.warn('Firestore subscription fallback:', err.message);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Helper to refresh responses for a specific form from API
  const loadResponses = async (formId: string) => {
    try {
      const res = await fetch(`/api/forms/${formId}/responses`);
      if (res.ok) {
        const data = await res.json();
        setResponsesMap((prev) => ({ ...prev, [formId]: data.responses || [] }));
      }
    } catch (e) {
      console.error('Failed to load responses:', e);
    }
  };

  // Load responses for active form (subscribing in real-time if user is logged in)
  useEffect(() => {
    if (!activeFormId) return;

    if (user) {
      const unsubscribe = subscribeFormResponses(
        activeFormId,
        (resps) => {
          setResponsesMap((prev) => ({ ...prev, [activeFormId]: resps }));
        },
        (err) => {
          console.warn('Firestore responses fallback to API:', err.message);
          // Fallback to fetch API
          fetch(`/api/forms/${activeFormId}/responses`)
            .then((r) => r.json())
            .then((d) => {
              if (d.responses) {
                setResponsesMap((prev) => ({ ...prev, [activeFormId]: d.responses }));
              }
            })
            .catch(console.error);
        }
      );
      return () => unsubscribe();
    } else {
      fetch(`/api/forms/${activeFormId}/responses`)
        .then((r) => r.json())
        .then((d) => {
          if (d.responses) {
            setResponsesMap((prev) => ({ ...prev, [activeFormId]: d.responses }));
          }
        })
        .catch(console.error);
    }
  }, [activeFormId, user]);

  // URL Query Params Check for direct respondent filling link
  const urlParams = new URLSearchParams(window.location.search);
  const fillMode = urlParams.get('view') === 'fill';
  const fillFormId = urlParams.get('formId');

  const activeForm = forms.find((f) => f.id === activeFormId) || forms[0];
  const activeResponses = (activeForm && responsesMap[activeForm.id]) || [];

  // Standalone Respondent View (if visited via share URL ?view=fill&formId=...)
  if (fillMode && fillFormId) {
    const fillTargetForm = forms.find((f) => f.id === fillFormId || f.settings?.slug === fillFormId);
    if (!fillTargetForm && !isLoadingForms) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#F7F7F4] text-[#171918]">
          <div className="text-center space-y-2">
            <h1 className="text-xl font-bold">Form Not Found</h1>
            <p className="text-sm text-[#737873]">This questionnaire may have been archived or removed.</p>
          </div>
        </div>
      );
    }

    if (fillTargetForm) {
      return (
        <div className="min-h-screen bg-[#F7F7F4] dark:bg-[#111412] text-[#171918] dark:text-[#F0F2EE]">
          <PublicFormView
            form={fillTargetForm}
            onSubmitResponse={async (answers, completionTimeSeconds) => {
              const newResponse: FormResponse = {
                id: `resp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                formId: fillTargetForm.id,
                submittedAt: new Date().toISOString(),
                completionTimeSeconds,
                isComplete: true,
                status: 'valid',
                answers,
              };

              // Persist directly to Firestore
              try {
                await submitResponseToFirestore(fillTargetForm.id, newResponse);
              } catch (fsErr) {
                console.warn('Firestore response write notice:', fsErr);
              }

              // Also record via server endpoint for backup and notifications
              const res = await fetch(`/api/forms/${fillTargetForm.id}/responses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers, completionTimeSeconds, responseId: newResponse.id }),
              });
              const data = await res.json();
              return { receiptId: data.receiptId || newResponse.id };
            }}
          />
        </div>
      );
    }
  }

  // Form CRUD Handlers
  const handleSaveForm = async (updated: FormModel) => {
    try {
      // Sync to Firestore if authenticated
      if (user) {
        await saveFormToFirestore(updated, user.uid);
      }
      const res = await fetch(`/api/forms/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        const data = await res.json();
        setForms((prev) => prev.map((f) => (f.id === updated.id ? (data.form || updated) : f)));
      } else {
        setForms((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      }
    } catch (err) {
      console.error('Save failed:', err);
      setForms((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    }
  };

  const handleCreateNewForm = async (formData?: Partial<FormModel>) => {
    try {
      const payload: Partial<FormModel> = {
        ...(formData || {
          title: 'Untitled Questionnaire',
          description: 'Provide clear instructions for respondents.',
          category: 'General',
          questions: [
            {
              id: `q-${Date.now()}`,
              type: 'short_text',
              title: 'Full Name',
              validation: { required: false },
            },
            {
              id: `q-${Date.now() + 1}`,
              type: 'likert_5',
              title: 'How satisfied are you with our overall services?',
              validation: { required: true },
              options: [
                { id: '1', label: 'Strongly Disagree', value: '1' },
                { id: '2', label: 'Disagree', value: '2' },
                { id: '3', label: 'Neutral', value: '3' },
                { id: '4', label: 'Agree', value: '4' },
                { id: '5', label: 'Strongly Agree', value: '5' },
              ],
            },
          ],
        }),
        ownerId: user?.uid || 'usr-demo-owner',
      };

      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const createdForm: FormModel = data.form;
        if (user) {
          await saveFormToFirestore(createdForm, user.uid);
        }
        setForms((prev) => [createdForm, ...prev]);
        setActiveFormId(createdForm.id);
        setCurrentView('editor');
      }
    } catch (err) {
      console.error('Failed to create form:', err);
    }
  };

  const handleDuplicateForm = async (formId: string) => {
    const orig = forms.find((f) => f.id === formId);
    if (!orig) return;
    const duplicatedPayload = {
      ...orig,
      title: `${orig.title} (Copy)`,
      settings: { ...orig.settings, slug: `${orig.settings.slug}-copy` },
    };
    await handleCreateNewForm(duplicatedPayload);
  };

  const handleDeleteForm = async (formId: string) => {
    try {
      if (user) {
        await deleteFormFromFirestore(formId);
      }
      const res = await fetch(`/api/forms/${formId}`, { method: 'DELETE' });
      if (res.ok || user) {
        setForms((prev) => prev.filter((f) => f.id !== formId));
        if (activeFormId === formId) {
          const remaining = forms.filter((f) => f.id !== formId);
          setActiveFormId(remaining[0]?.id || '');
          setCurrentView('dashboard');
        }
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleRenameForm = async (formId: string, newTitle: string) => {
    const f = forms.find((x) => x.id === formId);
    if (!f) return;
    await handleSaveForm({ ...f, title: newTitle });
  };

  const handleSelectTemplate = async (templateId: string) => {
    const t = FORM_TEMPLATES.find((x) => x.id === templateId);
    if (!t) return;
    await handleCreateNewForm({
      title: t.form.title,
      description: t.form.description,
      category: t.category,
      branding: t.form.branding as any,
      sections: t.form.sections as any,
      questions: t.form.questions as any,
      settings: {
        isPublished: true,
        slug: `${t.id}-${Date.now().toString(36)}`,
        accessMode: 'public',
        allowAnonymous: true,
        preventDuplicates: false,
        allowMultipleSubmissions: true,
      },
    });
  };

  // Response management actions
  const handleUpdateResponseStatus = async (
    respId: string,
    status: 'valid' | 'flagged' | 'excluded'
  ) => {
    try {
      if (activeForm) {
        await updateResponseStatusInFirestore(activeForm.id, respId, status);
      }
      const res = await fetch(`/api/responses/${respId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        if (activeForm) {
          loadResponses(activeForm.id);
        }
      }
    } catch (err) {
      console.error('Update status failed:', err);
    }
  };

  const handleUpdateResponseNotes = async (respId: string, notes: string) => {
    try {
      if (activeForm) {
        await updateResponseNotesInFirestore(activeForm.id, respId, notes);
      }
      await fetch(`/api/responses/${respId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internalNotes: notes }),
      });
      if (activeForm) loadResponses(activeForm.id);
    } catch (err) {
      console.error('Update notes failed:', err);
    }
  };

  const handleDeleteResponse = async (respId: string) => {
    try {
      if (activeForm) {
        await deleteResponseFromFirestore(activeForm.id, respId);
      }
      await fetch(`/api/responses/${respId}`, { method: 'DELETE' });
      if (activeForm) loadResponses(activeForm.id);
    } catch (err) {
      console.error('Delete response failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F4] dark:bg-[#111412] text-[#171918] dark:text-[#F0F2EE] flex flex-col transition-colors selection:bg-[#176B52]/20">
      {/* Top Bar Header (Adheres to Top Bar Contract) */}
      <TopBar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view as any)}
        onOpenCreate={() => {
          setAiCreatorInitialMode('description');
          setIsAICreatorOpen(true);
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        activeFormTitle={currentView === 'editor' ? activeForm?.title : undefined}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Landing Page */}
        {currentView === 'landing' && (
          <LandingPage
            onStartCreate={(mode) => {
              if (mode === 'template') {
                setCurrentView('templates');
              } else if (mode === 'scratch') {
                handleCreateNewForm();
              } else {
                setAiCreatorInitialMode('description');
                setIsAICreatorOpen(true);
              }
            }}
            onSelectTemplate={handleSelectTemplate}
            onExploreDemo={() => {
              if (forms.length > 0) {
                setActiveFormId(forms[0].id);
                setCurrentView('analytics');
              }
            }}
          />
        )}

        {/* Dashboard */}
        {currentView === 'dashboard' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            <Dashboard
              forms={forms}
              onOpenFormEditor={(id) => {
                setActiveFormId(id);
                setCurrentView('editor');
              }}
              onOpenAnalytics={(id) => {
                setActiveFormId(id);
                setCurrentView('analytics');
              }}
              onOpenShareModal={(f) => {
                setActiveFormId(f.id);
                setIsShareModalOpen(true);
              }}
              onOpenCreateWithAI={() => {
                setAiCreatorInitialMode('description');
                setIsAICreatorOpen(true);
              }}
              onOpenStartFromScratch={() => handleCreateNewForm()}
              onOpenUploadDocument={() => {
                setAiCreatorInitialMode('document');
                setIsAICreatorOpen(true);
              }}
              onOpenTemplateGallery={() => setCurrentView('templates')}
              onDuplicateForm={handleDuplicateForm}
              onDeleteForm={handleDeleteForm}
              onRenameForm={handleRenameForm}
              onSelectTemplate={handleSelectTemplate}
            />
          </div>
        )}

        {/* Visual Form Editor */}
        {currentView === 'editor' && activeForm && (
          <FormEditor
            form={activeForm}
            onSaveForm={handleSaveForm}
            onOpenShareModal={() => setIsShareModalOpen(true)}
            onOpenAICreator={(mode) => {
              setAiCreatorInitialMode(mode);
              setIsAICreatorOpen(true);
            }}
            onOpenPreview={() => setIsPreviewOpen(true)}
          />
        )}

        {/* Submissions & Responses Workspace */}
        {currentView === 'responses' && activeForm && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E4DF] dark:border-[#272C28]">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-[#171918] dark:text-[#F0F2EE]">
                  Submissions: {activeForm.title}
                </h1>
                <p className="text-xs text-[#737873] dark:text-[#9BA19B]">
                  Manage, review, flag, or exclude individual respondent answers
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView('analytics')}
                  className="px-3 py-1.5 text-xs font-medium text-[#176B52] dark:text-[#228B6B] hover:bg-[#E8F3EE] dark:hover:bg-[#172D24] rounded-md transition-colors"
                >
                  View Analytics Charts
                </button>
              </div>
            </div>

            <ResponsesWorkspace
              form={activeForm}
              responses={activeResponses}
              onUpdateResponseStatus={handleUpdateResponseStatus}
              onUpdateResponseNotes={handleUpdateResponseNotes}
              onDeleteResponse={handleDeleteResponse}
            />
          </div>
        )}

        {/* Analytics & AI Insights View */}
        {(currentView === 'analytics' || currentView === 'analytics-hub') && activeForm && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
            {/* Header with Form Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E4DF] dark:border-[#272C28]">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-[#171918] dark:text-[#F0F2EE]">
                  Analytics: {activeForm.title}
                </h1>
                <p className="text-xs text-[#737873] dark:text-[#9BA19B]">
                  Automatic charts, NPS calculation, and AI response summaries
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Form Switcher */}
                <select
                  value={activeForm.id}
                  onChange={(e) => setActiveFormId(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-white dark:bg-[#191D1A] border border-[#E2E4DF] dark:border-[#272C28] rounded-md font-medium text-[#171918] dark:text-[#F0F2EE]"
                >
                  {forms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.title} ({f.submissionCount || 0})
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setCurrentView('responses')}
                  className="px-3 py-1.5 text-xs font-medium text-[#171918] dark:text-[#F0F2EE] border border-[#E2E4DF] dark:border-[#272C28] hover:bg-[#F0F2ED] dark:hover:bg-[#222723] rounded-md transition-colors"
                >
                  View Responses Table
                </button>

                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#176B52] hover:bg-[#125541] rounded-md shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Report</span>
                </button>
              </div>
            </div>

            <AnalyticsView
              form={activeForm}
              responses={activeResponses}
              onOpenStatistics={() => setCurrentView('statistics')}
              onOpenReportBuilder={() => setIsReportModalOpen(true)}
            />
          </div>
        )}

        {/* Optional Advanced Statistics Workspace */}
        {currentView === 'statistics' && activeForm && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E4DF] dark:border-[#272C28]">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-[#171918] dark:text-[#F0F2EE]">
                  Statistical Testing: {activeForm.title}
                </h1>
                <p className="text-xs text-[#737873] dark:text-[#9BA19B]">
                  Optional analysis module for hypothesis testing, t-tests, ANOVA, and survey reliability
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAlignmentModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#176B52] dark:text-[#228B6B] hover:bg-[#E8F3EE] dark:hover:bg-[#172D24] rounded-md transition-colors"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Research Alignment</span>
                </button>
                <button
                  onClick={() => setCurrentView('analytics')}
                  className="px-3 py-1.5 text-xs font-medium text-[#737873] hover:text-[#171918] dark:hover:text-[#F0F2EE] rounded-md transition-colors"
                >
                  Back to Analytics
                </button>
              </div>
            </div>

            <StatisticsWorkspace form={activeForm} responses={activeResponses} />
          </div>
        )}

        {/* Templates Gallery */}
        {currentView === 'templates' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            <TemplateGallery onSelectTemplate={handleSelectTemplate} />
          </div>
        )}
      </div>

      {/* AI Creator Modal */}
      <AICreatorModal
        isOpen={isAICreatorOpen}
        onClose={() => setIsAICreatorOpen(false)}
        initialMode={aiCreatorInitialMode}
        currentFormForImprovement={activeForm}
        onFormGenerated={(formData) => handleCreateNewForm(formData)}
        onApplyImprovement={(suggestion) => {
          if (activeForm && suggestion.revisedQuestion) {
            const updatedQuestions = activeForm.questions.map((q) =>
              q.id === suggestion.questionId
                ? { ...q, ...suggestion.revisedQuestion }
                : q
            );
            handleSaveForm({ ...activeForm, questions: updatedQuestions });
          }
        }}
      />

      {/* Share & Publish Modal */}
      {activeForm && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          form={activeForm}
          onUpdateSettings={(patch) =>
            handleSaveForm({ ...activeForm, settings: { ...activeForm.settings, ...patch } })
          }
        />
      )}

      {/* Report Builder Modal */}
      {activeForm && (
        <ReportExportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          form={activeForm}
          responses={activeResponses}
        />
      )}

      {/* Research Alignment Modal */}
      {activeForm && (
        <ResearchAlignmentModal
          isOpen={isAlignmentModalOpen}
          onClose={() => setIsAlignmentModalOpen(false)}
          form={activeForm}
        />
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Responsive Live Form Preview Drawer */}
      {isPreviewOpen && activeForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-4xl bg-[#F0F2ED] dark:bg-[#111412] rounded-2xl border border-[#E2E4DF] dark:border-[#272C28] shadow-2xl overflow-hidden flex flex-col h-[90vh]">
            {/* Preview Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-[#191D1A] border-b border-[#E2E4DF] dark:border-[#272C28]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#171918] dark:text-[#F0F2EE]">
                  Live Respondent Preview
                </span>
              </div>

              {/* Device Frame Switcher */}
              <div className="flex items-center gap-1 p-1 bg-[#F0F2ED] dark:bg-[#111412] rounded-lg">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded transition-colors ${
                    previewDevice === 'desktop'
                      ? 'bg-white dark:bg-[#191D1A] text-[#176B52] shadow-sm'
                      : 'text-[#737873]'
                  }`}
                  title="Desktop View"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewDevice('tablet')}
                  className={`p-1.5 rounded transition-colors ${
                    previewDevice === 'tablet'
                      ? 'bg-white dark:bg-[#191D1A] text-[#176B52] shadow-sm'
                      : 'text-[#737873]'
                  }`}
                  title="Tablet View"
                >
                  <Tablet className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded transition-colors ${
                    previewDevice === 'mobile'
                      ? 'bg-white dark:bg-[#191D1A] text-[#176B52] shadow-sm'
                      : 'text-[#737873]'
                  }`}
                  title="Mobile View"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-1.5 rounded-lg text-[#737873] hover:text-[#171918] dark:hover:text-[#F0F2EE]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Preview Screen Canvas */}
            <div className="flex-1 overflow-y-auto p-6 flex justify-center items-start">
              <div
                className={`transition-all duration-300 w-full ${
                  previewDevice === 'mobile'
                    ? 'max-w-sm'
                    : previewDevice === 'tablet'
                    ? 'max-w-xl'
                    : 'max-w-2xl'
                }`}
              >
                <PublicFormView
                  form={activeForm}
                  isEmbedded={true}
                  onSubmitResponse={async (answers, completionTimeSeconds) => {
                    const newResponse: FormResponse = {
                      id: `resp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                      formId: activeForm.id,
                      submittedAt: new Date().toISOString(),
                      completionTimeSeconds,
                      isComplete: true,
                      status: 'valid',
                      answers,
                    };

                    try {
                      await submitResponseToFirestore(activeForm.id, newResponse);
                    } catch (fsErr) {
                      console.warn('Firestore response write notice:', fsErr);
                    }

                    // Record preview response into memory and server
                    const res = await fetch(`/api/forms/${activeForm.id}/responses`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ answers, completionTimeSeconds, responseId: newResponse.id }),
                    });
                    const data = await res.json();
                    setResponsesMap((prev) => ({
                      ...prev,
                      [activeForm.id]: [...(prev[activeForm.id] || []), newResponse],
                    }));
                    return { receiptId: data.receiptId || newResponse.id };
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
