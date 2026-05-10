import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import PageTransition from '../ui/PageTransition';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B1020]">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 relative">
          <div className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-100">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent dark:from-indigo-500/10 dark:via-transparent dark:to-purple-500/10" />
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl dark:bg-violet-400/10" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-400/10" />
          </div>
          <main className="relative flex-1 p-6 max-w-7xl mx-auto w-full overflow-y-auto">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </main>
        </div>
      </div>
    </div>
  );
}