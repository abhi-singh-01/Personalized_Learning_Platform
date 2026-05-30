import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import usePageTitle from '../../hooks/usePageTitle';
import Loading from '../../components/ui/Loading';
import Badge from '../../components/ui/Badge';
import {
  Play, FileText, Presentation, ArrowLeft, CheckCircle, MessageSquare,
  BookOpen, Sparkles, Video, ClipboardList, FolderOpen, Brain, ExternalLink,
  Star, ThumbsUp, Flag, Trash2
} from 'lucide-react';
const AIVideoPanel = lazy(() => import('../../components/ui/AIVideoPanel'));
import CourseVideoPlayer from '../../components/ui/CourseVideoPlayer';
import PdfViewer from '../../components/ui/PdfViewer';
import { unwrapApiData } from '../../utils/apiData';
import { getProtectedMaterialStreamUrl, resolveMaterialUrl, openProtectedMaterialInNewTab } from '../../utils/materialUrl';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { sanitizeHtml } from '../../utils/sanitizeHtml';

export default function CourseDetail() {
  const { id } = useParams();
  const api = useApi();
  const toast = useToast();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  const [activeArticle, setActiveArticle] = useState(null);
  const [activeDocument, setActiveDocument] = useState(null);
  const [progress, setProgress] = useState({ completedMaterials: [] });
  const [comments, setComments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState('lectures');
  const [openingDocId, setOpeningDocId] = useState(null);
  const playerRef = useRef(null);
  const tabsRef = useRef(null);
  usePageTitle(course?.title || 'Course');

  useEffect(() => {
    api.get('/courses/' + id).then((res) => setCourse(unwrapApiData(res)));
    api.get('/materials/course/' + id).then((res) => setMaterials(unwrapApiData(res) || []));
    api.get('/quizzes/course/' + id).then((res) => setQuizzes(unwrapApiData(res) || []));
    api.get('/courses/' + id + '/progress').then((res) => setProgress(unwrapApiData(res) || { completedMaterials: [] }));
    api.get('/courses/' + id + '/comments').then((res) => setComments(unwrapApiData(res) || []));
    api.get('/reviews/course/' + id).then((res) => setReviews(unwrapApiData(res)?.reviews || []));
  }, [id]);

  useEffect(() => {
    if (activeTab !== 'quizzes') return;
    api.get('/quizzes/course/' + id).then((res) => setQuizzes(unwrapApiData(res) || []));
  }, [activeTab, id]);

  useEffect(() => {
    if (activeVideo || activeDocument || activeArticle) {
      requestAnimationFrame(() => {
        playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [activeVideo, activeDocument, activeArticle]);

  const scrollToTabs = (tab) => {
    setActiveTab(tab);
    requestAnimationFrame(() => {
      tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const toggleComplete = async (materialId, e) => {
    e.stopPropagation();
    try {
      const res = await api.post('/courses/' + id + '/materials/' + materialId + '/complete');
      setProgress(unwrapApiData(res) || { completedMaterials: [] });
    } catch (err) {
      console.error(err);
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await api.post('/courses/' + id + '/comments', { text: newComment });
      setComments([unwrapApiData(res), ...comments]);
      setNewComment('');
    } catch (err) {
      console.error(err);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      const own = reviews.find((r) => (r.learner?._id || r.learner) === user?.id);
      const payload = { courseId: id, ...reviewForm, rating: Number(reviewForm.rating) };
      const res = own
        ? await api.put(`/reviews/${own._id}`, payload)
        : await api.post('/reviews', payload);
      const saved = unwrapApiData(res);
      const learnerRef = { _id: user?.id, name: user?.name, avatar: user?.avatar };
      setReviews((prev) => own ? prev.map((r) => r._id === own._id ? { ...r, ...saved, learner: r.learner } : r) : [{ ...saved, learner: learnerRef }, ...prev]);
      toast.success(own ? 'Review updated' : 'Review submitted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit review');
    }
  };

  const deleteReview = async (reviewId) => {
    try {
      await api.del(`/reviews/${reviewId}`);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      toast.success('Review deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete review');
    }
  };

  const markHelpful = async (reviewId) => {
    try {
      const res = await api.post(`/reviews/${reviewId}/helpful`);
      setReviews((prev) => prev.map((r) => r._id === reviewId ? { ...r, helpful: unwrapApiData(res)?.helpful ?? r.helpful } : r));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update helpful vote');
    }
  };

  const reportReview = async (reviewId) => {
    const reason = window.prompt('Why are you reporting this review?') || '';
    if (!reason.trim()) return;
    try {
      await api.post(`/reviews/${reviewId}/report`, { reason });
      toast.success('Review reported for moderation');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not report review');
    }
  };

  const trackView = async (materialId) => {
    try {
      await api.post('/materials/' + materialId + '/view');
    } catch (e) { }
  };

  // Categorize materials
  const videoMaterials = materials.filter((m) => m.type === 'youtube' || m.type === 'video');
  const documentMaterials = materials.filter((m) => m.type === 'pdf' || m.type === 'ppt');
  const articleMaterials = materials.filter((m) => m.type === 'article');

  const icons = { youtube: Play, pdf: FileText, ppt: Presentation, article: BookOpen, video: Video };

  if (!course) return <Loading />;

  const progressPercentage = materials.length > 0
    ? Math.round((progress.completedMaterials.length / materials.length) * 100)
    : 0;

  const playVideo = (m) => {
    setActiveArticle(null);
    setActiveDocument(null);

    if (m.type === 'youtube') {
      setActiveVideo({ _id: m._id, title: m.title, kind: 'youtube', videoId: m.videoId });
    } else if (m.type === 'video') {
      if (!m.fileUrl) {
        toast.error('This video has no file. Ask your educator to re-upload it.');
        return;
      }
      setActiveVideo({
        _id: m._id,
        title: m.title,
        kind: 'upload',
        streamUrl: getProtectedMaterialStreamUrl(m._id),
        fileUrl: m.fileUrl,
      });
    }

    setActiveTab('lectures');
    trackView(m._id);
    requestAnimationFrame(() => {
      playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const openDocument = (m) => {
    setActiveVideo(null);

    if (m.type === 'article') {
      setActiveDocument(null);
      setActiveTab('documents');
      setActiveArticle(m);
      trackView(m._id);
      requestAnimationFrame(() => {
        playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return;
    }

    if (m.type === 'pdf' || m.type === 'ppt') {
      if (!m.fileUrl) {
        toast.error('This document has no file. Ask your educator to re-upload it.');
        return;
      }
      setActiveArticle(null);
      setActiveDocument({ ...m, streamUrl: getProtectedMaterialStreamUrl(m._id) });
      setActiveTab('documents');
      trackView(m._id);
      requestAnimationFrame(() => {
        playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  const handleOpenInNewTab = async (materialId) => {
    if (!materialId) return;
    setOpeningDocId(materialId);
    try {
      await openProtectedMaterialInNewTab(materialId);
    } catch (err) {
      toast.error(err.message || 'Could not open file in a new tab.');
    } finally {
      setOpeningDocId(null);
    }
  };

  const openMaterial = (m) => {
    if (m.type === 'youtube' || m.type === 'video') {
      playVideo(m);
      return;
    }
    if (m.type === 'article' || m.type === 'pdf' || m.type === 'ppt') {
      openDocument(m);
      return;
    }

    if (m.fileUrl) {
      handleOpenInNewTab(m._id);
    }
  };

  const MaterialItem = ({ m }) => {
    const Icon = icons[m.type] || FileText;
    const isCompleted = progress.completedMaterials.includes(m._id);
    const isVideo = m.type === 'youtube' || m.type === 'video';
    const isDocument = m.type === 'pdf' || m.type === 'ppt' || m.type === 'article';
    const isActive = activeVideo?._id === m._id
      || activeDocument?._id === m._id
      || activeArticle?._id === m._id;
    const viewLabel = isVideo
      ? 'View Video'
      : m.type === 'pdf'
        ? 'View PDF'
        : m.type === 'ppt'
          ? 'Open File'
          : m.type === 'article'
            ? 'Read'
            : 'View';

    return (
      <div
        role={isVideo || isDocument ? 'button' : undefined}
        tabIndex={isVideo || isDocument ? 0 : undefined}
        onClick={isVideo ? () => playVideo(m) : isDocument ? () => openDocument(m) : undefined}
        onKeyDown={(isVideo || isDocument) ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (isVideo) playVideo(m);
            else openDocument(m);
          }
        } : undefined}
        className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
          (isVideo || isDocument) ? 'cursor-pointer' : ''
        } ${
          isActive ? 'bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-200 dark:ring-primary-800' : 'hover:bg-gray-50 dark:hover:bg-gray-700/60'
        }`}
      >
        <div className={`p-2.5 rounded-xl transition-colors ${m.type === 'video' || m.type === 'youtube'
          ? 'bg-red-50 dark:bg-red-900/20 text-red-500'
          : m.type === 'pdf'
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500'
            : m.type === 'ppt'
              ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-500'
              : 'bg-green-50 dark:bg-green-900/20 text-green-500'
          }`}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{m.title}</p>
          <p className="text-xs text-gray-400 capitalize mt-0.5">
            {m.type === 'youtube' ? 'YouTube Video' : m.type === 'video' ? 'Video Lecture' : m.type === 'pdf' ? 'PDF Document' : m.type === 'ppt' ? 'Presentation' : 'Article'}
          </p>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); openMaterial(m); }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
            isVideo
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : m.type === 'pdf'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
          }`}
        >
          {isVideo ? <Play size={12} fill="currentColor" /> : <FileText size={12} />}
          {viewLabel}
        </button>
        <button
          onClick={(e) => toggleComplete(m._id, e)}
          className={`p-2 rounded-full transition-colors flex-shrink-0 ${isCompleted ? 'text-green-500 bg-green-50 dark:bg-green-900/20' : 'text-gray-300 hover:text-green-500'}`}
          title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
        >
          <CheckCircle size={20} className={isCompleted ? 'fill-green-100 dark:fill-green-900' : ''} />
        </button>
      </div>
    );
  };

  const tabs = [
    { key: 'lectures', label: 'Video Lectures', icon: Video, count: videoMaterials.length },
    { key: 'documents', label: 'Documents', icon: FolderOpen, count: documentMaterials.length + articleMaterials.length },
    { key: 'quizzes', label: 'Quizzes', icon: ClipboardList, count: quizzes.length },
    { key: 'discussion', label: 'Discussion', icon: MessageSquare, count: comments.length },
    { key: 'reviews', label: 'Reviews', icon: Star, count: reviews.length },
  ];

  return (
    <div className="space-y-6">
      <Link
        to="/learner/courses"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600"
      >
        <ArrowLeft size={16} /> Back to Courses
      </Link>

      {/* Course Header */}
      <div className="card">
        <h1 className="text-2xl font-bold mb-2">{course.title}</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-3">
          {course.description}
        </p>
        <div className="flex gap-2 mb-4">
          <Badge>{course.category}</Badge>
          <Badge variant="primary">{course.difficulty}</Badge>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Course Progress</span>
            <span className="text-sm font-bold text-primary-600">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div className="bg-primary-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{progress.completedMaterials.length} of {materials.length} materials completed</p>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          className="card !p-4 flex items-center gap-3 cursor-pointer hover:border-red-300 dark:hover:border-red-700 transition-colors text-left w-full"
          onClick={() => scrollToTabs('lectures')}
        >
          <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20">
            <Video size={20} className="text-red-500" />
          </div>
          <div>
            <p className="text-xl font-bold">{videoMaterials.length}</p>
            <p className="text-xs text-gray-500">Video Lectures</p>
          </div>
        </button>
        <button
          type="button"
          className="card !p-4 flex items-center gap-3 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors text-left w-full"
          onClick={() => scrollToTabs('documents')}
        >
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20">
            <FolderOpen size={20} className="text-blue-500" />
          </div>
          <div>
            <p className="text-xl font-bold">{documentMaterials.length + articleMaterials.length}</p>
            <p className="text-xs text-gray-500">Documents</p>
          </div>
        </button>
        <button
          type="button"
          className="card !p-4 flex items-center gap-3 cursor-pointer hover:border-purple-300 dark:hover:border-purple-700 transition-colors text-left w-full"
          onClick={() => scrollToTabs('quizzes')}
        >
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20">
            <ClipboardList size={20} className="text-purple-500" />
          </div>
          <div>
            <p className="text-xl font-bold">{quizzes.length}</p>
            <p className="text-xs text-gray-500">Quizzes</p>
          </div>
        </button>
        <Link to={`/learner/courses/${id}/practice`}
          className="card !p-4 flex items-center gap-3 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
            <Brain size={20} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-bold">AI Practice</p>
            <p className="text-xs text-gray-500">Generate Quiz</p>
          </div>
        </Link>
      </div>

      {/* Video player — one video at a time */}
      {activeVideo && (
        <div ref={playerRef} className="card scroll-mt-20">
          <CourseVideoPlayer
            key={activeVideo._id}
            youtubeId={activeVideo.kind === 'youtube' ? activeVideo.videoId : undefined}
            src={activeVideo.kind === 'upload'
              ? activeVideo.streamUrl || resolveMaterialUrl(activeVideo.fileUrl)
              : undefined}
            title={activeVideo.title}
          />
          {activeVideo.kind === 'upload' && (
            <Suspense fallback={null}>
              <AIVideoPanel materialId={activeVideo._id} materialTitle={activeVideo.title} />
            </Suspense>
          )}
        </div>
      )}

      {/* Document / article viewer */}
      {(activeArticle || activeDocument) && (
        <div ref={playerRef} className="card scroll-mt-20">
          {activeArticle && (
            <div className="prose dark:prose-invert max-w-none">
              <h2 className="text-2xl font-bold mb-4">{activeArticle.title}</h2>
              <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(activeArticle.content) }} />
            </div>
          )}
          {activeDocument && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-bold">{activeDocument.title}</h2>
                  <p className="text-xs text-gray-500 capitalize mt-0.5">
                    {activeDocument.type === 'pdf' ? 'PDF document' : 'Presentation file'}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={openingDocId === activeDocument._id}
                  onClick={() => handleOpenInNewTab(activeDocument._id)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:underline disabled:opacity-60"
                >
                  <ExternalLink size={14} />
                  {openingDocId === activeDocument._id
                    ? 'Opening…'
                    : activeDocument.type === 'pdf'
                      ? 'Open PDF in new tab'
                      : 'Open in new tab'}
                </button>
              </div>
              {activeDocument.type === 'pdf' ? (
                <PdfViewer
                  key={activeDocument._id}
                  src={activeDocument.streamUrl}
                  materialId={activeDocument._id}
                  onOpenInNewTab={handleOpenInNewTab}
                  title={activeDocument.title}
                />
              ) : (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-8 text-center">
                  <Presentation size={40} className="mx-auto text-orange-400 mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Presentations open best in PowerPoint or Google Slides.
                  </p>
                  <button
                    type="button"
                    disabled={openingDocId === activeDocument._id}
                    onClick={() => handleOpenInNewTab(activeDocument._id)}
                    className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
                  >
                    <ExternalLink size={16} />
                    {openingDocId === activeDocument._id ? 'Opening…' : 'Download / open file'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content Tabs */}
      <div ref={tabsRef} className="card !p-0 overflow-hidden scroll-mt-24">
        {/* Tab Header */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 ${activeTab === tab.key
                ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/10'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${activeTab === tab.key
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                  }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5">
          {/* Video Lectures Tab */}
          {activeTab === 'lectures' && (
            <div>
              {videoMaterials.length === 0 ? (
                <div className="text-center py-10">
                  <Video size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-sm text-gray-400">No video lectures uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {videoMaterials.map((m, idx) => (
                    <div key={m._id} className="flex items-center gap-1">
                      <span className="text-xs text-gray-400 w-6 text-right flex-shrink-0">{idx + 1}.</span>
                      <div className="flex-1">
                        <MaterialItem m={m} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div>
              {documentMaterials.length === 0 && articleMaterials.length === 0 ? (
                <div className="text-center py-10">
                  <FolderOpen size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-sm text-gray-400">No documents or articles uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {[...documentMaterials, ...articleMaterials].map((m) => (
                    <MaterialItem key={m._id} m={m} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quizzes Tab */}
          {activeTab === 'quizzes' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">Test your knowledge with educator-created quizzes</p>
                <Link
                  to={`/learner/courses/${id}/practice`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                >
                  <Sparkles size={14} />
                  AI Practice Quiz
                </Link>
              </div>
              {quizzes.length === 0 ? (
                <div className="text-center py-10">
                  <ClipboardList size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-sm text-gray-400">No quizzes created yet</p>
                  <Link
                    to={`/learner/courses/${id}/practice`}
                    className="inline-flex items-center gap-1.5 mt-3 text-sm text-purple-600 hover:underline"
                  >
                    <Sparkles size={14} />
                    Try AI-generated practice quiz instead
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {quizzes.map((q) => {
                    const can = q.attemptStatus?.canStart !== false;
                    const lastResult = q.attemptStatus?.lastResult;
                    const inner = (
                      <div className="flex items-center justify-between w-full gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 shrink-0">
                            <ClipboardList size={18} className="text-purple-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm group-hover:text-primary-600 transition-colors truncate">{q.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {q.questions?.length || 0} questions
                              {q.isAIGenerated && <span className="ml-2 text-purple-400">✦ AI</span>}
                              {lastResult && (
                                <span className="ml-2 font-semibold text-primary-600">
                                  · Score: {lastResult.score}% ({lastResult.correctCount}/{lastResult.totalQuestions})
                                </span>
                              )}
                            </p>
                            {!can && q.attemptStatus?.reason && (
                              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">{q.attemptStatus.reason}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {lastResult && (
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                              lastResult.score >= 80
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                : lastResult.score >= 50
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            }`}>
                              {lastResult.score}%
                            </span>
                          )}
                          <Badge
                            variant={
                              q.difficulty === 'easy'
                                ? 'success'
                                : q.difficulty === 'hard'
                                  ? 'danger'
                                  : 'warning'
                            }
                          >
                            {q.difficulty}
                          </Badge>
                        </div>
                      </div>
                    );
                    const quizPath = '/learner/quiz/' + q._id;
                    if (can) {
                      return (
                        <Link
                          key={q._id}
                          to={quizPath}
                          className="flex items-center justify-between p-3.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-all group"
                        >
                          {inner}
                        </Link>
                      );
                    }
                    if (lastResult) {
                      return (
                        <Link
                          key={q._id}
                          to={quizPath}
                          className="flex items-center justify-between p-3.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-all group border border-primary-100 dark:border-primary-900/40"
                        >
                          {inner}
                          {!can && (
                            <span className="text-xs font-semibold text-primary-600 shrink-0 ml-2">
                              View score
                            </span>
                          )}
                        </Link>
                      );
                    }
                    return (
                      <div
                        key={q._id}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 opacity-90 cursor-not-allowed"
                      >
                        {inner}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Discussion Tab */}
          {activeTab === 'discussion' && (
            <div>
              <form onSubmit={submitComment} className="mb-6 flex gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex-shrink-0 flex items-center justify-center text-primary-700 font-bold text-sm">
                  You
                </div>
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    className="input-field flex-1"
                    placeholder="Ask a question or share feedback..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <button type="submit" disabled={!newComment.trim()} className="btn-primary whitespace-nowrap">
                    Post
                  </button>
                </div>
              </form>

              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment._id} className="flex gap-3">
                    <img
                      src={comment.user?.avatar || `https://ui-avatars.com/api/?name=${comment.user?.name}&background=random`}
                      alt="avatar"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-2xl rounded-tl-none p-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm flex items-center gap-2">
                          {comment.user?.name}
                          {comment.user?.role === 'educator' && <Badge variant="primary">Educator</Badge>}
                        </p>
                        <p className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</p>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{comment.text}</p>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-4">Be the first to start the discussion!</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <form onSubmit={submitReview} className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                <h3 className="font-semibold">Your review</h3>
                <div className="grid sm:grid-cols-[140px_1fr] gap-3">
                  <select
                    className="input-field"
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })}
                  >
                    {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
                  </select>
                  <input
                    className="input-field"
                    placeholder="Short title"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  />
                </div>
                <textarea
                  className="input-field min-h-[90px]"
                  placeholder="Share what helped you or what could improve..."
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  required
                />
                <button className="btn-primary" type="submit">Submit review</button>
              </form>

              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-4">No reviews yet.</p>
                ) : reviews.map((review) => {
                  const own = (review.learner?._id || review.learner) === user?.id;
                  return (
                    <div key={review._id} className="rounded-2xl bg-gray-50 dark:bg-gray-800 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-1 text-amber-500 mb-1">
                            {Array.from({ length: review.rating || 0 }).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                          </div>
                          <h4 className="font-semibold">{review.title || 'Course review'}</h4>
                          <p className="text-xs text-gray-500">By {review.learner?.name || 'Learner'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => markHelpful(review._id)} className="text-xs flex items-center gap-1 text-gray-500 hover:text-primary-600">
                            <ThumbsUp size={14} /> {review.helpful || 0}
                          </button>
                          {!own && (
                            <button onClick={() => reportReview(review._id)} className="text-xs flex items-center gap-1 text-gray-500 hover:text-red-500">
                              <Flag size={14} /> Report
                            </button>
                          )}
                          {own && (
                            <button onClick={() => deleteReview(review._id)} className="text-xs flex items-center gap-1 text-red-500 hover:underline">
                              <Trash2 size={14} /> Delete
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-3">{review.comment}</p>
                      {review.educatorReply && (
                        <div className="mt-3 rounded-xl bg-white dark:bg-gray-900 p-3 text-sm">
                          <span className="font-semibold">Educator reply:</span> {review.educatorReply}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}