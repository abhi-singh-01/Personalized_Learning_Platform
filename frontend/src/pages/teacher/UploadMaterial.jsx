import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import Card from '../../components/ui/Card';
import Loading from '../../components/ui/Loading';
import { ArrowLeft, Play, FileText, Presentation, Trash2, Edit3 } from 'lucide-react';
import API from '../../api/axios';
import JoditEditor from 'jodit-react';
import { useRef } from 'react';

export default function UploadMaterial() {
  const { courseId } = useParams();
  const api = useApi();
  const [materials, setMaterials] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', type: 'youtube', url: '', content: '' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const editor = useRef(null);

  useEffect(() => {
    if (courseId) {
      api.get('/courses/' + courseId)
        .then((res) => setCourseName(res.data?.title || ''))
        .catch(() => setCourseName('Unknown Course'));
      loadMaterials();
    }
  }, [courseId]);

  const loadMaterials = () => {
    api.get('/materials/course/' + courseId).then((res) => setMaterials(res.data || []));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (form.type === 'youtube' || form.type === 'article') {
        if (editingId) {
          await api.put(`/materials/${editingId}`, { ...form, course: courseId });
        } else {
          await api.post('/materials', { ...form, course: courseId });
        }
      } else {
        const fd = new FormData();
        fd.append('title', form.title);
        fd.append('description', form.description);
        fd.append('type', form.type);
        fd.append('course', courseId);
        if (file) fd.append('file', file);

        if (editingId) {
          await API.put(`/materials/${editingId}`, fd, {
            headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` },
          });
        } else {
          await API.post('/materials', fd, {
            headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` },
          });
        }
      }
      setForm({ title: '', description: '', type: 'youtube', url: '', content: '' });
      setFile(null);
      setEditingId(null);
      loadMaterials();
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || e.message);
    }
    setSaving(false);
  };

  const startEdit = (m) => {
    setEditingId(m._id);
    setForm({
      title: m.title || '',
      description: m.description || '',
      type: m.type || 'youtube',
      url: m.url || `https://youtube.com/watch?v=${m.videoId}` || '',
      content: m.content || ''
    });
    setFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ title: '', description: '', type: 'youtube', url: '', content: '' });
    setFile(null);
  };

  const remove = async (id) => {
    if (!confirm('Delete this material?')) return;
    try {
      await api.del('/materials/' + id);
      loadMaterials();
    } catch (e) { }
  };

  const icons = { youtube: Play, pdf: FileText, ppt: Presentation };

  return (
    <div className="space-y-6">
      <Link to="/teacher/courses/new" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">
        <ArrowLeft size={16} /> Back to Courses
      </Link>

      <h1 className="text-2xl font-bold">Upload Materials — {courseName}</h1>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{editingId ? 'Edit Material' : 'Add New Material'}</h2>
          {editingId && (
            <button onClick={cancelEdit} className="text-sm text-red-500 hover:text-red-600">Cancel Edit</button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Title</label>
              <input className="input-field" placeholder="Material title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Type</label>
              <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="youtube">YouTube Video</option>
                <option value="pdf">PDF Document</option>
                <option value="ppt">PowerPoint</option>
                <option value="article">Rich Text Article</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description (Summary)</label>
            <input className="input-field" placeholder="Optional brief summary" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          {form.type === 'youtube' && (
            <div>
              <label className="block text-sm font-medium mb-1.5">YouTube URL</label>
              <input className="input-field" placeholder="https://youtube.com/watch?v=..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required />
            </div>
          )}

          {(form.type === 'pdf' || form.type === 'ppt') && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Upload File</label>
              <input type="file" accept={form.type === 'pdf' ? '.pdf' : '.ppt,.pptx'} className="input-field" onChange={(e) => setFile(e.target.files[0])} required={!editingId} />
            </div>
          )}

          {form.type === 'article' && (
            <div className="pb-10">
              <label className="block text-sm font-medium mb-1.5">Article Content</label>
              <div className="bg-white dark:bg-gray-800 rounded-lg text-black">
                <JoditEditor
                  ref={editor}
                  value={form.content}
                  config={{ placeholder: 'Start writing your rich course content here...' }}
                  onBlur={newContent => setForm({ ...form, content: newContent })}
                  onChange={() => { }} // Handle onBlur for better performance
                />
              </div>
            </div>
          )}

          <button type="submit" disabled={saving || (form.type === 'article' && !form.content)} className="btn-primary">
            {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Upload Material'}
          </button>
        </form>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Current Materials ({materials.length})</h2>
        {materials.length === 0 ? (
          <p className="text-gray-400 text-center py-6 text-sm">No materials uploaded yet</p>
        ) : (
          <div className="space-y-2">
            {materials.map((m) => {
              const Icon = icons[m.type] || FileText;
              return (
                <div key={m._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600">
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{m.title}</p>
                      <p className="text-xs text-gray-400 capitalize">{m.type}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(m)} className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => remove(m._id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}