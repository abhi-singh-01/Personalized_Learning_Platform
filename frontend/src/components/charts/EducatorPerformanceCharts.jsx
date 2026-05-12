import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { BarChart2, Trophy } from 'lucide-react';
import Card from '../ui/Card';

const PIE_COLORS = ['#f97316', '#eab308', '#3b82f6', '#22c55e'];

export default function EducatorPerformanceCharts({ coursePerformance, pieData, dark }) {
  return (
    <>
      {coursePerformance?.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
              <Trophy size={16} className="text-indigo-500" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Course Performance</h2>
          </div>
          {coursePerformance.every((c) => !c.avgScore || c.avgScore === 0) ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center mb-3">
                <BarChart2 className="text-gray-300 dark:text-gray-600" size={28} />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No quiz scores yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-[200px]">
                Scores will appear here once learners start taking quizzes
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={coursePerformance} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#374151' : '#f3f4f6'} vertical={false} />
                <XAxis dataKey="title" tick={{ fontSize: 11, fill: dark ? '#9ca3af' : '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: dark ? '#9ca3af' : '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(v) => v + '%'} />
                <Tooltip
                  cursor={{ fill: dark ? 'rgba(75,85,99,0.2)' : 'rgba(99,102,241,0.06)' }}
                  contentStyle={{
                    backgroundColor: dark ? '#1f2937' : '#fff',
                    border: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    color: dark ? '#f3f4f6' : '#111827',
                    fontSize: 13,
                  }}
                  formatter={(value) => [value + '%', 'Avg Score']}
                />
                <Bar dataKey="avgScore" fill="url(#barGradient)" radius={[8, 8, 0, 0]} maxBarSize={50} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      )}

      {pieData?.some((d) => d.value > 0) && (
        <Card>
          <h2 className="text-base sm:text-lg font-semibold mb-4 text-gray-900 dark:text-white">AI Level Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => name + ': ' + value}
                labelLine={{ stroke: dark ? '#6b7280' : '#9ca3af' }}
                stroke={dark ? '#1f2937' : '#fff'}
                strokeWidth={2}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: dark ? '#1f2937' : '#fff',
                  border: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  color: dark ? '#f3f4f6' : '#111827',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}
    </>
  );
}
