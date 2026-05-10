import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap } from 'lucide-react';
import useApi from '../../hooks/useApi';
import usePageTitle from '../../hooks/usePageTitle';
import { useAuth } from '../../context/AuthContext';
import Loading from '../../components/ui/Loading';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';

export default function LearnerMyCourses() {
  usePageTitle('My Courses');
  const api = useApi();
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    api.get('/courses').then((res) => setCourses(res.data || [])).catch(() => {});
  }, []);

  const userId = user?.id || user?._id;

  const enrolled = useMemo(() => {
    if (!userId) return [];
    return (courses || []).filter((c) =>
      c?.learners?.some((s) => (typeof s === 'string' ? s : s?._id) === userId)
    );
  }, [courses, userId]);

  if (api.loading && courses.length === 0) return <Loading />;

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-violet-500 dark:from-primary-300 dark:to-violet-300 bg-clip-text text-transparent">
            My Courses
          </h1>
          <p className="text-sm text-gray-500 dark:text-white/60 mt-1">
            {enrolled.length} course{enrolled.length !== 1 ? 's' : ''} enrolled
          </p>
        </div>
        <Link
          to="/learner/courses"
          className="btn-secondary !px-4 !py-2 !rounded-xl text-sm inline-flex items-center gap-2"
        >
          <GraduationCap size={16} />
          Explore more
        </Link>
      </div>

      {enrolled.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No purchased courses yet"
            description="Once you enroll in a course (free or paid), it will appear here for quick access."
            icon={BookOpen}
          />
          <div className="flex justify-center pb-6">
            <Link to="/learner/courses" className="btn-primary text-sm !rounded-xl">
              Browse courses
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6 stagger-children">
          {enrolled.map((course) => (
            <Link
              key={course._id}
              to={'/learner/courses/' + course._id}
              className="group relative bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10
                         shadow-sm hover:shadow-xl hover:shadow-primary-500/5 dark:hover:shadow-black/40
                         transition-all duration-300 overflow-hidden flex flex-col"
            >
              <div className="relative h-36 sm:h-40 bg-gradient-to-br from-primary-500 via-primary-600 to-violet-600 dark:from-primary-500/80 dark:via-violet-500/80 dark:to-purple-500/80 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.14),transparent_60%)]" />
                <BookOpen size={36} className="text-white/80 group-hover:scale-110 transition-transform duration-300" />
              </div>

              <div className="flex flex-col flex-1 p-4 sm:p-5">
                <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white mb-1 line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-200 transition-colors">
                  {course.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-white/60 mb-3 line-clamp-2 leading-relaxed">
                  {course.description}
                </p>

                <div className="flex flex-wrap items-center gap-1.5 mb-4">
                  <Badge>{course.category}</Badge>
                  <Badge variant="primary">{course.difficulty}</Badge>
                </div>

                <div className="mt-auto inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold
                                bg-gradient-to-r from-primary-600 to-violet-600 hover:from-primary-700 hover:to-violet-700
                                text-white shadow-md shadow-primary-500/15 hover:shadow-lg hover:shadow-primary-500/25
                                transition-all duration-300 group-hover:-translate-y-0.5"
                >
                  Continue Learning
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

