export type QuestionType =
  // Basic Fields
  | 'short_text'
  | 'long_text'
  | 'email'
  | 'phone'
  | 'number'
  | 'date'
  | 'time'
  | 'url'
  | 'dropdown'
  | 'single_choice'
  | 'multiple_choice'
  | 'yes_no'
  | 'true_false'
  // Rating and Feedback
  | 'likert_5'
  | 'likert_7'
  | 'star_rating'
  | 'linear_scale'
  | 'satisfaction'
  | 'agreement'
  | 'nps'
  // Advanced Fields
  | 'matrix'
  | 'ranking'
  | 'constant_sum'
  | 'checkbox_grid'
  | 'file_upload'
  | 'signature'
  | 'consent'
  | 'section_break'
  | 'info_text';

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
}

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: string;
  minSelect?: number;
  maxSelect?: number;
}

export type LogicOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'greater_than'
  | 'less_than'
  | 'is_empty'
  | 'is_not_empty';

export type LogicAction = 'show' | 'hide' | 'jump_to_section' | 'end_form';

export interface LogicRule {
  id: string;
  sourceQuestionId: string;
  operator: LogicOperator;
  value: string;
  action: LogicAction;
  targetId?: string; // target question ID or section ID
}

export interface FormQuestion {
  id: string;
  sectionId?: string;
  type: QuestionType;
  title: string;
  description?: string;
  placeholder?: string;
  defaultValue?: any;
  options?: QuestionOption[];
  // For matrix and grids
  matrixRows?: string[];
  matrixColumns?: string[];
  // For linear / rating scales
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
  // For constant sum
  sumTarget?: number;
  validation: ValidationRule;
  logicRules?: LogicRule[];
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  order: number;
}

export interface FormBranding {
  accentColor: string;
  theme: 'light' | 'dark' | 'cream' | 'sage';
  fontFamily: 'DM Sans' | 'Plus Jakarta Sans' | 'Inter';
  coverImageUrl?: string;
  logoUrl?: string;
  submitButtonText: string;
  thankYouTitle: string;
  thankYouMessage: string;
  redirectUrl?: string;
  showProgressBar: boolean;
}

export interface FormPublishSettings {
  isPublished: boolean;
  slug: string;
  accessMode: 'public' | 'password' | 'private';
  password?: string;
  responseLimit?: number;
  closeDate?: string;
  allowAnonymous: boolean;
  preventDuplicates: boolean;
  allowMultipleSubmissions: boolean;
}

export interface FormModel {
  id: string;
  workspaceId: string;
  ownerId?: string;
  title: string;
  description: string;
  category: string;
  status: 'draft' | 'published' | 'closed';
  sections: FormSection[];
  questions: FormQuestion[];
  branding: FormBranding;
  settings: FormPublishSettings;
  createdAt: string;
  updatedAt: string;
  submissionCount: number;
  version: number;
}

export interface FormResponse {
  id: string;
  formId: string;
  submittedAt: string;
  completionTimeSeconds: number;
  isComplete: boolean;
  answers: Record<string, any>;
  status: 'valid' | 'flagged' | 'excluded';
  internalNotes?: string;
  respondentIdentifier?: string; // e.g. anonymous or email
  ipHash?: string;
}

export interface TemplateModel {
  id: string;
  title: string;
  description: string;
  category: string;
  iconName: string;
  estimatedMinutes: number;
  form: Partial<FormModel>;
}

export interface AIImprovementSuggestion {
  type: 'bias' | 'ambiguity' | 'redundancy' | 'ordering' | 'validation' | 'scale';
  questionId?: string;
  questionTitle?: string;
  issue: string;
  suggestion: string;
  revisedQuestion?: Partial<FormQuestion>;
}

export interface AIResponseInsight {
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  keyThemes: { theme: string; countEstimate: number; sentiment: string }[];
  topLikes: string[];
  painPoints: string[];
  actionRecommendations: string[];
  dataFreshness: string;
}

export interface ResearchObjective {
  id: string;
  title: string;
  description: string;
  mappedQuestionIds: string[];
}

export interface ResearchHypothesis {
  id: string;
  statement: string;
  independentVariable: string;
  dependentVariable: string;
  mappedQuestionIds: string[];
  proposedTest: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  tier: 'free' | 'pro' | 'business' | 'enterprise';
  workspaces: { id: string; name: string }[];
  currentWorkspaceId: string;
  monthlyResponsesUsed: number;
  monthlyResponsesLimit: number;
  aiGenerationsUsed: number;
  aiGenerationsLimit: number;
}
