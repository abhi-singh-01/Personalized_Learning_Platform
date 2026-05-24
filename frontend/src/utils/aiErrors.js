/** Map API/AI errors to short, user-friendly copy (no technical jargon). */
export function friendlyAiMessage(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const m = raw.toLowerCase();

  if (
    m.includes('transcript') ||
    m.includes('invalid') ||
    m.includes('gemini') ||
    m.includes('ai returned') ||
    m.includes('could not prepare')
  ) {
    return 'Transcript is not available for this video yet. Use Transcribe to try again.';
  }
  if (m.includes('network') || m.includes('timeout') || m.includes('fetch')) {
    return 'Connection issue. Check your network and try again.';
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'AI is busy. Please wait a moment and try again.';
  }
  if (m.includes('not found') || m.includes('video file')) {
    return 'This video file could not be loaded. Contact your educator if it keeps happening.';
  }

  return 'Something went wrong. Please try again.';
}
