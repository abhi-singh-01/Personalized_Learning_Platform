import { Video, Mic, Users, Sparkles, Shield } from 'lucide-react';

/**
 * Google Meet–style pre-join lobby before entering the video room.
 */
export default function LiveClassLobby({
  title,
  subtitle,
  role = 'learner',
  onJoin,
  onCancel,
  joining = false,
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#202124] text-white p-4 sm:p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 mb-4">
            <Video size={28} />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold mb-1">{title || 'Live Class'}</h1>
          {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
        </div>

        <div className="rounded-2xl bg-[#292a2d] border border-[#3c4043] p-6 space-y-4">
          <div className="aspect-video rounded-xl bg-[#3c4043] flex items-center justify-center relative overflow-hidden">
            <div className="text-center px-4">
              <div className="w-20 h-20 rounded-full bg-violet-600/80 flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
                {role === 'host' ? 'H' : 'L'}
              </div>
              <p className="text-sm text-gray-300">Camera & mic ready inside the meeting</p>
            </div>
          </div>

          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-center gap-2">
              <Mic size={16} className="text-[#8ab4f8] shrink-0" />
              Allow microphone when your browser asks
            </li>
            <li className="flex items-center gap-2">
              <Video size={16} className="text-[#8ab4f8] shrink-0" />
              HD video powered by secure WebRTC
            </li>
            <li className="flex items-center gap-2">
              <Users size={16} className="text-[#8ab4f8] shrink-0" />
              {role === 'host' ? 'You are the meeting host' : 'Join with other enrolled learners'}
            </li>
          </ul>

          {role === 'host' && (
            <div className="flex items-start gap-2 text-xs text-violet-200 bg-violet-900/30 rounded-lg p-3 border border-violet-500/20">
              <Sparkles size={14} className="shrink-0 mt-0.5" />
              <span>
                PLP host tools: live chat, raised-hand queue, copy invite link, and end class for everyone.
              </span>
            </div>
          )}

          {role === 'learner' && (
            <div className="flex items-start gap-2 text-xs text-indigo-200 bg-indigo-900/30 rounded-lg p-3 border border-indigo-500/20">
              <Sparkles size={14} className="shrink-0 mt-0.5" />
              <span>
                Raise your hand anytime · AI notes available on the course page after class
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Shield size={12} />
            Encrypted live session · Only enrolled members can join
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-3 rounded-full border border-[#5f6368] text-gray-300 hover:bg-[#3c4043] transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={onJoin}
              disabled={joining}
              className="flex-1 py-3 rounded-full bg-[#1a73e8] hover:bg-[#1967d2] text-white font-semibold text-sm shadow-lg disabled:opacity-60 transition-colors"
            >
              {joining ? 'Joining…' : role === 'host' ? 'Join as host' : 'Join now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
