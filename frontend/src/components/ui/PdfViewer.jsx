import { useState, useEffect, useRef } from 'react';
import { ExternalLink, FileText, Loader2 } from 'lucide-react';

export default function PdfViewer({ src, title, materialId, onOpenInNewTab }) {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [opening, setOpening] = useState(false);
  const loadTimerRef = useRef(null);

  const clearLoadTimer = () => {
    if (loadTimerRef.current) {
      clearTimeout(loadTimerRef.current);
      loadTimerRef.current = null;
    }
  };

  useEffect(() => {
    setLoading(true);
    setFailed(false);
    clearLoadTimer();

    if (!src) {
      setLoading(false);
      return undefined;
    }

    loadTimerRef.current = setTimeout(() => {
      setLoading(false);
      setFailed(true);
    }, 15000);

    return clearLoadTimer;
  }, [src]);

  const handleLoad = () => {
    clearLoadTimer();
    setLoading(false);
    setFailed(false);
  };

  const handleOpenExternal = async () => {
    if (!materialId || !onOpenInNewTab) return;
    setOpening(true);
    try {
      await onOpenInNewTab(materialId);
    } finally {
      setOpening(false);
    }
  };

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
        <div className="p-8 text-center min-h-[280px] flex flex-col items-center justify-center">
          <FileText size={40} className="mx-auto text-blue-400 mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Could not preview this PDF in the browser. Open it in a new tab instead.
          </p>
          <button
            type="button"
            disabled={opening || !materialId || !onOpenInNewTab}
            onClick={handleOpenExternal}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
          >
            <ExternalLink size={16} />
            {opening ? 'Opening…' : 'Open PDF'}
          </button>
        </div>
      ) : (
        <iframe
          src={iframeSrc}
          title={title || 'PDF document'}
          className="w-full h-[70vh] min-h-[420px] bg-white dark:bg-gray-950"
          onLoad={handleLoad}
        />
      )}
    </div>
  );
}
