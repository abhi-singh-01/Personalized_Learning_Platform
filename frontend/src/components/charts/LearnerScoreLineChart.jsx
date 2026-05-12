import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function LearnerScoreLineChart({ data }) {
  if (!data?.length) return null;
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
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
  );
}
