import { useState } from 'react';
import { ExternalLink, FileText, Loader2 } from 'lucide-react';

export default function PdfViewer({ src, title }) {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  if (!src) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-8 text-center">
        <FileText size={40} className="mx-auto text-gray-400 mb-3" />
        <p className="text-sm text-gray-600 dark:text-gray-300">PDF unavailable.</p>
      </div>
    );
  }

  const iframeSrc = src.includes('#') ? src : `${src}#toolbar=1&navpanes=0`;

  return (
    <div className="relative rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {loading && !failed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-50/90 dark:bg-gray-900/90 z-10">
          <Loader2 size={28} className="animate-spin text-primary-600" />
          <p className="text-sm text-gray-500">Loading PDF…</p>
        </div>
      )}
      {failed ? (
        <div className="p-8 text-center">
          <FileText size={40} className="mx-auto text-blue-400 mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Could not preview this PDF in the browser. Open it in a new tab instead.
          </p>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-2"
          >
            <ExternalLink size={16} />
            Open PDF
          </a>
        </div>
      ) : (
        <iframe
          src={iframeSrc}
          title={title || 'PDF document'}
          className="w-full h-[70vh] min-h-[420px] bg-white dark:bg-gray-950"
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setFailed(true);
          }}
        />
      )}
    </div>
  );
}
