import React, { useState, useMemo } from 'react';
import {
  Plus,
  Sparkles,
  FileText,
  UploadCloud,
  LayoutGrid,
  Search,
  MoreVertical,
  Eye,
  BarChart3,
  Share2,
  Trash2,
  Copy,
  Edit3,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  FolderPlus,
} from 'lucide-react';
import { FormModel, TemplateModel } from '../types/form';
import { FORM_TEMPLATES } from '../data/templates';

interface DashboardProps {
  forms: FormModel[];
  onOpenFormEditor: (formId: string) => void;
  onOpenAnalytics: (formId: string) => void;
  onOpenShareModal: (form: FormModel) => void;
  onOpenCreateWithAI: () => void;
  onOpenStartFromScratch: () => void;
  onOpenUploadDocument: () => void;
  onOpenTemplateGallery: () => void;
  onDuplicateForm: (formId: string) => void;
  onDeleteForm: (formId: string) => void;
  onRenameForm: (formId: string, newTitle: string) => void;
  onSelectTemplate: (templateId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  forms,
  onOpenFormEditor,
  onOpenAnalytics,
  onOpenShareModal,
  onOpenCreateWithAI,
  onOpenStartFromScratch,
  onOpenUploadDocument,
  onOpenTemplateGallery,
  onDuplicateForm,
  onDeleteForm,
  onRenameForm,
  onSelectTemplate,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft' | 'closed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');

  // Metrics
  const totalSubmissions = useMemo(() => {
    return forms.reduce((acc, f) => acc + (f.submissionCount || 0), 0);
  }, [forms]);

  const publishedCount = forms.filter((f) => f.status === 'published').length;
  const draftCount = forms.filter((f) => f.status === 'draft').length;
  const closedCount = forms.filter((f) => f.status === 'closed').length;

  // Filtered forms
  const filteredForms = useMemo(() => {
    return forms.filter((f) => {
      if (activeTab !== 'all' && f.status !== activeTab) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return f.title.toLowerCase().includes(q) || f.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [forms, activeTab, searchQuery]);

  const handleStartRename = (f: FormModel) => {
    setRenamingId(f.id);
    setRenameInput(f.title);
  };

  const handleCommitRename = (id: string) => {
    if (renameInput.trim()) {
      onRenameForm(id, renameInput.trim());
    }
    setRenamingId(null);
  };

  return (
    <div className="space-y-8">
      {/* 1. Quick Actions Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={onOpenCreateWithAI}
          className="p-4 bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] hover:border-[#176B52] dark:hover:border-[#228B6B] transition-all text-left group shadow-sm flex flex-col justify-between"
        >
          <div className="w-8 h-8 rounded-lg bg-[#E8F3EE] dark:bg-[#172D24] text-[#176B52] dark:text-[#228B6B] flex items-center justify-center mb-3">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#171918] dark:text-[#F0F2EE] group-hover:text-[#176B52] dark:group-hover:text-[#228B6B] transition-colors block">
              Create with AI
            </span>
            <span className="text-[11px] text-[#737873] dark:text-[#9BA19B]">
              From description or topic
            </span>
          </div>
        </button>

        <button
          onClick={onOpenUploadDocument}
          className="p-4 bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] hover:border-[#176B52] dark:hover:border-[#228B6B] transition-all text-left group shadow-sm flex flex-col justify-between"
        >
          <div className="w-8 h-8 rounded-lg bg-[#E8F3EE] dark:bg-[#172D24] text-[#176B52] dark:text-[#228B6B] flex items-center justify-center mb-3">
            <UploadCloud className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#171918] dark:text-[#F0F2EE] group-hover:text-[#176B52] dark:group-hover:text-[#228B6B] transition-colors block">
              Upload Document
            </span>
            <span className="text-[11px] text-[#737873] dark:text-[#9BA19B]">
              Convert Word DOCX or PDF
            </span>
          </div>
        </button>

        <button
          onClick={onOpenStartFromScratch}
          className="p-4 bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] hover:border-[#176B52] dark:hover:border-[#228B6B] transition-all text-left group shadow-sm flex flex-col justify-between"
        >
          <div className="w-8 h-8 rounded-lg bg-[#E8F3EE] dark:bg-[#172D24] text-[#176B52] dark:text-[#228B6B] flex items-center justify-center mb-3">
            <Plus className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#171918] dark:text-[#F0F2EE] group-hover:text-[#176B52] dark:group-hover:text-[#228B6B] transition-colors block">
              Start from Scratch
            </span>
            <span className="text-[11px] text-[#737873] dark:text-[#9BA19B]">
              Blank canvas builder
            </span>
          </div>
        </button>

        <button
          onClick={onOpenTemplateGallery}
          className="p-4 bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] hover:border-[#176B52] dark:hover:border-[#228B6B] transition-all text-left group shadow-sm flex flex-col justify-between"
        >
          <div className="w-8 h-8 rounded-lg bg-[#E8F3EE] dark:bg-[#172D24] text-[#176B52] dark:text-[#228B6B] flex items-center justify-center mb-3">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#171918] dark:text-[#F0F2EE] group-hover:text-[#176B52] dark:group-hover:text-[#228B6B] transition-colors block">
              Choose Template
            </span>
            <span className="text-[11px] text-[#737873] dark:text-[#9BA19B]">
              Browse 20+ ready forms
            </span>
          </div>
        </button>
      </div>

      {/* 2. Key Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28]">
          <span className="text-xs font-medium text-[#737873] dark:text-[#9BA19B] uppercase block">
            Total Forms
          </span>
          <span className="text-2xl font-bold font-mono tabular-nums text-[#171918] dark:text-[#F0F2EE]">
            {forms.length}
          </span>
        </div>
        <div className="p-4 bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28]">
          <span className="text-xs font-medium text-[#737873] dark:text-[#9BA19B] uppercase block">
            Published Active
          </span>
          <span className="text-2xl font-bold font-mono tabular-nums text-[#176B52] dark:text-[#228B6B]">
            {publishedCount}
          </span>
        </div>
        <div className="p-4 bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28]">
          <span className="text-xs font-medium text-[#737873] dark:text-[#9BA19B] uppercase block">
            Total Responses
          </span>
          <span className="text-2xl font-bold font-mono tabular-nums text-[#171918] dark:text-[#F0F2EE]">
            {totalSubmissions}
          </span>
        </div>
        <div className="p-4 bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28]">
          <span className="text-xs font-medium text-[#737873] dark:text-[#9BA19B] uppercase block">
            Drafts & Review
          </span>
          <span className="text-2xl font-bold font-mono tabular-nums text-[#737873] dark:text-[#9BA19B]">
            {draftCount}
          </span>
        </div>
      </div>

      {/* 3. Forms Workspace & Filter Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Segmented Filter */}
          <div className="flex items-center gap-1 p-1 bg-[#F0F2ED] dark:bg-[#191D1A] border border-[#E2E4DF] dark:border-[#272C28] rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-[#222723] text-[#171918] dark:text-[#F0F2EE] shadow-sm font-semibold'
                  : 'text-[#737873] dark:text-[#9BA19B]'
              }`}
            >
              All Forms ({forms.length})
            </button>
            <button
              onClick={() => setActiveTab('published')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'published'
                  ? 'bg-white dark:bg-[#222723] text-[#171918] dark:text-[#F0F2EE] shadow-sm font-semibold'
                  : 'text-[#737873] dark:text-[#9BA19B]'
              }`}
            >
              Published ({publishedCount})
            </button>
            <button
              onClick={() => setActiveTab('draft')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'draft'
                  ? 'bg-white dark:bg-[#222723] text-[#171918] dark:text-[#F0F2EE] shadow-sm font-semibold'
                  : 'text-[#737873] dark:text-[#9BA19B]'
              }`}
            >
              Drafts ({draftCount})
            </button>
            <button
              onClick={() => setActiveTab('closed')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'closed'
                  ? 'bg-white dark:bg-[#222723] text-[#171918] dark:text-[#F0F2EE] shadow-sm font-semibold'
                  : 'text-[#737873] dark:text-[#9BA19B]'
              }`}
            >
              Closed ({closedCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#737873]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search forms..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-[#191D1A] border border-[#E2E4DF] dark:border-[#272C28] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#176B52]"
            />
          </div>
        </div>

        {/* Forms Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredForms.map((form) => {
            const isRenaming = renamingId === form.id;
            return (
              <div
                key={form.id}
                className="p-5 bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] hover:border-[#176B52]/50 transition-all flex flex-col justify-between shadow-sm group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[#737873] dark:text-[#9BA19B] mb-2">
                    <span className="font-medium text-[#176B52] dark:text-[#228B6B]">
                      {form.category}
                    </span>
                    <span className="capitalize font-mono text-[11px]">{form.status}</span>
                  </div>

                  {isRenaming ? (
                    <div className="flex items-center gap-1.5 mb-2">
                      <input
                        type="text"
                        value={renameInput}
                        onChange={(e) => setRenameInput(e.target.value)}
                        className="px-2 py-1 text-xs border border-[#176B52] rounded flex-1 focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleCommitRename(form.id)}
                        className="p-1 text-xs text-[#176B52]"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <h3
                      onClick={() => onOpenFormEditor(form.id)}
                      className="text-sm font-bold text-[#171918] dark:text-[#F0F2EE] hover:text-[#176B52] dark:hover:text-[#228B6B] transition-colors cursor-pointer mb-1.5 leading-snug truncate"
                    >
                      {form.title}
                    </h3>
                  )}

                  <p className="text-xs text-[#737873] dark:text-[#9BA19B] line-clamp-2 leading-relaxed mb-4">
                    {form.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#E2E4DF] dark:border-[#272C28] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-[#737873] dark:text-[#9BA19B]">
                    <span>{form.questions.length} questions</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums font-semibold text-[#171918] dark:text-[#F0F2EE]">
                      {form.submissionCount} submissions
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenAnalytics(form.id)}
                      className="p-1.5 text-[#737873] hover:text-[#176B52] dark:hover:text-[#228B6B] rounded transition-colors"
                      title="View Responses & Analytics"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenShareModal(form)}
                      className="p-1.5 text-[#737873] hover:text-[#176B52] dark:hover:text-[#228B6B] rounded transition-colors"
                      title="Share link & QR code"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenFormEditor(form.id)}
                      className="p-1.5 text-[#737873] hover:text-[#171918] dark:hover:text-[#F0F2EE] rounded transition-colors"
                      title="Edit Form"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDuplicateForm(form.id)}
                      className="p-1.5 text-[#737873] hover:text-[#171918] rounded transition-colors"
                      title="Duplicate Form"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteForm(form.id)}
                      className="p-1.5 text-[#737873] hover:text-red-600 rounded transition-colors"
                      title="Delete Form"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredForms.length === 0 && (
          <div className="p-12 text-center bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#E8F3EE] dark:bg-[#172D24] text-[#176B52] dark:text-[#228B6B] flex items-center justify-center">
              <FolderPlus className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#171918] dark:text-[#F0F2EE]">
                {forms.length === 0 ? 'No forms yet' : 'No matching forms'}
              </h4>
              <p className="text-xs text-[#737873] dark:text-[#9BA19B] max-w-sm mx-auto mt-1">
                {forms.length === 0
                  ? 'Turn any idea, topic, or document into a shareable form, or start with a pre-built template.'
                  : `No forms matched "${searchQuery}". Clear your search or create a new form.`}
              </p>
            </div>
            {forms.length === 0 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={onOpenCreateWithAI}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#176B52] hover:bg-[#125541] rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Create with AI</span>
                </button>
                <button
                  onClick={onOpenTemplateGallery}
                  className="px-4 py-2 text-xs font-medium text-[#171918] dark:text-[#F0F2EE] border border-[#E2E4DF] dark:border-[#272C28] hover:bg-[#F0F2ED] dark:hover:bg-[#222723] rounded-lg transition-colors"
                >
                  Pick a Template
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Favourite Templates Section */}
      <div className="pt-4 border-t border-[#E2E4DF] dark:border-[#272C28]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#171918] dark:text-[#F0F2EE]">
            Recommended Templates
          </h3>
          <button
            onClick={onOpenTemplateGallery}
            className="text-xs font-semibold text-[#176B52] dark:text-[#228B6B] hover:underline flex items-center gap-1"
          >
            <span>Browse all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {FORM_TEMPLATES.slice(0, 3).map((template) => (
            <div
              key={template.id}
              onClick={() => onSelectTemplate(template.id)}
              className="p-4 bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] hover:border-[#176B52] dark:hover:border-[#228B6B] cursor-pointer transition-colors"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#176B52] dark:text-[#228B6B] block mb-1">
                {template.category}
              </span>
              <h4 className="text-xs font-bold text-[#171918] dark:text-[#F0F2EE] mb-1">
                {template.title}
              </h4>
              <p className="text-[11px] text-[#737873] dark:text-[#9BA19B] line-clamp-2">
                {template.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
