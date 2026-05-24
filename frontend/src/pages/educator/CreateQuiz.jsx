import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { ArrowLeft, Plus, Trash2, Brain, X, CheckCircle2, Pencil, UserCog } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';
import { useToast } from '../../context/ToastContext';
import { unwrapApiData } from '../../utils/apiData';

const emptyQuestion = () => ({
  question: '',
  options: ['', '', '', ''],
  correctAnswer: 0,
  explanation: '',
});

const defaultForm = () => ({
  title: '',
  description: '',
  difficulty: 'medium',
  timeLimit: 15,
  questions: [emptyQuestion()],
});

function LearnerHelpModal({ quizId, onClose, api, toast }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  const load = () => {
    setLoading(true);
    api
      .get(`/quizzes/${quizId}/learner-access`)
      .then((res) => setRows(unwrapApiData(res)?.learners || []))
      .catch((e) => toast.error(e?.response?.data?.message || 'Could not load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [quizId]);

  const saveRow = async (row, { blocked, extraAttempts }) => {
    try {
      await api.put(`/quizzes/${quizId}/learner-access/${row.learner._id}`, {
        blocked,
        extraAttempts: Math.max(0, extraAttempts),
        blockReason: blocked ? 'Please contact your educator.' : '',
        educatorNote: '',
      });
      toast.success(`Updated ${row.learner.name}`);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Save failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold">Help a learner</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 overflow-auto max-h-[60vh] space-y-3">
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-gray-500">No learners enrolled yet.</p>
          ) : (
            rows.map((row) => (
              <LearnerHelpRow key={row.learner._id} row={row} onSave={saveRow} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function LearnerHelpRow({ row, onSave }) {
  const [blocked, setBlocked] = useState(Boolean(row.override?.blocked));
  const [extra, setExtra] = useState(String(row.override?.extraAttempts ?? 0));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(row, { blocked, extraAttempts: parseInt(extra, 10) || 0 });
    setSaving(false);
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
      <p className="font-medium text-sm">{row.learner.name}</p>
      <p className="text-xs text-gray-500">
        Attempts: {row.attemptsUsed} / {row.totalAttemptsAllowed}
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={blocked} onChange={(e) => setBlocked(e.target.checked)} />
        Block from this quiz
      </label>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Give extra attempts</label>
        <input
          type="number"
          min={0}
          max={10}
          className="input-field !py-1.5 text-sm w-24"
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
        />
      </div>
      <button type="button" className="btn-primary text-sm py-1.5" disabled={saving} onClick={handleSave}>
        {saving ? 'Saving…' : 'Save'}
      </button>
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
  const [form, setForm] = useState(defaultForm());
  const [aiForm, setAiForm] = useState({ topic: '', difficulty: 'medium', numQuestions: 5 });
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [helpQuizId, setHelpQuizId] = useState(null);

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
    setForm((f) => ({ ...f, questions: [...f.questions, emptyQuestion()] }));
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
    setForm(defaultForm());
  };

  const startEditQuiz = async (qid) => {
    try {
      const q = unwrapApiData(await api.get('/quizzes/' + qid));
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
        questions: mappedQs.length ? mappedQs : [emptyQuestion()],
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
      const payload = { ...form, course: courseId, timeLimit: parseInt(form.timeLimit, 10) || 15 };
      if (editingQuizId) {
        await api.put('/quizzes/' + editingQuizId, payload);
        showQuizCreated('Quiz updated.');
        cancelQuizEdit();
      } else {
        await api.post('/quizzes', payload);
        showQuizCreated('Quiz created.');
        setForm(defaultForm());
      }
      loadQuizzes();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not save quiz');
    }
    setSaving(false);
  };

  const generateAI = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/ai/generate-quiz', { courseId, ...aiForm });
      showQuizCreated('AI quiz added to your course.');
      loadQuizzes();
      setAiForm({ topic: '', difficulty: 'medium', numQuestions: 5 });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not generate quiz');
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
          className="flex items-start gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/95 dark:bg-emerald-950/40 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-100"
          role="status"
        >
          <CheckCircle2 className="shrink-0 mt-0.5" size={18} aria-hidden />
          <p className="flex-1">{successMessage}</p>
          <button type="button" onClick={() => setSuccessMessage('')} className="p-1" aria-label="Dismiss">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="flex gap-2">
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
        <div className="rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50/90 dark:bg-amber-950/30 px-3 py-2 text-sm flex flex-wrap justify-between gap-2">
          <span>Editing a quiz — save or cancel when done.</span>
          <button type="button" onClick={cancelQuizEdit} className="font-medium underline">
            Cancel edit
          </button>
        </div>
      )}

      {mode === 'ai' ? (
        <Card>
          <h2 className="text-lg font-semibold mb-4">Generate Quiz with AI</h2>
          <form onSubmit={generateAI} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium mb-1.5">Topic</label>
              <input
                className="input-field"
                placeholder="e.g. Binary Search Trees"
                value={aiForm.topic}
                onChange={(e) => setAiForm({ ...aiForm, topic: e.target.value })}
                required
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Difficulty</label>
                <select
                  className="input-field"
                  value={aiForm.difficulty}
                  onChange={(e) => setAiForm({ ...aiForm, difficulty: e.target.value })}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Number of questions</label>
                <input
                  type="number"
                  className="input-field"
                  min={3}
                  max={15}
                  value={aiForm.numQuestions}
                  onChange={(e) => setAiForm({ ...aiForm, numQuestions: parseInt(e.target.value, 10) || 5 })}
                />
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Generating…' : 'Generate with AI'}
            </button>
          </form>
        </Card>
      ) : (
        <Card>
          <h2 className="text-lg font-semibold mb-4">{editingQuizId ? 'Edit quiz' : 'Create quiz manually'}</h2>
          <form onSubmit={submitManual} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium mb-1.5">Quiz title</label>
                <input
                  className="input-field"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Difficulty</label>
                <select
                  className="input-field"
                  value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium mb-1.5">Description (optional)</label>
                <input
                  className="input-field"
                  placeholder="Short summary"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Time limit (minutes)</label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  className="input-field"
                  value={form.timeLimit}
                  onChange={(e) => setForm({ ...form, timeLimit: parseInt(e.target.value, 10) || 15 })}
                />
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
                <input
                  className="input-field"
                  placeholder="Question text"
                  value={q.question}
                  onChange={(e) => updateQuestion(qi, 'question', e.target.value)}
                  required
                />
                <div className="grid sm:grid-cols-2 gap-2">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={'correct-' + qi}
                        checked={q.correctAnswer === oi}
                        onChange={() => updateQuestion(qi, 'correctAnswer', oi)}
                      />
                      <input
                        className="input-field flex-1"
                        placeholder={'Option ' + (oi + 1)}
                        value={opt}
                        onChange={(e) => updateOption(qi, oi, e.target.value)}
                        required
                      />
                    </div>
                  ))}
                </div>
                <input
                  className="input-field"
                  placeholder="Explanation (optional)"
                  value={q.explanation}
                  onChange={(e) => updateQuestion(qi, 'explanation', e.target.value)}
                />
              </div>
            ))}

            <button type="button" onClick={addQuestion} className="btn-secondary text-sm flex items-center gap-1">
              <Plus size={16} /> Add question
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : editingQuizId ? 'Save changes' : 'Create quiz'}
            </button>
          </form>
        </Card>
      )}

      <Card>
        <h2 className="text-lg font-semibold mb-4">Existing quizzes ({quizzes.length})</h2>
        {quizzes.length === 0 ? (
          <p className="text-gray-400 text-center py-6 text-sm">No quizzes yet</p>
        ) : (
          <div className="space-y-2">
            {quizzes.map((q) => (
              <div key={q._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div>
                  <p className="font-medium text-sm">{q.title}</p>
                  <p className="text-xs text-gray-400">
                    {q.questions?.length || 0} questions · {q.timeLimit ?? 15} min
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant={q.difficulty === 'easy' ? 'success' : q.difficulty === 'hard' ? 'danger' : 'warning'}>
                    {q.difficulty}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => setHelpQuizId(q._id)}
                    className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                    title="Help a learner (block or extra attempts)"
                  >
                    <UserCog size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => startEditQuiz(q._id)}
                    className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg"
                    title="Edit"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteQuiz(q._id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {helpQuizId && (
        <LearnerHelpModal quizId={helpQuizId} onClose={() => setHelpQuizId(null)} api={api} toast={toast} />
      )}
    </div>
  );
}
