import { useRef, useState, useEffect, useCallback } from 'react';
import { RotateCcw, RotateCw, Play, Pause, Maximize2 } from 'lucide-react';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

let ytApiPromise = null;
function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prev === 'function') prev();
      resolve(window.YT);
    };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  });
  return ytApiPromise;
}

function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function CourseVideoPlayer({ title, src, youtubeId }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const ytHostRef = useRef(null);
  const ytPlayerRef = useRef(null);

  const isYouTube = Boolean(youtubeId);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [quality, setQuality] = useState('auto');
  const [qualities, setQualities] = useState([{ value: 'auto', label: 'Auto' }]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ytReady, setYtReady] = useState(false);

  const applySpeed = useCallback((rate) => {
    setSpeed(rate);
    if (isYouTube && ytPlayerRef.current?.setPlaybackRate) {
      ytPlayerRef.current.setPlaybackRate(rate);
    } else if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  }, [isYouTube]);

  const skip = useCallback((delta) => {
    if (isYouTube && ytPlayerRef.current?.getCurrentTime) {
      const t = ytPlayerRef.current.getCurrentTime() || 0;
      const d = ytPlayerRef.current.getDuration?.() || duration;
      ytPlayerRef.current.seekTo(Math.max(0, Math.min(d, t + delta)), true);
      setCurrentTime(Math.max(0, Math.min(d, t + delta)));
    } else if (videoRef.current) {
      const next = Math.max(0, Math.min(videoRef.current.duration || duration, videoRef.current.currentTime + delta));
      videoRef.current.currentTime = next;
      setCurrentTime(next);
    }
  }, [isYouTube, duration]);

  const togglePlay = useCallback(() => {
    if (isYouTube && ytPlayerRef.current) {
      const state = ytPlayerRef.current.getPlayerState?.();
      if (state === 1) {
        ytPlayerRef.current.pauseVideo();
        setPlaying(false);
      } else {
        ytPlayerRef.current.playVideo();
        setPlaying(true);
      }
    } else if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setPlaying(true);
      } else {
        videoRef.current.pause();
        setPlaying(false);
      }
    }
  }, [isYouTube]);

  const applyQuality = useCallback((value) => {
    setQuality(value);
    if (isYouTube && ytPlayerRef.current?.setPlaybackQuality && value !== 'auto') {
      ytPlayerRef.current.setPlaybackQuality(value);
    }
  }, [isYouTube]);

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  useEffect(() => {
    if (!isYouTube || !youtubeId || !ytHostRef.current) return undefined;

    let player = null;
    let tick = null;

    loadYouTubeApi().then((YT) => {
      player = new YT.Player(ytHostRef.current, {
        videoId: youtubeId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          autoplay: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (e) => {
            ytPlayerRef.current = e.target;
            setYtReady(true);
            setDuration(e.target.getDuration() || 0);
            e.target.setPlaybackRate(speed);
            const levels = e.target.getAvailableQualityLevels?.() || [];
            const opts = [{ value: 'auto', label: 'Auto' }];
            levels.forEach((lvl) => {
              if (lvl && lvl !== 'auto') {
                opts.push({ value: lvl, label: lvl.toUpperCase().replace('HD', ' HD').replace('HIGH', 'High').trim() });
              }
            });
            if (opts.length > 1) setQualities(opts);
          },
          onStateChange: (e) => {
            setPlaying(e.data === 1);
          },
        },
      });
      ytPlayerRef.current = player;

      tick = setInterval(() => {
        const p = ytPlayerRef.current;
        if (p?.getCurrentTime) {
          setCurrentTime(p.getCurrentTime() || 0);
          const d = p.getDuration?.();
          if (d) setDuration(d);
        }
      }, 500);
    });

    return () => {
      clearInterval(tick);
      try {
        player?.pauseVideo?.();
        player?.stopVideo?.();
        player?.destroy?.();
      } catch {
        /* ignore */
      }
      ytPlayerRef.current = null;
    };
  }, [isYouTube, youtubeId]);

  useEffect(() => {
    if (isYouTube || !videoRef.current) return undefined;
    const v = videoRef.current;

    const onMeta = () => {
      setDuration(v.duration || 0);
      const h = v.videoHeight;
      if (h >= 720) {
        setQualities([
          { value: 'auto', label: 'Auto (original)' },
          { value: '720', label: '720p' },
          { value: '480', label: '480p' },
          { value: '360', label: '360p' },
        ]);
      } else if (h >= 480) {
        setQualities([
          { value: 'auto', label: 'Auto (original)' },
          { value: '480', label: '480p' },
          { value: '360', label: '360p' },
        ]);
      }
    };
    const onTime = () => setCurrentTime(v.currentTime || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    v.addEventListener('loadedmetadata', onMeta);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);

    return () => {
      v.pause();
      v.removeAttribute('src');
      v.load();
      v.removeEventListener('loadedmetadata', onMeta);
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
    };
  }, [isYouTube, src]);

  useEffect(() => {
    if (isYouTube || !videoRef.current || quality === 'auto') return;
    const v = videoRef.current;
    const h = parseInt(quality, 10);
    if (Number.isFinite(h)) {
      v.style.maxHeight = `${h}px`;
      v.style.margin = '0 auto';
      v.style.objectFit = 'contain';
    }
  }, [quality, isYouTube]);

  return (
    <div ref={containerRef} className="rounded-xl overflow-hidden bg-black border border-gray-800">
      {title && (
        <div className="px-4 py-2 bg-gray-900/90 border-b border-gray-800">
          <p className="text-sm font-medium text-white truncate">{title}</p>
        </div>
      )}

      <div className="aspect-video relative bg-black">
        {isYouTube ? (
          <div ref={ytHostRef} className="absolute inset-0 w-full h-full" title={title} />
        ) : (
          <video
            ref={videoRef}
            src={src}
            className="w-full h-full absolute inset-0 object-contain bg-black"
            autoPlay
            playsInline
            preload="metadata"
            controlsList="nodownload"
            onClick={togglePlay}
          />
        )}
      </div>

      <div className="px-3 sm:px-4 py-3 bg-gray-900 text-white space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-400 font-mono tabular-nums">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => skip(-5)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-medium transition-colors"
            title="Back 5 seconds"
          >
            <RotateCcw size={14} />
            5s
          </button>

          <button
            type="button"
            onClick={togglePlay}
            disabled={isYouTube && !ytReady}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary-600 hover:bg-primary-500 transition-colors disabled:opacity-50"
            title={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={() => skip(5)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-medium transition-colors"
            title="Forward 5 seconds"
          >
            5s
            <RotateCw size={14} />
          </button>

          <div className="h-6 w-px bg-gray-700 hidden sm:block" />

          <label className="inline-flex items-center gap-1.5 text-xs text-gray-300">
            <span className="text-gray-500">Speed</span>
            <select
              value={speed}
              onChange={(e) => applySpeed(parseFloat(e.target.value))}
              className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white focus:ring-1 focus:ring-primary-500 outline-none"
            >
              {SPEEDS.map((s) => (
                <option key={s} value={s}>{s === 1 ? 'Normal' : `${s}x`}</option>
              ))}
            </select>
          </label>

          <label className="inline-flex items-center gap-1.5 text-xs text-gray-300">
            <span className="text-gray-500">Quality</span>
            <select
              value={quality}
              onChange={(e) => applyQuality(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white focus:ring-1 focus:ring-primary-500 outline-none max-w-[120px]"
            >
              {qualities.map((q) => (
                <option key={q.value} value={q.value}>{q.label}</option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="ml-auto inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            title="Fullscreen"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
