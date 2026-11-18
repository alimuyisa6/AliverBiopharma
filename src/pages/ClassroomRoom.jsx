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
  raiseHand
} from '../api/client';
import Icon from '../components/Icon/Icon';
import Spinner from '../components/Spinner/Spinner';
import Button from '../components/Button/Button';
import EmptyState from '../components/EmptyState/EmptyState';
import { useLayout } from '../contexts/LayoutContext';


export default function ClassroomRoom() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { displayName, class_name } = useLevelFilter();
  const { bootstrap } = useLayout();
  const chatBodyRef = useRef(null);

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

  useEffect(() => {
    doJoinRoom();
    fetchRoom();
    fetchMessages();
    fetchParticipants();

    const msgInterval = setInterval(fetchMessages, 3000);
    const partInterval = setInterval(fetchParticipants, 10000);

    return () => {
      clearInterval(msgInterval);
      clearInterval(partInterval);
      leaveRoomSilent();
    };
  }, [roomId]);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  async function doJoinRoom() {
    try {
      await joinClassroom(roomId);
    } catch {}
  }

  async function leaveRoomSilent() {
    try {
      await leaveClassroom(roomId);
    } catch {}
  }

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
      setParticipants(data || []);
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
    setLeaving(true);
    try {
      await leaveClassroom(roomId);
    } catch {
    } finally {
      navigate('/classroom');
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

  function toggleMute() {
    setIsMuted(!isMuted);
    // In real app, would call API to toggle audio
  }

  function toggleVideo() {
    setIsVideoOn(!isVideoOn);
    // In real app, would call API to toggle video
  }

  function toggleScreenShare() {
    setIsScreenSharing(!isScreenSharing);
    // In real app, would call API to toggle screen share
  }

  function toggleWhiteboard() {
    setIsWhiteboardVisible(!isWhiteboardVisible);
  }

  function muteAll() {
    // In real app, would call API to mute all participants
    setParticipants(participants.map(p => ({ ...p, is_muted: true })));
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

  const levelName = displayName || room.level || '';
  const roomClass = room.class_name || class_name || '';

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-primary-100 bg-gradient-to-r from-primary-900 via-primary-800 to-primary-700 p-4 text-white shadow-xl shadow-primary-900/10 sm:p-6">
        <Button variant="ghost" size="sm" icon onClick={handleLeaveRoom} loading={leaving}>
          <Icon name="arrow-left" />
        </Button>

        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-xl font-bold leading-tight text-white sm:text-2xl">
            {room.title}<br />
            <span className="mt-3 flex flex-wrap gap-2">
              {room.topic_name && <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border border-white/20 bg-white/15 text-white">{room.topic_name}</span>}
              {roomClass && <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border border-secondary-200/40 bg-secondary-400/20 text-orange-50">{roomClass}</span>}
              {levelName && <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border border-primary-200/40 bg-primary-400/20 text-blue-50">{levelName}</span>}
            </span>
          </h2>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-red-200/30 bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-100"><span className="h-2 w-2 animate-pulse rounded-full bg-red-400"></span> Recording</span>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/30 bg-emerald-400/15 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">Live</span>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {participants.map((participant) => (
              <div
                key={participant.id || participant.user_id}
                className={`relative flex min-h-48 flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-900 to-slate-900 p-5 text-center text-white shadow-lg ${participant.is_speaking ? 'ring-2 ring-emerald-400 ring-offset-2' : ''} ${participant.user_id === user?.id ? 'border-primary-300' : ''}`}
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

          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-white p-3 shadow-sm sm:p-4">
            <Button variant={isMuted ? 'ghost' : 'primary'} size="sm" onClick={toggleMute}>
              <Icon name={isMuted ? 'microphone-slash' : 'microphone'} />
              {isMuted ? 'Unmute' : 'Mute'}
            </Button>
            <Button variant={isVideoOn ? 'ghost' : 'primary'} size="sm" onClick={toggleVideo}>
              <Icon name={isVideoOn ? 'video' : 'video-slash'} />
              {isVideoOn ? 'Camera' : 'Camera Off'}
            </Button>
            <Button variant={isScreenSharing ? 'primary' : 'ghost'} size="sm" onClick={toggleScreenShare}>
              <Icon name="desktop" />
              {isScreenSharing ? 'Stop Share' : 'Share'}
            </Button>
            <Button variant={handRaised ? 'warm' : 'secondary'} size="sm" onClick={handleRaiseHand} loading={raisingHand}>
              <Icon name="hand" />
              {handRaised ? 'Hand raised' : 'Raise hand'}
            </Button>
            <Button variant="secondary" size="sm" onClick={toggleWhiteboard}>
              <Icon name="pencil" />
              {isWhiteboardVisible ? 'Hide board' : 'Show board'}
            </Button>
          </div>

          {isWhiteboardVisible && (
            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              <div className="flex flex-wrap items-center gap-2 border-b border-border bg-slate-50 p-3">
                <Button variant="secondary" size="xs"><Icon name="pencil" /> Pen</Button>
                <Button variant="secondary" size="xs"><Icon name="eraser" /> Eraser</Button>
                <Button variant="secondary" size="xs"><Icon name="shapes" /> Shape</Button>
                <Button variant="secondary" size="xs"><Icon name="palette" /> Color</Button>
                <Button variant="secondary" size="xs"><Icon name="undo" /></Button>
                <Button variant="secondary" size="xs"><Icon name="redo" /></Button>
                <Button variant="secondary" size="xs"><Icon name="trash" /> Clear</Button>
                <span className="ml-auto text-xs font-bold uppercase tracking-wider text-slate-500">Shared whiteboard</span>
              </div>
              <div className="flex min-h-64 flex-col items-center justify-center gap-3 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:24px_24px] p-8 text-center text-sm font-medium text-slate-500">
                <Icon name="pen-fancy" />
                <span>Draw here to share your ideas with the class.</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-border bg-primary-50/70 px-4 py-3">
              <h4><Icon name="comment-dots" /> Live chat</h4>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="xs"><Icon name="smile" /></Button>
                <Button variant="ghost" size="xs"><Icon name="ellipsis-vertical" /></Button>
              </div>
            </div>
            <div className="flex max-h-[420px] min-h-64 flex-1 flex-col gap-3 overflow-y-auto p-4" ref={chatBodyRef}>
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
                      <div className="max-w-[88%] rounded-2xl rounded-tl-md border border-border bg-slate-50 px-3.5 py-3">
                        <div className="mb-1 flex items-center justify-between gap-4 text-xs font-bold text-primary-800">
                          {message.sender_name || 'User'}
                          <span className="text-[10px] font-medium text-slate-400">
                            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="m-0 whitespace-pre-wrap break-words text-sm text-slate-700">{message.content}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-end gap-2 border-t border-border bg-white p-3">
              <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-slate-50 text-lg transition hover:bg-primary-50" onClick={() => {
                const emojis = ['👍', '❤️', '😂', '😮', '🎉', '🙌', '👏', '💯'];
                const pick = emojis[Math.floor(Math.random() * emojis.length)];
                setChatInput(chatInput + pick);
              }}>😊</button>
              <textarea
                className="max-h-28 min-h-10 w-full flex-1 resize-none rounded-xl border border-border bg-slate-50 px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 block min-h-32 w-full min-w-0 resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
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
              <h4><Icon name="users" /> Participants ({participants.length})</h4>
              <Button variant="secondary" size="xs" onClick={muteAll}>
                <Icon name="microphone-slash" /> Mute all
              </Button>
            </div>
            <div className="grid max-h-64 gap-1 overflow-y-auto p-3">
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
                  {participant.is_muted && <Icon name="microphone-slash" className="ml-auto h-4 w-4 shrink-0 text-red-600" />}
                  {participant.hand_raised && <Icon name="hand" className="ml-auto h-4 w-4 shrink-0 text-secondary-600" />}
                  {participant.is_screen_sharing && <Icon name="desktop" className="ml-auto h-4 w-4 shrink-0 text-primary-600" />}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            <h4><Icon name="circle-info" /> Session details</h4>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {room.level && <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 [&>strong]:mb-1 [&>strong]:block [&>strong]:text-xs [&>strong]:uppercase [&>strong]:tracking-wide [&>strong]:text-slate-500"><strong>Level</strong> {room.level}</div>}
              {roomClass && <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 [&>strong]:mb-1 [&>strong]:block [&>strong]:text-xs [&>strong]:uppercase [&>strong]:tracking-wide [&>strong]:text-slate-500"><strong>Class</strong> {roomClass}</div>}
              {room.topic_name && <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 [&>strong]:mb-1 [&>strong]:block [&>strong]:text-xs [&>strong]:uppercase [&>strong]:tracking-wide [&>strong]:text-slate-500"><strong>Topic</strong> {room.topic_name}</div>}
              <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 [&>strong]:mb-1 [&>strong]:block [&>strong]:text-xs [&>strong]:uppercase [&>strong]:tracking-wide [&>strong]:text-slate-500"><strong>Type</strong> {room.room_type === 'free' ? 'Open discussion' : room.room_type === 'hard_topic' ? 'Focused topic' : 'Premium'}</div>
              {room.tutor_name && <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 [&>strong]:mb-1 [&>strong]:block [&>strong]:text-xs [&>strong]:uppercase [&>strong]:tracking-wide [&>strong]:text-slate-500"><strong>Tutor</strong> {room.tutor_name}</div>}
              <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 [&>strong]:mb-1 [&>strong]:block [&>strong]:text-xs [&>strong]:uppercase [&>strong]:tracking-wide [&>strong]:text-slate-500"><strong>Status</strong> {room.status === 'live' ? '● Live' : room.status}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white p-3 shadow-sm sm:p-4">
        <Button variant="danger" size="sm" onClick={handleLeaveRoom}>
          <Icon name="right-from-bracket" /> Leave classroom
        </Button>
        <Button variant="secondary" size="sm">
          <Icon name="file-export" /> Export notes
        </Button>
        <Button variant="secondary" size="sm">
          <Icon name="flag" /> Report an issue
        </Button>
      </div>
    </div>
  );
}
