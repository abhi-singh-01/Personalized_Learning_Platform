import { useEffect, useRef, useState } from 'react';
import { buildJitsiMeetOptions, loadJitsiExternalApi } from '../../utils/liveMeet';

export default function JitsiMeetEmbed({
  domain = 'meet.jit.si',
  roomId,
  displayName = 'Participant',
  isHost = false,
  onApiReady,
  onError,
}) {
  const containerRef = useRef(null);
  const apiRef = useRef(null);
  const onApiReadyRef = useRef(onApiReady);
  const onErrorRef = useRef(onError);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    onApiReadyRef.current = onApiReady;
  }, [onApiReady]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!roomId || !containerRef.current) return undefined;

    let disposed = false;

    const mount = async () => {
      try {
        const JitsiMeetExternalAPI = await loadJitsiExternalApi(domain);
        if (disposed || !containerRef.current) return;

        const opts = buildJitsiMeetOptions({ domain, roomId, displayName, isHost });
        const api = new JitsiMeetExternalAPI(opts.domain, {
          ...opts,
          parentNode: containerRef.current,
          width: '100%',
          height: '100%',
        });

        apiRef.current = api;
        onApiReadyRef.current?.(api);
        setLoadError('');
      } catch (err) {
        const msg = err.message || 'Could not start live video';
        setLoadError(msg);
        onErrorRef.current?.(msg);
      }
    };

    mount();

    return () => {
      disposed = true;
      if (apiRef.current) {
        try {
          apiRef.current.dispose();
        } catch {
          /* ignore */
        }
        apiRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [domain, roomId, displayName, isHost]);

  if (loadError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black text-gray-300 text-sm p-6 text-center">
        {loadError}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full">
      <div ref={containerRef} className="absolute inset-0 w-full h-full [&>iframe]:w-full [&>iframe]:h-full" />
      {/* Covers "Powered by Jitsi" on free meet.jit.si — shows PLP instead */}
      <div
        className="absolute bottom-[52px] left-2 z-[2] pointer-events-none flex items-center gap-1.5 rounded-md bg-[#202124]/90 px-2 py-1 text-[10px] text-gray-400 border border-[#3c4043]/80"
        aria-hidden
      >
        <span className="font-bold text-violet-300">PLP</span>
        <span>Live Class</span>
      </div>
    </div>
  );
}
