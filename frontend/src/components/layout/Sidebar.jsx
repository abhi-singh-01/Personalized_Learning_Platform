import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isEducatorRole } from '../../utils/rolePaths';
import {
  LayoutDashboard, BookOpen, Brain, User, PlusCircle, Users,
  TicketPercent, Radio, IndianRupee, Layout, Zap, FileText,
  Flag, Monitor, BarChart3, CreditCard
} from 'lucide-react';

const learnerLinks = [
  { to: '/learner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/learner/my-courses', label: 'My Courses', icon: BookOpen },
  { to: '/learner/courses', label: 'Explore Courses', icon: BookOpen },
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
  if (isEducatorRole(user?.role)) links = educatorLinks;
  else if (user?.role === 'admin') links = adminLinks;

  const roleName = user?.role === 'admin' ? 'Admin' : (isEducatorRole(user?.role) ? 'Educator' : 'Learner');

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white/90 dark:bg-[#0B1220]/80 backdrop-blur-xl border-r border-gray-200 dark:border-white/10 min-h-[calc(100vh-4rem)] transition-all duration-300 shadow-[0_1px_0_rgba(255,255,255,0.04)]">
      <div className="p-4 stagger-children">
        {/* Role Badge */}
        <div className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-500/10 dark:to-violet-500/10 mb-5 border border-primary-100/50 dark:border-white/10">
          <p className="text-[10px] font-bold text-primary-600 dark:text-primary-300 uppercase tracking-[0.22em]">
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
                    ? 'bg-primary-50 dark:bg-white/10 text-primary-700 dark:text-white shadow-sm shadow-primary-100 dark:shadow-black/30'
                    : 'text-gray-500 dark:text-white/70 hover:text-gray-800 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 hover:pl-4'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active indicator bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-full bg-primary-600 dark:bg-primary-300 animate-scale-in" />
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