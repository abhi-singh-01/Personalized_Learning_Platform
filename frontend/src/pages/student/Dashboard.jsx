import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useApi from '../../hooks/useApi';
import { StatCard } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Loading from '../../components/ui/Loading';
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
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function StudentDashboard() {
  const { user } = useAuth();
  const api = useApi();
  const [data, setData] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [fbLoading, setFbLoading] = useState(false);

  useEffect(() => {
    api.get('/analytics/student/dashboard').then((res) => setData(res.data));
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
      {/* Welcome Section */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">
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
              <h2 className="text-lg font-semibold mb-4">Performance Trend</h2>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ fill: '#6366f1' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Weak Topics */}
          {data?.weakTopics?.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className="text-yellow-500" /> Areas to
                Improve
              </h2>
              <div className="space-y-3">
                {data.weakTopics.map((t) => (
                  <div
                    key={t.topic}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{t.topic}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-400 rounded-full"
                          style={{ width: t.accuracy + '%' }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
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
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
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
                <p key={i} className="text-gray-500">
                  • {r}
                </p>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-3 text-sm">
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
            to="/student/study-plan"
            className="block mt-4 text-center text-sm text-primary-600 hover:underline"
          >
            Generate Full Study Plan →
          </Link>
        </div>
      </div>

      {/* Enrolled Courses Quick Access */}
      {u?.enrolledCourses?.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Continue Learning</h2>
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
                    to={'/student/courses/' + courseId}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <BookOpen size={18} className="text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{title}</p>
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