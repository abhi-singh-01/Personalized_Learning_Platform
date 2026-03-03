export const levelColors = {
  Beginner: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  Developing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  Proficient: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  Advanced: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
};

export const riskColors = { High: 'bg-red-100 text-red-700', Medium: 'bg-yellow-100 text-yellow-700' };

export const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const getInitials = (name) => name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '??';