/**
 * Jitsi embed URL tuned for in-app Meet-style experience.
 */
export function buildJitsiSrc({ domain = 'meet.jit.si', roomId, displayName = 'Participant' }) {
  const base = `https://${domain}/${encodeURIComponent(roomId)}`;
  const hash = new URLSearchParams({
    'config.prejoinPageEnabled': 'false',
    'config.startWithAudioMuted': 'false',
    'config.disableDeepLinking': 'true',
    'config.enableWelcomePage': 'false',
    'interfaceConfig.SHOW_JITSI_WATERMARK': 'false',
    'interfaceConfig.SHOW_BRAND_WATERMARK': 'false',
    'interfaceConfig.DISABLE_JOIN_LEAVE_NOTIFICATIONS': 'true',
    'userInfo.displayName': displayName,
  });
  return `${base}#${hash.toString()}`;
}

export function learnerLiveClassUrl(classId) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/learner/live-class/${classId}`;
}
