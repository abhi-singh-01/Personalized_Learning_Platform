import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Users, Hand,
  PhoneOff, Copy, Check, Sparkles, ChevronLeft, ChevronRight,
  Brain, Radio, X,
} from 'lucide-react';

function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function ControlButton({ active, danger, label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`flex flex-col items-center justify-center gap-1 min-w-[52px] sm:min-w-[56px] transition-all ${
        disabled ? 'opacity-40 cursor-not-allowed' : ''
      }`}
    >
      <span
        className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full transition-all ${
          danger
            ? 'bg-red-600 hover:bg-red-500 text-white'
            : active
              ? 'bg-[#8ab4f8] text-[#202124]'
              : 'bg-[#3c4043] hover:bg-[#5f6368] text-white'
        }`}
      >
        {children}
      </span>
      <span className="text-[10px] sm:text-xs text-gray-300 hidden sm:block max-w-[64px] truncate">{label}</span>
    </button>
  );
}

/**
 * Google Meet–style shell for PLP live classes (Jitsi inside + PLP chat/hands).
 */
export default function LiveMeetShell({
  role = 'learner',
  title,
  subtitle,
  jitsiSrc,
  startedAt,
  participantCount = 0,
  messages = [],
  onSendMessage,
  chatEnabled = true,
  handRaised = false,
  onToggleHand,
  raisedHands = [],
  onDismissHand,
  onCopyLink,
  onLeave,
  onEndClass,
  uniqueFeatures = null,
  ended = false,
}) {
  const [sidePanel, setSidePanel] = useState('chat');
  const [panelOpen, setPanelOpen] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!startedAt) return undefined;
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Date.now() - start);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCopy = async () => {
    if (!onCopyLink) return;
    try {
      await onCopyLink();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !onSendMessage) return;
    onSendMessage(newMessage.trim());
    setNewMessage('');
  };

  if (ended) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124] text-white p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-[#3c4043] flex items-center justify-center mx-auto mb-4">
            <PhoneOff size={28} />
          </div>
          <h2 className="text-xl font-semibold mb-2">Class ended</h2>
          <p className="text-gray-400 text-sm mb-6">Thanks for joining. You can return to your dashboard.</p>
          <button type="button" onClick={onLeave} className="px-6 py-2.5 rounded-full bg-[#8ab4f8] text-[#202124] font-semibold">
            Return to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#202124] text-white">
      {/* Top bar — Meet-style */}
      <header className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-[#202124] border-b border-[#3c4043] shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 shrink-0">
            <span className="text-xs font-bold">PLP</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <h1 className="text-sm sm:text-base font-medium truncate">{title || 'Live Class'}</h1>
            </div>
            {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="hidden sm:inline text-xs font-mono text-gray-400 tabular-nums">{formatDuration(elapsed)}</span>
          <span className="hidden md:flex items-center gap-1 text-xs text-gray-400 bg-[#3c4043] px-2 py-1 rounded-full">
            <Users size={12} /> {participantCount}
          </span>
          {onCopyLink && (
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs bg-[#3c4043] hover:bg-[#5f6368] px-2 sm:px-3 py-1.5 rounded-full transition-colors"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy link'}</span>
            </button>
          )}
        </div>
      </header>

      {/* PLP unique features strip */}
      {uniqueFeatures && (
        <div className="px-3 py-2 bg-gradient-to-r from-violet-900/40 to-indigo-900/30 border-b border-violet-500/20 text-xs flex flex-wrap items-center gap-2 shrink-0">
          <Sparkles size={14} className="text-violet-300 shrink-0" />
          {uniqueFeatures}
        </div>
      )}

      {/* Main stage */}
      <div className="flex flex-1 min-h-0 relative">
        <div className={`flex-1 min-w-0 flex flex-col ${panelOpen ? 'lg:mr-0' : ''}`}>
          <div className="flex-1 min-h-0 bg-black relative">
            <iframe
              title="Live class video"
              src={jitsiSrc}
              className="absolute inset-0 w-full h-full border-0"
              allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
            />
            {/* Host raised-hands overlay */}
            {role === 'host' && raisedHands.length > 0 && (
              <div className="absolute top-3 left-3 right-3 sm:right-auto sm:max-w-xs z-10">
                <div className="bg-[#3c4043]/95 backdrop-blur rounded-xl p-3 border border-yellow-500/30 shadow-lg">
                  <p className="text-xs font-semibold text-yellow-300 mb-2 flex items-center gap-1">
                    <Hand size={14} /> Hands raised ({raisedHands.length})
                  </p>
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {raisedHands.map((u) => (
                      <div key={u.userId} className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate">{u.name || 'Learner'}</span>
                        {onDismissHand && (
                          <button
                            type="button"
                            onClick={() => onDismissHand(u.userId)}
                            className="text-xs text-gray-400 hover:text-white shrink-0"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Side panel — chat / people */}
        {panelOpen && (
          <aside className="w-full sm:w-80 lg:w-96 border-l border-[#3c4043] bg-[#292a2d] flex flex-col absolute inset-y-0 right-0 z-20 lg:relative lg:inset-auto shadow-2xl lg:shadow-none max-w-full">
            <div className="flex border-b border-[#3c4043]">
              <button
                type="button"
                onClick={() => setSidePanel('chat')}
                className={`flex-1 py-3 text-sm font-medium ${sidePanel === 'chat' ? 'text-[#8ab4f8] border-b-2 border-[#8ab4f8]' : 'text-gray-400'}`}
              >
                Chat
              </button>
              <button
                type="button"
                onClick={() => setSidePanel('people')}
                className={`flex-1 py-3 text-sm font-medium ${sidePanel === 'people' ? 'text-[#8ab4f8] border-b-2 border-[#8ab4f8]' : 'text-gray-400'}`}
              >
                People ({participantCount})
              </button>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="px-3 text-gray-400 hover:text-white lg:hidden"
                aria-label="Close panel"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {sidePanel === 'chat' ? (
              <>
                <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                  {messages.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">No messages yet. Say hello!</p>
                  )}
                  {messages.map((msg, i) => (
                    <div key={msg._id || i} className="text-sm">
                      <span className="font-medium text-[#8ab4f8]">{msg.userName || 'User'}</span>
                      <span className="text-gray-300 ml-1.5">{msg.message}</span>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                {chatEnabled && onSendMessage && (
                  <form onSubmit={handleSend} className="p-3 border-t border-[#3c4043] flex gap-2 shrink-0">
                    <input
                      className="flex-1 bg-[#3c4043] border-0 rounded-full px-4 py-2 text-sm text-white placeholder:text-gray-500 focus:ring-2 focus:ring-[#8ab4f8] outline-none"
                      placeholder="Send a message to everyone"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="h-10 w-10 rounded-full bg-[#8ab4f8] text-[#202124] flex items-center justify-center disabled:opacity-40"
                    >
                      <MessageSquare size={18} />
                    </button>
                  </form>
                )}
              </>
            ) : (
              <div className="flex-1 overflow-y-auto p-4">
                <p className="text-sm text-gray-400 mb-3">In meeting</p>
                <div className="flex items-center gap-2 py-2">
                  <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-sm font-bold">
                    {role === 'host' ? 'E' : 'L'}
                  </div>
                  <span className="text-sm">{role === 'host' ? 'You (Host)' : 'You'}</span>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Video and audio are powered by secure WebRTC inside the meeting. Use the toolbar below for PLP features.
                </p>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Bottom control bar — Google Meet style */}
      <footer className="shrink-0 px-2 sm:px-6 py-3 sm:py-4 bg-[#202124] border-t border-[#3c4043]">
        <div className="flex items-center justify-center gap-1 sm:gap-3 flex-wrap">
          {!panelOpen && (
            <ControlButton label="Open panel" onClick={() => setPanelOpen(true)}>
              <ChevronLeft size={22} />
            </ControlButton>
          )}

          {role === 'learner' && onToggleHand && (
            <ControlButton label={handRaised ? 'Lower hand' : 'Raise hand'} active={handRaised} onClick={onToggleHand}>
              <Hand size={22} />
            </ControlButton>
          )}

          <ControlButton label="Chat" active={panelOpen && sidePanel === 'chat'} onClick={() => { setPanelOpen(true); setSidePanel('chat'); }}>
            <MessageSquare size={22} />
          </ControlButton>

          <ControlButton label="People" active={panelOpen && sidePanel === 'people'} onClick={() => { setPanelOpen(true); setSidePanel('people'); }}>
            <Users size={22} />
          </ControlButton>

          {role === 'host' && (
            <ControlButton label="PLP Live" active onClick={() => {}} disabled>
              <Radio size={22} />
            </ControlButton>
          )}

          {role === 'learner' && (
            <ControlButton label="AI tips" onClick={() => {}} disabled title="Available after class on course page">
              <Brain size={22} />
            </ControlButton>
          )}

          <div className="w-px h-10 bg-[#3c4043] mx-1 sm:mx-2 hidden sm:block" />

          {role === 'host' && onEndClass ? (
            <ControlButton label="End for all" danger onClick={onEndClass}>
              <PhoneOff size={22} />
            </ControlButton>
          ) : (
            <ControlButton label="Leave" danger onClick={onLeave}>
              <PhoneOff size={22} />
            </ControlButton>
          )}
        </div>
        <p className="text-center text-[10px] text-gray-500 mt-2 hidden sm:block">
          Mic & camera controls are inside the video area · PLP chat & raise hand work here
        </p>
      </footer>
    </div>
  );
}
