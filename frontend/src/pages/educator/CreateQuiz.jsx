import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { ArrowLeft, Plus, Trash2, Brain, X, CheckCircle2, Pencil, Users } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';
import { useToast } from '../../context/ToastContext';
import { unwrapApiData } from '../../utils/apiData';

function toDatetimeLocalValue(iso) {
  if (!iso) return '';
  const x = new Date(iso);
  if (Number.isNaN(x.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
}

function LearnerAccessEditor({ row, quizId, api, toast, onSaved }) {
  const o = row.override || {};
  const [extra, setExtra] = useState(String(o.extraAttempts ?? 0));
  const [blocked, setBlocked] = useState(Boolean(o.blocked));
  const [blockReason, setBlockReason] = useState(o.blockReason || '');
  const [note, setNote] = useState(o.educatorNote || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const o2 = row.override || {};
    setExtra(String(o2.extraAttempts ?? 0));
    setBlocked(Boolean(o2.blocked));
    setBlockReason(o2.blockReason || '');
    setNote(o2.educatorNote || '');
  }, [row]);

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/quizzes/${quizId}/learner-access/${row.learner._id}`, {
        extraAttempts: Math.max(0, parseInt(extra, 10) || 0),
        blocked,
        blockReason,
        educatorNote: note,
      });
      toast.success(`Saved for ${row.learner.name}`);
      onSaved();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Save failed');
    }
    setSaving(false);
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-2">
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <p className="font-medium text-sm">{row.learner.name}</p>
          <p className="text-xs text-gray-500">{row.learner.email}</p>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Submitted attempts: {row.attemptsUsed} / {row.totalAttemptsAllowed}
        </p>
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-2 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Extra attempts (add-on)</label>
          <input className="input-field !py-1.5 text-sm" type="number" min={0} max={20} value={extra} onChange={(e) => setExtra(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 pt-5 sm:pt-6">
          <input id={`blk-${row.learner._id}`} type="checkbox" checked={blocked} onChange={(e) => setBlocked(e.target.checked)} />
          <label htmlFor={`blk-${row.learner._id}`} className="text-sm">
            Block access
          </label>
        </div>
        <div className="sm:col-span-2 md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Reason (shown to learner if blocked)</label>
          <input
            className="input-field !py-1.5 text-sm"
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            disabled={!blocked}
            placeholder="e.g. Contact me before retaking"
          />
        </div>
        <div className="sm:col-span-2 md:col-span-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">Educator note (private)</label>
          <input className="input-field !py-1.5 text-sm" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Internal notes" />
        </div>
      </div>
      <button type="button" className="btn-primary text-sm py-1.5" disabled={saving} onClick={save}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

function LearnerAccessModal({ quizId, onClose, api, toast }) {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .get(`/quizzes/${quizId}/learner-access`)
      .then((res) => setOverview(unwrapApiData(res)))
      .catch((e) => toast.error(e?.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [quizId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-4xl w-full max-h-[88vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="font-semibold text-base">Resolve learner access</h3>
            <p className="text-xs text-gray-500 mt-0.5">{overview?.quiz?.title}</p>
          </div>
          <button type="button" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-auto p-4">
          {loading ? (
            <p className="text-sm text-gray-500">Loading enrolled learners…</p>
          ) : !overview?.learners?.length ? (
            <p className="text-sm text-gray-500">No learners enrolled in this course yet.</p>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                Add extra attempts, unblock a learner, or set a block with a short message they will see. Extend quiz dates from the quiz editor.
              </p>
              {overview.learners.map((row) => (
                <LearnerAccessEditor key={row.learner._id} row={row} quizId={quizId} api={api} toast={toast} onSaved={load} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreateQuiz() {
  usePageTitle('Create Quiz');
  const { courseId } = useParams();
  const api = useApi();
  const toast = useToast();
  const successClearRef = useRef(null);
  const [quizzes, setQuizzes] = useState([]);
  const [courseName, setCourseName] = useState('');
  const [mode, setMode] = useState('manual');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
    timeLimit: 15,
    maxAttempts: 1,
    availableFrom: '',
    availableUntil: '',
    questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' }],
  });
  const [aiForm, setAiForm] = useState({
    topic: '',
    difficulty: 'medium',
    numQuestions: 5,
    timeLimit: 15,
    maxAttempts: 1,
    availableFrom: '',
    availableUntil: '',
  });
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [accessQuizId, setAccessQuizId] = useState(null);

  useEffect(() => {
    api.get('/courses/' + courseId).then((res) => setCourseName(res.data?.title || ''));
    loadQuizzes();
  }, [courseId]);

  useEffect(() => () => {
    if (successClearRef.current) clearTimeout(successClearRef.current);
  }, []);

  const loadQuizzes = () => {
    api.get('/quizzes/course/' + courseId).then((res) => setQuizzes(unwrapApiData(res) || []));
  };

  const addQuestion = () => {
    setForm((f) => ({
      ...f,
      questions: [...f.questions, { question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' }],
    }));
  };

  const removeQuestion = (i) => {
    setForm((f) => ({ ...f, questions: f.questions.filter((_, idx) => idx !== i) }));
  };

  const updateQuestion = (i, field, value) => {
    setForm((f) => {
      const q = [...f.questions];
      q[i] = { ...q[i], [field]: value };
      return { ...f, questions: q };
    });
  };

  const updateOption = (qi, oi, value) => {
    setForm((f) => {
      const q = [...f.questions];
      const opts = [...q[qi].options];
      opts[oi] = value;
      q[qi] = { ...q[qi], options: opts };
      return { ...f, questions: q };
    });
  };

  const showQuizCreated = (message) => {
    setSuccessMessage(message);
    toast.success(message);
    if (successClearRef.current) clearTimeout(successClearRef.current);
    successClearRef.current = setTimeout(() => setSuccessMessage(''), 8000);
  };

  const cancelQuizEdit = () => {
    setEditingQuizId(null);
    setForm({
      title: '',
      description: '',
      difficulty: 'medium',
      timeLimit: 15,
      maxAttempts: 1,
      availableFrom: '',
      availableUntil: '',
      questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' }],
    });
  };

  const startEditQuiz = async (qid) => {
    try {
      const res = await api.get('/quizzes/' + qid);
      const q = unwrapApiData(res);
      if (!q) return;
      setEditingQuizId(qid);
      setMode('manual');
      const mappedQs = (q.questions || []).map((qq) => ({
        question: qq.question || '',
        options: Array.isArray(qq.options) && qq.options.length === 4 ? [...qq.options] : ['', '', '', ''],
        correctAnswer: typeof qq.correctAnswer === 'number' ? qq.correctAnswer : 0,
        explanation: qq.explanation || '',
      }));
      setForm({
        title: q.title || '',
        description: q.description || '',
        difficulty: q.difficulty || 'medium',
        timeLimit: q.timeLimit ?? 15,
        maxAttempts: q.maxAttempts ?? 1,
        availableFrom: toDatetimeLocalValue(q.availableFrom),
        availableUntil: toDatetimeLocalValue(q.availableUntil),
        questions: mappedQs.length ? mappedQs : [{ question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' }],
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not load quiz');
    }
  };

  const submitManual = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const apiForm = {
        ...form,
        course: courseId,
        maxAttempts: Math.max(1, parseInt(form.maxAttempts, 10) || 1),
        availableFrom: form.availableFrom ? new Date(form.availableFrom).toISOString() : null,
        availableUntil: form.availableUntil ? new Date(form.availableUntil).toISOString() : null,
      };
      if (editingQuizId) {
        await api.put('/quizzes/' + editingQuizId, apiForm);
        showQuizCreated('Quiz updated successfully. Learners will see the latest version on the course page.');
        cancelQuizEdit();
      } else {
        await api.post('/quizzes', apiForm);
        showQuizCreated('Quiz created successfully. Learners can take it from the course page.');
        setForm({
          title: '',
          description: '',
          difficulty: 'medium',
          timeLimit: 15,
          maxAttempts: 1,
          availableFrom: '',
          availableUntil: '',
          questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' }],
        });
      }
      loadQuizzes();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not create quiz';
      toast.error(msg);
    }
    setSaving(false);
  };

  const generateAI = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/ai/generate-quiz', {
        courseId,
        topic: aiForm.topic,
        difficulty: aiForm.difficulty,
        numQuestions: aiForm.numQuestions,
        timeLimit: aiForm.timeLimit,
        maxAttempts: aiForm.maxAttempts,
        availableFrom: aiForm.availableFrom || undefined,
        availableUntil: aiForm.availableUntil || undefined,
      });
      showQuizCreated('Quiz created successfully. This quiz was generated with AI and added to your course.');
      loadQuizzes();
      setAiForm({
        topic: '',
        difficulty: 'medium',
        numQuestions: 5,
        timeLimit: 15,
        maxAttempts: 1,
        availableFrom: '',
        availableUntil: '',
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not generate quiz';
      toast.error(msg);
    }
    setSaving(false);
  };

  const deleteQuiz = async (qid) => {
    if (!confirm('Delete this quiz?')) return;
    try {
      await api.del('/quizzes/' + qid);
      loadQuizzes();
      toast.success('Quiz removed.');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not delete quiz');
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/educator/courses/new" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">
        <ArrowLeft size={16} /> Back to Courses
      </Link>

      <h1 className="text-2xl font-bold">Quizzes — {courseName}</h1>

      {successMessage && (
        <div
          className="flex items-start gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/95 dark:bg-emerald-950/40 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-100 shadow-sm"
          role="status"
        >
          <CheckCircle2 className="shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" size={18} aria-hidden />
          <p className="flex-1 leading-relaxed">{successMessage}</p>
          <button
            type="button"
            onClick={() => {
              setSuccessMessage('');
              if (successClearRef.current) clearTimeout(successClearRef.current);
            }}
            className="shrink-0 p-1 rounded-lg text-emerald-700/70 hover:text-emerald-900 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50 transition-colors"
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="flex gap-2 mb-2">
        <button
          type="button"
          disabled={!!editingQuizId}
          onClick={() => setMode('manual')}
          className={mode === 'manual' ? 'btn-primary text-sm' : 'btn-secondary text-sm disabled:opacity-50'}
        >
          Manual Create
        </button>
        <button
          type="button"
          disabled={!!editingQuizId}
          onClick={() => setMode('ai')}
          className={mode === 'ai' ? 'btn-primary text-sm' : 'btn-secondary text-sm disabled:opacity-50'}
        >
          <Brain size={16} className="inline mr-1" /> AI Generate
        </button>
      </div>

      {editingQuizId && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50/90 dark:bg-amber-950/30 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
          <span>You are editing an existing quiz. AI generate is disabled until you save or cancel.</span>
          <button type="button" onClick={cancelQuizEdit} className="text-sm font-medium text-amber-800 dark:text-amber-200 underline">
            Cancel edit
          </button>
        </div>
      )}

      {mode === 'ai' ? (
        <Card>
          <h2 className="text-lg font-semibold mb-4">Generate Quiz with AI</h2>
          <form onSubmit={generateAI} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Topic</label>
              <input className="input-field" placeholder="e.g., Binary Search Trees" value={aiForm.topic} onChange={(e) => setAiForm({ ...aiForm, topic: e.target.value })} required />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Difficulty</label>
                <select className="input-field" value={aiForm.difficulty} onChange={(e) => setAiForm({ ...aiForm, difficulty: e.target.value })}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Number of Questions</label>
                <input type="number" className="input-field" min={3} max={15} value={aiForm.numQuestions} onChange={(e) => setAiForm({ ...aiForm, numQuestions: parseInt(e.target.value) || 5 })} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Time per attempt (minutes)</label>
                <input type="number" className="input-field" min={1} max={180} value={aiForm.timeLimit} onChange={(e) => setAiForm({ ...aiForm, timeLimit: parseInt(e.target.value, 10) || 15 })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Max attempts per learner</label>
                <input type="number" className="input-field" min={1} max={20} value={aiForm.maxAttempts} onChange={(e) => setAiForm({ ...aiForm, maxAttempts: parseInt(e.target.value, 10) || 1 })} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Available from (optional)</label>
                <input type="datetime-local" className="input-field" value={aiForm.availableFrom} onChange={(e) => setAiForm({ ...aiForm, availableFrom: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Available until (optional)</label>
                <input type="datetime-local" className="input-field" value={aiForm.availableUntil} onChange={(e) => setAiForm({ ...aiForm, availableUntil: e.target.value })} />
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Generating...' : 'Generate with AI'}
            </button>
          </form>
        </Card>
      ) : (
        <Card>
          <h2 className="text-lg font-semibold mb-4">{editingQuizId ? 'Edit quiz' : 'Create Quiz Manually'}</h2>
          <form onSubmit={submitManual} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Quiz Title</label>
                <input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Difficulty</label>
                <select className="input-field" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Description (optional)</label>
                <input className="input-field" placeholder="Short summary for learners" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Time limit (minutes)</label>
                <input type="number" min={1} max={180} className="input-field" value={form.timeLimit} onChange={(e) => setForm({ ...form, timeLimit: parseInt(e.target.value, 10) || 15 })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Max attempts per learner</label>
                <input type="number" min={1} max={20} className="input-field" value={form.maxAttempts} onChange={(e) => setForm({ ...form, maxAttempts: parseInt(e.target.value, 10) || 1 })} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Available from (optional)</label>
                <input type="datetime-local" className="input-field" value={form.availableFrom} onChange={(e) => setForm({ ...form, availableFrom: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Available until (optional)</label>
                <input type="datetime-local" className="input-field" value={form.availableUntil} onChange={(e) => setForm({ ...form, availableUntil: e.target.value })} />
              </div>
            </div>

            {form.questions.map((q, qi) => (
              <div key={qi} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary-600">Question {qi + 1}</span>
                  {form.questions.length > 1 && (
                    <button type="button" onClick={() => removeQuestion(qi)} className="text-red-500 p-1">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <input className="input-field" placeholder="Question text" value={q.question} onChange={(e) => updateQuestion(qi, 'question', e.target.value)} required />
                <div className="grid sm:grid-cols-2 gap-2">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input type="radio" name={'correct-' + qi} checked={q.correctAnswer === oi} onChange={() => updateQuestion(qi, 'correctAnswer', oi)} />
                      <input className="input-field flex-1" placeholder={'Option ' + (oi + 1)} value={opt} onChange={(e) => updateOption(qi, oi, e.target.value)} required />
                    </div>
                  ))}
                </div>
                <input className="input-field" placeholder="Explanation (optional)" value={q.explanation} onChange={(e) => updateQuestion(qi, 'explanation', e.target.value)} />
              </div>
            ))}

            <button type="button" onClick={addQuestion} className="btn-secondary text-sm flex items-center gap-1">
              <Plus size={16} /> Add Question
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : editingQuizId ? 'Save changes' : 'Create Quiz'}
            </button>
          </form>
        </Card>
      )}

      <Card>
        <h2 className="text-lg font-semibold mb-4">Existing Quizzes ({quizzes.length})</h2>
        {quizzes.length === 0 ? (
          <p className="text-gray-400 text-center py-6 text-sm">No quizzes yet</p>
        ) : (
          <div className="space-y-2">
            {quizzes.map((q) => (
              <div key={q._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div>
                  <p className="font-medium text-sm">{q.title}</p>
                  <p className="text-xs text-gray-400">{q.questions?.length || '?'} questions</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={q.difficulty === 'easy' ? 'success' : q.difficulty === 'hard' ? 'danger' : 'warning'}>
                    {q.difficulty}
                  </Badge>
                  <button type="button" onClick={() => setAccessQuizId(q._id)} className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg" title="Learner access & issues">
                    <Users size={16} />
                  </button>
                  <button type="button" onClick={() => startEditQuiz(q._id)} className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg" title="Edit quiz">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => deleteQuiz(q._id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Delete quiz">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {accessQuizId && <LearnerAccessModal quizId={accessQuizId} onClose={() => setAccessQuizId(null)} api={api} toast={toast} />}
    </div>
  );
}