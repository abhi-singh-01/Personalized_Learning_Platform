import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import Loading from '../../components/ui/Loading';
import LiveMeetShell from '../../components/live/LiveMeetShell';
import LiveClassLobby from '../../components/live/LiveClassLobby';
import { learnerLiveClassUrl } from '../../utils/liveMeet';
import usePageTitle from '../../hooks/usePageTitle';
import { AlertCircle } from 'lucide-react';

export default function EducatorLiveClassHost() {
  usePageTitle('Host Live Class');
  const { classId } = useParams();
  const navigate = useNavigate();
  const api = useApi();
  const { user } = useAuth();
  const socketCtx = useSocket();

  const [classInfo, setClassInfo] = useState(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [messages, setMessages] = useState([]);
  const [raisedHands, setRaisedHands] = useState([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [error, setError] = useState('');
  const [ended, setEnded] = useState(false);
  const [inMeeting, setInMeeting] = useState(false);
  const [joining, setJoining] = useState(false);

  const displayName = user?.name || user?.email?.split('@')[0] || 'Educator';

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await api.post(`/live-classes/${classId}/join`);
        if (cancelled) return;
        setClassInfo(res.data);
        setParticipantCount(1);

        const chatRes = await api.get(`/live-classes/${classId}/chat`);
        if (!cancelled) setMessages(chatRes.data?.messages || []);

        try {
          const active = await api.get('/live-classes/educator/active');
          const match = (active.data || []).find((c) => c._id === classId);
          if (match?.course?.title) setCourseTitle(match.course.title);
          if (match?.currentAttendees != null) {
            setParticipantCount(Math.max(1, match.currentAttendees + 1));
          }
        } catch {
          /* optional */
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Could not open this live class');
      }
    };
    load();
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

    const roomKey = classInfo.roomId;

    const handleMessage = (msg) => setMessages((prev) => [...prev, msg]);
    const handleEnded = () => setEnded(true);
    const handleRaised = (data) => {
      if ((data.roomId || data.room) !== roomKey) return;
      setRaisedHands((prev) => [
        ...prev.filter((u) => u.userId !== data.userId),
        data,
      ]);
    };
    const handleLowered = (data) => {
      if ((data.roomId || data.room) !== roomKey) return;
      setRaisedHands((prev) => prev.filter((u) => u.userId !== data.userId));
    };
    const handleJoined = () => setParticipantCount((n) => n + 1);
    const handleLeft = () => setParticipantCount((n) => Math.max(1, n - 1));

    socketCtx.on('chat:message', handleMessage);
    socketCtx.on('class:ended', handleEnded);
    socketCtx.on('room:hand-raised', handleRaised);
    socketCtx.on('room:hand-lowered', handleLowered);
    socketCtx.on('room:user-joined', handleJoined);
    socketCtx.on('room:user-left', handleLeft);

    return () => {
      socketCtx.off('chat:message', handleMessage);
      socketCtx.off('class:ended', handleEnded);
      socketCtx.off('room:hand-raised', handleRaised);
      socketCtx.off('room:hand-lowered', handleLowered);
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

  const copyLearnerLink = async () => {
    await navigator.clipboard.writeText(learnerLiveClassUrl(classId));
  };

  const handleLeave = () => {
    if (classInfo?.roomId && socketCtx?.emit) {
      socketCtx.emit('room:leave', { roomId: classInfo.roomId });
    }
    api.post(`/live-classes/${classId}/leave`).catch(() => {});
    navigate('/educator/live-classes');
  };

  const handleEndClass = async () => {
    if (!window.confirm('End this live class for all participants?')) return;
    try {
      await api.put(`/live-classes/${classId}/end`);
      setEnded(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not end class');
    }
  };

  const dismissHand = (userId) => {
    setRaisedHands((prev) => prev.filter((u) => u.userId !== userId));
  };

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124] p-6">
        <div className="text-center max-w-md text-white">
          <AlertCircle size={40} className="mx-auto text-red-400 mb-3" />
          <p className="mb-4 text-gray-300">{error}</p>
          <button type="button" onClick={() => navigate('/educator/live-classes')} className="px-6 py-2 rounded-full bg-[#8ab4f8] text-[#202124] font-semibold">
            Back to Live Classes
          </button>
        </div>
      </div>
    );
  }

  if (!classInfo) return <Loading />;

  if (!inMeeting && !ended) {
    return (
      <LiveClassLobby
        role="host"
        title={classInfo.roomName || classInfo.topic || 'Live Class'}
        subtitle={courseTitle || 'Host meeting'}
        onJoin={enterMeeting}
        onCancel={() => navigate('/educator/live-classes')}
        joining={joining}
      />
    );
  }

  return (
    <LiveMeetShell
      role="host"
      title={classInfo.roomName || classInfo.topic}
      subtitle={courseTitle}
      jitsiDomain={classInfo.jitsiDomain}
      roomId={classInfo.roomId}
      displayName={`${displayName} (Host)`}
      startedAt={classInfo.startedAt}
      participantCount={participantCount}
      messages={messages}
      onSendMessage={sendMessage}
      chatEnabled={classInfo.chatEnabled !== false}
      raisedHands={raisedHands}
      onDismissHand={dismissHand}
      onCopyLink={copyLearnerLink}
      onLeave={handleLeave}
      onEndClass={handleEndClass}
      ended={ended}
      uniqueFeatures={
        <>
          <span className="font-medium text-violet-200">PLP Host</span>
          <span className="text-gray-400">·</span>
          <span>Share screen · Hands queue · Invite learners · End for all</span>
        </>
      }
    />
  );
}
