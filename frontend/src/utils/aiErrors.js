/** Map API/AI errors to short, user-friendly copy (no technical jargon). */
export function friendlyAiMessage(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const m = raw.toLowerCase();

  if (m.includes('generate notes') || m.includes('notes could not')) {
    return 'Notes could not be generated. Ensure GEMINI_API_KEY is set on the server and try again.';
  }
  if (m.includes('syllabus')) {
    return 'Syllabus could not be extracted. Try again in a moment.';
  }
  if (m.includes('roadmap')) {
    return 'Roadmap could not be built. Try again in a moment.';
  }
  if (
    m.includes('transcript') ||
    m.includes('invalid') ||
    m.includes('gemini') ||
    m.includes('ai returned') ||
    m.includes('could not prepare')
  ) {
    return 'AI could not process this lecture. Try Generate Notes — it reads the video directly.';
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
