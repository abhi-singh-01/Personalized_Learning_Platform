import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import Card from '../../components/ui/Card';
import { ArrowLeft, Play, FileText, Presentation, Trash2, Edit3, Video, Upload, X, ExternalLink, BookOpen, ChevronUp, ChevronDown } from 'lucide-react';
import API from '../../api/axios';
import usePageTitle from '../../hooks/usePageTitle';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import { getProtectedMaterialStreamUrl, resolveMaterialUrl } from '../../utils/materialUrl';

const JoditEditor = lazy(() => import('jodit-react'));

function youtubeWatchUrl(m) {
  if (!m) return '';
  if (m.url && /^https?:\/\//i.test(m.url.trim())) return m.url.trim();
  if (m.videoId) return `https://www.youtube.com/watch?v=${m.videoId}`;
  return '';
}

export default function UploadMaterial() {
  usePageTitle('Upload Material');
  const { courseId } = useParams();
  const api = useApi();
  const editor = useRef(null);
  const [materials, setMaterials] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', type: 'youtube', url: '', content: '' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingFileUrl, setEditingFileUrl] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewArticle, setPreviewArticle] = useState(null);
  const [reorderBusy, setReorderBusy] = useState(false);
  const [message, setMessage] = useState('');

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

  const persistMaterialOrder = async (orderedList) => {
    if (orderedList.length < 2) return;
    setReorderBusy(true);
    try {
      const res = await api.put(`/materials/course/${courseId}/reorder`, {
        orderedIds: orderedList.map((m) => m._id),
      });
      setMaterials(res.data || orderedList);
    } catch (e) {
      console.error(e);
      setMessage(e.response?.data?.message || e.message || 'Could not reorder materials');
      loadMaterials();
    } finally {
      setReorderBusy(false);
    }
  };

  const moveMaterial = (index, direction) => {
    const j = index + direction;
    if (j < 0 || j >= materials.length) return;
    const next = [...materials];
    [next[index], next[j]] = [next[j], next[index]];
    setMaterials(next);
    persistMaterialOrder(next);
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
      setMessage(e.response?.data?.message || e.message || 'Could not save material');
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
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setMessage(`Click delete again to confirm removing "${m?.title || 'this material'}".`);
      return;
    }
    setDeletingId(id);
    try {
      await api.del('/materials/' + id);
      setConfirmDeleteId(null);
      if (editingId === id) cancelEdit();
      loadMaterials();
    } catch (e) {
      setMessage(e.response?.data?.message || e.message || 'Could not delete material');
    } finally {
      setDeletingId(null);
    }
  };

  const icons = { youtube: Play, pdf: FileText, ppt: Presentation, video: Video, article: BookOpen };

  const openUploadedFile = (m) => {
    if (!m?._id && !m?.fileUrl) return;
    try {
      const href = m?._id
        ? getProtectedMaterialStreamUrl(m._id)
        : resolveMaterialUrl(m.fileUrl);
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (e) {
      console.error(e);
      setMessage(e.message || e.response?.data?.message || 'Could not open this file');
    }
  };

  const openYoutube = (m) => {
    const href = youtubeWatchUrl(m);
    if (!href) return;
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  const fileSizeDisplay = file ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' : null;

  return (
    <div className="space-y-6">
      <Link to="/educator/courses/new" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">
        <ArrowLeft size={16} /> Back to Courses
      </Link>

      <h1 className="text-2xl font-bold">Upload Materials — {courseName}</h1>
      {message && (
        <div className="rounded-xl px-4 py-3 text-sm bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          {message}
        </div>
      )}

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
                  <button
                    type="button"
                    onClick={() => openUploadedFile({ _id: editingId, fileUrl: editingFileUrl })}
                    className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Open / preview in new tab
                  </button>
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
          Use <strong className="font-medium text-gray-600 dark:text-gray-300">View</strong> to open PDFs, uploaded videos, or YouTube in a new tab and confirm they look correct for learners. Articles open in a quick preview here.
        </p>
        {materials.length === 0 ? (
          <p className="text-gray-400 text-center py-6 text-sm">No materials uploaded yet</p>
        ) : (
          <div className="space-y-2">
            {materials.map((m, idx) => {
              const Icon = icons[m.type] || FileText;
              const busy = deletingId === m._id;
              return (
                <div key={m._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    {materials.length > 1 && (
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                          type="button"
                          disabled={reorderBusy || idx === 0}
                          onClick={() => moveMaterial(idx, -1)}
                          className="p-1 rounded text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30"
                          title="Move up"
                          aria-label="Move up"
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          type="button"
                          disabled={reorderBusy || idx === materials.length - 1}
                          onClick={() => moveMaterial(idx, 1)}
                          className="p-1 rounded text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30"
                          title="Move down"
                          aria-label="Move down"
                        >
                          <ChevronDown size={16} />
                        </button>
                      </div>
                    )}
                    <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 shrink-0">
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{m.title}</p>
                      <p className="text-xs text-gray-400 capitalize">{m.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0 pl-11 sm:pl-0">
                    {(m.type === 'pdf' || m.type === 'ppt' || m.type === 'video') && m.fileUrl && (
                      <button
                        type="button"
                        onClick={() => openUploadedFile(m)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-sky-800 dark:text-sky-200 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/40 border border-sky-200/80 dark:border-sky-800/60"
                        title="Open file in a new tab to verify"
                      >
                        <ExternalLink size={14} />
                        <span className="hidden sm:inline">View file</span>
                        <span className="sm:hidden">View</span>
                      </button>
                    )}
                    {m.type === 'youtube' && (
                      <button
                        type="button"
                        onClick={() => openYoutube(m)}
                        disabled={!youtubeWatchUrl(m)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-sky-800 dark:text-sky-200 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/40 border border-sky-200/80 dark:border-sky-800/60 disabled:opacity-40 disabled:pointer-events-none"
                        title="Open YouTube in a new tab"
                      >
                        <Play size={14} />
                        <span className="hidden sm:inline">View video</span>
                        <span className="sm:hidden">View</span>
                      </button>
                    )}
                    {m.type === 'article' && m.content && (
                      <button
                        type="button"
                        onClick={() => setPreviewArticle(m)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-violet-800 dark:text-violet-200 bg-violet-50 dark:bg-violet-950/50 hover:bg-violet-100 dark:hover:bg-violet-900/40 border border-violet-200/80 dark:border-violet-800/60"
                        title="Preview article as learners will see it"
                      >
                        <BookOpen size={14} />
                        <span className="hidden sm:inline">Preview article</span>
                        <span className="sm:hidden">Preview</span>
                      </button>
                    )}
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
                      <span className="hidden sm:inline">{busy ? '…' : confirmDeleteId === m._id ? 'Confirm' : 'Delete'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {previewArticle && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="article-preview-title"
          onClick={(e) => e.target === e.currentTarget && setPreviewArticle(null)}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <h3 id="article-preview-title" className="font-semibold text-sm sm:text-base truncate pr-2">
                {previewArticle.title}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewArticle(null)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0"
                aria-label="Close preview"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto p-4 sm:p-6 text-sm leading-relaxed text-gray-800 dark:text-gray-200 max-w-none break-words [&_img]:max-w-full [&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary-600 [&_a]:underline">
              <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewArticle.content || '') }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}