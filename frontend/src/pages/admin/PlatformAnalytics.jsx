import { useState, useEffect, lazy, Suspense } from 'react';
import useApi from '../../hooks/useApi';
import Loading from '../../components/ui/Loading';
import ReportExporter from '../../components/ui/ReportExporter';
import { StatCard } from '../../components/ui/Card';
import { Users, Server, BookOpen } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';

const PlatformAnalyticsCharts = lazy(() => import('../../components/charts/PlatformAnalyticsCharts'));

export default function PlatformAnalytics() {
  usePageTitle('Platform Analytics');
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

                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Analytics Overview</h2>
                        <p className="text-gray-500 dark:text-gray-400">Generated on: {new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard icon={Users} label="Total Learners" value={data.totals.learners} color="blue" />
                        <StatCard icon={Users} label="Total Educators" value={data.totals.educators} color="indigo" />
                        <StatCard icon={BookOpen} label="Total Courses" value={data.totals.courses} color="green" />
                        <StatCard icon={Server} label="System Status" value="Healthy" color="primary" />
                    </div>

                    <Suspense
                        fallback={
                            <div className="grid lg:grid-cols-2 gap-6 mt-8">
                                <div className="h-[250px] rounded-xl bg-gray-50 dark:bg-gray-800/50 animate-pulse border border-gray-100 dark:border-gray-700" />
                                <div className="h-[250px] rounded-xl bg-gray-50 dark:bg-gray-800/50 animate-pulse border border-gray-100 dark:border-gray-700" />
                            </div>
                        }
                    >
                        <PlatformAnalyticsCharts trendData={trendData} courseDistribution={data.courseDistribution} />
                    </Suspense>

                </div>
            </ReportExporter>
        </div>
    );
}
