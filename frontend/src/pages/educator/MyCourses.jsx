import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import usePageTitle from '../../hooks/usePageTitle';
import Loading from '../../components/ui/Loading';
import {
  BookOpen, PlusCircle, Search, Pencil, Trash2, Copy, Eye, EyeOff,
  Upload, FileQuestion, Video, Users, Calendar, Tag, Filter,
  LayoutGrid, GraduationCap, ChevronRight, MessageSquare,
} from 'lucide-react';

const STATUS_BADGES = {
  published: { label: 'Published', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  draft: { label: 'Draft', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  pending_review: { label: 'Pending', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  archived: { label: 'Archived', cls: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const DIFFICULTY_COLORS = {
  beginner: 'from-emerald-400 to-teal-500',
  intermediate: 'from-blue-400 to-indigo-500',
  advanced: 'from-purple-400 to-pink-500',
};

const PLACEHOLDER_GRADIENTS = [
  'from-indigo-500 via-purple-500 to-pink-500',
  'from-cyan-500 via-blue-500 to-indigo-500',
  'from-emerald-500 via-teal-500 to-cyan-500',
  'from-amber-500 via-orange-500 to-red-500',
  'from-violet-500 via-purple-500 to-fuchsia-500',
  'from-rose-500 via-pink-500 to-purple-500',
];

export default function MyCourses() {
  usePageTitle('My Courses');
  const api = useApi();
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | published | draft
  const [message, setMessage] = useState({ text: '', type: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const fetchedRef = useRef(false);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses/teaching');
      setCourses(res.data || []);
    } catch (e) {}
  };

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchCourses();
  }, []);

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleTogglePublish = async (id) => {
    try {
      const res = await api.patch(`/courses/${id}/toggle-publish`);
      setCourses(prev => prev.map(c => c._id === id ? { ...c, isPublished: res.data.isPublished, status: res.data.status } : c));
      showMsg(res.data.isPublished ? 'Course published!' : 'Course set to draft');
    } catch (e) {
      showMsg(e.response?.data?.message || 'Failed', 'error');
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const res = await api.post(`/courses/${id}/duplicate`);
      setCourses(prev => [res.data, ...prev]);
      showMsg('Course duplicated as draft!');
    } catch (e) {
      showMsg(e.response?.data?.message || 'Failed to duplicate', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.del(`/courses/${deleteConfirm}`);
      setCourses(prev => prev.filter(c => c._id !== deleteConfirm));
      setDeleteConfirm(null);
      showMsg('Course deleted');
    } catch (e) {
      showMsg(e.response?.data?.message || 'Failed to delete', 'error');
      setDeleteConfirm(null);
    }
  };

  // Filter & search
  const filtered = courses.filter(c => {
    if (filter === 'published' && c.status !== 'published') return false;
    if (filter === 'draft' && c.status !== 'draft') return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: courses.length,
    published: courses.filter(c => c.status === 'published').length,
    draft: courses.filter(c => c.status === 'draft').length,
  };

  if (api.loading && courses.length === 0) return <Loading />;

  return (
    <div className="space-y-6">
      {/* ═══ Hero Header ═══ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 dark:from-indigo-700 dark:via-purple-800 dark:to-violet-900 p-5 sm:p-6 md:p-8 text-white shadow-xl shadow-purple-500/15 dark:shadow-purple-900/30">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIvPjwvZz48L3N2Zz4=')] opacity-50" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LayoutGrid size={20} className="text-white/70" />
              <p className="text-sm text-white/70 font-medium">Course Management</p>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">My Courses</h1>
            <p className="text-xs sm:text-sm text-white/60 mt-1.5">{courses.length} course{courses.length !== 1 ? 's' : ''} in your portfolio</p>
          </div>
          <Link to="/educator/courses/new" className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl bg-white text-purple-700 hover:bg-white/90 shadow-lg shadow-black/10 transition-all duration-200 hover:-translate-y-0.5 self-start sm:self-auto">
            <PlusCircle size={16} /> Create Course
          </Link>
        </div>
      </div>

      {/* ═══ Toast ═══ */}
      {message.text && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium border transition-all ${
          message.type === 'error'
            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
            : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* ═══ Filters & Search ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          {[
            { key: 'all', label: 'All' },
            { key: 'published', label: 'Published' },
            { key: 'draft', label: 'Drafts' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                filter === f.key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {f.label} <span className="text-[10px] ml-0.5 opacity-60">({counts[f.key]})</span>
            </button>
          ))}
        </div>
        <div className="relative max-w-xs w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input-field pl-9 !py-2 text-sm"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ═══ Course Cards Grid ═══ */}
      {filtered.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filtered.map((course, idx) => {
            const badge = STATUS_BADGES[course.status] || STATUS_BADGES.draft;
            const gradient = PLACEHOLDER_GRADIENTS[idx % PLACEHOLDER_GRADIENTS.length];
            const diffColor = DIFFICULTY_COLORS[course.difficulty] || DIFFICULTY_COLORS.beginner;
            return (
              <div key={course._id} className="group card !p-0 overflow-hidden hover:shadow-lg dark:hover:shadow-gray-900/40 transition-all duration-300 hover:-translate-y-1 flex flex-col">
                {/* Thumbnail / Gradient Placeholder */}
                <div className="relative h-36 sm:h-40 overflow-hidden">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                      <GraduationCap size={48} className="text-white/30" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <span className={`absolute top-3 left-3 text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm ${badge.cls}`}>
                    {badge.label}
                  </span>
                  {/* Difficulty Badge */}
                  <span className={`absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r ${diffColor} text-white shadow-sm`}>
                    {course.difficulty}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white line-clamp-2 mb-1.5 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {course.title}
                  </h3>

                  {course.category && (
                    <div className="flex items-center gap-1 mb-2">
                      <Tag size={11} className="text-gray-400" />
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">{course.category}</span>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 flex-1">
                    {course.description}
                  </p>

                  {/* Stats Row */}
                  <div className="flex items-center gap-4 text-[11px] text-gray-400 dark:text-gray-500 mb-3 border-t border-gray-100 dark:border-gray-700/50 pt-3">
                    <span className="flex items-center gap-1">
                      <Users size={12} /> {course.learners?.length || 0} students
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {new Date(course.createdAt).toLocaleDateString()}
                    </span>
                    {course.price > 0 && (
                      <span className="ml-auto font-bold text-xs text-emerald-600 dark:text-emerald-400">₹{course.price}</span>
                    )}
                    {course.price === 0 && (
                      <span className="ml-auto font-bold text-xs text-blue-600 dark:text-blue-400">Free</span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    <Link
                      to={`/educator/courses/${course._id}/edit`}
                      className="flex flex-col items-center gap-0.5 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all text-[10px] font-medium"
                      title="Edit"
                    >
                      <Pencil size={14} /> Edit
                    </Link>
                    <Link
                      to={`/educator/courses/${course._id}/materials`}
                      className="flex flex-col items-center gap-0.5 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all text-[10px] font-medium"
                      title="Materials"
                    >
                      <Upload size={14} /> Material
                    </Link>
                    <Link
                      to={`/educator/courses/${course._id}/quizzes`}
                      className="flex flex-col items-center gap-0.5 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400 transition-all text-[10px] font-medium"
                      title="Quizzes"
                    >
                      <FileQuestion size={14} /> Quiz
                    </Link>
                    <Link
                      to={`/educator/courses/${course._id}/reviews`}
                      className="flex flex-col items-center gap-0.5 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 dark:hover:text-amber-400 transition-all text-[10px] font-medium"
                      title="Reviews"
                    >
                      <MessageSquare size={14} /> Reviews
                    </Link>
                    <Link
                      to={`/educator/courses/${course._id}/live`}
                      className="flex flex-col items-center gap-0.5 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 transition-all text-[10px] font-medium"
                      title="Live Class"
                    >
                      <Video size={14} /> Live
                    </Link>
                  </div>

                  {/* Secondary Actions */}
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50">
                    <button
                      onClick={() => handleTogglePublish(course._id)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                        course.isPublished
                          ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                          : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                      }`}
                    >
                      {course.isPublished ? <><EyeOff size={12} /> Unpublish</> : <><Eye size={12} /> Publish</>}
                    </button>
                    <button
                      onClick={() => handleDuplicate(course._id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                    >
                      <Copy size={12} /> Duplicate
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(course._id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all ml-auto"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4">
            <BookOpen size={32} className="text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {search ? 'No matching courses' : 'No courses yet'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-[280px]">
            {search
              ? 'Try adjusting your search or filter'
              : 'Create your first course and start teaching!'}
          </p>
          {!search && (
            <Link to="/educator/courses/new" className="btn-primary flex items-center gap-2 text-sm">
              <PlusCircle size={16} /> Create Course
            </Link>
          )}
        </div>
      )}

      {/* ═══ Delete Confirmation Modal ═══ */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
                <Trash2 size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Course</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
              All materials, quizzes, and enrollments associated with this course will be permanently removed.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-5 rounded-xl transition-all">
                Delete Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
