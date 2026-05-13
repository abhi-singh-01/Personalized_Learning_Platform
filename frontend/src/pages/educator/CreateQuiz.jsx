import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { ArrowLeft, Plus, Trash2, Brain, X, CheckCircle2, Pencil, ChevronUp, ChevronDown } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';
import { useToast } from '../../context/ToastContext';

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
    questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' }],
  });
  const [aiForm, setAiForm] = useState({ topic: '', difficulty: 'medium', numQuestions: 5 });
  const [editingQuizId, setEditingQuizId] = useState(null);

  useEffect(() => {
    api.get('/courses/' + courseId).then((res) => setCourseName(res.data?.title || ''));
    loadQuizzes();
  }, [courseId]);

  useEffect(() => () => {
    if (successClearRef.current) clearTimeout(successClearRef.current);
  }, []);

  const loadQuizzes = () => {
    api.get('/quizzes/course/' + courseId).then((res) => setQuizzes(res.data || []));
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
      questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' }],
    });
  };

  const startEditQuiz = async (qid) => {
    try {
      const res = await api.get('/quizzes/' + qid);
      const q = res.data;
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
      if (editingQuizId) {
        await api.put('/quizzes/' + editingQuizId, { ...form, course: courseId });
        showQuizCreated('Quiz updated successfully. Learners will see the latest version on the course page.');
        cancelQuizEdit();
      } else {
        await api.post('/quizzes', { ...form, course: courseId });
        showQuizCreated('Quiz created successfully. Learners can take it from the course page.');
        setForm({
          title: '',
          description: '',
          difficulty: 'medium',
          timeLimit: 15,
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
      await api.post('/ai/generate-quiz', { courseId, ...aiForm });
      showQuizCreated('Quiz created successfully. This quiz was generated with AI and added to your course.');
      loadQuizzes();
      setAiForm({ topic: '', difficulty: 'medium', numQuestions: 5 });
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
    </div>
  );
}