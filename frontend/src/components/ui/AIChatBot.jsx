import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import {
  MessageCircle,
  X,
  Send,
  Trash2,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import '../../styles/AIChatBot.css';

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
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  // Only show for learners
  if (!user || user.role !== 'learner') return null;

  // ── Detect course context from URL ──
  useEffect(() => {
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
  }, [location.pathname]);

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

  // ── Send Message with SSE Streaming ──
  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || isStreaming) return;

    setInput('');
    setError('');
    setSuggestions([]);

    const userMsg = { role: 'user', content: msg };
    const botMsg = { role: 'bot', content: '', streaming: true };

    setMessages(prev => [...prev, userMsg, botMsg]);
    setIsStreaming(true);

    try {
      const token = localStorage.getItem('token');
      const body = {
        message: msg,
        courseId: courseContext?.id || null,
        history: messages.slice(-10).map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        })),
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || '/api'}/chatbot/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Error ${response.status}`);
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

      // Finalize
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === 'bot') {
          updated[updated.length - 1] = { ...last, streaming: false };
        }
        return updated;
      });
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
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
    } finally {
      setIsStreaming(false);
    }
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
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
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
                    msg.content
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
              disabled={!input.trim() || isStreaming}
              id="chatbot-send"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
