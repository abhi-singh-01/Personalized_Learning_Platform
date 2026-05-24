import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useApi from '../../hooks/useApi';
import usePageTitle from '../../hooks/usePageTitle';
import { StatCard } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Loading from '../../components/ui/Loading';
import BDUIPanel from '../../components/ui/BDUIPanel';
import ReportExporter from '../../components/ui/ReportExporter';
import { levelColors } from '../../utils/helpers';
import {
  Trophy,
  BookOpen,
  Flame,
  Target,
  Brain,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Clock,
  Video,
  XCircle,
} from 'lucide-react';
const LearnerScoreLineChart = lazy(() => import('../../components/charts/LearnerScoreLineChart'));

export default function LearnerDashboard() {
  const { user } = useAuth();
  const api = useApi();
  const [data, setData] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [fbLoading, setFbLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState({ upcoming: [], cancelled: [] });
  const fetchedRef = useRef(false);
  usePageTitle('Dashboard');

  useEffect(() => {
    if (fetchedRef.current) return; // StrictMode guard
    fetchedRef.current = true;

    api.get('/analytics/learner/dashboard').then((res) => setData(res.data)).catch(() => {});
    api.get('/schedules/learner/upcoming').then((res) => setScheduleData(res.data || { upcoming: [], cancelled: [] })).catch(() => {});
  }, []);

  const getFeedback = async () => {
    setFbLoading(true);
    try {
      const res = await api.post('/ai/feedback');
      setFeedback(res.data);
    } catch (e) {
      console.error(e);
    }
    setFbLoading(false);
  };

  if (api.loading && !data) return <Loading />;

  const u = data?.user || user;
  const chartData =
    data?.recentScores
      ?.slice()
      .reverse()
      .map((s, i) => ({
        name: 'Q' + (i + 1),
        score: s.score,
      })) || [];

  return (
    <div className="space-y-6">
      <BDUIPanel screen="dashboard" />
      {/* Welcome Section */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {u?.name?.split(' ')[0]}! 👋
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span
              className={
                'px-3 py-1 rounded-full text-xs font-medium ' +
                (levelColors[u?.aiLevel] || levelColors.Beginner)
              }
            >
              {u?.aiLevel || 'Beginner'}
            </span>
            <span className="flex items-center gap-1 text-sm text-orange-500">
              <Flame size={16} /> {u?.streak?.current || 0} day streak
            </span>
          </div>
        </div>
      </div>

      {/* Analytics & Reports Section inside Dashboard */}
      <ReportExporter title="Analytics & Reports" filename={`${u?.name?.replace(/\s+/g, '_')}_Analytics.pdf`}>
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Trophy}
              label="Average Score"
              value={(u?.averageScore || 0) + '%'}
              color="primary"
            />
            <StatCard
              icon={BookOpen}
              label="Courses Enrolled"
              value={u?.enrolledCourses?.length || 0}
              color="blue"
            />
            <StatCard
              icon={Target}
              label="Quizzes Taken"
              value={u?.totalQuizzesTaken || 0}
              color="green"
            />
            <StatCard
              icon={TrendingUp}
              label="Engagement"
              value={u?.engagementScore || 0}
              color="yellow"
              subtext="out of 100"
            />
          </div>

          {/* Performance Chart */}
          {chartData.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Performance Trend</h2>
              <Suspense
                fallback={
                  <div className="h-[250px] flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    Loading chart…
                  </div>
                }
              >
                <LearnerScoreLineChart data={chartData} />
              </Suspense>
            </div>
          )}

          {/* Weak Topics */}
          {data?.weakTopics?.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                <AlertTriangle size={20} className="text-yellow-500" /> Areas to
                Improve
              </h2>
              <div className="space-y-3">
                {data.weakTopics.map((t) => (
                  <div
                    key={t.topic}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-200">{t.topic}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-400 rounded-full"
                          style={{ width: t.accuracy + '%' }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {t.accuracy}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ReportExporter>

      {/* Bottom Features (Outside PDF) */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* AI Insights */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <Brain size={20} className="text-primary-500" /> AI Insights
          </h2>
          {feedback ? (
            <div className="space-y-3 text-sm">
              <p className="text-gray-600 dark:text-gray-400">
                {feedback.overallAssessment}
              </p>
              <p className="font-medium text-green-600">
                {feedback.motivationalMessage}
              </p>
              {feedback.recommendations?.map((r, i) => (
                <p key={i} className="text-gray-500 dark:text-gray-400">
                  • {r}
                </p>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 dark:text-gray-400 mb-3 text-sm">
                Get personalized AI recommendations
              </p>
              <button
                onClick={getFeedback}
                disabled={fbLoading}
                className="btn-primary text-sm"
              >
                {fbLoading ? 'Generating...' : 'Get AI Feedback'}
              </button>
            </div>
          )}
          <Link
            to="/learner/study-plan"
            className="block mt-4 text-center text-sm text-primary-600 hover:underline"
          >
            Generate Full Study Plan →
          </Link>
        </div>
      </div>

      {/* Upcoming Lectures */}
      {scheduleData.upcoming?.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <Calendar size={20} className="text-emerald-500" /> Upcoming Lectures
          </h2>
          <div className="space-y-3">
            {scheduleData.upcoming.map((s) => {
              const d = new Date(s.scheduledAt);
              const now = new Date();
              const diffMs = d - now;
              const diffH = Math.floor(diffMs / 3600000);
              const diffM = Math.floor((diffMs % 3600000) / 60000);
              const isToday = d.toDateString() === now.toDateString();
              return (
                <div key={s._id} className={`flex items-center justify-between p-4 rounded-xl border ${isToday ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${isToday ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                      <Video size={20} className={isToday ? 'text-emerald-600' : 'text-gray-500'} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{s.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.course?.title} · {s.educator?.name} · {s.duration} min</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {d.toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {diffMs > 0 && diffMs < 24 * 3600000 && (
                          <span className="text-emerald-600 font-medium">Starts in {diffH > 0 ? diffH + 'h ' : ''}{diffM}m</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {s.meetingLink && (
                    <a href={s.meetingLink} target="_blank" rel="noreferrer" className="text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium">
                      Join
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancelled Lectures Notice */}
      {scheduleData.cancelled?.length > 0 && (
        <div className="card border-red-100 dark:border-red-900/30">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-red-500">
            <XCircle size={16} /> Recently Cancelled
          </h2>
          <div className="space-y-2">
            {scheduleData.cancelled.slice(0, 3).map((s) => (
              <div key={s._id} className="flex items-center justify-between p-3 rounded-lg bg-red-50/50 dark:bg-red-900/10">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-through">{s.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{s.course?.title} · {s.educator?.name}</p>
                  <p className="text-xs text-red-500 mt-0.5">Reason: {s.cancelReason}</p>
                </div>
                <span className="text-xs text-gray-400">{new Date(s.scheduledAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enrolled Courses Quick Access */}
      {u?.enrolledCourses?.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Continue Learning</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {u.enrolledCourses
              .filter((c, index, self) =>
                index === self.findIndex((t) => (t._id === c._id || t === c))
              )
              .map((course) => {
                const courseId = typeof course === 'string' ? course : course._id;
                const title =
                  typeof course === 'object' ? course.title : 'Course';
                const category =
                  typeof course === 'object' ? course.category : '';
                return (
                  <Link
                    key={courseId}
                    to={'/learner/courses/' + courseId}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <BookOpen size={18} className="text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{title}</p>
                      {category && (
                        <p className="text-xs text-gray-400">{category}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}