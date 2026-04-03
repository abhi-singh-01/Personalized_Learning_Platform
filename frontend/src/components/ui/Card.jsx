export default function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`card ${hover ? 'card-interactive' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, color = 'primary', subtext, trend }) {
  const colors = {
    primary: 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400',
  };
  return (
    <div className="card group hover:shadow-md transition-all duration-300 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colors[color]} transition-transform duration-300 group-hover:scale-110`}>
        <Icon size={24} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold">{value}</p>
          {trend && (
            <span className={`text-xs font-semibold ${trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-gray-400'}`}>
              {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}{Math.abs(trend)}%
            </span>
          )}
        </div>
        {subtext && <p className="text-xs text-gray-400 mt-0.5 truncate">{subtext}</p>}
      </div>
    </div>
  );
}