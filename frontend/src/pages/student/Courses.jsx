import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useApi from '../../hooks/useApi';
import Loading from '../../components/ui/Loading';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import { Search, BookOpen, Users } from 'lucide-react';

export default function Courses() {
  const { user, refreshUser } = useAuth();
  const api = useApi();
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [enrolling, setEnrolling] = useState(null);

  useEffect(() => {
    api.get('/courses').then((res) => setCourses(res.data || []));
  }, []);

  const enroll = async (courseId) => {
    setEnrolling(courseId);
    try {
      await api.post('/courses/' + courseId + '/enroll');
      await refreshUser();
      const res = await api.get('/courses');
      setCourses(res.data || []);
    } catch (e) {
      console.error(e);
    }
    setEnrolling(null);
  };

  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase())
  );

  if (api.loading && courses.length === 0) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Courses</h1>
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            className="input-field pl-10 w-64"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No courses found" icon={BookOpen} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course) => {
            const userId = user?.id || user?._id;
            const enrolled = course.students?.some((s) => {
              const sid = typeof s === 'string' ? s : s._id;
              return sid === userId;
            });
            return (
              <div key={course._id} className="card flex flex-col">
                <div className="h-32 rounded-lg bg-gradient-to-br from-primary-400 to-violet-500 mb-4 flex items-center justify-center">
                  <BookOpen size={40} className="text-white/80" />
                </div>
                <h3 className="font-semibold text-lg mb-1">{course.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                  {course.description}
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <Badge>{course.category}</Badge>
                  <Badge variant="primary">{course.difficulty}</Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
                  <Users size={14} /> {course.students?.length || 0} students
                  {course.teacher && (
                    <span className="ml-2">by {course.teacher.name}</span>
                  )}
                </div>
                <div className="mt-auto">
                  {enrolled ? (
                    <Link
                      to={'/student/courses/' + course._id}
                      className="btn-primary w-full text-center block text-sm"
                    >
                      Continue Learning
                    </Link>
                  ) : (
                    <button
                      onClick={() => enroll(course._id)}
                      disabled={enrolling === course._id}
                      className="btn-secondary w-full text-sm"
                    >
                      {enrolling === course._id ? 'Enrolling...' : 'Enroll Now'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}