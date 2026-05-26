import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import usePageTitle from '../../hooks/usePageTitle';
import Card from '../../components/ui/Card';
import Loading from '../../components/ui/Loading';
import { ArrowLeft, Upload, FileQuestion, Trash2, IndianRupee, Image, X } from 'lucide-react';

export default function ManageCourse() {
  const { id } = useParams();
  const nav = useNavigate();
  const api = useApi();
  const isEdit = !!id;
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'beginner',
    tags: '',
    price: 0,
  });
  usePageTitle(isEdit ? 'Edit Course' : 'New Course');
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState([]);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [existingThumbnail, setExistingThumbnail] = useState('');

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
          price: c.price || 0,
        });
        setExistingThumbnail(c.thumbnail || '');
        setThumbnailPreview(c.thumbnail || '');
      });
    }
    api.get('/courses/teaching').then((res) => setCourses(res.data || []));
  }, [id]);

  useEffect(() => {
    if (!thumbnailFile) return undefined;
    const objectUrl = URL.createObjectURL(thumbnailFile);
    setThumbnailPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [thumbnailFile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...form,
        price: Number(form.price) || 0,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      };
      const payload = thumbnailFile ? new FormData() : body;
      if (thumbnailFile) {
        Object.entries(body).forEach(([key, value]) => {
          payload.append(key, Array.isArray(value) ? value.join(',') : value);
        });
        payload.append('thumbnail', thumbnailFile);
      }
      if (isEdit) {
        await api.put('/courses/' + id, payload);
      } else {
        await api.post('/courses', payload);
      }
      nav('/educator/dashboard');
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

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
  };

  const clearSelectedThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(existingThumbnail);
  };

  return (
    <div className="space-y-6">
      <Link to="/educator/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">
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
            <label className="block text-sm font-medium mb-1.5">Course Thumbnail</label>
            <div className="grid gap-3 sm:grid-cols-[180px_1fr] sm:items-center">
              <div className="h-28 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-hidden flex items-center justify-center">
                {thumbnailPreview ? (
                  <img src={thumbnailPreview} alt="Course thumbnail preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="text-center text-gray-400">
                    <Image size={28} className="mx-auto mb-1" />
                    <span className="text-xs">No image selected</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  <Upload size={16} />
                  Upload thumbnail
                  <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/gif" onChange={handleThumbnailChange} className="hidden" />
                </label>
                {thumbnailFile && (
                  <button type="button" onClick={clearSelectedThumbnail} className="inline-flex items-center gap-1.5 ml-2 text-sm text-gray-500 hover:text-red-500">
                    <X size={14} /> Remove selection
                  </button>
                )}
                <p className="text-xs text-gray-500">PNG, JPG, WebP, or GIF. Max 5MB. Stored in S3 when AWS storage is configured.</p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea className="input-field h-24 resize-none" placeholder="Describe what learners will learn..." value={form.description} onChange={set('description')} required />
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
            <label className="block text-sm font-medium mb-1.5">Price (₹)</label>
            <div className="relative">
              <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                min="0"
                step="1"
                className="input-field pl-9"
                placeholder="0 = Free course"
                value={form.price}
                onChange={set('price')}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Set to 0 for a free course. Learners will pay via Razorpay for paid courses.</p>
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
                  <p className="text-xs text-gray-500">{c.learners?.length || 0} learners | {c.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={'/educator/courses/' + c._id + '/materials'} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500" title="Upload Materials">
                    <Upload size={16} />
                  </Link>
                  <Link to={'/educator/courses/' + c._id + '/quizzes'} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500" title="Manage Quizzes">
                    <FileQuestion size={16} />
                  </Link>
                  <Link to={'/educator/courses/' + c._id + '/edit'} className="text-xs text-primary-600 hover:underline">
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
