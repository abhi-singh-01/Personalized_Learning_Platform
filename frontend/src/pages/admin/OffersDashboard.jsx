import { useEffect, useState } from 'react';
import useApi from '../../hooks/useApi';
import Loading from '../../components/ui/Loading';
import { TicketPercent, IndianRupee, TrendingUp, Users, Calendar } from 'lucide-react';

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="card flex items-center gap-3">
      <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}

export default function OffersDashboard() {
  const api = useApi();
  const [data, setData] = useState(null);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const fetchData = async ({ start: startParam, end: endParam } = {}) => {
    const params = new URLSearchParams();
    if (startParam) params.append('start', startParam);
    if (endParam) params.append('end', endParam);
    const qs = params.toString();
    const url = qs ? `/payments/coupons/analytics?${qs}` : '/payments/coupons/analytics';

    const res = await api.get(url);
    setData(res.data);
  };

  useEffect(() => {
    fetchData().catch(() => {});
  }, []);

  if (api.loading && !data) return <Loading />;
  if (!data) return <Loading />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <TicketPercent className="text-primary-600" />
        Offer Analytics
      </h1>

      <div className="card !p-4 flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between">
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-500 mb-1">Start</span>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                className="input-field pl-10"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-500 mb-1">End</span>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                className="input-field pl-10"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            className="btn-primary"
            onClick={() => fetchData({ start, end }).catch(() => {})}
          >
            Apply
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              setStart('');
              setEnd('');
              fetchData().catch(() => {});
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={TicketPercent} label="Coupons" value={data.totals.couponCount} />
        <Stat icon={Users} label="Redemptions" value={data.totals.redemptions} />
        <Stat icon={IndianRupee} label="Discount Given" value={data.totals.totalDiscountGiven.toFixed(2)} />
        <Stat icon={TrendingUp} label="Revenue (After Discount)" value={data.totals.revenueAfterDiscount.toFixed(2)} />
        <Stat
          icon={TrendingUp}
          label="Conversion Rate"
          value={`${data.totals.conversionRate.toFixed(2)}%`}
        />
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 font-semibold">
          Coupon performance
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Redemptions</th>
                <th className="px-4 py-3">Conversion</th>
                <th className="px-4 py-3">Discount Given</th>
                <th className="px-4 py-3">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.coupons.map((c) => (
                <tr key={c.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-3 font-medium">{c.code}</td>
                  <td className="px-4 py-3">{c.type}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700'}`}>
                      {c.isActive ? 'active' : 'inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{c.redemptions}</td>
                  <td className="px-4 py-3">{(c.conversionRate || 0).toFixed(2)}%</td>
                  <td className="px-4 py-3">{c.totalDiscountGiven.toFixed(2)}</td>
                  <td className="px-4 py-3">{c.revenueAfterDiscount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
