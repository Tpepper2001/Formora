import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { FormModel, FormResponse, AuditLogItem } from './src/types/form.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));

// -------------------------------------------------------------
// In-Memory & Local JSON Store for Forms, Responses & Audit Logs
// -------------------------------------------------------------
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'formora_store.json');

interface DataStore {
  forms: FormModel[];
  responses: FormResponse[];
  auditLogs: AuditLogItem[];
}

let store: DataStore = {
  forms: [],
  responses: [],
  auditLogs: [],
};

// Ensure data folder and load or initialize clean store (Zero mock data)
function initStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      store = {
        forms: parsed.forms || [],
        responses: parsed.responses || [],
        auditLogs: parsed.auditLogs || [],
      };
    } else {
      store = { forms: [], responses: [], auditLogs: [] };
      persistStore();
    }
  } catch (err) {
    console.error('Error initializing data store:', err);
    store = { forms: [], responses: [], auditLogs: [] };
  }
}

function persistStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write store to disk:', err);
  }
}

initStore();

// -------------------------------------------------------------
// REST API Endpoints
// -------------------------------------------------------------

// Forms List
app.get('/api/forms', (req, res) => {
  res.json({ forms: store.forms });
});

// Single Form
app.get('/api/forms/:id', (req, res) => {
  const form = store.forms.find((f) => f.id === req.params.id || f.settings?.slug === req.params.id);
  if (!form) {
    return res.status(404).json({ error: 'Form not found' });
  }
  res.json({ form });
});

// Create Form
app.post('/api/forms', (req, res) => {
  const body = req.body;
  const newForm: FormModel = {
    id: body.id || `form-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    workspaceId: body.workspaceId || 'ws-main',
    ownerId: body.ownerId,
    title: body.title || 'Untitled Form',
    description: body.description || '',
    category: body.category || 'General',
    status: body.status || 'draft',
    sections: body.sections || [{ id: 'sec-1', title: 'General', order: 0 }],
    questions: body.questions || [],
    branding: body.branding || {
      accentColor: '#176B52',
      theme: 'light',
      fontFamily: 'DM Sans',
      submitButtonText: 'Submit',
      thankYouTitle: 'Thank you!',
      thankYouMessage: 'Your response has been recorded.',
      showProgressBar: true,
    },
    settings: body.settings || {
      isPublished: false,
      slug: `form-${Date.now().toString(36)}`,
      accessMode: 'public',
      allowAnonymous: true,
      preventDuplicates: false,
      allowMultipleSubmissions: true,
    },
    createdAt: body.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    submissionCount: 0,
    version: 1,
  };

  store.forms.unshift(newForm);

  // Auto-log Form Created
  const logEntry: AuditLogItem = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId: newForm.ownerId || 'system',
    action: 'Form Created',
    formId: newForm.id,
    formTitle: newForm.title,
    details: `${newForm.questions.length} questions`,
    timestamp: new Date().toISOString(),
  };
  store.auditLogs.unshift(logEntry);

  persistStore();
  res.status(201).json({ form: newForm });
});

// Update Form
app.put('/api/forms/:id', (req, res) => {
  const index = store.forms.findIndex((f) => f.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Form not found' });
  }
  const existing = store.forms[index];
  const wasNotPublished = existing.status !== 'published';
  const isNowPublished = req.body.status === 'published';

  const updated: FormModel = {
    ...existing,
    ...req.body,
    id: existing.id,
    updatedAt: new Date().toISOString(),
    version: (existing.version || 1) + 1,
  };
  store.forms[index] = updated;

  // If status changed to published, log activity
  if (wasNotPublished && isNowPublished) {
    const logEntry: AuditLogItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: updated.ownerId || 'system',
      action: 'Form Published',
      formId: updated.id,
      formTitle: updated.title,
      details: 'Form published to respondents',
      timestamp: new Date().toISOString(),
    };
    store.auditLogs.unshift(logEntry);
  }

  persistStore();
  res.json({ form: updated });
});

// Delete Form
app.delete('/api/forms/:id', (req, res) => {
  const index = store.forms.findIndex((f) => f.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Form not found' });
  }
  const deletedForm = store.forms[index];
  store.forms.splice(index, 1);
  // Also remove responses
  store.responses = store.responses.filter((r) => r.formId !== req.params.id);

  // Auto-log Form Deleted
  const logEntry: AuditLogItem = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId: deletedForm.ownerId || 'system',
    action: 'Form Deleted',
    formId: deletedForm.id,
    formTitle: deletedForm.title,
    details: 'Form removed',
    timestamp: new Date().toISOString(),
  };
  store.auditLogs.unshift(logEntry);

  persistStore();
  res.json({ success: true });
});

// Get Responses for a Form
app.get('/api/forms/:id/responses', (req, res) => {
  const form = store.forms.find((f) => f.id === req.params.id);
  if (!form) {
    return res.status(404).json({ error: 'Form not found' });
  }
  const responses = store.responses.filter((r) => r.formId === form.id);
  res.json({ responses });
});

// Submit a Response
app.post('/api/forms/:id/responses', (req, res) => {
  const form = store.forms.find((f) => f.id === req.params.id || f.settings?.slug === req.params.id);
  if (!form) {
    return res.status(404).json({ error: 'Form not found' });
  }

  // Check if form is closed or limits reached
  if (form.status === 'closed') {
    return res.status(403).json({ error: 'This form is no longer accepting submissions.' });
  }
  if (form.settings?.responseLimit && form.submissionCount >= form.settings.responseLimit) {
    return res.status(403).json({ error: 'This form has reached its maximum response capacity.' });
  }
  if (form.settings?.closeDate && new Date(form.settings.closeDate) < new Date()) {
    return res.status(403).json({ error: 'The deadline for this form has passed.' });
  }

  const newResponse: FormResponse = {
    id: req.body.responseId || `resp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    formId: form.id,
    submittedAt: new Date().toISOString(),
    completionTimeSeconds: req.body.completionTimeSeconds || 60,
    isComplete: true,
    answers: req.body.answers || {},
    status: 'valid',
    internalNotes: '',
    respondentIdentifier: req.body.respondentIdentifier || (form.settings?.allowAnonymous ? 'Anonymous' : 'Visitor'),
  };

  store.responses.unshift(newResponse);
  form.submissionCount = (form.submissionCount || 0) + 1;

  // Auto-log Response Received
  const logEntry: AuditLogItem = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId: form.ownerId || 'system',
    action: 'Response Received',
    formId: form.id,
    formTitle: form.title,
    details: `Response from ${newResponse.respondentIdentifier}`,
    timestamp: new Date().toISOString(),
  };
  store.auditLogs.unshift(logEntry);

  persistStore();

  res.status(201).json({ response: newResponse, receiptId: newResponse.id });
});

