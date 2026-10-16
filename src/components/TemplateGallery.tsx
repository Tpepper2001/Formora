import React, { useState, useMemo } from 'react';
import { Search, ArrowRight, LayoutGrid, Sparkles, Filter, Check } from 'lucide-react';
import { FORM_TEMPLATES } from '../data/templates';
import { TemplateModel } from '../types/form';

interface TemplateGalleryProps {
  onSelectTemplate: (templateId: string) => void;
  onClose?: () => void;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  onSelectTemplate,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = useMemo(() => {
    const set = new Set<string>();
    set.add('All');
    FORM_TEMPLATES.forEach((t) => set.add(t.category));
    return Array.from(set);
  }, []);

  const filteredTemplates = useMemo(() => {
    return FORM_TEMPLATES.filter((t) => {
      if (selectedCategory !== 'All' && t.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28]">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#171918] dark:text-[#F0F2EE]">
            Formora Template Library
          </h2>
          <p className="text-xs text-[#737873] dark:text-[#9BA19B] mt-1">
            Pre-configured questionnaires with validated rating scales, logic, and sections
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#737873]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F7F7F4] dark:bg-[#111412] border border-[#E2E4DF] dark:border-[#272C28] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#176B52]"
          />
        </div>
      </div>

      {/* Category Pills (Filter Tabs) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-[#176B52] text-white font-semibold shadow-sm'
                : 'bg-white dark:bg-[#191D1A] border border-[#E2E4DF] dark:border-[#272C28] text-[#737873] hover:text-[#171918] dark:hover:text-[#F0F2EE]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            onClick={() => onSelectTemplate(template.id)}
            className="p-6 bg-white dark:bg-[#191D1A] rounded-xl border border-[#E2E4DF] dark:border-[#272C28] hover:border-[#176B52] dark:hover:border-[#228B6B] transition-all flex flex-col justify-between cursor-pointer group shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-[#737873] dark:text-[#9BA19B] mb-2">
                <span className="font-semibold text-[#176B52] dark:text-[#228B6B]">
                  {template.category}
                </span>
                <span className="font-mono text-[11px] tabular-nums">
                  ~{template.estimatedMinutes} min
                </span>
              </div>
              <h3 className="text-sm font-bold text-[#171918] dark:text-[#F0F2EE] group-hover:text-[#176B52] dark:group-hover:text-[#228B6B] transition-colors mb-2">
                {template.title}
              </h3>
              <p className="text-xs text-[#737873] dark:text-[#9BA19B] line-clamp-3 leading-relaxed mb-4">
                {template.description}
              </p>
            </div>

            <div className="pt-4 border-t border-[#E2E4DF] dark:border-[#272C28] flex items-center justify-between text-xs">
              <span className="text-[#737873] dark:text-[#9BA19B]">
                {template.form.questions?.length || 5} questions
              </span>
              <span className="font-semibold text-[#176B52] dark:text-[#228B6B] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                <span>Use Template</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
