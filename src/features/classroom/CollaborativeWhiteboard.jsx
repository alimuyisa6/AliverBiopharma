import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  applyClassroomWhiteboardOperation,
  getClassroomWhiteboardArchives,
  getClassroomWhiteboardConfig,
  getClassroomWhiteboardHistory,
  getClassroomWhiteboardSnapshot,
  saveClassroomWhiteboardSnapshot
} from '../../api/client';

const BOARD_WIDTH = 1000;
const BOARD_HEIGHT = 600;
const COLORS = ['#163b68', '#0f766e', '#b45309', '#be123c', '#6d28d9', '#111827'];
const TOOLS = [
  { id: 'pen', label: 'Pen', symbol: '✎' },
  { id: 'highlighter', label: 'Highlighter', symbol: '▰' },
  { id: 'eraser', label: 'Eraser', symbol: '⌫' },
  { id: 'line', label: 'Line', symbol: '／' },
  { id: 'rectangle', label: 'Rectangle', symbol: '▱' },
  { id: 'ellipse', label: 'Ellipse', symbol: '◯' }
];

function getPoint(event, element) {
  const bounds = element.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(BOARD_WIDTH, ((event.clientX - bounds.left) / bounds.width) * BOARD_WIDTH)),
    y: Math.max(0, Math.min(BOARD_HEIGHT, ((event.clientY - bounds.top) / bounds.height) * BOARD_HEIGHT))
  };
}

function strokePath(points) {
  if (!points?.length) return '';
  return points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
}

function renderStroke(stroke) {
  const points = stroke.points || [];
  if (points.length < 2) return null;
  const first = points[0];
  const last = points[points.length - 1];
  const common = {
    stroke: stroke.color,
    strokeWidth: stroke.width,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    opacity: stroke.tool === 'highlighter' ? 0.28 : 1,
    fill: 'none'
  };

  if (stroke.tool === 'line') {
    return <line key={stroke.id} x1={first.x} y1={first.y} x2={last.x} y2={last.y} {...common} />;
  }
  if (stroke.tool === 'rectangle') {
    return <rect key={stroke.id} x={Math.min(first.x, last.x)} y={Math.min(first.y, last.y)} width={Math.abs(last.x - first.x)} height={Math.abs(last.y - first.y)} rx="3" {...common} />;
  }
  if (stroke.tool === 'ellipse') {
    return <ellipse key={stroke.id} cx={(first.x + last.x) / 2} cy={(first.y + last.y) / 2} rx={Math.abs(last.x - first.x) / 2} ry={Math.abs(last.y - first.y) / 2} {...common} />;
  }
  return <path key={stroke.id} d={strokePath(points)} {...common} />;
}

function isValidPreviewStroke(stroke) {
  const allowedTools = new Set(['pen', 'highlighter', 'eraser', 'line', 'rectangle', 'ellipse']);
  return Boolean(
    stroke &&
    allowedTools.has(stroke.tool) &&
    /^#[0-9a-f]{6}$/i.test(String(stroke.color || '')) &&
    Number.isFinite(Number(stroke.width)) &&
    Number(stroke.width) >= 1 &&
    Number(stroke.width) <= 28 &&
    Array.isArray(stroke.points) &&
    stroke.points.length >= 2 &&
    stroke.points.length <= 250 &&
    stroke.points.every((point) => Number.isFinite(Number(point?.x)) && Number.isFinite(Number(point?.y)) && Number(point.x) >= 0 && Number(point.x) <= BOARD_WIDTH && Number(point.y) >= 0 && Number(point.y) <= BOARD_HEIGHT)
  );
}

function applyBoardEvent(strokes, operation) {
  if (!operation) return strokes;
  if (operation.type === 'add') return [...strokes, operation.stroke];
  if (operation.type === 'remove') return strokes.filter((stroke) => stroke.id !== operation.stroke_id);
  if (operation.type === 'clear') return [];
  return strokes;
}

