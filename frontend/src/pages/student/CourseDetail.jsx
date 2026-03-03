import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import Loading from '../../components/ui/Loading';
import Badge from '../../components/ui/Badge';
import { Play, FileText, Presentation, ArrowLeft, CheckCircle, MessageSquare, BookOpen, Sparkles } from 'lucide-react';

export default function CourseDetail() {
  const { id } = useParams();
  const api = useApi();
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [activeArticle, setActiveArticle] = useState(null);
  const [progress, setProgress] = useState({ completedMaterials: [] });
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    api.get('/courses/' + id).then((res) => setCourse(res.data));
    api.get('/materials/course/' + id).then((res) => setMaterials(res.data || []));
    api.get('/quizzes/course/' + id).then((res) => setQuizzes(res.data || []));
    api.get('/courses/' + id + '/progress').then((res) => setProgress(res.data || { completedMaterials: [] }));
    api.get('/courses/' + id + '/comments').then((res) => setComments(res.data || []));
  }, [id]);

  const toggleComplete = async (materialId, e) => {
    e.stopPropagation();
    try {
      const res = await api.post('/courses/' + id + '/materials/' + materialId + '/complete');
      setProgress(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await api.post('/courses/' + id + '/comments', { text: newComment });
      setComments([res.data, ...comments]);
      setNewComment('');
    } catch (err) {
      console.error(err);
    }
  };

  const trackView = async (materialId) => {
    try {
      await api.post('/materials/' + materialId + '/view');
    } catch (e) { }
  };

  const icons = { youtube: Play, pdf: FileText, ppt: Presentation, article: BookOpen };

  if (!course) return <Loading />;

  const progressPercentage = materials.length > 0
    ? Math.round((progress.completedMaterials.length / materials.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <Link
        to="/student/courses"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600"
      >
        <ArrowLeft size={16} /> Back to Courses
      </Link>

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

      {(activeVideo || activeArticle) && (
        <div className="card">
          {activeVideo && (
            <div className="aspect-video rounded-lg bg-black relative">
              <iframe
                src={'https://www.youtube.com/embed/' + activeVideo}
                className="w-full h-full absolute top-0 left-0"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                title="Course Video"
              />
            </div>
          )}
          {activeArticle && (
            <div className="prose dark:prose-invert max-w-none">
              <h2 className="text-2xl font-bold mb-4">{activeArticle.title}</h2>
              <div dangerouslySetInnerHTML={{ __html: activeArticle.content }} />
            </div>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">
            Materials ({materials.length})
          </h2>
          <div className="space-y-3">
            {materials.map((m) => {
              const Icon = icons[m.type] || FileText;
              return (
                <div
                  key={m._id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  onClick={() => {
                    trackView(m._id);
                    if (m.type === 'youtube') {
                      setVideoLoading(true);
                      setActiveVideo(m.videoId);
                      setActiveArticle(null);
                    } else if (m.type === 'article') {
                      setActiveArticle(m);
                      setActiveVideo(null);
                    } else if (m.fileUrl) {
                      window.open('http://localhost:5000' + m.fileUrl, '_blank');
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600">
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{m.title}</p>
                      <p className="text-xs text-gray-400 capitalize">{m.type}</p>
                    </div>
                  </div>

                  {/* Complete Toggle */}
                  <button
                    onClick={(e) => toggleComplete(m._id, e)}
                    className={`p-2 rounded-full transition-colors ${progress.completedMaterials.includes(m._id) ? 'text-green-500 bg-green-50 dark:bg-green-900/20' : 'text-gray-300 hover:text-green-500'}`}
                    title={progress.completedMaterials.includes(m._id) ? "Mark as incomplete" : "Mark as complete"}
                  >
                    <CheckCircle size={20} className={progress.completedMaterials.includes(m._id) ? "fill-green-100 dark:fill-green-900" : ""} />
                  </button>
                </div>
              );
            })}
            {materials.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                No materials yet
              </p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              Quizzes ({quizzes.length})
            </h2>
            <Link to={`/student/courses/${id}/practice`} className="btn-secondary text-sm flex items-center gap-1 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/20 px-3 py-1.5 bg-white dark:bg-gray-800">
              <Sparkles size={16} /> Practice AI
            </Link>
          </div>
          <div className="space-y-3">
            {quizzes.map((q) => (
              <Link
                key={q._id}
                to={'/student/quiz/' + q._id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">{q.title}</p>
                  <p className="text-xs text-gray-400">
                    {q.questions?.length || 0} questions
                  </p>
                </div>
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
              </Link>
            ))}
            {quizzes.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                No quizzes yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MessageSquare size={20} className="text-primary-600" /> Course Discussion
        </h2>

        <form onSubmit={submitComment} className="mb-6 flex gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex-shrink-0 flex items-center justify-center text-primary-700 font-bold">
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
                    {comment.user?.role === 'teacher' && <Badge variant="primary">Teacher</Badge>}
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
    </div>
  );
}