import { useEffect } from 'react';
import { X } from 'lucide-react';
import useBDUI from '../../hooks/useBDUI';

function AnnouncementBar({ item, onDismiss, onClick }) {
  const c = item.content || {};
  const text = c.text || item.title || '';
  if (!text) return null;

  const inner = (
    <div
      className="px-4 py-2 text-sm text-center"
      style={{
        backgroundColor: c.bgColor || '#4f46e5',
        color: c.textColor || '#ffffff',
      }}
    >
      {text}
    </div>
  );

  return (
    <div className="relative">
      {c.linkTo ? (
        <a href={c.linkTo} onClick={() => onClick(item._id)} className="block hover:opacity-95">
          {inner}
        </a>
      ) : (
        inner
      )}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-white/80 hover:text-white"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

function Strip({ item, onClick }) {
  const c = item.content || {};
  const text = c.text || item.title;
  if (!text) return null;

  return (
    <div
      className={
        'rounded-lg px-4 py-3 text-sm flex items-center gap-2 ' +
        (c.bgGradient ? `bg-gradient-to-r ${c.bgGradient}` : 'bg-primary-50 dark:bg-primary-900/30')
      }
    >
      {c.emoji && <span>{c.emoji}</span>}
      <span className="flex-1">{text}</span>
      {c.linkTo && (
        <a
          href={c.linkTo}
          onClick={() => onClick(item._id)}
          className="text-primary-600 font-medium text-xs whitespace-nowrap"
        >
          Learn more
        </a>
      )}
    </div>
  );
}

function Banner({ item, onClick }) {
  const c = item.content || {};
  const title = item.title || c.heading;
  const desc = item.description || c.subtitle;

  return (
    <div
      className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
      style={{ backgroundColor: c.bgColor || undefined }}
    >
      {c.imageUrl && (
        <img src={c.imageUrl} alt="" className="w-full h-40 object-cover" />
      )}
      <div className="p-4" style={{ color: c.textColor || undefined }}>
        {title && <h3 className="font-semibold">{title}</h3>}
        {desc && <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{desc}</p>}
        {c.linkTo && c.buttonText && (
          <a
            href={c.linkTo}
            onClick={() => onClick(item._id)}
            className="inline-block mt-3 btn-primary text-sm"
          >
            {c.buttonText}
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * Renders backend-driven UI blocks for a screen (announcements, strips, banners).
 */
export default function BDUIPanel({ screen, className = '' }) {
  const {
    announcements,
    strips,
    banners,
    loaded,
    trackImpression,
    trackClick,
  } = useBDUI(screen);

  useEffect(() => {
    if (!loaded) return;
    [...announcements, ...strips, ...banners].forEach((item) => {
      if (item._id) trackImpression(item._id);
    });
  }, [loaded, announcements, strips, banners, trackImpression]);

  if (!loaded) return null;

  const hasContent =
    announcements.length > 0 || strips.length > 0 || banners.length > 0;
  if (!hasContent) return null;

  const handleClick = (id) => {
    if (id) trackClick(id);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {announcements.map((item) => (
        <AnnouncementBar key={item._id} item={item} onClick={handleClick} />
      ))}
      {strips.map((item) => (
        <Strip key={item._id} item={item} onClick={handleClick} />
      ))}
      {banners.map((item) => (
        <Banner key={item._id} item={item} onClick={handleClick} />
      ))}
    </div>
  );
}

/** Fixed top bar for global announcements (below navbar). */
export function BDUIAnnouncementBar() {
  const { announcements, loaded, trackImpression, trackClick } = useBDUI('global');

  useEffect(() => {
    if (!loaded) return;
    announcements.forEach((item) => {
      if (item._id) trackImpression(item._id);
    });
  }, [loaded, announcements, trackImpression]);

  if (!loaded || announcements.length === 0) return null;

  const item = announcements[0];
  return (
    <AnnouncementBar
      item={item}
      onClick={(id) => trackClick(id)}
    />
  );
}