export default function CollaborativeWhiteboard({ roomId, user, isTutor = false }) {
  const svgRef = useRef(null);
  const activeStrokeRef = useRef(null);
  const channelRef = useRef(null);
  const showHistoryRef = useRef(false);
  const revisionRef = useRef(0);
  const strokesRef = useRef([]);
  const refreshSnapshotRef = useRef(null);
  const previewTimersRef = useRef(new Map());
  const lastPreviewAtRef = useRef(0);
  const [strokes, setStrokes] = useState([]);
  const [revision, setRevision] = useState(0);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState(COLORS[0]);
  const [width, setWidth] = useState(3);
  const [draft, setDraft] = useState(null);
  const [connection, setConnection] = useState('connecting');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [activeEditors, setActiveEditors] = useState([]);
  const [remoteDrafts, setRemoteDrafts] = useState({});
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  showHistoryRef.current = showHistory;
  const [history, setHistory] = useState([]);
  const [archives, setArchives] = useState([]);
  const [archiveTitle, setArchiveTitle] = useState('Classroom whiteboard snapshot');

  const replaceSnapshot = useCallback((snapshot) => {
    const nextRevision = Number(snapshot?.revision) || 0;
    if (nextRevision < revisionRef.current) return;
    const nextStrokes = Array.isArray(snapshot?.document?.strokes) ? snapshot.document.strokes : [];
    revisionRef.current = nextRevision;
    strokesRef.current = nextStrokes;
    setRevision(nextRevision);
    setStrokes(nextStrokes);
    setLastSavedAt(snapshot?.updated_at || null);
  }, []);

  const refreshSnapshot = useCallback(async () => {
    const snapshot = await getClassroomWhiteboardSnapshot(roomId, user?.id);
    replaceSnapshot(snapshot);
    return snapshot;
  }, [roomId, replaceSnapshot, user?.id]);
  const refreshActivity = useCallback(async () => {
    const [nextHistory, nextArchives] = await Promise.all([
      getClassroomWhiteboardHistory(roomId, user?.id),
      getClassroomWhiteboardArchives(roomId, user?.id)
    ]);
    setHistory(Array.isArray(nextHistory) ? nextHistory : []);
    setArchives(Array.isArray(nextArchives) ? nextArchives : []);
  }, [roomId, user?.id]);
  refreshSnapshotRef.current = refreshSnapshot;

  useEffect(() => {
    let disposed = false;
    let refreshTimer;
    let activeChannel;
    let client;

    async function connect() {
      try {
        setConnection('connecting');
        setError('');
        const config = await getClassroomWhiteboardConfig(roomId, user?.id);
        if (disposed) return;

        client = createClient(config.url, config.publishable_key, {
          auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
          realtime: { params: { eventsPerSecond: 12 } }
        });
        await client.realtime.setAuth(config.access_token);

        activeChannel = client.channel(config.topic, {
          config: {
            private: true,
            broadcast: { self: false, ack: true },
            presence: { key: user?.id || 'classroom-guest' }
          }
        });
        channelRef.current = activeChannel;

        activeChannel
          .on('broadcast', { event: 'board_preview' }, ({ payload }) => {
            const editorId = payload?.user_id;
            if (!editorId || editorId === user?.id || !isValidPreviewStroke(payload?.stroke)) return;
            setRemoteDrafts((current) => ({ ...current, [editorId]: { ...payload.stroke, id: `preview-${editorId}` } }));
            window.clearTimeout(previewTimersRef.current.get(editorId));
            previewTimersRef.current.set(editorId, window.setTimeout(() => {
              setRemoteDrafts((current) => { const next = { ...current }; delete next[editorId]; return next; });
              previewTimersRef.current.delete(editorId);
            }, 1800));
          })
          .on('broadcast', { event: 'board_operation' }, async ({ payload }) => {
            if (payload?.actor_id) {
              window.clearTimeout(previewTimersRef.current.get(payload.actor_id));
              previewTimersRef.current.delete(payload.actor_id);
              setRemoteDrafts((current) => { const next = { ...current }; delete next[payload.actor_id]; return next; });
            }
            const eventRevision = Number(payload?.revision) || 0;
            if (eventRevision <= revisionRef.current) return;
            if (payload?.operation?.type === 'restore') {
              try { await refreshSnapshotRef.current?.(); } catch { setError('The restored snapshot could not be loaded.'); }
              if (showHistoryRef.current) refreshActivity().catch(() => {});
              return;
            }
            if (eventRevision !== revisionRef.current + 1) {
              try { await refreshSnapshotRef.current?.(); } catch { setError('The board changed while reconnecting. Refresh the board to see the latest version.'); }
              return;
            }
            const next = applyBoardEvent(strokesRef.current, payload.operation);
            strokesRef.current = next;
            revisionRef.current = eventRevision;
            setStrokes(next);
            setRevision(eventRevision);
            setLastSavedAt(new Date().toISOString());
            if (showHistoryRef.current) refreshActivity().catch(() => {});
          })
          .on('presence', { event: 'sync' }, () => {
            const state = activeChannel.presenceState();
            const editors = Object.entries(state).flatMap(([key, entries]) => {
              const entry = entries?.[entries.length - 1] || {};
              return [{ key, name: entry.name || 'Participant', role: entry.role || 'learner' }];
            });
            setActiveEditors(editors);
          })
          .subscribe(async (status, subscribeError) => {
            if (disposed) return;
            if (status === 'SUBSCRIBED') {
              setConnection('connected');
              try {
                await activeChannel.track({
                  name: user?.full_name || user?.profile?.display_name || 'Participant',
                  role: isTutor ? 'tutor' : 'learner',
                  joined_at: new Date().toISOString()
                });
                await refreshSnapshotRef.current?.();
              } catch (syncError) {
                setError(syncError.message || 'The whiteboard connected but could not synchronise.');
              }
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
              setConnection('reconnecting');
              if (subscribeError?.message) setError(subscribeError.message);
            }
          });

        await Promise.all([refreshSnapshot(), refreshActivity()]);
        if (!disposed) refreshTimer = window.setInterval(async () => {
          try {
            const renewed = await getClassroomWhiteboardConfig(roomId, user?.id);
            if (!disposed) await client.realtime.setAuth(renewed.access_token);
          } catch (refreshError) {
            if (disposed) return;
            if (refreshError.status === 401 || refreshError.status === 403) {
              if (activeChannel && client) client.removeChannel(activeChannel);
              channelRef.current = null;
              setConnection('error');
              setError('Your access to this classroom has ended. The shared board has been disconnected.');
              return;
            }
            setConnection('reconnecting');
          }
        }, 2 * 60 * 1000);
      } catch (connectError) {
        if (!disposed) {
          setConnection('error');
          setError(connectError.message || 'Unable to connect to the shared whiteboard.');
        }
      }
    }

    connect();
    return () => {
      disposed = true;
      window.clearInterval(refreshTimer);
      previewTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      previewTimersRef.current.clear();
      activeStrokeRef.current = null;
      if (activeChannel && client) client.removeChannel(activeChannel);
      channelRef.current = null;
    };
  }, [roomId, user?.id, user?.full_name, user?.profile?.display_name, isTutor, refreshSnapshot, refreshActivity, retryCount]);

  const publishOperation = useCallback(async (operation) => {
    setBusy(true);
    setError('');
    try {
      const saved = await applyClassroomWhiteboardOperation(roomId, operation);
      replaceSnapshot(saved);
      if (showHistory) refreshActivity().catch(() => {});
      if (saved.operation && channelRef.current) {
        const response = await channelRef.current.send({
          type: 'broadcast',
          event: 'board_operation',
          payload: saved.operation
        });
        if (response !== 'ok') setConnection('reconnecting');
      }
    } catch (operationError) {
      setError(operationError.message || 'Your drawing could not be saved. Please try again.');
      if (operationError.status === 409) {
        try { await refreshSnapshot(); } catch {}
      }
    } finally {
      setBusy(false);
    }
  }, [roomId, replaceSnapshot, refreshSnapshot, refreshActivity, showHistory]);

  const beginStroke = (event) => {
    if (event.button !== 0 || busy || connection !== 'connected') return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const point = getPoint(event, event.currentTarget);
    const next = {
      tool,
      color: tool === 'eraser' ? '#ffffff' : color,
      width: tool === 'eraser' ? Math.max(18, width * 5) : width,
      points: [point]
    };
    activeStrokeRef.current = next;
    setDraft(next);
  };

  const moveStroke = (event) => {
    const active = activeStrokeRef.current;
    if (!active) return;
    const point = getPoint(event, event.currentTarget);
    const points = active.points.length >= 250
      ? [...active.points.slice(0, 249), point]
      : [...active.points, point];
    const next = { ...active, points };
    activeStrokeRef.current = next;
    setDraft(next);
    if (channelRef.current && user?.id && Date.now() - lastPreviewAtRef.current >= 90) {
      lastPreviewAtRef.current = Date.now();
      channelRef.current.send({
        type: 'broadcast',
        event: 'board_preview',
        payload: { user_id: user.id, stroke: { ...next, id: `preview-${user.id}` } }
      }).catch(() => {});
    }
  };

  const finishStroke = async () => {
    const active = activeStrokeRef.current;
    if (!active) return;
    activeStrokeRef.current = null;
    setDraft(null);
    if (active.points.length < 2) return;
    await publishOperation({ type: 'add', stroke: active });
  };

  const undo = () => publishOperation({ type: 'undo' });
  const clear = () => {
    if (window.confirm('Clear the shared board for everyone in this classroom?')) {
      publishOperation({ type: 'clear' });
    }
  };
  const saveSnapshot = async () => {
    setBusy(true);
    setError('');
    try {
      await saveClassroomWhiteboardSnapshot(roomId, archiveTitle);
      await refreshActivity();
      setShowHistory(true);
    } catch (saveError) {
      setError(saveError.message || 'Unable to save this snapshot.');
    } finally {
      setBusy(false);
    }
  };
  const restoreSnapshot = async (archiveId) => {
    if (!window.confirm('Restore this saved snapshot? The current board will be replaced.')) return;
    await publishOperation({ type: 'restore', archive_id: archiveId });
    await refreshActivity().catch(() => {});
  };

  const editorLabel = useMemo(() => {
    const others = activeEditors.filter((editor) => editor.key !== user?.id).length;
    if (!activeEditors.length) return 'You are here';
    return `${activeEditors.length} ${activeEditors.length === 1 ? 'person' : 'people'} here${others > 0 ? ` · ${others} other${others === 1 ? '' : 's'} editing` : ''}`;
  }, [activeEditors, user?.id]);

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_50px_-32px_rgba(15,23,42,0.35)]" aria-label="Collaborative classroom whiteboard">
      <div className="flex flex-col gap-4 border-b border-primary-800 bg-primary-950 px-4 py-5 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary-400 text-xl text-primary-950">✎</span>
          <div>
            <h3 className="m-0 text-lg font-extrabold text-white sm:text-xl">Collaborative whiteboard</h3>
            <p className="m-0 mt-1 text-xs text-primary-100">Draw, explain and build ideas together in real time.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${connection === 'connected' ? 'border-emerald-300/30 bg-emerald-400/15 text-emerald-100' : connection === 'error' ? 'border-red-300/30 bg-red-400/15 text-red-100' : 'border-amber-200/30 bg-amber-300/15 text-amber-100'}`}>
            <span className={`h-2 w-2 rounded-full ${connection === 'connected' ? 'bg-emerald-300' : connection === 'error' ? 'bg-red-300' : 'animate-pulse bg-amber-300'}`} />
            {connection === 'connected' ? 'Live and synced' : connection === 'error' ? 'Connection error' : 'Connecting…'}
          </span>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-primary-100">{editorLabel}</span>
        </div>
      </div>

      <div className="flex flex-col gap-4 bg-slate-50 p-3 sm:p-5">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5" role="toolbar" aria-label="Whiteboard tools">
              {TOOLS.map((item) => (
                <button key={item.id} type="button" onClick={() => setTool(item.id)} aria-pressed={tool === item.id} title={item.label} className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 ${tool === item.id ? 'border-primary-800 bg-primary-900 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-primary-300 hover:bg-primary-50'}`}>
                  <span aria-hidden="true" className="text-base">{item.symbol}</span><span className="hidden sm:inline">{item.label}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={undo} disabled={busy || strokes.length === 0} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40">Undo mine</button>
              {isTutor && <button type="button" onClick={clear} disabled={busy || strokes.length === 0} className="min-h-10 rounded-xl border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40">Clear board</button>}
              <button type="button" onClick={() => { setShowHistory((visible) => !visible); if (!showHistory) refreshActivity().catch((err) => setError(err.message)); }} aria-expanded={showHistory} className="min-h-10 rounded-xl border border-primary-200 bg-primary-50 px-3 text-sm font-semibold text-primary-800 transition hover:bg-primary-100">{showHistory ? 'Hide history' : 'Board history'}</button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-bold uppercase tracking-wide text-slate-500">Ink</span>
              {COLORS.map((swatch) => <button key={swatch} type="button" onClick={() => { setColor(swatch); if (tool === 'eraser') setTool('pen'); }} aria-label={`Choose ${swatch} ink`} aria-pressed={color === swatch && tool !== 'eraser'} className={`h-7 w-7 rounded-full border-2 transition ${color === swatch && tool !== 'eraser' ? 'scale-110 border-primary-900 ring-2 ring-primary-200' : 'border-white shadow-sm ring-1 ring-slate-200'}`} style={{ backgroundColor: swatch }} />)}
            </div>
            <label className="flex items-center gap-3 text-xs font-semibold text-slate-600">Stroke width <input type="range" min="1" max="12" value={width} onChange={(event) => setWidth(Number(event.target.value))} className="w-28 accent-primary-800" /><span className="w-4 text-right tabular-nums">{width}</span></label>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-inner">
          <div className="pointer-events-none absolute inset-0 opacity-[0.28]" style={{ backgroundImage: 'radial-gradient(#cbd5e1 0.8px, transparent 0.8px)', backgroundSize: '18px 18px' }} />
          <svg ref={svgRef} viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`} role="img" aria-label="Shared drawing surface. Use pointer or touch to draw." className={`relative block aspect-[5/3] w-full touch-none select-none ${tool === 'eraser' ? 'cursor-cell' : 'cursor-crosshair'}`} onPointerDown={beginStroke} onPointerMove={moveStroke} onPointerUp={finishStroke} onPointerCancel={finishStroke} onLostPointerCapture={finishStroke}>
            <rect x="0" y="0" width={BOARD_WIDTH} height={BOARD_HEIGHT} fill="transparent" />
            {strokes.map(renderStroke)}
            {Object.values(remoteDrafts).map(renderStroke)}
            {draft && renderStroke({ ...draft, id: 'active-draft' })}
          </svg>
          {connection !== 'connected' && <div className="absolute bottom-3 left-3 rounded-lg border border-amber-200 bg-amber-50/95 px-3 py-2 text-xs font-semibold text-amber-900 shadow-sm">{connection === 'error' ? 'Board connection unavailable' : 'Reconnecting · changes will sync when connection returns'}</div>}
        </div>

        {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><span>{error}</span><button type="button" onClick={() => { setError(''); setRetryCount((value) => value + 1); }} className="font-bold underline underline-offset-2">Reconnect</button></div>}
        {isTutor && <div className="flex flex-col gap-2 rounded-2xl border border-primary-100 bg-white p-3 sm:flex-row sm:items-center"><label className="min-w-0 flex-1 text-xs font-semibold text-slate-600">Save a named session snapshot<input value={archiveTitle} onChange={(event) => setArchiveTitle(event.target.value)} maxLength={80} className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100" placeholder="e.g. Pharmacokinetics — group discussion" /></label><button type="button" onClick={saveSnapshot} disabled={busy || !archiveTitle.trim()} className="min-h-10 rounded-xl bg-secondary-400 px-4 text-sm font-bold text-primary-950 transition hover:bg-secondary-300 disabled:cursor-not-allowed disabled:opacity-50">Save snapshot</button></div>}

        {showHistory && <div className="grid gap-4 lg:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-4"><h4 className="m-0 text-sm font-extrabold text-slate-900">Recent board activity</h4><p className="mb-3 mt-1 text-xs text-slate-500">Latest changes, recorded in order.</p>{history.length ? <ol className="m-0 space-y-3 p-0">{history.slice(0, 12).map((item) => { const kind = item.operation?.type; const label = kind === 'add' ? `Added ${item.operation?.stroke?.tool || 'a drawing'}` : kind === 'remove' ? 'Undid a drawing' : kind === 'clear' ? 'Cleared the board' : kind === 'restore' ? 'Restored a saved snapshot' : 'Updated the board'; return <li key={item.revision} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-0"><div className="min-w-0"><p className="m-0 text-xs font-semibold text-slate-800">{label}</p><p className="m-0 mt-1 text-[11px] text-slate-500">{item.actor_name || 'Participant'} · revision {item.revision}</p></div><time className="shrink-0 text-[11px] text-slate-400">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></li>; })}</ol> : <p className="m-0 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">No board activity has been recorded yet.</p>}</section><section className="rounded-2xl border border-slate-200 bg-white p-4"><h4 className="m-0 text-sm font-extrabold text-slate-900">Saved session snapshots</h4><p className="mb-3 mt-1 text-xs text-slate-500">Restore a previously saved board state.</p>{archives.length ? <ul className="m-0 space-y-3 p-0">{archives.map((archive) => <li key={archive.id} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0"><div className="min-w-0"><p className="m-0 truncate text-xs font-semibold text-slate-800">{archive.title}</p><p className="m-0 mt-1 text-[11px] text-slate-500">{archive.created_by_name} · {new Date(archive.created_at).toLocaleDateString()}</p></div>{isTutor && <button type="button" onClick={() => restoreSnapshot(archive.id)} disabled={busy} className="shrink-0 rounded-lg border border-primary-200 px-3 py-2 text-xs font-bold text-primary-800 transition hover:bg-primary-50 disabled:opacity-50">Restore</button>}</li>)}</ul> : <p className="m-0 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">No saved snapshots yet. Tutors can save a board state for later revision.</p>}</section></div>}

        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-500">
          <span>{strokes.length} drawing {strokes.length === 1 ? 'element' : 'elements'} · revision {revision}</span>
          <span>{lastSavedAt ? `Last saved ${new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Board is ready for the first drawing'}</span>
        </div>
      </div>
    </section>
  );
}
