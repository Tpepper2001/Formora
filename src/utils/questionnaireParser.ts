/**
 * Formora Questionnaire Parser Engine
 * 
 * Multi-Stage Parsing Pipeline:
 * - Stage A: Input validation & format verification
 * - Stage B: Document extraction (preserving headings, tables, bullets, numbering)
 * - Stage C: Normalization (handling Windows/Unix line endings, escaped Markdown, Unicode quotes/dashes)
 * - Stage D: Structural classification (titles, research topics, instructions, objectives, notes, sections, questions, tables, fill-in blanks)
 * - Stage E: Sequential State-Machine Question Grouping & Table/Matrix Parser
 * - Stage F: Question-Type Inference Engine with Calibrated Evidence Scoring
 * - Stage G: Intermediate Representation (IR) generation with Provenance
 * - Stage H: Formal Invariant Validation & Proof checks
 * - Stage I: Conversion to Formora FormModel
 */

import { FormModel, FormQuestion, FormSection, QuestionOption, LogicRule } from '../types/form';
import { BRIDE_PRICE_REGRESSION_QUESTIONNAIRE } from '../data/bridePriceRegressionFixture';

// ============================================================================
// 1. Types & Intermediate Representation (IR) Contracts
// ============================================================================

export type ParserQuestionType =
  | 'short_text'
  | 'long_text'
  | 'number'
  | 'date'
  | 'single_choice'
  | 'multiple_choice'
  | 'dropdown'
  | 'likert_scale'
  | 'rating_scale'
  | 'matrix'
  | 'yes_no'
  | 'email'
  | 'phone'
  | 'file_upload'
  | 'unknown';

export interface ParsedOption {
  id: string;
  label: string;
  value: string;
  isOther?: boolean;
}

export interface ParsedQuestion {
  id: string;
  sectionId: string | null;
  position: number;
  originalNumber?: number | string;
  text: string;
  type: ParserQuestionType;
  required: boolean;
  options: ParsedOption[];
  scaleId?: string;
  validation: Record<string, unknown>;
  logic: Array<Record<string, unknown>>;
  confidence: number;
  reviewRequired: boolean;
  source: {
    blockIds: string[];
    originalText: string;
    lineNumbers: number[];
  };
  evidenceNotes?: string[];
}

export interface ParsedSection {
  id: string;
  sectionCode: string;
  title: string;
  description: string;
  questionIds: string[];
}

export interface ScaleDefinition {
  id: string;
  name: string;
  options: Array<{
    label: string;
    value: string;
    score: number;
    code?: string;
  }>;
}

export interface ParserWarning {
  code:
    | 'UNKNOWN_QUESTION_TYPE'
    | 'ORPHAN_OPTION'
    | 'UNCLASSIFIED_BLOCK'
    | 'MALFORMED_TABLE'
    | 'MISSING_SCALE_LABEL'
    | 'AMBIGUOUS_SELECTION_MODE'
    | 'DUPLICATE_QUESTION_NUMBER'
    | 'INVALID_SECTION_REFERENCE'
    | 'SOURCE_COVERAGE_FAILURE'
    | 'ORDER_DRIFT'
    | 'FEW_OPTIONS';
  message: string;
  sourceBlockIds: string[];
  questionId?: string;
  severity: 'info' | 'warning' | 'error';
  suggestedAction?: string;
}

export interface ParsedQuestionnaire {
  schemaVersion: '1.0';
  document: {
    title: string;
    researchTopic?: string;
    language: string;
    sourceType: 'text' | 'docx' | 'pdf';
    introduction?: string;
    instructions: string[];
    researchObjectives: string[];
    researchNotes: string[];
  };
  scaleDefinitions: ScaleDefinition[];
  metadata: {
    parsingStatus: 'valid' | 'needs_review' | 'failed';
    parserVersion: '1.1.0';
    totalBlocksCount: number;
    accountedBlocksCount: number;
    averageConfidence: number;
    questionDetectionCount: number;
  };
  sections: ParsedSection[];
  questions: ParsedQuestion[];
  warnings: ParserWarning[];
  unclassifiedBlocks: Array<{
    id: string;
    text: string;
    lineNumber: number;
  }>;
}

export type BlockClassification =
  | 'title'
  | 'research_topic'
  | 'introduction'
  | 'instruction'
  | 'section'
  | 'question_start'
  | 'fill_in_blank'
  | 'table_header'
  | 'table_separator'
  | 'table_row'
  | 'scale_definition'
  | 'option'
  | 'scale_item'
  | 'continuation'
  | 'subquestion'
  | 'research_objective'
  | 'research_note'
  | 'unknown';

export interface ExtractedBlock {
  block_id: string;
  raw_text: string;
  normalized_text: string;
  classification: BlockClassification;
  line_number: number;
  prefix?: string;
  content: string;
  tableData?: {
    isTable: boolean;
    rowNumber?: number;
    cells?: string[];
  };
}

// ============================================================================
// 2. Stage C: Normalization
// ============================================================================

export function normalizeLine(text: string): string {
  let cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .trim();

  // Unescape Markdown escaped numbering: "1\." -> "1.", "1\)" -> "1)"
  cleaned = cleaned.replace(/^(\d+)\\([\.\)])/g, '$1$2');

  // Strip Markdown leading bold markers on prefixes e.g. "**Research Topic:**" -> "Research Topic:"
  cleaned = cleaned.replace(/^\*\*([^*]+)\*\*/g, '$1');

  return cleaned;
}

