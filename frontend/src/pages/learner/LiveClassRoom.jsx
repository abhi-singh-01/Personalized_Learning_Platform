import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import { useSocket } from '../../context/SocketContext';
import Loading from '../../components/ui/Loading';
import Card from '../../components/ui/Card';
import {
  ArrowLeft, MessageSquare, Users, Send, Hand, Video,
  AlertCircle, LogOut
} from 'lucide-react';

export default function LiveClassRoom() {
  const { classId } = useParams();
  const api = useApi();
  const socketCtx = useSocket();
  const [classInfo, setClassInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState([]);
  const [handRaised, setHandRaised] = useState(false);
  const [error, setError] = useState('');
  const [ended, setEnded] = useState(false);
  const [showChat, setShowChat] = useState(true);

  // Join the class
  useEffect(() => {
    const joinClass = async () => {
      try {
        const res = await api.post(`/live-classes/${classId}/join`);
        setClassInfo(res.data);

        // Join socket room
        if (socketCtx?.emit && res.data?.roomId) {
          socketCtx.emit('room:join', { roomId: res.data.roomId });
        }

        // Fetch chat history
        const chatRes = await api.get(`/live-classes/${classId}/chat`);
        setMessages(chatRes.data?.messages || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to join class');
      }
    };
    joinClass();

    return () => {
      // Leave on unmount
      if (classInfo?.roomId && socketCtx?.emit) {
        socketCtx.emit('room:leave', { roomId: classInfo.roomId });
      }
      api.post(`/live-classes/${classId}/leave`).catch(() => {});
    };
  }, [classId]);

  // Socket listeners
  useEffect(() => {
    if (!socketCtx?.socket || !classInfo?.roomId) return;

    const handleMessage = (msg) => {
      setMessages(prev => [...prev, msg]);
    };

    const handleEnded = () => {
      setEnded(true);
    };

    const handleUserJoined = (data) => {
      setParticipants(prev => [...prev.filter(p => p.userId !== data.userId), data]);
    };

    const handleUserLeft = (data) => {
      setParticipants(prev => prev.filter(p => p.userId !== data.userId));
    };

    socketCtx.on('chat:message', handleMessage);
    socketCtx.on('class:ended', handleEnded);
    socketCtx.on('room:user-joined', handleUserJoined);
    socketCtx.on('room:user-left', handleUserLeft);

    return () => {
      socketCtx.off('chat:message', handleMessage);
      socketCtx.off('class:ended', handleEnded);
      socketCtx.off('room:user-joined', handleUserJoined);
      socketCtx.off('room:user-left', handleUserLeft);
    };
  }, [socketCtx?.socket, classInfo?.roomId]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !classInfo?.roomId) return;

    socketCtx.emit('chat:send', {
      roomId: classInfo.roomId,
      message: newMessage.trim(),
    });
    setNewMessage('');
  };

  const toggleHand = () => {
    if (!classInfo?.roomId) return;
    if (handRaised) {
      socketCtx.emit('room:lower-hand', { roomId: classInfo.roomId });
    } else {
      socketCtx.emit('room:raise-hand', { roomId: classInfo.roomId });
    }
    setHandRaised(!handRaised);
  };

  if (error) {
    return (
      <div className="space-y-4">
        <Link to="/learner/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <Card className="text-center py-8">
          <AlertCircle size={40} className="mx-auto text-red-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </Card>
      </div>
    );
  }

  if (!classInfo) return <Loading />;

  if (ended) {
    return (
      <div className="space-y-4">
        <Card className="text-center py-8">
          <Video size={40} className="mx-auto text-gray-400 mb-3" />
          <h2 className="text-xl font-bold mb-2">Class Ended</h2>
          <p className="text-gray-500">This live class has ended. Thank you for attending!</p>
          <Link to="/learner/dashboard" className="btn-primary inline-block mt-4">Back to Dashboard</Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link to="/learner/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            {classInfo.roomName || classInfo.topic || 'Live Class'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleHand}
            className={`flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors ${handRaised ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'}`}>
            <Hand size={14} /> {handRaised ? 'Lower Hand' : 'Raise Hand'}
          </button>
          <button onClick={() => setShowChat(!showChat)}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 rounded-lg">
            <MessageSquare size={14} /> Chat
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Video Area — Jitsi Embed */}
        <div className={showChat ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <Card className="!p-0 overflow-hidden">
            <div className="aspect-video bg-gray-900 relative">
              <iframe
                src={`https://${classInfo.jitsiDomain || 'meet.jit.si'}/${classInfo.roomId}`}
                className="w-full h-full border-0"
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                style={{ minHeight: '400px' }}
              />
            </div>
          </Card>
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="lg:col-span-1">
            <Card className="!p-0 flex flex-col" style={{ height: 'calc(56.25vw * 0.6)', minHeight: '400px', maxHeight: '600px' }}>
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 font-semibold flex items-center gap-2">
                <MessageSquare size={16} className="text-primary-600" /> Live Chat
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.map((msg, i) => (
                  <div key={msg._id || i} className="text-sm">
                    <span className="font-semibold text-primary-600">{msg.userName || 'User'}</span>
                    <span className="text-gray-600 dark:text-gray-400 ml-1.5">{msg.message}</span>
                    <span className="text-xs text-gray-400 ml-2">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>

              {/* Input */}
              {classInfo.chatEnabled && (
                <form onSubmit={sendMessage} className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                  <input className="input-field flex-1 !py-2 text-sm" placeholder="Type a message..."
                    value={newMessage} onChange={e => setNewMessage(e.target.value)} />
                  <button type="submit" disabled={!newMessage.trim()}
                    className="p-2 bg-primary-600 text-white rounded-lg disabled:opacity-50">
                    <Send size={16} />
                  </button>
                </form>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
