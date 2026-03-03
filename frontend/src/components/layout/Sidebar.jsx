import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, BookOpen, Brain, User, PlusCircle, Users } from 'lucide-react';

const studentLinks = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/student/courses', label: 'Courses', icon: BookOpen },
  { to: '/student/study-plan', label: 'AI Study Plan', icon: Brain },
  { to: '/profile', label: 'Profile', icon: User },
];

const teacherLinks = [
  { to: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/teacher/courses/new', label: 'New Course', icon: PlusCircle },
  { to: '/teacher/students', label: 'Students', icon: Users },
  { to: '/profile', label: 'Profile', icon: User },
];

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function Sidebar() {
  const { user } = useAuth();

  let links = studentLinks;
  if (user?.role === 'teacher') links = teacherLinks;
  else if (user?.role === 'admin') links = adminLinks;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-[calc(100vh-4rem)]">
      <div className="p-4">
        <div className="px-3 py-2 rounded-lg bg-primary-50 dark:bg-primary-900/30 mb-4">
          <p className="text-xs font-medium text-primary-600 dark:text-primary-400 uppercase">{user?.role}</p>
        </div>
        <nav className="space-y-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`
            }>
              <l.icon size={18} /> {l.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}