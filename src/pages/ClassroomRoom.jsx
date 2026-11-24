// pages/ClassroomRoom.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLevelFilter } from '../hooks/useLevelFilter';
import {
  joinClassroom,
  leaveClassroom,
  getClassroomRoom,
  getClassroomMessages,
  getClassroomParticipants,
  sendClassroomMessage,
  raiseHand,
  toggleClassroomMute,
  fileClassroomComplaint
} from '../api/client';
import Icon from '../components/Icon/Icon';
import Spinner from '../components/Spinner/Spinner';
import Button from '../components/Button/Button';
import EmptyState from '../components/EmptyState/EmptyState';
import { useLayout } from '../contexts/LayoutContext';
import CollaborativeWhiteboard from '../features/classroom/CollaborativeWhiteboard';


export default function ClassroomRoom() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { displayName, class_name } = useLevelFilter();
  const { bootstrap } = useLayout();
  const chatBodyRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const roomLifecycleRef = useRef(null);

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isMuted, setIsMuted] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isWhiteboardVisible, setIsWhiteboardVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [raisingHand, setRaisingHand] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState(null);
  const [mediaError, setMediaError] = useState('');
  const [deviceBusy, setDeviceBusy] = useState(false);
  const [hasMediaPreview, setHasMediaPreview] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportDescription, setReportDescription] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reportError, setReportError] = useState('');

  async function leaveRoomLifecycle(lifecycle) {
    if (!lifecycle?.joined) return;
    lifecycle.joined = false;
    window.clearTimeout(lifecycle.leaveTimer);
    lifecycle.leaveTimer = null;
    try {
      await leaveClassroom(lifecycle.roomId);
    } catch {}
  }

  useEffect(() => {
    let cancelled = false;
    let msgInterval;
    let partInterval;

    let lifecycle = roomLifecycleRef.current;
    if (!lifecycle || lifecycle.roomId !== roomId) {
      lifecycle = {
        roomId,
        activeEffects: 0,
        leaveTimer: null,
        joinPromise: null,
        joined: false
      };
      roomLifecycleRef.current = lifecycle;
    }

    lifecycle.activeEffects += 1;
    window.clearTimeout(lifecycle.leaveTimer);
    lifecycle.leaveTimer = null;
    if (!lifecycle.joinPromise) lifecycle.joinPromise = joinClassroom(roomId);

    async function initializeRoom() {
      try {
        await lifecycle.joinPromise;
        lifecycle.joined = true;
        if (cancelled) {
          if (lifecycle.activeEffects === 0) await leaveRoomLifecycle(lifecycle);
          return;
        }
        await Promise.all([fetchRoom(), fetchMessages(), fetchParticipants()]);
        if (cancelled) return;
        msgInterval = window.setInterval(fetchMessages, 3000);
        partInterval = window.setInterval(fetchParticipants, 10000);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'You could not join this classroom. Please try again.');
          setLoading(false);
        }
      }
    }

    initializeRoom();

    return () => {
      cancelled = true;
      window.clearInterval(msgInterval);
      window.clearInterval(partInterval);
      lifecycle.activeEffects = Math.max(0, lifecycle.activeEffects - 1);
      if (lifecycle.activeEffects === 0) {
        lifecycle.leaveTimer = window.setTimeout(() => {
          if (lifecycle.activeEffects === 0) leaveRoomLifecycle(lifecycle);
        }, 100);
      }
    };
  }, [roomId]);
  useEffect(() => {
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = screenStreamRef.current || mediaStreamRef.current;
    }
  }, [isVideoOn, isScreenSharing, participants]);

  useEffect(() => () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  async function fetchRoom() {
    try {
      const data = await getClassroomRoom(roomId);
      setRoom(data);
      setLoading(false);
    } catch {
      setError("We couldn't load this classroom. Please try again.");
      setLoading(false);
    }
  }

  async function fetchMessages() {
    try {
      const data = await getClassroomMessages(roomId);
      setMessages(data || []);
    } catch {}
  }

  async function fetchParticipants() {
    try {
      const data = await getClassroomParticipants(roomId);
      const activeParticipants = data || [];
      setParticipants(activeParticipants);
      const self = activeParticipants.find((participant) => participant.user_id === user?.id);
      setHandRaised(Boolean(self?.hand_raised));
      if (typeof self?.is_muted === 'boolean') {
        setIsMuted(self.is_muted);
        mediaStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !self.is_muted; });
      }
    } catch {}
  }

  async function handleSendMessage() {
    const messageText = chatInput.trim();
    if (!messageText || sending) return;
    setSending(true);
    setChatInput('');
    try {
      await sendClassroomMessage(roomId, messageText);
      await fetchMessages();
    } catch {
      setChatInput(messageText);
    } finally {
      setSending(false);
    }
  }

  async function handleRaiseHand() {
    if (raisingHand) return;
    setRaisingHand(true);
    try {
      await raiseHand(roomId, !handRaised);
      setHandRaised((value) => !value);
    } catch {
    } finally {
      setRaisingHand(false);
    }
  }

  async function handleLeaveRoom() {
    if (leaving) return;
    setLeaving(true);
    await leaveRoomLifecycle(roomLifecycleRef.current);
    navigate('/classroom');
  }

  function handleExportChat() {
    const transcript = messages.map((message) => {
      const time = message.created_at ? new Date(message.created_at).toLocaleString() : '';
      const sender = message.sender_name || (message.user_id === user?.id ? 'You' : 'Participant');
      return `[${time}] ${sender}: ${message.content || message.file_name || ''}`;
    }).join('\n');
    const blob = new Blob([`Classroom: ${room?.title || 'Session'}\n\n${transcript}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `classroom-chat-${roomId}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function handleReportIssue() {
    if (!reportDescription.trim() || reporting) return;
    setReporting(true);
    setReportError('');
    try {
      await fileClassroomComplaint(roomId, 'classroom_session', reportDescription.trim());
      setReportDescription('');
      setReportOpen(false);
    } catch (err) {
      setReportError(err.message || 'We could not submit your report. Please try again.');
    } finally {
      setReporting(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  }

  function getEmptyStateImage(key) {
    const uiComponents = bootstrap?.ui_components || [];
    const component = uiComponents.find((item) => item.component_key === `empty_state_${key}`);
    return component?.properties?.image_url || null;
  }

  async function ensureMediaStream(device) {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('This browser does not support camera and microphone access.');
    }

    const currentStream = mediaStreamRef.current || new MediaStream();
    const hasRequestedTrack = device === 'audio'
      ? currentStream.getAudioTracks().length > 0
      : currentStream.getVideoTracks().length > 0;

    if (!hasRequestedTrack) {
      const capturedStream = await navigator.mediaDevices.getUserMedia({
        audio: device === 'audio',
        video: device === 'video'
      });
      capturedStream.getTracks().forEach((track) => currentStream.addTrack(track));
      mediaStreamRef.current = currentStream;
    }

    currentStream.getAudioTracks().forEach((track) => { track.enabled = !isMuted; });
    currentStream.getVideoTracks().forEach((track) => { track.enabled = isVideoOn; });
    setHasMediaPreview(currentStream.getVideoTracks().length > 0);
    if (videoPreviewRef.current && !screenStreamRef.current && currentStream.getVideoTracks().length) {
      videoPreviewRef.current.srcObject = currentStream;
    }
    return currentStream;
  }

  async function toggleMute() {
    if (deviceBusy) return;
    setDeviceBusy(true);
    setMediaError('');
    try {
      const nextMuted = !isMuted;
      if (!user?.id) throw new Error('Your account session is unavailable. Please sign in again.');
      const stream = await ensureMediaStream('audio');
      await toggleClassroomMute(roomId, user.id, nextMuted);
      stream.getAudioTracks().forEach((track) => { track.enabled = !nextMuted; });
      setIsMuted(nextMuted);
      setParticipants((current) => current.map((participant) => participant.user_id === user.id
        ? { ...participant, is_muted: nextMuted }
        : participant));
    } catch (err) {
      setMediaError(err.message || 'Unable to access your microphone. Check browser permissions.');
    } finally {
      setDeviceBusy(false);
    }
  }

  async function toggleVideo() {
    if (deviceBusy) return;
    setDeviceBusy(true);
    setMediaError('');
    try {
      const nextVideoOn = !isVideoOn;
      const stream = await ensureMediaStream('video');
      stream.getVideoTracks().forEach((track) => { track.enabled = nextVideoOn; });
      setIsVideoOn(nextVideoOn);
    } catch (err) {
      setMediaError(err.message || 'Unable to access your camera. Check browser permissions.');
    } finally {
      setDeviceBusy(false);
    }
  }

  async function toggleScreenShare() {
    if (deviceBusy) return;
    setDeviceBusy(true);
    setMediaError('');
    try {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
        setIsScreenSharing(false);
        if (videoPreviewRef.current) videoPreviewRef.current.srcObject = mediaStreamRef.current;
        setHasMediaPreview(Boolean(mediaStreamRef.current?.getVideoTracks().length));
        return;
      }
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error('Screen sharing is not supported by this browser.');
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      screenStreamRef.current = stream;
      if (videoPreviewRef.current) videoPreviewRef.current.srcObject = stream;
      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        screenStreamRef.current = null;
        setIsScreenSharing(false);
        if (videoPreviewRef.current) videoPreviewRef.current.srcObject = mediaStreamRef.current;
        setHasMediaPreview(Boolean(mediaStreamRef.current?.getVideoTracks().length));
      }, { once: true });
      setIsScreenSharing(true);
    } catch (err) {
      if (err.name !== 'NotAllowedError') setMediaError(err.message || 'Unable to share your screen.');
    } finally {
      setDeviceBusy(false);
    }
  }

  function toggleWhiteboard() {
    setIsWhiteboardVisible((visible) => !visible);
  }

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full items-center justify-center px-4 py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-4 py-12">
        <EmptyState
          image={getEmptyStateImage('classrooms')}
          title="This classroom is unavailable"
          description={error || 'This classroom may have ended or the link may be incorrect.'}
          action={
            <Button onClick={() => navigate('/classroom')}>
              <Icon name="arrow-left" /> Back to classrooms
            </Button>
          }
        />
      </div>
    );
  }

  const levelName = displayName || room.level_name || room.level || '';
  const roomGroup = room.group_name || room.class_name || class_name || '';
  const isPharmacyLevel = /pharmacy/i.test(`${room.level_kind || ''} ${levelName}`);
  const groupLabel = isPharmacyLevel ? 'Program' : (room.group_label || 'Class');
  const unitLabel = isPharmacyLevel ? 'Course Unit' : (room.unit_label || 'Topic');
  const roomUnit = room.unit_name || room.topic_name || '';
  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-primary-100 bg-primary-950 p-4 text-white shadow-xl shadow-primary-900/10 sm:p-6">
        <Button variant="ghost" size="sm" icon onClick={handleLeaveRoom} loading={leaving}>
          <Icon name="arrow-left" />
        </Button>

        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-xl font-bold leading-tight text-white sm:text-2xl">
            {room.title}<br />
            <span className="mt-3 flex flex-wrap gap-2">
              {roomUnit && <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border border-white/20 bg-white/15 text-white">{unitLabel}: {roomUnit}</span>}
              {roomGroup && <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border border-secondary-200/40 bg-secondary-400/20 text-orange-50">{groupLabel}: {roomGroup}</span>}
              {levelName && <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border border-primary-200/40 bg-primary-400/20 text-blue-50">{levelName}</span>}
            </span>
          </h2>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-3">
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${room.status === 'live' || room.status === 'open_floor' ? 'border-emerald-200/30 bg-emerald-400/15 text-emerald-100' : 'border-amber-200/30 bg-amber-400/15 text-amber-100'}`}>
            <span className={`h-2 w-2 rounded-full ${room.status === 'live' || room.status === 'open_floor' ? 'bg-emerald-400' : 'bg-amber-300'}`} />
            <span className="text-xs font-bold uppercase tracking-wider">{room.status === 'upcoming' ? 'Scheduled' : room.status === 'open_floor' ? 'Open floor' : room.status === 'live' ? 'Live' : room.status}</span>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            <div className="relative flex min-h-48 flex-col overflow-hidden rounded-2xl border border-primary-200 bg-primary-950 shadow-sm">
              <video ref={videoPreviewRef} autoPlay muted playsInline className={`h-48 w-full bg-primary-950 object-cover ${isVideoOn || isScreenSharing ? 'block' : 'hidden'}`} />
              {(!hasMediaPreview || (!isVideoOn && !isScreenSharing)) && <div className="flex min-h-48 flex-1 flex-col items-center justify-center gap-3 text-primary-100"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10"><Icon name="user" size="2rem" monochrome /></span><span className="text-sm font-semibold">{hasMediaPreview ? 'Your camera is off' : 'Camera preview not started'}</span></div>}
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between gap-2 bg-primary-950/90 px-3 py-2 text-xs font-semibold text-white"><span>You · device preview</span><span className="text-primary-200">Local only</span></div>
            </div>
            {participants.map((participant) => (
              <div
                key={participant.id || participant.user_id}
                className={`relative flex min-h-48 flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-primary-100 bg-primary-900 p-5 text-center text-white shadow-lg ${participant.is_speaking ? 'ring-2 ring-emerald-400 ring-offset-2' : ''} ${participant.user_id === user?.id ? 'border-primary-300' : ''}`}
              >
                {participant.role === 'tutor' && <span className="absolute left-3 top-3 rounded-full border border-secondary-200/30 bg-secondary-400/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-100">Tutor</span>}
                {participant.role === 'admin' && <span className="absolute left-3 top-3 rounded-full border border-primary-200/30 bg-primary-400/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-100">Admin</span>}
                <span className="mb-1 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white"><Icon name={participant.role === "tutor" ? "user-graduate" : participant.role === "admin" ? "shield-halved" : "user"} size="2rem" monochrome /></span>
                <span className="max-w-full truncate text-sm font-semibold text-white">{participant.user_name || 'Participant'}{participant.user_id === user?.id ? ' (you)' : ''}</span>
                {participant.is_muted && <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 text-red-100"><Icon name="microphone-slash" monochrome /></span>}
                {participant.hand_raised && <span className="absolute bottom-3 right-12 flex h-8 w-8 items-center justify-center rounded-full bg-secondary-400/20 text-orange-100"><Icon name="hand" monochrome /></span>}
                {participant.is_screen_sharing && <span className="absolute bottom-3 right-[5.25rem] flex h-8 w-8 items-center justify-center rounded-full bg-primary-400/20 text-blue-100"><Icon name="desktop" monochrome /></span>}
              </div>
            ))}
          </div>

          <section className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-5" aria-label="Classroom controls">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div><h3 className="m-0 text-sm font-bold text-slate-900 sm:text-base">Your devices</h3><p className="m-0 mt-1 text-xs text-slate-500">Control your local camera, microphone and screen preview.</p></div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">Local preview only · not broadcasting</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5 sm:gap-3">
            <Button className="min-h-12 w-full justify-center gap-2 rounded-xl px-3 py-3 text-sm" variant={isMuted ? 'ghost' : 'primary'} size="sm" onClick={toggleMute}>
              <Icon name={isMuted ? 'microphone-slash' : 'microphone'} />
              {isMuted ? 'Unmute' : 'Mute'}
            </Button>
            <Button className="min-h-12 w-full justify-center gap-2 rounded-xl px-3 py-3 text-sm" variant={isVideoOn ? 'ghost' : 'primary'} size="sm" onClick={toggleVideo}>
              <Icon name={isVideoOn ? 'video' : 'video-slash'} />
              {isVideoOn ? 'Camera' : 'Camera Off'}
            </Button>
            <Button className="min-h-12 w-full justify-center gap-2 rounded-xl px-3 py-3 text-sm" variant={isScreenSharing ? 'primary' : 'ghost'} size="sm" onClick={toggleScreenShare}>
              <Icon name="desktop" />
              {isScreenSharing ? 'Stop Share' : 'Share'}
            </Button>
            <Button className="min-h-12 w-full justify-center gap-2 rounded-xl px-3 py-3 text-sm" variant={handRaised ? 'warm' : 'secondary'} size="sm" onClick={handleRaiseHand} loading={raisingHand}>
              <Icon name="hand" />
              {handRaised ? 'Hand raised' : 'Raise hand'}
            </Button>
            <Button className="min-h-12 w-full justify-center gap-2 rounded-xl px-3 py-3 text-sm" variant="secondary" size="sm" onClick={toggleWhiteboard}>
              <Icon name="pencil" />
              {isWhiteboardVisible ? 'Hide board' : 'Show board'}
            </Button>
            </div>
          </section>

          {isWhiteboardVisible && (
            <CollaborativeWhiteboard
              roomId={roomId}
              user={user}
              isTutor={room.tutor_id === user?.id || room.participant_role === 'tutor'}
            />
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-primary-800 bg-primary-900 px-4 py-3 text-white">
              <h4 className="m-0 flex items-center gap-2 text-base font-bold text-white"><Icon name="comment-dots" /> Live chat</h4>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-primary-100">{messages.length} messages</span>
            </div>
            <div className="flex max-h-[420px] min-h-64 flex-1 flex-col gap-3 overflow-y-auto bg-slate-50/70 p-4" ref={chatBodyRef} aria-live="polite" aria-label="Classroom messages">
              {messages.length === 0 && <div className="m-auto max-w-xs py-8 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700"><Icon name="message" size="1.5rem" /></span><p className="mb-1 mt-3 text-sm font-bold text-slate-800">Start the conversation</p><p className="m-0 text-xs leading-5 text-slate-500">Ask a question or share a useful idea with the class.</p></div>}
              {messages.map((message) => (
                <div key={message.id} className="w-full">
                  {message.message_type === 'system' ? (
                    <div className="mx-auto flex max-w-[95%] items-center gap-2 rounded-xl bg-primary-50 px-3 py-2 text-xs font-medium text-primary-800">
                      <Icon name="circle-info" />
                      {message.content}
                    </div>
                  ) : message.message_type === 'resource' ? (
                    <div className="rounded-xl border border-border bg-slate-50 p-3">
                      <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                        <strong>{message.sender_name || 'Tutor'}</strong>
                        <span className="shrink-0 text-[11px] text-slate-500">
                          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-primary-700">
                        <Icon name="file-pdf" />
                        <a href={message.file_url} target="_blank" rel="noreferrer" download={message.file_name}>
                          {message.file_name}
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className={`flex ${message.user_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[88%] rounded-2xl border px-3.5 py-3 shadow-sm ${message.user_id === user?.id ? "rounded-tr-md border-primary-700 bg-primary-700 text-white" : "rounded-tl-md border-slate-200 bg-white text-slate-800"}`}>
                        <div className={`mb-1 flex items-center justify-between gap-4 text-xs font-bold ${message.user_id === user?.id ? "text-blue-100" : "text-primary-800"}`}>
                          {message.sender_name || 'User'}
                          <span className={`text-[10px] font-medium ${message.user_id === user?.id ? "text-blue-100/80" : "text-slate-400"}`}>
                            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className={`m-0 whitespace-pre-wrap break-words text-sm ${message.user_id === user?.id ? "text-white" : "text-slate-700"}`}>{message.content}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-end gap-2 border-t border-border bg-white p-3">
              <button type="button" aria-label="Insert a random reaction" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-slate-50 text-lg transition hover:bg-primary-50" onClick={() => {
                const emojis = ['👍', '❤️', '😂', '😮', '🎉', '🙌', '👏', '💯'];
                const pick = emojis[Math.floor(Math.random() * emojis.length)];
                setChatInput(chatInput + pick);
              }}>😊</button>
              <textarea
                aria-label="Write a classroom message"
                className="max-h-32 min-h-12 w-full min-w-0 flex-1 resize-y rounded-xl border border-border bg-white px-4 py-3 text-sm leading-6 text-foreground shadow-sm outline-none transition placeholder:text-slate-400 hover:border-primary-300 focus:border-primary-600 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a message…"
                rows={1}
                maxLength={1000}
              />
              <Button onClick={handleSendMessage} disabled={!chatInput.trim()} loading={sending} loadingLabel="Sending…" icon>
                <Icon name="paper-plane" />
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-primary-50/70 px-4 py-3">
              <div><h4 className="m-0"><Icon name="users" /> Participants ({participants.length})</h4><p className="m-0 mt-1 text-xs text-slate-500">People currently in this classroom</p></div>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">Live audio not connected</span>
            </div>
            <div className="grid max-h-72 gap-1 overflow-y-auto p-3">
              {participants.length === 0 && <p className="m-0 px-3 py-6 text-center text-sm text-slate-500">Participant list is loading or no one else has joined yet.</p>}
              {participants.map((participant) => (
                <div key={participant.id || participant.user_id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-slate-50">
                  <Icon
                    name={participant.role === 'tutor' ? 'user-graduate' : participant.role === 'admin' ? 'shield-halved' : 'user'}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 p-2 ${participant.role === 'tutor' ? 'bg-secondary-50 text-secondary-700' : participant.role === 'admin' ? 'bg-primary-100 text-primary-800' : 'text-primary-700'}`}
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{participant.user_name || 'Participant'}</div>
                    <div className="mt-0.5 text-xs capitalize text-slate-500">{participant.role}</div>
                  </div>
                  <div className="ml-auto flex shrink-0 items-center gap-2">
                    {participant.is_muted && <span title="Microphone muted" className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600"><Icon name="microphone-slash" /></span>}
                    {participant.hand_raised && <span title="Hand raised" className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-50 text-secondary-700"><Icon name="hand" /></span>}
                    {participant.is_screen_sharing && <span title="Screen sharing" className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-700"><Icon name="desktop" /></span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            <h4><Icon name="circle-info" /> Session details</h4>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {levelName && <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 [&>strong]:mb-1 [&>strong]:block [&>strong]:text-xs [&>strong]:uppercase [&>strong]:tracking-wide [&>strong]:text-slate-500"><strong>Level</strong> {levelName}</div>}
              {roomGroup && <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 [&>strong]:mb-1 [&>strong]:block [&>strong]:text-xs [&>strong]:uppercase [&>strong]:tracking-wide [&>strong]:text-slate-500"><strong>{groupLabel}</strong> {roomGroup}</div>}
              {roomUnit && <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 [&>strong]:mb-1 [&>strong]:block [&>strong]:text-xs [&>strong]:uppercase [&>strong]:tracking-wide [&>strong]:text-slate-500"><strong>{unitLabel}</strong> {roomUnit}</div>}
              <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 [&>strong]:mb-1 [&>strong]:block [&>strong]:text-xs [&>strong]:uppercase [&>strong]:tracking-wide [&>strong]:text-slate-500"><strong>Type</strong> {room.room_type === 'free' ? 'Open discussion' : room.room_type === 'hard_topic' ? 'Focused topic' : 'Premium'}</div>
              {room.tutor_name && <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 [&>strong]:mb-1 [&>strong]:block [&>strong]:text-xs [&>strong]:uppercase [&>strong]:tracking-wide [&>strong]:text-slate-500"><strong>Tutor</strong> {room.tutor_name}</div>}
              <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 [&>strong]:mb-1 [&>strong]:block [&>strong]:text-xs [&>strong]:uppercase [&>strong]:tracking-wide [&>strong]:text-slate-500"><strong>Status</strong> {room.status === 'live' ? '● Live' : room.status}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-5">
        <Button variant="danger" size="sm" onClick={handleLeaveRoom}>
          <Icon name="right-from-bracket" /> Leave classroom
        </Button>
        <Button variant="secondary" size="sm" onClick={handleExportChat}>
          <Icon name="file-export" /> Export chat
        </Button>
        <Button variant="secondary" size="sm" onClick={() => { setReportError(''); setReportOpen(true); }}>
          <Icon name="flag" /> Report an issue
        </Button>
      </div>

      {reportOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !reporting) setReportOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="classroom-report-title" className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><Icon name="flag" size="1.25rem" /></span><h3 id="classroom-report-title" className="mb-0 mt-4 text-xl font-bold text-slate-900">Report a classroom issue</h3><p className="mb-0 mt-2 text-sm leading-6 text-slate-600">Tell the Aliver team what happened. Your report will be reviewed privately.</p></div>
              <button type="button" aria-label="Close report dialog" disabled={reporting} onClick={() => setReportOpen(false)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><Icon name="close" /></button>
            </div>
            <label htmlFor="classroom-report-description" className="mb-2 block text-sm font-semibold text-slate-800">What happened?</label>
            <textarea id="classroom-report-description" rows={5} maxLength={2000} value={reportDescription} onChange={(event) => setReportDescription(event.target.value)} placeholder="Describe the issue and when it occurred…" className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary-600 focus:ring-4 focus:ring-primary-100" />
            <div className="mt-1 flex justify-end text-xs text-slate-500">{reportDescription.length}/2000</div>
            {reportError && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{reportError}</p>}
            <div className="mt-5 flex flex-col-reverse justify-end gap-2 sm:flex-row"><Button variant="ghost" onClick={() => setReportOpen(false)} disabled={reporting}>Cancel</Button><Button onClick={handleReportIssue} disabled={!reportDescription.trim()} loading={reporting}>Submit report</Button></div>
          </section>
        </div>
      )}
    </div>
  );
}
