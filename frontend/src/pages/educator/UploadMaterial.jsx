import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import Card from '../../components/ui/Card';
import { ArrowLeft, Play, FileText, Presentation, Trash2, Edit3, Video, Upload, X } from 'lucide-react';
import API from '../../api/axios';
import usePageTitle from '../../hooks/usePageTitle';

const JoditEditor = lazy(() => import('jodit-react'));

function resolveMaterialUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('blob:') || url.startsWith('data:')) return url;
  if (!url.startsWith('/')) return url;
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  if (apiBase.startsWith('http')) {
    try {
      return `${new URL(apiBase).origin}${url}`;
    } catch {
      return url;
    }
  }
  return url;
}

export default function UploadMaterial() {
  usePageTitle('Upload Material');
  const { courseId } = useParams();
  const api = useApi();
  const [materials, setMaterials] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', type: 'youtube', url: '', content: '' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingFileUrl, setEditingFileUrl] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
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
    setUploadProgress(0);
    setIsUploading(false);
    try {
      if (form.type === 'youtube' || form.type === 'article') {
        if (editingId) {
          await api.put(`/materials/${editingId}`, { ...form, course: courseId });
        } else {
          await api.post('/materials', { ...form, course: courseId });
        }
      } else {
        setIsUploading(true);
        const fd = new FormData();
        fd.append('title', form.title);
        fd.append('description', form.description);
        fd.append('type', form.type);
        fd.append('course', courseId);
        if (file) fd.append('file', file);

        const config = {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` },
          onUploadProgress: (progressEvent) => {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(pct);
          },
        };

        if (editingId) {
          await API.put(`/materials/${editingId}`, fd, config);
        } else {
          await API.post('/materials', fd, config);
        }
      }
      setForm({ title: '', description: '', type: 'youtube', url: '', content: '' });
      setFile(null);
      setEditingId(null);
      setEditingFileUrl(null);
      setUploadProgress(0);
      setIsUploading(false);
      loadMaterials();
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || e.message);
    }
    setSaving(false);
  };

  const startEdit = (m) => {
    setEditingId(m._id);
    const ytUrl =
      m.type === 'youtube'
        ? (m.url || (m.videoId ? `https://www.youtube.com/watch?v=${m.videoId}` : ''))
        : '';
    setForm({
      title: m.title || '',
      description: m.description || '',
      type: m.type || 'youtube',
      url: ytUrl,
      content: m.content || ''
    });
    setEditingFileUrl(m.fileUrl && ['video', 'pdf', 'ppt'].includes(m.type) ? m.fileUrl : null);
    setFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingFileUrl(null);
    setForm({ title: '', description: '', type: 'youtube', url: '', content: '' });
    setFile(null);
  };

  const remove = async (id) => {
    const m = materials.find((x) => x._id === id);
    if (!confirm(`Delete “${m?.title || 'this material'}”? Learners lose access. This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await api.del('/materials/' + id);
      if (editingId === id) cancelEdit();
      loadMaterials();
    } catch (e) {
      alert(e.response?.data?.message || e.message || 'Could not delete material');
    } finally {
      setDeletingId(null);
    }
  };

  const icons = { youtube: Play, pdf: FileText, ppt: Presentation, video: Video };

  const fileSizeDisplay = file ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' : null;

  return (
    <div className="space-y-6">
      <Link to="/educator/courses/new" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">
        <ArrowLeft size={16} /> Back to Courses
      </Link>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Upload Materials — {courseName}</h1>
        <Link
          to={`/educator/courses/${courseId}/live`}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-red-500/20 hover:shadow-lg transition-all duration-200"
        >
          <Video size={16} />
          Record Live Lecture
        </Link>
      </div>

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
                <option value="video">Video Lecture (Upload)</option>
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

          {(form.type === 'pdf' || form.type === 'ppt' || form.type === 'video') && (
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {form.type === 'video' ? 'Video file' : 'Upload file'}
                {editingId ? <span className="font-normal text-gray-400"> (optional when editing)</span> : null}
              </label>
              {editingId && editingFileUrl && (
                <div className="mb-3 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/90 dark:bg-emerald-950/30 px-3 py-2.5 text-sm text-emerald-950 dark:text-emerald-100/95">
                  <p className="font-medium text-xs uppercase tracking-wide text-emerald-800 dark:text-emerald-300/90 mb-1">
                    {form.type === 'video' ? 'Current video' : 'Current file'}
                  </p>
                  <a
                    href={resolveMaterialUrl(editingFileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Open / preview in new tab
                  </a>
                  <p className="text-xs text-emerald-800/75 dark:text-emerald-200/60 mt-2">
                    Leave the picker empty to keep this file. Choose a new file only to replace it (old file is removed from storage when save succeeds).
                  </p>
                </div>
              )}
              <div className="relative">
                <input
                  type="file"
                  accept={
                    form.type === 'pdf' ? '.pdf'
                      : form.type === 'ppt' ? '.ppt,.pptx'
                      : '.mp4,.mpeg,.mov,.avi,.webm,.wmv,.mkv'
                  }
                  className="input-field"
                  onChange={(e) => setFile(e.target.files[0])}
                  required={!editingId}
                />
              </div>
              {file && (
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <Upload size={12} />
                  <span>{file.name}</span>
                  <span className="text-gray-400">({fileSizeDisplay})</span>
                  <button type="button" onClick={() => setFile(null)} className="ml-1 text-red-400 hover:text-red-500">
                    <X size={12} />
                  </button>
                </div>
              )}
              {form.type === 'video' && (
                <p className="text-xs text-gray-400 mt-1">Supported: MP4, MPEG, MOV, AVI, WebM, MKV, WMV (max 200MB)</p>
              )}
            </div>
          )}

          {form.type === 'article' && (
            <div className="pb-10">
              <label className="block text-sm font-medium mb-1.5">Article Content</label>
              <div className="bg-white dark:bg-gray-800 rounded-lg text-black min-h-[320px]">
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-80 text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-gray-600 rounded-lg">
                      Loading editor…
                    </div>
                  }
                >
                  <JoditEditor
                    ref={editor}
                    value={form.content}
                    config={{ placeholder: 'Start writing your rich course content here...' }}
                    onBlur={(newContent) => setForm({ ...form, content: newContent })}
                    onChange={() => {}}
                  />
                </Suspense>
              </div>
            </div>
          )}

          {/* Upload Progress Bar */}
          {isUploading && saving && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Uploading...</span>
                <span className="font-semibold text-primary-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              {file && uploadProgress < 100 && (
                <p className="text-xs text-gray-400">
                  {((file.size * uploadProgress) / (100 * 1024 * 1024)).toFixed(1)} / {fileSizeDisplay} uploaded
                </p>
              )}
            </div>
          )}

          <button type="submit" disabled={saving || (form.type === 'article' && !form.content)} className="btn-primary">
            {saving
              ? (isUploading ? `Uploading... ${uploadProgress}%` : 'Saving...')
              : editingId
                ? (file && (form.type === 'video' || form.type === 'pdf' || form.type === 'ppt') ? 'Save & replace file' : 'Save changes')
                : 'Upload material'}
          </button>
        </form>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-1">Course materials ({materials.length})</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Edit titles, YouTube links, or articles anytime. For uploaded videos, PDFs, and slides you can replace the file or delete the item.
        </p>
        {materials.length === 0 ? (
          <p className="text-gray-400 text-center py-6 text-sm">No materials uploaded yet</p>
        ) : (
          <div className="space-y-2">
            {materials.map((m) => {
              const Icon = icons[m.type] || FileText;
              const busy = deletingId === m._id;
              return (
                <div key={m._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 shrink-0">
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{m.title}</p>
                      <p className="text-xs text-gray-400 capitalize">{m.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 pl-11 sm:pl-0">
                    <button
                      type="button"
                      onClick={() => startEdit(m)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/50"
                      title="Edit material or replace video file"
                    >
                      <Edit3 size={14} />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(m._id)}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50"
                      title="Delete this material permanently"
                    >
                      <Trash2 size={14} />
                      <span className="hidden sm:inline">{busy ? '…' : 'Delete'}</span>
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