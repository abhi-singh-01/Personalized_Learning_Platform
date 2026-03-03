import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import Card from '../../components/ui/Card';
import Loading from '../../components/ui/Loading';
import { ArrowLeft, Upload, FileQuestion, Trash2 } from 'lucide-react';

export default function ManageCourse() {
  const { id } = useParams();
  const nav = useNavigate();
  const api = useApi();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'beginner',
    tags: '',
  });
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState([]);
  const isEdit = !!id;

  useEffect(() => {
    if (id) {
      api.get('/courses/' + id).then((res) => {
        const c = res.data;
        setForm({
          title: c.title,
          description: c.description,
          category: c.category,
          difficulty: c.difficulty,
          tags: (c.tags || []).join(', '),
        });
      });
    }
    api.get('/courses/teaching').then((res) => setCourses(res.data || []));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...form,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      };
      if (isEdit) {
        await api.put('/courses/' + id, body);
      } else {
        await api.post('/courses', body);
      }
      nav('/teacher/dashboard');
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const deleteCourse = async (courseId) => {
    if (!confirm('Delete this course? This cannot be undone.')) return;
    try {
      await api.del('/courses/' + courseId);
      setCourses((prev) => prev.filter((c) => c._id !== courseId));
    } catch (e) {}
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="space-y-6">
      <Link to="/teacher/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <Card>
        <h2 className="text-xl font-bold mb-6">{isEdit ? 'Edit Course' : 'Create New Course'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Course Title</label>
            <input className="input-field" placeholder="e.g., Introduction to Data Structures" value={form.title} onChange={set('title')} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea className="input-field h-24 resize-none" placeholder="Describe what students will learn..." value={form.description} onChange={set('description')} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Category</label>
              <input className="input-field" placeholder="e.g., Computer Science" value={form.category} onChange={set('category')} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Difficulty</label>
              <select className="input-field" value={form.difficulty} onChange={set('difficulty')}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Tags (comma separated)</label>
            <input className="input-field" placeholder="e.g., python, algorithms, DSA" value={form.tags} onChange={set('tags')} />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : isEdit ? 'Update Course' : 'Create Course'}
          </button>
        </form>
      </Card>

      {courses.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">Your Courses</h2>
          <div className="space-y-3">
            {courses.map((c) => (
              <div key={c._id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="font-medium">{c.title}</h3>
                  <p className="text-xs text-gray-500">{c.students?.length || 0} students | {c.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={'/teacher/courses/' + c._id + '/materials'} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500" title="Upload Materials">
                    <Upload size={16} />
                  </Link>
                  <Link to={'/teacher/courses/' + c._id + '/quizzes'} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500" title="Manage Quizzes">
                    <FileQuestion size={16} />
                  </Link>
                  <Link to={'/teacher/courses/' + c._id + '/edit'} className="text-xs text-primary-600 hover:underline">
                    Edit
                  </Link>
                  <button onClick={() => deleteCourse(c._id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
