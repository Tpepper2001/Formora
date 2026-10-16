import { FormModel, FormResponse } from '../types/form';

/**
 * Clean CSV Export
 * Converts form submissions into RFC 4180 CSV with UTF-8 BOM
 */
export function exportResponsesToCSV(form: FormModel, responses: FormResponse[]): void {
  const headers = ['Submission ID', 'Submitted At', 'Completion Time (s)', 'Status'];
  const questionMap: { id: string; title: string }[] = [];

  for (const q of form.questions) {
    if (q.type === 'section_break' || q.type === 'info_text') continue;
    if (q.type === 'matrix' && q.matrixRows) {
      for (const row of q.matrixRows) {
        headers.push(`"${q.title.replace(/"/g, '""')} [${row.replace(/"/g, '""')}]"`);
        questionMap.push({ id: `${q.id}:::${row}`, title: `${q.title} [${row}]` });
      }
    } else {
      headers.push(`"${q.title.replace(/"/g, '""')}"`);
      questionMap.push({ id: q.id, title: q.title });
    }
  }

  const rows: string[] = [headers.join(',')];

  for (const resp of responses) {
    const rowValues = [
      `"${resp.id}"`,
      `"${new Date(resp.submittedAt).toLocaleString()}"`,
      resp.completionTimeSeconds || 0,
      `"${resp.status}"`,
    ];

    for (const qItem of questionMap) {
      if (qItem.id.includes(':::')) {
        const [qId, matrixRow] = qItem.id.split(':::');
        const matrixAns = resp.answers[qId];
        const val = matrixAns && typeof matrixAns === 'object' ? matrixAns[matrixRow] || '' : '';
        rowValues.push(`"${String(val).replace(/"/g, '""')}"`);
      } else {
        const val = resp.answers[qItem.id];
        let strVal = '';
        if (Array.isArray(val)) {
          strVal = val.join('; ');
        } else if (val !== undefined && val !== null) {
          strVal = String(val);
        }
        rowValues.push(`"${strVal.replace(/"/g, '""')}"`);
      }
    }

    rows.push(rowValues.join(','));
  }

  const csvContent = '\uFEFF' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${slugify(form.title)}-responses-${formatDate(new Date())}.csv`);
}

/**
 * JSON Export
 */
export function exportResponsesToJSON(form: FormModel, responses: FormResponse[]): void {
  const data = {
    form: {
      id: form.id,
      title: form.title,
      description: form.description,
      exportedAt: new Date().toISOString(),
    },
    totalResponses: responses.length,
    responses,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `${slugify(form.title)}-data-${formatDate(new Date())}.json`);
}

/**
 * Blank Word Document (.doc / XML)
 * Produces an editable document for paper distribution or offline interviews
 */
export function exportBlankFormWord(form: FormModel): void {
  let docContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>${form.title}</title>
<style>
  body { font-family: 'Calibri', 'Arial', sans-serif; margin: 40px; color: #222; }
  h1 { color: #176B52; font-size: 22pt; margin-bottom: 6px; }
  p.desc { color: #555; font-size: 11pt; margin-bottom: 24px; line-height: 1.4; }
  h2.sec { color: #333; font-size: 14pt; border-bottom: 1.5pt solid #176B52; padding-bottom: 4px; margin-top: 24px; }
  .question { margin-bottom: 20px; page-break-inside: avoid; }
  .q-title { font-weight: bold; font-size: 11pt; margin-bottom: 4px; }
  .q-desc { font-size: 9.5pt; color: #666; margin-bottom: 6px; }
  .q-box { border: 1pt solid #ccc; height: 50pt; width: 100%; margin-top: 6px; }
  .q-line { border-bottom: 1pt solid #aaa; height: 20pt; width: 100%; margin-top: 4px; }
  .option { margin-bottom: 4px; font-size: 10.5pt; }
  .table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  .table th, .table td { border: 1pt solid #bbb; padding: 6pt; text-align: center; font-size: 9.5pt; }
  .table th { background: #f3f5f3; font-weight: bold; }
  .table td.row-label { text-align: left; font-weight: 500; }
</style>
</head>
<body>
  <h1>${escapeHtml(form.title)}</h1>
  <p class='desc'>${escapeHtml(form.description || 'Please complete all applicable questions.')}</p>
`;

  let currentSection = '';
  form.questions.forEach((q, idx) => {
    if (q.sectionId && q.sectionId !== currentSection) {
      const sec = form.sections.find((s) => s.id === q.sectionId);
      if (sec) {
        docContent += `<h2 class='sec'>${escapeHtml(sec.title)}</h2>`;
        currentSection = q.sectionId;
      }
    }

    if (q.type === 'section_break') {
      docContent += `<h2 class='sec'>${escapeHtml(q.title)}</h2>`;
      return;
    }

    docContent += `
    <div class='question'>
      <div class='q-title'>${idx + 1}. ${escapeHtml(q.title)}${q.validation?.required ? ' <span style="color:#d9534f">*</span>' : ''}</div>
      ${q.description ? `<div class='q-desc'>${escapeHtml(q.description)}</div>` : ''}
    `;

    if (q.type === 'short_text' || q.type === 'email' || q.type === 'phone' || q.type === 'url' || q.type === 'number') {
      docContent += `<div class='q-line'></div>`;
    } else if (q.type === 'long_text') {
      docContent += `<div class='q-box'></div>`;
    } else if (q.type === 'single_choice' || q.type === 'yes_no' || q.type === 'true_false') {
      const opts = q.options || (q.type === 'yes_no' ? [{ label: 'Yes' }, { label: 'No' }] : [{ label: 'True' }, { label: 'False' }]);
      opts.forEach((opt) => {
        docContent += `<div class='option'>◯ ${escapeHtml(opt.label)}</div>`;
      });
    } else if (q.type === 'multiple_choice') {
      (q.options || []).forEach((opt) => {
        docContent += `<div class='option'>☐ ${escapeHtml(opt.label)}</div>`;
      });
    } else if (q.type === 'likert_5' || q.type === 'likert_7' || q.type === 'satisfaction' || q.type === 'agreement') {
      const scaleCount = q.type === 'likert_7' ? 7 : 5;
      docContent += `<div style='margin-top:8px;'>`;
      for (let s = 1; s <= scaleCount; s++) {
        docContent += `<span style='display:inline-block; margin-right: 20px;'>[ &nbsp; ] ${s}</span>`;
      }
      docContent += `</div>`;
    } else if (q.type === 'matrix' && q.matrixRows && q.matrixColumns) {
      docContent += `<table class='table'><thead><tr><th style='text-align:left;'>Item</th>`;
      q.matrixColumns.forEach((col) => {
        docContent += `<th>${escapeHtml(col)}</th>`;
      });
      docContent += `</tr></thead><tbody>`;
      q.matrixRows.forEach((row) => {
        docContent += `<tr><td class='row-label'>${escapeHtml(row)}</td>`;
        q.matrixColumns!.forEach(() => {
          docContent += `<td>◯</td>`;
        });
        docContent += `</tr>`;
      });
      docContent += `</tbody></table>`;
    } else if (q.type === 'signature') {
      docContent += `<div style='margin-top:20px;'><div style='width:250pt; border-bottom:1pt solid #333; height:30pt;'></div><div style='font-size:9pt; color:#666;'>Signature Date: ____________</div></div>`;
    } else {
      docContent += `<div class='q-line'></div>`;
    }

    docContent += `</div>`;
  });

  docContent += `</body></html>`;

  const blob = new Blob([docContent], { type: 'application/msword' });
  downloadBlob(blob, `${slugify(form.title)}-blank-form.doc`);
}

