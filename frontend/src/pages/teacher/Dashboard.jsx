import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useApi from '../../hooks/useApi';
import { StatCard } from '../../components/ui/Card';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Loading from '../../components/ui/Loading';
import ReportExporter from '../../components/ui/ReportExporter';
import { levelColors, riskColors, formatDate } from '../../utils/helpers';
import { Users, BookOpen, FileText, Trophy, PlusCircle, Upload, Brain, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const PIE_COLORS = ['#f97316', '#eab308', '#3b82f6', '#22c55e'];

export default function TeacherDashboard() {
  const { user } = useAuth();
  const api = useApi();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/analytics/teacher/dashboard').then((res) => setData(res.data));
  }, []);

  if (api.loading && !data) return <Loading />;
  if (!data) return <Loading />;

  const pieData = Object.entries(data.levelDistribution || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
        <div className="flex gap-2">
          <Link to="/teacher/courses/new" className="btn-primary text-sm flex items-center gap-1">
            <PlusCircle size={16} /> New Course
          </Link>
        </div>
      </div>

      <ReportExporter title="Analytics & Reports" filename={`Class_Report_${new Date().toISOString().split('T')[0]}.pdf`}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Total Students" value={data.totalStudents} color="blue" />
            <StatCard icon={BookOpen} label="Total Courses" value={data.totalCourses} color="primary" />
            <StatCard icon={FileText} label="Total Materials" value={data.totalMaterials} color="green" />
            <StatCard icon={Trophy} label="Avg Class Score" value={data.avgClassScore + '%'} color="yellow" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {data.coursePerformance?.length > 0 && (
              <Card>
                <h2 className="text-lg font-semibold mb-4">Course Performance</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.coursePerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="title" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="avgScore" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}

            {pieData.some((d) => d.value > 0) && (
              <Card>
                <h2 className="text-lg font-semibold mb-4">AI Level Distribution</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, value }) => name + ': ' + value}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>

          {data.atRisk?.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-500" /> Students at Risk
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Engagement</th>
                      <th className="pb-3 font-medium">Avg Score</th>
                      <th className="pb-3 font-medium">Last Active</th>
                      <th className="pb-3 font-medium">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.atRisk.map((s) => (
                      <tr key={s.id} className="border-b border-gray-100 dark:border-gray-700/50">
                        <td className="py-3 font-medium">{s.name}</td>
                        <td className="py-3">{s.engagementScore}</td>
                        <td className="py-3">{s.averageScore}%</td>
                        <td className="py-3 text-gray-500">{s.lastActive ? formatDate(s.lastActive) : 'Never'}</td>
                        <td className="py-3">
                          <span className={'px-2 py-1 rounded-full text-xs font-medium ' + (riskColors[s.risk] || riskColors.Medium)}>
                            {s.risk}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {data.topPerformers?.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Trophy size={20} className="text-yellow-500" /> Top Performers
              </h2>
              <div className="space-y-3">
                {data.topPerformers.map((s, i) => (
                  <div key={s._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-300 w-6">#{i + 1}</span>
                      <div>
                        <p className="font-medium text-sm">{s.name}</p>
                        <span className={'px-2 py-0.5 rounded-full text-xs ' + (levelColors[s.aiLevel] || '')}>
                          {s.aiLevel}
                        </span>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-primary-600">{s.averageScore}%</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </ReportExporter>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link to="/teacher/courses/new" className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all">
            <PlusCircle size={20} className="text-primary-600" />
            <span className="text-sm font-medium">New Course</span>
          </Link>
          <Link to="/teacher/students" className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all">
            <Users size={20} className="text-blue-600" />
            <span className="text-sm font-medium">View Students</span>
          </Link>
          <button onClick={() => alert('Select a course first from your courses page')} className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all text-left">
            <Upload size={20} className="text-green-600" />
            <span className="text-sm font-medium">Upload Material</span>
          </button>
          <button onClick={() => alert('Select a course first from your courses page')} className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all text-left">
            <Brain size={20} className="text-violet-600" />
            <span className="text-sm font-medium">Generate AI Quiz</span>
          </button>
        </div>
      </Card>
    </div>
  );
}