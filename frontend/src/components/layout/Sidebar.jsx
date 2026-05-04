import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, BookOpen, Brain, User, PlusCircle, Users,
  TicketPercent, Radio, IndianRupee, Layout, Zap, FileText,
  Flag, Monitor, BarChart3, CreditCard
} from 'lucide-react';

const learnerLinks = [
  { to: '/learner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/learner/courses', label: 'Courses', icon: BookOpen },
  { to: '/learner/study-plan', label: 'AI Study Plan', icon: Brain },
  { to: '/learner/payments', label: 'Payments', icon: CreditCard },
  { to: '/profile', label: 'Profile', icon: User },
];

const educatorLinks = [
  { to: '/educator/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/educator/courses', label: 'My Courses', icon: BookOpen },
  { to: '/educator/live-classes', label: 'Live Classes', icon: Radio },
  { to: '/educator/coupons', label: 'Coupons', icon: TicketPercent },
  { to: '/educator/earnings', label: 'Earnings', icon: IndianRupee },
  { to: '/educator/learners', label: 'Learners', icon: Users },
  { to: '/profile', label: 'Profile', icon: User },
];

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/offers', label: 'Offers', icon: TicketPercent },
  { to: '/admin/ui-config', label: 'UI Manager', icon: Layout },
  { to: '/admin/feature-flags', label: 'Feature Flags', icon: Zap },
  { to: '/admin/live-monitor', label: 'Live Monitor', icon: Monitor },
  { to: '/admin/moderation', label: 'Moderation', icon: Flag },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function Sidebar() {
  const { user } = useAuth();

  let links = learnerLinks;
  if (user?.role === 'educator') links = educatorLinks;
  else if (user?.role === 'admin') links = adminLinks;

  const roleName = user?.role === 'admin' ? 'Admin' : (user?.role === 'educator' ? 'Educator' : 'Learner');

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-[calc(100vh-4rem)] transition-all duration-300">
      <div className="p-4 stagger-children">
        {/* Role Badge */}
        <div className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 mb-5 border border-primary-100/50 dark:border-primary-800/30">
          <p className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-[0.2em]">
            {roleName} Panel
          </p>
        </div>

        {/* Navigation */}
        <nav className="space-y-0.5">
          {links.map((l, i) => (
            <NavLink
              key={l.to}
              to={l.to}
              style={{ animationDelay: `${i * 0.03}s` }}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shadow-sm shadow-primary-100 dark:shadow-primary-900/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:pl-4'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active indicator bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-full bg-primary-600 dark:bg-primary-400 animate-scale-in" />
                  )}
                  <l.icon size={18} className={`flex-shrink-0 transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`} />
                  <span>{l.label}</span>
                  {l.label === 'Live Classes' && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}