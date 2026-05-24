export const levelColors = {
  Beginner: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  Developing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  Proficient: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  Advanced: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
};

export const riskColors = { High: 'bg-red-100 text-red-700', Medium: 'bg-yellow-100 text-yellow-700' };

export const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/** Human-readable elapsed time — uses days once total time is 24h or more. */
export function formatElapsedDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  const totalMins = Math.floor(ms / 60000);
  if (totalMins < 1) return '<1m';
  if (totalMins < 60) return `${totalMins}m`;

  const totalHours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  if (totalHours < 24) {
    return mins ? `${totalHours}h ${mins}m` : `${totalHours}h`;
  }

  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const parts = [`${days}d`];
  if (hours) parts.push(`${hours}h`);
  if (mins) parts.push(`${mins}m`);
  return parts.join(' ');
}

export const getInitials = (name) => name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '??';