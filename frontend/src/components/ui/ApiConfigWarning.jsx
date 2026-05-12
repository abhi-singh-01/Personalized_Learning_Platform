/**
 * Shown on production when the app was built without VITE_API_URL, so axios still uses `/api`
 * (works on localhost via Vite proxy, but not on Vercel unless you add a rewrite or set the env).
 */
export default function ApiConfigWarning() {
  const isProd = import.meta.env.PROD;
  if (!isProd || import.meta.env.VITE_API_URL) return null;

  return (
    <div className="bg-amber-500 text-amber-950 text-sm px-4 py-3 text-center font-medium shadow-md z-[100] relative">
      <strong>API URL not set at build time.</strong> Add{' '}
      <code className="px-1 py-0.5 rounded bg-black/10 text-xs">VITE_API_URL</code> in Vercel →
      Settings → Environment Variables (e.g. <code className="text-xs">https://YOUR-SERVICE.onrender.com/api</code>)
      and redeploy. Otherwise payments and login cannot reach your Render backend.
    </div>
  );
}