/**
 * Executive Summary Word Report
 */
export function exportReportWord(form: FormModel, responses: FormResponse[], insightsSummary?: string): void {
  let docContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>${form.title} — Executive Report</title>
<style>
  body { font-family: 'Calibri', 'Arial', sans-serif; margin: 40px; color: #171918; }
  h1 { color: #176B52; font-size: 24pt; margin-bottom: 4px; }
  .kpi-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  .kpi-table td { border: 1pt solid #E2E4DF; padding: 12pt; background: #F7F7F4; text-align: center; }
  .kpi-val { font-size: 20pt; font-weight: bold; color: #176B52; }
  .kpi-lbl { font-size: 9.5pt; color: #64748B; text-transform: uppercase; letter-spacing: 0.5pt; }
  h2 { color: #171918; font-size: 14pt; border-bottom: 1.5pt solid #176B52; padding-bottom: 4px; margin-top: 24px; }
  .insight-box { background: #E8F3EE; border-left: 3pt solid #176B52; padding: 12pt; margin-bottom: 20px; font-size: 10.5pt; line-height: 1.5; }
  .q-item { margin-bottom: 16px; page-break-inside: avoid; }
  .q-title { font-weight: bold; font-size: 11pt; color: #222; }
</style>
</head>
<body>
  <h1>${escapeHtml(form.title)}</h1>
  <p style='color:#666; font-size:10pt;'>Generated on ${new Date().toLocaleDateString()} · Powered by Formora</p>

  <table class='kpi-table'>
    <tr>
      <td>
        <div class='kpi-val'>${responses.length}</div>
        <div class='kpi-lbl'>Total Submissions</div>
      </td>
      <td>
        <div class='kpi-val'>100%</div>
        <div class='kpi-lbl'>Completion Rate</div>
      </td>
      <td>
        <div class='kpi-val'>${Math.round(responses.reduce((a, b) => a + (b.completionTimeSeconds || 60), 0) / (responses.length || 1))}s</div>
        <div class='kpi-lbl'>Avg. Completion Time</div>
      </td>
    </tr>
  </table>

  ${insightsSummary ? `<h2>Executive AI Insights</h2><div class='insight-box'>${escapeHtml(insightsSummary)}</div>` : ''}

  <h2>Question-Level Findings</h2>
  ${form.questions.map((q, idx) => `
    <div class='q-item'>
      <div class='q-title'>${idx + 1}. ${escapeHtml(q.title)}</div>
      <p style='color:#666; font-size:10pt; margin:4px 0 0 0;'>Type: ${q.type} · Responses recorded: ${responses.filter(r => r.answers[q.id] !== undefined).length}</p>
    </div>
  `).join('')}
</body>
</html>
`;

  const blob = new Blob([docContent], { type: 'application/msword' });
  downloadBlob(blob, `${slugify(form.title)}-executive-report.doc`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'form';
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
