import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import API from '../../api/axios';
import Card from '../../components/ui/Card';
import {
  ArrowLeft, Video, VideoOff, Mic, MicOff, Monitor, Camera,
  Circle, Square, Clock, Save, Download, Maximize, Minimize,
  RotateCcw, CheckCircle, AlertCircle
} from 'lucide-react';

const RECORDING_STATES = { IDLE: 'idle', RECORDING: 'recording', PAUSED: 'paused', STOPPED: 'stopped', SAVING: 'saving', SAVED: 'saved' };

export default function LiveLecture() {
  const { courseId } = useParams();
  const nav = useNavigate();
  const api = useApi();

  // Stream refs
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // State
  const [courseName, setCourseName] = useState('');
  const [status, setStatus] = useState(RECORDING_STATES.IDLE);
  const [sourceMode, setSourceMode] = useState('camera'); // 'camera' | 'screen' | 'both'
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState('');
  const [lectureTitle, setLectureTitle] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [stream, setStream] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fetch course name
  useEffect(() => {
    if (courseId) {
      api.get('/courses/' + courseId)
        .then((res) => setCourseName(res.data?.title || ''))
        .catch(() => setCourseName('Unknown Course'));
    }
  }, [courseId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllStreams();
      clearInterval(timerRef.current);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, []);

  const stopAllStreams = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const startStream = async (mode) => {
    setError('');
    stopAllStreams();

    try {
      let mediaStream;

      if (mode === 'camera') {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: 'user' },
          audio: true,
        });
      } else if (mode === 'screen') {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: 1920, height: 1080 },
          audio: true,
        });
        // Also get mic audio
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const combinedStream = new MediaStream([
            ...screenStream.getVideoTracks(),
            ...audioStream.getAudioTracks(),
          ]);
          mediaStream = combinedStream;
          // Stop screen share when user clicks browser's "Stop sharing" button
          screenStream.getVideoTracks()[0].addEventListener('ended', () => {
            stopRecording();
          });
        } catch {
          mediaStream = screenStream;
        }
      } else {
        // 'both' — picture-in-picture approach: screen + camera overlay
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: 1920, height: 1080 },
          audio: true,
        });
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 },
          audio: true,
        });
        // Combine: screen video + camera audio (camera video shown as PiP overlay separately)
        mediaStream = new MediaStream([
          ...screenStream.getVideoTracks(),
          ...cameraStream.getAudioTracks(),
        ]);
        screenStream.getVideoTracks()[0].addEventListener('ended', () => {
          stopRecording();
        });
      }

      if (videoRef.current) videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
      setSourceMode(mode);
    } catch (err) {
      console.error('Stream error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Permission denied. Please allow camera/microphone access and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera or microphone found. Please connect a device and try again.');
      } else {
        setError(`Could not start stream: ${err.message}`);
      }
    }
  };

  const startRecording = useCallback(() => {
    if (!stream) return;
    setError('');
    chunksRef.current = [];
    setRecordedBlob(null);
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl('');

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm';

    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2500000 });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setRecordedBlob(blob);
      setRecordedUrl(url);
      setStatus(RECORDING_STATES.STOPPED);
      clearInterval(timerRef.current);
    };

    recorder.start(1000); // collect data every second
    mediaRecorderRef.current = recorder;
    setStatus(RECORDING_STATES.RECORDING);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
  }, [stream, recordedUrl]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    stopAllStreams();
  }, [stream]);

  const resetRecording = () => {
    stopAllStreams();
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl('');
    setStatus(RECORDING_STATES.IDLE);
    setElapsed(0);
    setUploadProgress(0);
    setLectureTitle('');
    clearInterval(timerRef.current);
  };

  const downloadRecording = () => {
    if (!recordedBlob) return;
    const a = document.createElement('a');
    a.href = recordedUrl;
    a.download = `lecture-${Date.now()}.webm`;
    a.click();
  };

  const saveAsCourseMaterial = async () => {
    if (!recordedBlob || !lectureTitle.trim()) {
      setError('Please enter a lecture title before saving.');
      return;
    }

    setStatus(RECORDING_STATES.SAVING);
    setUploadProgress(0);

    try {
      // Convert webm blob to a File so multer can handle it
      const file = new File([recordedBlob], `lecture-${Date.now()}.webm`, { type: recordedBlob.type });

      const fd = new FormData();
      fd.append('title', lectureTitle.trim());
      fd.append('description', `Live lecture recorded on ${new Date().toLocaleDateString()}`);
      fd.append('type', 'video');
      fd.append('course', courseId);
      fd.append('file', file);

      await API.post('/materials', fd, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        onUploadProgress: (progressEvent) => {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(pct);
        },
      });

      setStatus(RECORDING_STATES.SAVED);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save lecture. Please try downloading and uploading manually.');
      setStatus(RECORDING_STATES.STOPPED);
    }
  };

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? String(h).padStart(2, '0') + ':' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks().forEach((t) => (t.enabled = isMuted));
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach((t) => (t.enabled = isVideoOff));
      setIsVideoOff(!isVideoOff);
    }
  };

  const fileSizeMB = recordedBlob ? (recordedBlob.size / (1024 * 1024)).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      <Link to={`/educator/courses/${courseId}/materials`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">
        <ArrowLeft size={16} /> Back to Materials
      </Link>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
              <Video size={24} className="text-red-500" />
            </div>
            Live Lecture
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Course: <span className="font-semibold text-gray-700 dark:text-gray-300">{courseName}</span>
          </p>
        </div>
        {status === RECORDING_STATES.RECORDING && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full animate-pulse">
            <Circle size={10} className="fill-red-500 text-red-500" />
            <span className="text-sm font-bold">RECORDING</span>
            <span className="text-sm font-mono">{formatTime(elapsed)}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800/40 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* ── Video Preview ── */}
      <Card className="overflow-hidden">
        <div className={`relative bg-gray-900 rounded-xl overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : 'aspect-video'}`}>
          {status === RECORDING_STATES.STOPPED || status === RECORDING_STATES.SAVING || status === RECORDING_STATES.SAVED ? (
            /* Playback preview */
            recordedUrl ? (
              <video
                src={recordedUrl}
                controls
                className="w-full h-full object-contain bg-black"
              />
            ) : null
          ) : (
            /* Live preview */
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-contain bg-black"
            />
          )}

          {/* No stream overlay */}
          {status === RECORDING_STATES.IDLE && !stream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 text-white">
              <Video size={48} className="text-gray-500 mb-4" />
              <p className="text-lg font-semibold text-gray-300">Choose a source to begin</p>
              <p className="text-sm text-gray-500 mt-1">Select camera, screen, or both below</p>
            </div>
          )}

          {/* Timer overlay during recording */}
          {status === RECORDING_STATES.RECORDING && (
            <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg flex items-center gap-2 text-white">
              <Clock size={14} />
              <span className="font-mono text-sm">{formatTime(elapsed)}</span>
            </div>
          )}

          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="absolute bottom-4 right-4 p-2 bg-black/50 backdrop-blur-sm rounded-lg text-white hover:bg-black/70 transition-colors"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>
      </Card>

      {/* ── Source Selection (only when idle) ── */}
      {status === RECORDING_STATES.IDLE && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">Choose Source</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <button
              onClick={() => startStream('camera')}
              className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all duration-200 ${sourceMode === 'camera' && stream ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'}`}
            >
              <Camera size={28} className="text-blue-500" />
              <span className="font-semibold text-sm">Camera</span>
              <span className="text-xs text-gray-400">Webcam + microphone</span>
            </button>
            <button
              onClick={() => startStream('screen')}
              className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all duration-200 ${sourceMode === 'screen' && stream ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'}`}
            >
              <Monitor size={28} className="text-green-500" />
              <span className="font-semibold text-sm">Screen Share</span>
              <span className="text-xs text-gray-400">Share your screen + mic</span>
            </button>
            <button
              onClick={() => startStream('both')}
              className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all duration-200 ${sourceMode === 'both' && stream ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'}`}
            >
              <div className="flex items-center gap-1">
                <Monitor size={22} className="text-purple-500" />
                <span className="text-gray-300">+</span>
                <Camera size={18} className="text-purple-500" />
              </div>
              <span className="font-semibold text-sm">Screen + Camera</span>
              <span className="text-xs text-gray-400">Present with face overlay</span>
            </button>
          </div>
        </Card>
      )}

      {/* ── Recording Controls ── */}
      <Card>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {/* IDLE — Start Recording */}
          {status === RECORDING_STATES.IDLE && (
            <button
              onClick={startRecording}
              disabled={!stream}
              className="flex items-center gap-2 px-8 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-red-500/25 hover:shadow-xl transition-all duration-200"
            >
              <Circle size={18} className="fill-white" />
              Start Recording
            </button>
          )}

          {/* RECORDING — Stop + Mute + Video toggle */}
          {status === RECORDING_STATES.RECORDING && (
            <>
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/25 transition-all duration-200"
              >
                <Square size={16} className="fill-white" />
                Stop Recording
              </button>
              <button onClick={toggleMute} className={`p-3 rounded-xl border-2 transition-all ${isMuted ? 'border-red-300 bg-red-50 dark:bg-red-900/20 text-red-500' : 'border-gray-200 dark:border-gray-700 text-gray-600'}`}>
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <button onClick={toggleVideo} className={`p-3 rounded-xl border-2 transition-all ${isVideoOff ? 'border-red-300 bg-red-50 dark:bg-red-900/20 text-red-500' : 'border-gray-200 dark:border-gray-700 text-gray-600'}`}>
                {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
              </button>
            </>
          )}

          {/* STOPPED — Save / Download / Re-record */}
          {status === RECORDING_STATES.STOPPED && (
            <>
              <button
                onClick={resetRecording}
                className="flex items-center gap-2 px-5 py-3 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-600 font-semibold rounded-xl transition-all"
              >
                <RotateCcw size={16} />
                Re-record
              </button>
              <button
                onClick={downloadRecording}
                className="flex items-center gap-2 px-5 py-3 border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-semibold rounded-xl hover:bg-blue-100 transition-all"
              >
                <Download size={16} />
                Download ({fileSizeMB} MB)
              </button>
            </>
          )}

          {/* SAVING — progress */}
          {status === RECORDING_STATES.SAVING && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              <span className="font-semibold text-gray-700 dark:text-gray-300">Saving... {uploadProgress}%</span>
            </div>
          )}

          {/* SAVED — success */}
          {status === RECORDING_STATES.SAVED && (
            <div className="flex items-center gap-3 text-green-600">
              <CheckCircle size={24} />
              <span className="font-bold">Lecture saved as course material!</span>
            </div>
          )}
        </div>
      </Card>

      {/* ── Save as Material Form (shown after recording stops) ── */}
      {(status === RECORDING_STATES.STOPPED || status === RECORDING_STATES.SAVED) && (
        <Card>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Save size={20} className="text-primary-600" />
            Save as Course Material
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Lecture Title</label>
              <input
                className="input-field"
                placeholder="e.g., Week 3 – Introduction to Algorithms"
                value={lectureTitle}
                onChange={(e) => setLectureTitle(e.target.value)}
                disabled={status === RECORDING_STATES.SAVED}
              />
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span>Duration: <span className="font-semibold text-gray-700 dark:text-gray-300">{formatTime(elapsed)}</span></span>
              <span>·</span>
              <span>Size: <span className="font-semibold text-gray-700 dark:text-gray-300">{fileSizeMB} MB</span></span>
              <span>·</span>
              <span>Format: <span className="font-semibold text-gray-700 dark:text-gray-300">WebM</span></span>
            </div>

            {status === RECORDING_STATES.SAVING && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            {status !== RECORDING_STATES.SAVED && (
              <button
                onClick={saveAsCourseMaterial}
                disabled={status === RECORDING_STATES.SAVING || !lectureTitle.trim()}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                {status === RECORDING_STATES.SAVING ? `Uploading... ${uploadProgress}%` : 'Save to Course Materials'}
              </button>
            )}

            {status === RECORDING_STATES.SAVED && (
              <div className="flex gap-3">
                <Link
                  to={`/educator/courses/${courseId}/materials`}
                  className="btn-primary flex items-center gap-2"
                >
                  View Course Materials
                </Link>
                <button onClick={resetRecording} className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Record Another
                </button>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
