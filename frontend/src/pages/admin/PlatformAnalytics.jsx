import { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import Loading from '../../components/ui/Loading';
import ReportExporter from '../../components/ui/ReportExporter';
import { StatCard } from '../../components/ui/Card';
import { Users, Server, BookOpen, Activity } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function PlatformAnalytics() {
    const api = useApi();
    const [data, setData] = useState(null);

    useEffect(() => {
        api.get('/admin/analytics').then(res => setData(res.data));
    }, []);

    if (api.loading || !data) return <Loading />;

    // Format dates for charts
    const trendData = data.trends?.map(t => ({
        ...t,
        dateLabel: new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    })) || [];

    return (
        <div className="max-w-6xl mx-auto space-y-6">

            <ReportExporter
                title="Admin Platform Report"
                filename={`Platform_Report_${new Date().toISOString().split('T')[0]}.pdf`}
            >
                <div className="space-y-8 p-2">

                    <div className="border-b pb-4 mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Platform Analytics Overview</h2>
                        <p className="text-gray-500">Generated on: {new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard icon={Users} label="Total Students" value={data.totals.students} color="blue" />
                        <StatCard icon={Users} label="Total Teachers" value={data.totals.teachers} color="indigo" />
                        <StatCard icon={BookOpen} label="Total Courses" value={data.totals.courses} color="green" />
                        <StatCard icon={Server} label="System Status" value="Healthy" color="primary" />
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6 mt-8">
                        {/* User Growth Trend */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Users size={18} className="text-indigo-500" /> 30-Day User Signups
                            </h3>
                            <div style={{ width: '100%', height: 250 }}>
                                <ResponsiveContainer>
                                    <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="dateLabel" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Area type="monotone" dataKey="newUsers" stroke="#6366f1" fillOpacity={1} fill="url(#colorUsers)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Quiz Activity Trend */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Activity size={18} className="text-green-500" /> Platform Quiz Activity
                            </h3>
                            <div style={{ width: '100%', height: 250 }}>
                                <ResponsiveContainer>
                                    <BarChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="dateLabel" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Bar dataKey="quizzesTaken" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Course Distribution */}
                        {data.courseDistribution && data.courseDistribution.length > 0 && (
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 lg:col-span-2">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Course Categories Distribution</h3>
                                <div style={{ width: '100%', height: 300 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={data.courseDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {data.courseDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </ReportExporter>
        </div>
    );
}
