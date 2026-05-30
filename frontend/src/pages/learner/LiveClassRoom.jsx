import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import Loading from '../../components/ui/Loading';
import LiveMeetShell from '../../components/live/LiveMeetShell';
import LiveClassLobby from '../../components/live/LiveClassLobby';
import usePageTitle from '../../hooks/usePageTitle';
import { AlertCircle } from 'lucide-react';

export default function LiveClassRoom() {
  usePageTitle('Live Class');
  const { classId } = useParams();
  const navigate = useNavigate();
  const api = useApi();
  const { user } = useAuth();
  const socketCtx = useSocket();

  const [classInfo, setClassInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [handRaised, setHandRaised] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [error, setError] = useState('');
  const [ended, setEnded] = useState(false);
  const [inMeeting, setInMeeting] = useState(false);
  const [joining, setJoining] = useState(false);

  const displayName = user?.name || user?.email?.split('@')[0] || 'Learner';

  useEffect(() => {
    let cancelled = false;
    const joinClass = async () => {
      try {
        const res = await api.post(`/live-classes/${classId}/join`);
        if (cancelled) return;
        setClassInfo(res.data);

        const chatRes = await api.get(`/live-classes/${classId}/chat`);
        if (!cancelled) setMessages(chatRes.data?.messages || []);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to join class');
      }
    };
    joinClass();
    return () => { cancelled = true; };
  }, [classId]);

  const enterMeeting = useCallback(() => {
    if (!classInfo?.roomId || !socketCtx?.emit) return;
    setJoining(true);
    socketCtx.emit('room:join', { roomId: classInfo.roomId });
    setInMeeting(true);
    setJoining(false);
  }, [classInfo?.roomId, socketCtx]);

  useEffect(() => {
    if (!inMeeting || !socketCtx?.socket || !classInfo?.roomId) return;

    const handleMessage = (msg) => setMessages((prev) => [...prev, msg]);
    const handleEnded = () => setEnded(true);
    const handleJoined = () => setParticipantCount((n) => n + 1);
    const handleLeft = () => setParticipantCount((n) => Math.max(1, n - 1));

    socketCtx.on('chat:message', handleMessage);
    socketCtx.on('class:ended', handleEnded);
    socketCtx.on('room:user-joined', handleJoined);
    socketCtx.on('room:user-left', handleLeft);

    return () => {
      socketCtx.off('chat:message', handleMessage);
      socketCtx.off('class:ended', handleEnded);
      socketCtx.off('room:user-joined', handleJoined);
      socketCtx.off('room:user-left', handleLeft);
    };
  }, [inMeeting, socketCtx, classInfo?.roomId]);

  useEffect(() => {
    return () => {
      if (classInfo?.roomId && socketCtx?.emit) {
        socketCtx.emit('room:leave', { roomId: classInfo.roomId });
      }
      api.post(`/live-classes/${classId}/leave`).catch(() => {});
    };
  }, [classId, classInfo?.roomId]);

  const sendMessage = (text) => {
    if (!classInfo?.roomId) return;
    socketCtx.emit('chat:send', { roomId: classInfo.roomId, message: text });
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

  const handleLeave = () => {
    if (classInfo?.roomId && socketCtx?.emit) {
      socketCtx.emit('room:leave', { roomId: classInfo.roomId });
    }
    api.post(`/live-classes/${classId}/leave`).catch(() => {});
    navigate('/learner/dashboard');
  };

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124] p-6">
        <div className="text-center max-w-md text-white">
          <AlertCircle size={40} className="mx-auto text-red-400 mb-3" />
          <p className="mb-4 text-gray-300">{error}</p>
          <button type="button" onClick={() => navigate('/learner/dashboard')} className="px-6 py-2 rounded-full bg-[#8ab4f8] text-[#202124] font-semibold">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!classInfo) return <Loading />;

  if (!inMeeting && !ended) {
    return (
      <LiveClassLobby
        role="learner"
        title={classInfo.roomName || classInfo.topic || 'Live Class'}
        subtitle={classInfo.courseName}
        onJoin={enterMeeting}
        onCancel={() => navigate('/learner/dashboard')}
        joining={joining}
      />
    );
  }

  return (
    <LiveMeetShell
      role="learner"
      title={classInfo.roomName || classInfo.topic}
      subtitle={classInfo.courseName}
      jitsiDomain={classInfo.jitsiDomain}
      roomId={classInfo.roomId}
      displayName={displayName}
      startedAt={classInfo.startedAt}
      participantCount={participantCount}
      messages={messages}
      onSendMessage={sendMessage}
      chatEnabled={classInfo.chatEnabled !== false}
      handRaised={handRaised}
      onToggleHand={toggleHand}
      onLeave={handleLeave}
      ended={ended}
      uniqueFeatures={
        <>
          <span className="font-medium text-indigo-200">PLP Live</span>
          <span className="text-gray-400">·</span>
          <span>Raise hand · Class chat · AI notes on course page after class</span>
        </>
      }
    />
  );
}