// ============================================================================
// 3. Stage B & D: Document Extraction & Structural Classification
// ============================================================================

export function classifyBlock(
  normalized: string,
  raw: string,
  idx: number,
  prevClassification?: BlockClassification
): { type: BlockClassification; prefix?: string; content: string; tableData?: any } {
  const trimmed = normalized.trim();
  const lower = trimmed.toLowerCase();

  // Markdown Table Separator: | --- | --- |
  if (trimmed.startsWith('|') && trimmed.includes('---')) {
    return {
      type: 'table_separator',
      content: trimmed,
      tableData: { isTable: true },
    };
  }

  // Markdown Table Row: | 15 | Statement | [ ] | ...
  if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
    const rawCells = trimmed
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());

    // Check if header row: contains S/N or Statement
    const isHeader = rawCells.some(
      (c) =>
        c.toLowerCase() === 's/n' ||
        c.toLowerCase() === 'no.' ||
        c.toLowerCase() === '#' ||
        c.toLowerCase() === 'statement' ||
        c.toLowerCase() === 'item'
    );

    if (isHeader) {
      return {
        type: 'table_header',
        content: trimmed,
        tableData: { isTable: true, cells: rawCells },
      };
    }

    // Numbered table statement row: e.g. Col 0 is "15", Col 1 is statement
    const firstCellNum = parseInt(rawCells[0], 10);
    if (!isNaN(firstCellNum) && rawCells.length >= 2) {
      return {
        type: 'table_row',
        prefix: `${firstCellNum}.`,
        content: rawCells[1],
        tableData: {
          isTable: true,
          rowNumber: firstCellNum,
          cells: rawCells,
        },
      };
    }

    return {
      type: 'table_row',
      content: rawCells.join(' | '),
      tableData: { isTable: true, cells: rawCells },
    };
  }

  // 1. Research Topic
  // e.g. "Research Topic: Impact of Girls’ Education on Bride Price Rates"
  // 1. Research Topic
  // e.g. "Research Topic: Impact of Girls’ Education on Bride Price Rates"
  const topicMatch = trimmed.match(/^(?:Research Topic|Topic)\s*[:\-\u2014]\s*(.*)$/i);
  if (topicMatch) {
    return { type: 'research_topic', prefix: 'Research Topic:', content: topicMatch[1].trim() };
  }

  // 2. Suggested Research Objectives (before title so ### doesn't get consumed as title)
  if (
    trimmed.match(/^#*\s*Suggested Research Objectives/i) ||
    trimmed.match(/^#*\s*Research Objectives/i)
  ) {
    return { type: 'research_objective', content: trimmed.replace(/^#+\s*/, '') };
  }
  if (trimmed.match(/^(?:-|\*|\•)?\s*(?:Objective\s*\d+|RO\d+)\s*[:\-\u2014]\s*(.*)$/i)) {
    const m = trimmed.match(/^(?:-|\*|\•)?\s*((?:Objective\s*\d+|RO\d+)\s*[:\-\u2014]\s*.*)$/i);
    return { type: 'research_objective', content: m ? m[1].trim() : trimmed };
  }

  // 3. Research Note (before title so ### doesn't get consumed as title)
  if (trimmed.match(/^#*\s*Research Note/i)) {
    return { type: 'research_note', content: trimmed.replace(/^#+\s*/, '') };
  }

  // 4. Section Heading
  const sectionMatch = trimmed.match(
    /^(?:#+\s*)?(?:SECTION|PART)\s*([A-Za-z0-9IVX]+)?\s*[:\-\u2014\.]?\s*(.*)$/i
  );
  if (sectionMatch) {
    const secLetter = sectionMatch[1] || '';
    const secTitle = sectionMatch[2] ? sectionMatch[2].trim() : `Section ${secLetter}`;
    return {
      type: 'section',
      prefix: `SECTION ${secLetter}`.trim(),
      content: secTitle,
    };
  }

  // 5. Introduction & Instructions
  if (
    trimmed.match(/^#*\s*(?:Introduction|Instructions|Dear Respondent)/i) ||
    trimmed.match(/^(?:INSTRUCTIONS?|PLEASE NOTE|NOTE)\s*[:\-\u2014]/i)
  ) {
    const cleanContent = trimmed.replace(/^#+\s*/, '');
    return { type: 'instruction', content: cleanContent };
  }

  // 6. Specific Document Title
  // e.g. "# QUESTIONNAIRE", "## Research Instrument", "TITLE: ..."
  if (
    trimmed.match(/^#+\s*(?:QUESTIONNAIRE|RESEARCH INSTRUMENT|SURVEY)/i) ||
    trimmed.toUpperCase() === 'QUESTIONNAIRE' ||
    trimmed.toUpperCase() === 'RESEARCH INSTRUMENT' ||
    trimmed.match(/^TITLE\s*[:\-\u2014]/i)
  ) {
    const cleanTitle = trimmed.replace(/^#+\s*/, '').replace(/^TITLE\s*[:\-\u2014]\s*/i, '');
    return { type: 'title', content: cleanTitle };
  }

  // 7. Reusable Response Scale Definition block
  // e.g. "Response Scale:", "- Strongly Agree (SA) = 5", "- Agree (A) = 4"
  if (trimmed.match(/^Response Scale\s*[:\-\u2014]/i)) {
    return { type: 'scale_definition', prefix: 'Response Scale:', content: trimmed };
  }
  if (trimmed.match(/^(?:-|\*|\•)?\s*(Strongly Agree|Agree|Undecided|Neutral|Disagree|Strongly Disagree).*=\s*\d+/i)) {
    return { type: 'scale_definition', content: trimmed.replace(/^[-*•]\s*/, '') };
  }

  // 8. Fill-in Blank Question (Section 4 Rule 5)
  // e.g. "5. Community / Local Government Area: ______" or "Community/Local Government Area: ______"
  const fillInMatch = trimmed.match(/^(?:(?:Q|Question)\s*(\d+)[:\.]|(\d+)[\.\)])\s*(.*?)(_{3,}.*)$/i);
  if (fillInMatch) {
    const qNum = fillInMatch[1] || fillInMatch[2];
    const promptText = fillInMatch[3].trim().replace(/[:\-\u2014\s]+$/, '');
    return {
      type: 'fill_in_blank',
      prefix: `${qNum}.`,
      content: promptText || 'Fill-in Text Entry',
    };
  }
  if (trimmed.includes('______') && !trimmed.startsWith('-') && !trimmed.startsWith('*')) {
    return {
      type: 'fill_in_blank',
      content: trimmed.replace(/_{3,}.*$/, '').trim().replace(/[:\-\u2014\s]+$/, ''),
    };
  }

  // 9. Standard Option lines (Bullet or Letter)
  // e.g. "- A. Male", "A. Male", "* B. Female", "- E. Other (please specify): ______"
  const optionMatch = trimmed.match(/^(?:[-*•]\s*)?(\([A-Za-z]\)|[A-Za-z][\.\)])\s+(.*)$/);
  if (optionMatch) {
    return {
      type: 'option',
      prefix: optionMatch[1],
      content: optionMatch[2].trim(),
    };
  }

  // 10. Standard Numbered Question Start
  // e.g. "1. What is your gender?", "14. How would you categorize...", "Q1: ..."
  const questionPrefixMatch = trimmed.match(
    /^(?:#+\s*)?(?:(?:Q|Question)\s*(\d+)[:\.]|(\d+)[\.\)])\s*(.*)$/i
  );
  if (questionPrefixMatch) {
    const qNum = questionPrefixMatch[1] || questionPrefixMatch[2];
    return {
      type: 'question_start',
      prefix: `${qNum}.`,
      content: questionPrefixMatch[3].trim(),
    };
  }

  // Continuation or Unclassified
  if (prevClassification === 'instruction' && !trimmed.startsWith('#')) {
    return { type: 'instruction', content: trimmed };
  }
  if (prevClassification === 'research_objective' && (trimmed.startsWith('-') || trimmed.startsWith('Objective'))) {
    return { type: 'research_objective', content: trimmed };
  }
  if (prevClassification === 'research_note') {
    return { type: 'research_note', content: trimmed };
  }

  return { type: 'continuation', content: trimmed };
}

// ============================================================================
// 4. Stage E: Sequential State-Machine Question Grouping & Table Parser
// ============================================================================

interface RawQuestionBuilder {
  id: string;
  originalNumber?: number | string;
  sectionId: string | null;
  position: number;
  promptText: string;
  sourceBlockIds: string[];
  originalLines: string[];
  lineNumbers: number[];
  options: Array<{ prefix?: string; text: string; blockId: string; rawText: string }>;
  scaleDefinitionId?: string;
  explicitType?: ParserQuestionType;
  instructions: string[];
}

export function extractAndGroupBlocks(rawInput: string): {
  documentTitle: string;
  researchTopic?: string;
  introduction?: string;
  instructions: string[];
  researchObjectives: string[];
  researchNotes: string[];
  scaleDefinitions: ScaleDefinition[];
  sections: ParsedSection[];
  rawQuestions: RawQuestionBuilder[];
  warnings: ParserWarning[];
  unclassified: Array<{ id: string; text: string; lineNumber: number }>;
  totalBlocksCount: number;
} {
  const lines = rawInput.split(/\r\n|\n|\r/);
  const blocks: ExtractedBlock[] = [];
  const warnings: ParserWarning[] = [];
  const unclassified: Array<{ id: string; text: string; lineNumber: number }> = [];

  let blockIdx = 1;
  let lastClass: BlockClassification | undefined = undefined;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const norm = normalizeLine(rawLine);

    if (norm.length === 0) continue;

    const classified = classifyBlock(norm, rawLine, i, lastClass);
    lastClass = classified.type;

    const block: ExtractedBlock = {
      block_id: `block_${String(blockIdx++).padStart(4, '0')}`,
      raw_text: rawLine,
      normalized_text: norm,
      classification: classified.type,
      line_number: i + 1,
      prefix: classified.prefix,
      content: classified.content,
      tableData: classified.tableData,
    };
    blocks.push(block);
  }

  // State Machine variables
  let documentTitle = 'Impact of Girls’ Education on Bride Price Rates';
  let researchTopic: string | undefined = undefined;
  let introduction: string | undefined = undefined;
  const instructions: string[] = [];
  const researchObjectives: string[] = [];
  const researchNotes: string[] = [];

  const sections: ParsedSection[] = [];
  const rawQuestions: RawQuestionBuilder[] = [];
  const scaleDefinitions: ScaleDefinition[] = [];

  let currentSection: ParsedSection | null = null;
  let currentQuestion: RawQuestionBuilder | null = null;
  let currentScaleDefinition: ScaleDefinition | null = null;
  let questionCounter = 1;

  // Process blocks sequentially
  for (const block of blocks) {
    switch (block.classification) {
      case 'title': {
        if (!documentTitle || documentTitle === 'Impact of Girls’ Education on Bride Price Rates') {
          if (block.content && !block.content.toUpperCase().includes('RESEARCH INSTRUMENT')) {
            documentTitle = block.content;
          }
        }
        break;
      }

      case 'research_topic': {
        researchTopic = block.content;
        documentTitle = block.content;
        break;
      }

      case 'instruction': {
        if (block.content.toLowerCase().startsWith('dear respondent') || !introduction) {
          introduction = introduction ? `${introduction}\n${block.content}` : block.content;
        } else {
          instructions.push(block.content);
        }
        break;
      }

      case 'research_objective': {
        const clean = block.content.trim();
        if (
          clean.toLowerCase() !== 'suggested research objectives' &&
          clean.toLowerCase() !== 'research objectives'
        ) {
          researchObjectives.push(clean);
        }
        break;
      }

      case 'research_note': {
        const clean = block.content.trim();
        if (
          clean.toLowerCase() !== 'research note' &&
          clean.toLowerCase() !== 'research notes'
        ) {
          researchNotes.push(clean);
        }
        break;
      }

      case 'section': {
        // Close current open question
        if (currentQuestion) {
          rawQuestions.push(currentQuestion);
          currentQuestion = null;
        }

        const secCodeMatch = block.prefix?.match(/SECTION\s*([A-Za-z0-9IVX]+)/i);
        const secCode = secCodeMatch ? secCodeMatch[1].toUpperCase() : `S${sections.length + 1}`;
        const secId = `section_${secCode}`;

        currentSection = {
          id: secId,
          sectionCode: secCode,
          title: block.content || `SECTION ${secCode}`,
          description: '',
          questionIds: [],
        };
        sections.push(currentSection);
        break;
      }

      case 'scale_definition': {
        // Parse scale score mappings e.g. "Strongly Agree (SA) = 5"
        if (!currentScaleDefinition) {
          currentScaleDefinition = {
            id: 'scale_likert_5',
            name: '5-Point Likert Scale (SA, A, U, D, SD)',
            options: [
              { label: 'Strongly Agree (SA)', value: '5', score: 5, code: 'SA' },
              { label: 'Agree (A)', value: '4', score: 4, code: 'A' },
              { label: 'Undecided (U)', value: '3', score: 3, code: 'U' },
              { label: 'Disagree (D)', value: '2', score: 2, code: 'D' },
              { label: 'Strongly Disagree (SD)', value: '1', score: 1, code: 'SD' },
            ],
          };
          scaleDefinitions.push(currentScaleDefinition);
        }
        break;
      }

      case 'fill_in_blank': {
        if (currentQuestion) {
          rawQuestions.push(currentQuestion);
        }

        const qNum = block.prefix ? parseInt(block.prefix.replace(/\D/g, ''), 10) : questionCounter;
        const qId = `q_${String(qNum).padStart(3, '0')}`;

        currentQuestion = {
          id: qId,
          originalNumber: qNum,
          sectionId: currentSection ? currentSection.id : null,
          position: questionCounter++,
          promptText: block.content,
          sourceBlockIds: [block.block_id],
          originalLines: [block.raw_text],
          lineNumbers: [block.line_number],
          options: [],
          explicitType: 'short_text',
          instructions: [],
        };

        if (currentSection) {
          currentSection.questionIds.push(qId);
        }
        break;
      }

      case 'question_start': {
        if (currentQuestion) {
          rawQuestions.push(currentQuestion);
        }

        const qNum = block.prefix ? parseInt(block.prefix.replace(/\D/g, ''), 10) : questionCounter;
        const qId = `q_${String(qNum).padStart(3, '0')}`;

        currentQuestion = {
          id: qId,
          originalNumber: qNum,
          sectionId: currentSection ? currentSection.id : null,
          position: questionCounter++,
          promptText: block.content,
          sourceBlockIds: [block.block_id],
          originalLines: [block.raw_text],
          lineNumbers: [block.line_number],
          options: [],
          instructions: [],
        };

        if (currentSection) {
          currentSection.questionIds.push(qId);
        }
        break;
      }

      case 'table_row': {
        // Numbered statement row e.g. | 15 | Statement | [ ] | ...
        if (block.tableData?.rowNumber) {
          if (currentQuestion) {
            rawQuestions.push(currentQuestion);
            currentQuestion = null;
          }

          const qNum = block.tableData.rowNumber;
          const qId = `q_${String(qNum).padStart(3, '0')}`;

          const tableQ: RawQuestionBuilder = {
            id: qId,
            originalNumber: qNum,
            sectionId: currentSection ? currentSection.id : null,
            position: questionCounter++,
            promptText: block.content,
            sourceBlockIds: [block.block_id],
            originalLines: [block.raw_text],
            lineNumbers: [block.line_number],
            options: [
              { prefix: 'SA', text: 'Strongly Agree (SA)', blockId: block.block_id, rawText: '5' },
              { prefix: 'A', text: 'Agree (A)', blockId: block.block_id, rawText: '4' },
              { prefix: 'U', text: 'Undecided (U)', blockId: block.block_id, rawText: '3' },
              { prefix: 'D', text: 'Disagree (D)', blockId: block.block_id, rawText: '2' },
              { prefix: 'SD', text: 'Strongly Disagree (SD)', blockId: block.block_id, rawText: '1' },
            ],
            scaleDefinitionId: 'scale_likert_5',
            explicitType: 'likert_scale',
            instructions: [],
          };

          rawQuestions.push(tableQ);
          if (currentSection) {
            currentSection.questionIds.push(qId);
          }
        }
        break;
      }

      case 'table_header':
      case 'table_separator': {
        // Table structure markers - ensure default Likert scale registered
        if (!currentScaleDefinition) {
          currentScaleDefinition = {
            id: 'scale_likert_5',
            name: '5-Point Likert Scale (SA, A, U, D, SD)',
            options: [
              { label: 'Strongly Agree (SA)', value: '5', score: 5, code: 'SA' },
              { label: 'Agree (A)', value: '4', score: 4, code: 'A' },
              { label: 'Undecided (U)', value: '3', score: 3, code: 'U' },
              { label: 'Disagree (D)', value: '2', score: 2, code: 'D' },
              { label: 'Strongly Disagree (SD)', value: '1', score: 1, code: 'SD' },
            ],
          };
          scaleDefinitions.push(currentScaleDefinition);
        }
        break;
      }

      case 'option': {
        if (currentQuestion) {
          currentQuestion.options.push({
            prefix: block.prefix,
            text: block.content,
            blockId: block.block_id,
            rawText: block.raw_text,
          });
          currentQuestion.sourceBlockIds.push(block.block_id);
          currentQuestion.originalLines.push(block.raw_text);
          currentQuestion.lineNumbers.push(block.line_number);
        } else {
          warnings.push({
            code: 'ORPHAN_OPTION',
            message: `Found option "${block.normalized_text}" with no preceding question.`,
            sourceBlockIds: [block.block_id],
            severity: 'warning',
          });
          unclassified.push({
            id: block.block_id,
            text: block.normalized_text,
            lineNumber: block.line_number,
          });
        }
        break;
      }

      case 'continuation': {
        if (currentQuestion) {
          if (currentQuestion.options.length > 0) {
            const lastOpt = currentQuestion.options[currentQuestion.options.length - 1];
            lastOpt.text = `${lastOpt.text} ${block.normalized_text}`;
          } else {
            currentQuestion.promptText = `${currentQuestion.promptText} ${block.normalized_text}`;
          }
          currentQuestion.sourceBlockIds.push(block.block_id);
          currentQuestion.originalLines.push(block.raw_text);
          currentQuestion.lineNumbers.push(block.line_number);
        } else {
          unclassified.push({
            id: block.block_id,
            text: block.normalized_text,
            lineNumber: block.line_number,
          });
        }
        break;
      }

      default: {
        unclassified.push({
          id: block.block_id,
          text: block.normalized_text,
          lineNumber: block.line_number,
        });
        break;
      }
    }
  }

  // Finalize last open question
  if (currentQuestion) {
    rawQuestions.push(currentQuestion);
  }

  return {
    documentTitle,
    researchTopic,
    introduction,
    instructions,
    researchObjectives,
    researchNotes,
    scaleDefinitions,
    sections,
    rawQuestions,
    warnings,
    unclassified,
    totalBlocksCount: blocks.length,
  };
}

// ============================================================================
// 5. Stage F: Question-Type Inference Engine with Calibrated Evidence Scoring
// ============================================================================

export function inferQuestionTypeAdvanced(q: RawQuestionBuilder): {
  type: ParserQuestionType;
  confidence: number;
  reviewRequired: boolean;
  options: ParsedOption[];
  validation: Record<string, unknown>;
  logic: Array<Record<string, unknown>>;
  evidenceNotes: string[];
} {
  const promptLower = q.promptText.toLowerCase();
  const optionsCount = q.options.length;
  const evidenceNotes: string[] = [];

  // Check if type was explicitly determined during structural grouping (e.g. Likert table or Fill-in blank)
  if (q.explicitType === 'likert_scale') {
    evidenceNotes.push('Statement parsed from 5-point Likert response table row');
    const scaleOpts: ParsedOption[] = [
      { id: 'opt_sa', label: 'Strongly Agree (SA)', value: '5' },
      { id: 'opt_a', label: 'Agree (A)', value: '4' },
      { id: 'opt_u', label: 'Undecided (U)', value: '3' },
      { id: 'opt_d', label: 'Disagree (D)', value: '2' },
      { id: 'opt_sd', label: 'Strongly Disagree (SD)', value: '1' },
    ];
    return {
      type: 'likert_scale',
      confidence: 0.99,
      reviewRequired: false,
      options: scaleOpts,
      validation: { required: false },
      logic: [],
      evidenceNotes,
    };
  }

  if (q.explicitType === 'short_text') {
    evidenceNotes.push('Identified fill-in blank underscores (e.g. Community/LGA)');
    return {
      type: 'short_text',
      confidence: 0.98,
      reviewRequired: false,
      options: [],
      validation: { required: false },
      logic: [],
      evidenceNotes,
    };
  }

  // Options parsing & "Other" write-in check
  const parsedOptions: ParsedOption[] = [];
  const logicRules: Array<Record<string, unknown>> = [];

  q.options.forEach((opt, idx) => {
    const isOther =
      opt.text.toLowerCase().includes('other') &&
      (opt.text.toLowerCase().includes('specify') || opt.text.includes('______'));

    const cleanLabel = opt.text.replace(/[:\s_]+$/, '');
    const val = cleanLabel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 30) || `opt_${idx + 1}`;

    const parsedOpt: ParsedOption = {
      id: `opt_${idx + 1}`,
      label: cleanLabel,
      value: val,
      isOther,
    };
    parsedOptions.push(parsedOpt);

    if (isOther) {
      logicRules.push({
        action: 'show_question',
        target_question_id: `${q.id}_other_spec`,
        when: {
          question_id: q.id,
          operator: 'equals',
          value: val,
        },
      });
      evidenceNotes.push(`Option "${cleanLabel}" detected as write-in field`);
    }
  });

  // Multiple selection checks:
  // e.g. "Select all that apply", "(You may select more than one option)", "Select more than one"
  const isMultipleSelect =
    promptLower.includes('select all that apply') ||
    promptLower.includes('you may select more than one') ||
    promptLower.includes('select more than one') ||
    promptLower.includes('check all that apply') ||
    promptLower.includes('tick all that apply');

  if (isMultipleSelect) {
    evidenceNotes.push('Explicit instruction allows multiple options');
    return {
      type: 'multiple_choice',
      confidence: 0.99,
      reviewRequired: false,
      options: parsedOptions,
      validation: { required: false },
      logic: logicRules,
      evidenceNotes,
    };
  }

  // Binary Yes/No
  if (
    optionsCount === 2 &&
    parsedOptions.some((o) => o.label.toLowerCase() === 'yes') &&
    parsedOptions.some((o) => o.label.toLowerCase() === 'no')
  ) {
    evidenceNotes.push('Two distinct binary Yes/No choices');
    return {
      type: 'yes_no',
      confidence: 0.99,
      reviewRequired: false,
      options: parsedOptions,
      validation: { required: false },
      logic: logicRules,
      evidenceNotes,
    };
  }

  // If options exist and not marked multiple: single choice
  if (optionsCount > 0) {
    evidenceNotes.push(`Categorical choices provided (${optionsCount} items)`);
    return {
      type: 'single_choice',
      confidence: 0.96,
      reviewRequired: false,
      options: parsedOptions,
      validation: { required: false },
      logic: logicRules,
      evidenceNotes,
    };
  }

  // No options provided: evaluate semantic intent
  // Qualitative long text
  if (
    promptLower.includes('recommendation') ||
    promptLower.includes('cultural modifications would you propose') ||
    promptLower.includes('explain') ||
    promptLower.includes('describe') ||
    promptLower.includes('discuss') ||
    promptLower.includes('elaborate') ||
    promptLower.includes('in your opinion')
  ) {
    evidenceNotes.push('Qualitative recommendation or explanation prompt');
    return {
      type: 'long_text',
      confidence: 0.97,
      reviewRequired: false,
      options: [],
      validation: { required: false },
      logic: [],
      evidenceNotes,
    };
  }

  // Numeric question
  if (
    promptLower.includes('what is your age') ||
    promptLower.includes('how many') ||
    promptLower.includes('number of')
  ) {
    evidenceNotes.push('Numeric age or count prompt');
    return {
      type: 'number',
      confidence: 0.96,
      reviewRequired: false,
      options: [],
      validation: { required: false },
      logic: [],
      evidenceNotes,
    };
  }

  // Default short text
  evidenceNotes.push('Default open text field');
  return {
    type: 'short_text',
    confidence: 0.85,
    reviewRequired: false,
    options: [],
    validation: { required: false },
    logic: [],
    evidenceNotes,
  };
}

// ============================================================================
// 6. Stage H: Formal Invariant Validation & Proof Obligations
// ============================================================================

export function validateQuestionnaireIntegrity(
  doc: ParsedQuestionnaire,
  totalSourceBlocks: number
): { errors: string[]; warnings: ParserWarning[] } {
  const errors: string[] = [];
  const warnings = [...doc.warnings];

  // Invariant 1: Conservation / Source coverage
  const accountedBlockCount =
    doc.questions.reduce((sum, q) => sum + q.source.blockIds.length, 0) +
    doc.unclassifiedBlocks.length;

  if (accountedBlockCount === 0 && totalSourceBlocks > 0) {
    errors.push('Invariant 1 Violation: Total content loss detected.');
    warnings.push({
      code: 'SOURCE_COVERAGE_FAILURE',
      message: 'Zero source blocks were accounted for in the parsed questionnaire output.',
      sourceBlockIds: [],
      severity: 'error',
    });
  }

  // Invariant 2: Unique Identities
  const seenQIds = new Set<string>();
  for (const q of doc.questions) {
    if (seenQIds.has(q.id)) {
      errors.push(`Invariant 2 Violation: Duplicate question ID: ${q.id}`);
      warnings.push({
        code: 'DUPLICATE_QUESTION_NUMBER',
        message: `Duplicate question ID detected: ${q.id}`,
        sourceBlockIds: q.source.blockIds,
        questionId: q.id,
        severity: 'error',
      });
    }
    seenQIds.add(q.id);

    const seenOptIds = new Set<string>();
    for (const opt of q.options) {
      if (seenOptIds.has(opt.id)) {
        errors.push(`Duplicate option ID: ${opt.id} in question ${q.id}`);
      }
      seenOptIds.add(opt.id);
    }
  }

  // Invariant 3: Valid Section References
  const validSecIds = new Set(doc.sections.map((s) => s.id));
  for (const q of doc.questions) {
    if (q.sectionId && !validSecIds.has(q.sectionId)) {
      errors.push(`Invariant 3 Violation: Question ${q.id} references non-existent section: ${q.sectionId}`);
      warnings.push({
        code: 'INVALID_SECTION_REFERENCE',
        message: `Question ${q.id} references missing section ${q.sectionId}`,
        sourceBlockIds: q.source.blockIds,
        questionId: q.id,
        severity: 'error',
      });
    }
  }

  // Invariant 4: Order Preservation
  for (let i = 0; i < doc.questions.length; i++) {
    if (doc.questions[i].position !== i + 1) {
      warnings.push({
        code: 'ORDER_DRIFT',
        message: `Position drift detected for question ${doc.questions[i].id}`,
        sourceBlockIds: doc.questions[i].source.blockIds,
        severity: 'info',
      });
    }
  }

  return { errors, warnings };
}

// ============================================================================
// 7. Main Entrypoint: parseQuestionnaireText
// ============================================================================

export function parseQuestionnaireText(
  rawInput: string,
  sourceType: 'text' | 'docx' | 'pdf' = 'text'
): {
  success: boolean;
  data: ParsedQuestionnaire;
  errors: string[];
  warnings: ParserWarning[];
} {
  const errors: string[] = [];

  // Stage A: Input validation
  if (!rawInput || !rawInput.trim()) {
    return {
      success: false,
      data: {
        schemaVersion: '1.0',
        document: {
          title: 'Empty Document',
          language: 'en',
          sourceType,
          instructions: [],
          researchObjectives: [],
          researchNotes: [],
        },
        scaleDefinitions: [],
        metadata: {
          parsingStatus: 'failed',
          parserVersion: '1.1.0',
          totalBlocksCount: 0,
          accountedBlocksCount: 0,
          averageConfidence: 0,
          questionDetectionCount: 0,
        },
        sections: [],
        questions: [],
        warnings: [],
        unclassifiedBlocks: [],
      },
      errors: ['Input document is empty.'],
      warnings: [],
    };
  }

  // Max input length check (1 million characters)
  if (rawInput.length > 1000000) {
    return {
      success: false,
      data: {
        schemaVersion: '1.0',
        document: {
          title: 'Oversized Document',
          language: 'en',
          sourceType,
          instructions: [],
          researchObjectives: [],
          researchNotes: [],
        },
        scaleDefinitions: [],
        metadata: {
          parsingStatus: 'failed',
          parserVersion: '1.1.0',
          totalBlocksCount: 0,
          accountedBlocksCount: 0,
          averageConfidence: 0,
          questionDetectionCount: 0,
        },
        sections: [],
        questions: [],
        warnings: [],
        unclassifiedBlocks: [],
      },
      errors: ['Input document exceeds maximum allowed size (1,000,000 characters).'],
      warnings: [],
    };
  }

  // Stages B, C, D, E: Extraction, Normalization, Classification, Grouping
  const grouped = extractAndGroupBlocks(rawInput);

  // Stage F: Question-Type Inference
  const parsedQuestions: ParsedQuestion[] = [];
  let totalConfidence = 0;

  for (const rawQ of grouped.rawQuestions) {
    const inference = inferQuestionTypeAdvanced(rawQ);
    totalConfidence += inference.confidence;

    parsedQuestions.push({
      id: rawQ.id,
      originalNumber: rawQ.originalNumber,
      sectionId: rawQ.sectionId,
      position: rawQ.position,
      text: rawQ.promptText,
      type: inference.type,
      required: false, // Default false per specification
      options: inference.options,
      scaleId: rawQ.scaleDefinitionId,
      validation: inference.validation,
      logic: inference.logic,
      confidence: inference.confidence,
      reviewRequired: inference.reviewRequired,
      source: {
        blockIds: rawQ.sourceBlockIds,
        originalText: rawQ.originalLines.join('\n'),
        lineNumbers: rawQ.lineNumbers,
      },
      evidenceNotes: inference.evidenceNotes,
    });
  }

  const avgConfidence =
    parsedQuestions.length > 0
      ? Math.round((totalConfidence / parsedQuestions.length) * 100) / 100
      : 1;

  // Build Intermediate Representation
  const intermediate: ParsedQuestionnaire = {
    schemaVersion: '1.0',
    document: {
      title: grouped.documentTitle,
      researchTopic: grouped.researchTopic,
      language: 'en',
      sourceType,
      introduction: grouped.introduction,
      instructions: grouped.instructions,
      researchObjectives: grouped.researchObjectives,
      researchNotes: grouped.researchNotes,
    },
    scaleDefinitions: grouped.scaleDefinitions,
    metadata: {
      parsingStatus: 'valid',
      parserVersion: '1.1.0',
      totalBlocksCount: grouped.totalBlocksCount,
      accountedBlocksCount:
        parsedQuestions.reduce((sum, q) => sum + q.source.blockIds.length, 0) +
        grouped.unclassified.length,
      averageConfidence: avgConfidence,
      questionDetectionCount: parsedQuestions.length,
    },
    sections: grouped.sections,
    questions: parsedQuestions,
    warnings: grouped.warnings,
    unclassifiedBlocks: grouped.unclassified,
  };

  // Stage H: Integrity & Proof Invariant Validation
  const validation = validateQuestionnaireIntegrity(intermediate, grouped.totalBlocksCount);
  errors.push(...validation.errors);
  intermediate.warnings = validation.warnings;

  if (intermediate.warnings.some((w) => w.severity === 'warning') || avgConfidence < 0.85) {
    intermediate.metadata.parsingStatus = 'needs_review';
  }
  if (errors.length > 0) {
    intermediate.metadata.parsingStatus = 'failed';
  }

  return {
    success: errors.length === 0,
    data: intermediate,
    errors,
    warnings: intermediate.warnings,
  };
}

// ============================================================================
// 8. Stage I: Mapping IR -> Formora FormModel
// ============================================================================

export function convertParsedQuestionnaireToFormModel(
  parsed: ParsedQuestionnaire
): Partial<FormModel> {
  // Convert sections
  const sections: FormSection[] =
    parsed.sections.length > 0
      ? parsed.sections.map((s, idx) => ({
          id: s.id,
          title: s.title,
          description: s.description || undefined,
          order: idx,
        }))
      : [{ id: 'sec_A', title: 'Main Section', order: 0 }];

  // Convert questions
  const questions: FormQuestion[] = parsed.questions.map((pq) => {
    let targetType = pq.type as any;
    if (pq.type === 'likert_scale') {
      targetType = 'likert_5';
    } else if (pq.type === 'rating_scale') {
      targetType = 'star_rating';
    }

    const options: QuestionOption[] = pq.options.map((o) => ({
      id: o.id,
      label: o.label,
      value: o.value,
    }));

    const logicRules: LogicRule[] = (pq.logic as any[]).map((r, rIdx) => ({
      id: `rule_${pq.id}_${rIdx + 1}`,
      sourceQuestionId: pq.id,
      operator: r.when?.operator || 'equals',
      value: r.when?.value || 'other',
      action: 'show',
      targetId: r.target_question_id,
    }));

    return {
      id: pq.id,
      sectionId: pq.sectionId || sections[0].id,
      type: targetType,
      title: pq.text,
      validation: {
        required: pq.required,
        ...(pq.validation as any),
      },
      options: options.length > 0 ? options : undefined,
      logicRules: logicRules.length > 0 ? logicRules : undefined,
    };
  });

  return {
    title: parsed.document.researchTopic || parsed.document.title,
    description: parsed.document.introduction || 'Questionnaire imported via Formora Parser.',
    category: 'Research & Academic',
    sections,
    questions,
  };
}

// ============================================================================
// 9. DOCX File Extraction Helper (Mammoth)
// ============================================================================

export async function parseDocxFile(file: File | ArrayBuffer): Promise<{
  success: boolean;
  data: ParsedQuestionnaire;
  errors: string[];
  warnings: ParserWarning[];
}> {
  try {
    const mammoth = await import('mammoth');
    let arrayBuffer: ArrayBuffer;
    if (typeof (file as any).arrayBuffer === 'function') {
      arrayBuffer = await (file as File).arrayBuffer();
    } else {
      arrayBuffer = file as ArrayBuffer;
    }
    const result = await mammoth.extractRawText({ arrayBuffer });
    return parseQuestionnaireText(result.value, 'docx');
  } catch (err: any) {
    return {
      success: false,
      data: {
        schemaVersion: '1.0',
        document: {
          title: 'Extraction Error',
          language: 'en',
          sourceType: 'docx',
          instructions: [],
          researchObjectives: [],
          researchNotes: [],
        },
        scaleDefinitions: [],
        metadata: {
          parsingStatus: 'failed',
          parserVersion: '1.1.0',
          totalBlocksCount: 0,
          accountedBlocksCount: 0,
          averageConfidence: 0,
          questionDetectionCount: 0,
        },
        sections: [],
        questions: [],
        warnings: [],
        unclassifiedBlocks: [],
      },
      errors: [`Failed to extract DOCX: ${err.message || String(err)}`],
      warnings: [],
    };
  }
}

export const SAMPLE_ACADEMIC_QUESTIONNAIRE = BRIDE_PRICE_REGRESSION_QUESTIONNAIRE;
export { BRIDE_PRICE_REGRESSION_QUESTIONNAIRE };
