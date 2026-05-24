import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isLearnerRole } from '../../utils/rolePaths';
import API from '../../api/axios';
import {
  MessageCircle,
  X,
  Send,
  Trash2,
  BookOpen,
  Sparkles,
  Paperclip,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import '../../styles/AIChatBot.css';

const SUMMARIZE_FILE_PROMPT =
  'Please summarize this attached file in plain language. Use short paragraphs and highlight the main ideas. If something is unclear from the file, say so briefly.';

/** Must match `.chatbot-input` max-height in AIChatBot.css */
const CHAT_INPUT_MAX_HEIGHT_PX = 160;

// ── Simple Markdown renderer ──
function renderMarkdown(text) {
  if (!text) return '';
  let html = text
    // Code blocks
    .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Unordered list items
    .replace(/^[\s]*[-•]\s+(.+)/gm, '<li>$1</li>')
    // Numbered list items
    .replace(/^[\s]*\d+\.\s+(.+)/gm, '<li>$1</li>')
    // Wrap consecutive <li> elements in <ul>
    .replace(/((?:<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '</p><p>')
    // Single line breaks
    .replace(/\n/g, '<br />');

  return '<p>' + html + '</p>';
}

// ── Typing Indicator ──
function TypingIndicator() {
  return (
    <div className="chatbot-typing">
      <div className="chatbot-typing-dot" />
      <div className="chatbot-typing-dot" />
      <div className="chatbot-typing-dot" />
    </div>
  );
}

export default function AIChatBot() {
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState('');
  const [courseContext, setCourseContext] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // ── Detect course context from URL ──
  useEffect(() => {
    if (!user || !isLearnerRole(user.role)) return;
    const match = location.pathname.match(/\/learner\/courses\/([a-f0-9]{24})/);
    if (match) {
      setCourseContext({ id: match[1] });
      // Fetch course name for display
      API.get(`/courses/${match[1]}`)
        .then(res => {
          const course = res.data?.data || res.data;
          setCourseContext({ id: match[1], title: course.title });
        })
        .catch(() => {});
    } else {
      setCourseContext(null);
    }
  }, [location.pathname, user]);

  // ── Load saved messages from sessionStorage ──
  useEffect(() => {
    const saved = sessionStorage.getItem('chatbot_messages');
    if (saved) {
      try { setMessages(JSON.parse(saved)); } catch {}
    }
  }, []);

  // Save messages to sessionStorage
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem('chatbot_messages', JSON.stringify(messages.slice(-50)));
    }
  }, [messages]);

  // ── Auto-scroll to bottom ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // ── Focus input when opened ──
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [isOpen]);

  // Reset textarea height after send clears input (inline height would otherwise persist)
  useEffect(() => {
    if (!input && inputRef.current) {
      inputRef.current.style.removeProperty('height');
    }
  }, [input]);

  // ── Load suggestions ──
  const loadSuggestions = useCallback(async () => {
    try {
      const params = courseContext?.id ? `?courseId=${courseContext.id}` : '';
      const res = await API.get(`/chatbot/suggest${params}`);
      const data = res.data?.data || res.data;
      setSuggestions(data.questions || []);
    } catch {
      setSuggestions([
        'What are we learning in this course?',
        'Can you explain the key concepts?',
        'Help me prepare for the quiz',
        'What should I study first?',
      ]);
    }
  }, [courseContext]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadSuggestions();
    }
  }, [isOpen, loadSuggestions]);

  // ── Only show for learners — MUST be after all hooks ──
  if (!user || !isLearnerRole(user.role)) return null;

  // ── Send Message — tries streaming first, falls back to non-streaming ──
  const sendMessage = async (text) => {
    const rawMsg = (text !== undefined && text !== null ? String(text) : input).trim();
    const fileSnapshot = attachment;
    const msg = rawMsg || (fileSnapshot ? 'Attached a file for doubt solving.' : '');
    if ((!msg && !fileSnapshot) || isStreaming) return;

    setInput('');
    setError('');
    setSuggestions([]);

    const userMsg = {
      role: 'user',
      content: msg,
      attachment: fileSnapshot ? { name: fileSnapshot.name, type: fileSnapshot.type, size: fileSnapshot.size } : null,
    };
    const botMsg = { role: 'bot', content: '', streaming: true };

    setMessages(prev => [...prev, userMsg, botMsg]);
    setIsStreaming(true);

    const body = {
      message: msg,
      courseId: courseContext?.id || null,
      history: messages.slice(-10).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
    };

    const hasAttachment = Boolean(fileSnapshot);
    const requestBody = hasAttachment ? new FormData() : JSON.stringify(body);
    if (hasAttachment) {
      requestBody.append('message', body.message);
      requestBody.append('courseId', body.courseId || '');
      requestBody.append('history', JSON.stringify(body.history));
      requestBody.append('attachment', fileSnapshot);
    }
    setAttachment(null);

    try {
      // Try SSE streaming first for real-time feel
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || '/api'}/chatbot/stream`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            ...(hasAttachment ? {} : { 'Content-Type': 'application/json' }),
          },
          body: requestBody,
        }
      );

      if (!response.ok) {
        throw new Error(`STREAM_FAILED_${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.done) break;
              if (parsed.text) {
                fullText += parsed.text;
                setMessages(prev => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last && last.role === 'bot') {
                    updated[updated.length - 1] = { ...last, content: fullText };
                  }
                  return updated;
                });
              }
            } catch (e) {
              if (e.message && !e.message.includes('JSON')) throw e;
            }
          }
        }
      }

      // Finalize streaming message
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === 'bot') {
          updated[updated.length - 1] = { ...last, streaming: false };
        }
        return updated;
      });
    } catch (streamErr) {
      // ── Fallback: use non-streaming /chatbot/chat endpoint ──
      try {
        const fallbackRes = hasAttachment
          ? await API.post('/chatbot/chat', requestBody, { headers: { 'Content-Type': 'multipart/form-data' } })
          : await API.post('/chatbot/chat', body);
        const res = fallbackRes;
        const reply = res.data?.data?.reply || res.data?.reply || 'Sorry, I could not generate a response.';

        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === 'bot') {
            updated[updated.length - 1] = { role: 'bot', content: reply, streaming: false };
          }
          return updated;
        });
        setError('');
      } catch (fallbackErr) {
        const errMsg = fallbackErr?.response?.data?.message || fallbackErr.message || 'Something went wrong. Please try again.';
        setError(errMsg);
        // Remove the empty bot message
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === 'bot' && !last.content) {
            updated.pop();
          } else if (last && last.role === 'bot') {
            updated[updated.length - 1] = { ...last, streaming: false };
          }
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const summarizeAttachedFile = () => {
    if (!attachment) {
      setError('Attach a file first, then tap Summarize.');
      return;
    }
    sendMessage(SUMMARIZE_FILE_PROMPT);
  };

  const handleAttachmentSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
    ];
    if (!allowed.includes(file.type)) {
      setError('Only PDF, DOC, DOCX, TXT, and image files are supported.');
      e.target.value = '';
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError('File size must be 15 MB or less.');
      e.target.value = '';
      return;
    }
    setError('');
    setAttachment(file);
    e.target.value = '';
  };

  // ── Handle Enter Key ──
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Clear Chat ──
  const clearChat = () => {
    setMessages([]);
    setSuggestions([]);
    setError('');
    sessionStorage.removeItem('chatbot_messages');
    loadSuggestions();
  };

  // ── Auto-resize textarea ──
  const handleInputChange = (e) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, CHAT_INPUT_MAX_HEIGHT_PX)}px`;
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        id="chatbot-fab"
        className={`chatbot-fab ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(v => !v)}
        aria-label={isOpen ? 'Close chat' : 'Open AI Study Buddy'}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="chatbot-panel" id="chatbot-panel">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-avatar">
              <Sparkles size={22} />
            </div>
            <div className="chatbot-header-info">
              <h3>AI Study Buddy</h3>
              <p>Ask anything about your courses</p>
            </div>
            <div className="chatbot-header-actions">
              <button className="chatbot-header-btn" onClick={clearChat} title="Clear chat">
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Course Context Pill */}
          {courseContext && (
            <div className="chatbot-context-pill">
              <BookOpen size={13} />
              <span>Context: {courseContext.title || 'Current Course'}</span>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="chatbot-error">
              {error}
            </div>
          )}

          {/* Messages */}
          <div className="chatbot-messages" id="chatbot-messages">
            {messages.length === 0 ? (
              <div className="chatbot-welcome">
                <div className="chatbot-welcome-icon">🤖</div>
                <h4>Hey there! 👋</h4>
                <p>
                  I'm your AI study buddy. Ask me anything about your courses,
                  and I'll explain it in simple terms!
                </p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`chatbot-msg ${msg.role === 'user' ? 'user' : 'bot'}`}
                >
                  {msg.role === 'user' ? (
                    <div>
                      <div>{msg.content}</div>
                      {msg.attachment && (
                        <div className="chatbot-attachment-chip user">
                          {msg.attachment.type?.startsWith('image/') ? <ImageIcon size={12} /> : <FileText size={12} />}
                          <span>{msg.attachment.name}</span>
                        </div>
                      )}
                    </div>
                  ) : msg.content ? (
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                  ) : (
                    msg.streaming && <TypingIndicator />
                  )}
                </div>
              ))
            )}
            {isStreaming && messages[messages.length - 1]?.content && (
              <TypingIndicator />
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {suggestions.length > 0 && messages.length === 0 && (
            <div className="chatbot-suggestions">
              {suggestions.slice(0, 4).map((q, i) => (
                <button
                  key={i}
                  className="chatbot-suggestion-btn"
                  onClick={() => sendMessage(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="chatbot-input-area">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp,.gif"
              className="chatbot-file-input"
              onChange={handleAttachmentSelect}
              disabled={isStreaming}
            />
            <button
              className="chatbot-attach-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming}
              aria-label="Attach file"
              title="Attach PDF, docs, or image"
            >
              <Paperclip size={16} />
            </button>
            <button
              type="button"
              className="chatbot-summarize-btn"
              onClick={summarizeAttachedFile}
              disabled={isStreaming || !attachment}
              aria-label="Summarize attached file"
              title={attachment ? 'Summarize this file in simple language' : 'Attach a file first'}
            >
              <Sparkles size={14} />
              <span>Summarize</span>
            </button>
            <textarea
              ref={inputRef}
              className="chatbot-input"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              rows={1}
              disabled={isStreaming}
              id="chatbot-input"
            />
            <button
              className="chatbot-send-btn"
              onClick={() => sendMessage()}
              disabled={(!input.trim() && !attachment) || isStreaming}
              id="chatbot-send"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
          {attachment && (
            <div className="chatbot-attachment-preview">
              <span className="chatbot-attachment-chip">
                {attachment.type?.startsWith('image/') ? <ImageIcon size={12} /> : <FileText size={12} />}
                <span>{attachment.name}</span>
              </span>
              <button
                type="button"
                className="chatbot-remove-attachment"
                onClick={() => setAttachment(null)}
                disabled={isStreaming}
              >
                Remove
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