// Update Response Status or Notes
app.patch('/api/responses/:id', (req, res) => {
  const resp = store.responses.find((r) => r.id === req.params.id);
  if (!resp) {
    return res.status(404).json({ error: 'Response not found' });
  }
  if (req.body.status) resp.status = req.body.status;
  if (req.body.internalNotes !== undefined) resp.internalNotes = req.body.internalNotes;
  persistStore();
  res.json({ response: resp });
});

// Delete Response
app.delete('/api/responses/:id', (req, res) => {
  const index = store.responses.findIndex((r) => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Response not found' });
  }
  const formId = store.responses[index].formId;
  store.responses.splice(index, 1);
  const form = store.forms.find((f) => f.id === formId);
  if (form && form.submissionCount > 0) {
    form.submissionCount -= 1;
  }
  persistStore();
  res.json({ success: true });
});

// Audit Logs Endpoint
app.get('/api/audit-logs', (req, res) => {
  const userId = req.query.userId as string | undefined;
  if (userId) {
    const userLogs = store.auditLogs.filter((l) => l.userId === userId);
    return res.json({ auditLogs: userLogs });
  }
  res.json({ auditLogs: store.auditLogs });
});

app.post('/api/audit-logs', (req, res) => {
  const log: AuditLogItem = {
    id: req.body.id || `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId: req.body.userId || 'system',
    action: req.body.action || 'Form Created',
    formId: req.body.formId,
    formTitle: req.body.formTitle || 'Untitled Form',
    details: req.body.details,
    timestamp: req.body.timestamp || new Date().toISOString(),
  };
  store.auditLogs.unshift(log);
  persistStore();
  res.status(201).json({ auditLog: log });
});

// -------------------------------------------------------------
// Dev & Production Serving
// -------------------------------------------------------------
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Formora full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
