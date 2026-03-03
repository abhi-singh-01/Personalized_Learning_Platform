import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { ArrowLeft, Plus, Trash2, Brain } from 'lucide-react';

export default function CreateQuiz() {
  const { courseId } = useParams();
  const api = useApi();
  const [quizzes, setQuizzes] = useState([]);
  const [courseName, setCourseName] = useState('');
  const [mode, setMode] = useState('manual');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
    timeLimit: 15,
    questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' }],
  });
  const [aiForm, setAiForm] = useState({ topic: '', difficulty: 'medium', numQuestions: 5 });

  useEffect(() => {
    api.get('/courses/' + courseId).then((res) => setCourseName(res.data?.title || ''));
    loadQuizzes();
  }, [courseId]);

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

  const submitManual = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/quizzes', { ...form, course: courseId });
      setForm({
        title: '',
        description: '',
        difficulty: 'medium',
        timeLimit: 15,
        questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' }],
      });
      loadQuizzes();
    } catch (e) {}
    setSaving(false);
  };

  const generateAI = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/ai/generate-quiz', { courseId, ...aiForm });
      loadQuizzes();
      setAiForm({ topic: '', difficulty: 'medium', numQuestions: 5 });
    } catch (e) {}
    setSaving(false);
  };

  const deleteQuiz = async (qid) => {
    if (!confirm('Delete this quiz?')) return;
    try {
      await api.del('/quizzes/' + qid);
      loadQuizzes();
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      <Link to="/teacher/courses/new" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">
        <ArrowLeft size={16} /> Back to Courses
      </Link>

      <h1 className="text-2xl font-bold">Quizzes — {courseName}</h1>

      <div className="flex gap-2 mb-2">
        <button onClick={() => setMode('manual')} className={mode === 'manual' ? 'btn-primary text-sm' : 'btn-secondary text-sm'}>
          Manual Create
        </button>
        <button onClick={() => setMode('ai')} className={mode === 'ai' ? 'btn-primary text-sm' : 'btn-secondary text-sm'}>
          <Brain size={16} className="inline mr-1" /> AI Generate
        </button>
      </div>

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
          <h2 className="text-lg font-semibold mb-4">Create Quiz Manually</h2>
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
              {saving ? 'Saving...' : 'Create Quiz'}
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
                  <button onClick={() => deleteQuiz(q._id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
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