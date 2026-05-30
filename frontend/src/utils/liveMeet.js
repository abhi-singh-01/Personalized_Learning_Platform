/**
 * Jitsi live class helpers — External API embed (screen share + branding).
 */

const scriptPromises = new Map();

export function learnerLiveClassUrl(classId) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/learner/live-class/${classId}`;
}

/** Load Jitsi external_api.js once per domain. */
export function loadJitsiExternalApi(domain = 'meet.jit.si') {
  const host = String(domain || 'meet.jit.si').replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.JitsiMeetExternalAPI) {
    return Promise.resolve(window.JitsiMeetExternalAPI);
  }
  if (scriptPromises.has(host)) return scriptPromises.get(host);

  const promise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://${host}/external_api.js`;
    script.async = true;
    script.onload = () => {
      if (window.JitsiMeetExternalAPI) resolve(window.JitsiMeetExternalAPI);
      else reject(new Error('Jitsi External API failed to load'));
    };
    script.onerror = () => reject(new Error(`Could not load Jitsi from ${host}`));
    document.head.appendChild(script);
  });
  scriptPromises.set(host, promise);
  return promise;
}

export function buildJitsiMeetOptions({
  domain = 'meet.jit.si',
  roomId,
  displayName = 'Participant',
  isHost = false,
}) {
  const host = String(domain || 'meet.jit.si').replace(/^https?:\/\//, '').replace(/\/$/, '');

  return {
    domain: host,
    roomName: roomId,
    userInfo: { displayName },
    configOverwrite: {
      prejoinPageEnabled: false,
      startWithAudioMuted: false,
      startWithVideoMuted: false,
      disableDeepLinking: true,
      enableWelcomePage: false,
      disableScreenshare: false,
      enableLayerSuspension: true,
      hideConferenceSubject: true,
      hideConferenceTimer: false,
      subject: 'PLP Live Class',
      // Educator can share screen/code; learners can share when allowed by browser
      disableRemoteMute: !isHost,
    },
    interfaceConfigOverwrite: {
      APP_NAME: 'PLP Live',
      NATIVE_APP_NAME: 'PLP Live',
      PROVIDER_NAME: 'PLP',
      SHOW_JITSI_WATERMARK: false,
      SHOW_BRAND_WATERMARK: false,
      SHOW_POWERED_BY: false,
      DISPLAY_WELCOME_FOOTER: false,
      DISPLAY_WELCOME_PAGE_CONTENT: false,
      MOBILE_APP_PROMO: false,
      DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
      DISABLE_FOCUS_INDICATOR: false,
      TOOLBAR_BUTTONS: [
        'microphone',
        'camera',
        'desktop',
        'fullscreen',
        'fodeviceselection',
        'hangup',
        'tileview',
        'settings',
      ],
      TOOLBAR_ALWAYS_VISIBLE: true,
      SETTINGS_SECTIONS: ['devices', 'language'],
    },
  };
}

/** @deprecated Use JitsiMeetEmbed + buildJitsiMeetOptions instead */
export function buildJitsiSrc({ domain = 'meet.jit.si', roomId, displayName = 'Participant' }) {
  const base = `https://${domain}/${encodeURIComponent(roomId)}`;
  const hash = new URLSearchParams({
    'config.prejoinPageEnabled': 'false',
    'config.disableScreenshare': 'false',
    'config.disableDeepLinking': 'true',
    'interfaceConfig.SHOW_JITSI_WATERMARK': 'false',
    'interfaceConfig.SHOW_BRAND_WATERMARK': 'false',
    'interfaceConfig.SHOW_POWERED_BY': 'false',
    'userInfo.displayName': displayName,
  });
  return `${base}#${hash.toString()}`;
}

export function isScreenShareSupported() {
  if (typeof navigator === 'undefined') return false;
  const isSecure = window.isSecureContext;
  const hasApi = !!(navigator.mediaDevices?.getDisplayMedia);
  return isSecure && hasApi;
}
