'use client';

import { useEffect, useRef, useState } from 'react';
import { colorFor, kindFor, faceMarkupFor, layoutFor } from '../lib/shapes';

const HEARTBEAT_MS = 4000;
const POLL_MS = 2200;

function makeVisitorId() {
  return 'visitor-' + Math.random().toString(36).slice(2, 10);
}

function formatNextWindow(win) {
  if (!win) return null;
  try {
    const start = new Date(win.start);
    return start.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch (e) {
    return null;
  }
}

export default function PresencePage() {
  const [open, setOpen] = useState(null);
  const [nextWin, setNextWin] = useState(null);
  const [visitorIds, setVisitorIds] = useState([]);
  const visitorIdRef = useRef(null);
  const leavingRef = useRef(new Set());
  const [leaving, setLeaving] = useState(new Set());

  useEffect(() => {
    if (!visitorIdRef.current) {
      visitorIdRef.current = makeVisitorId();
    }
    const myId = visitorIdRef.current;

    let cancelled = false;
    let heartbeatTimer = null;
    let pollTimer = null;

    async function heartbeat() {
      try {
        const res = await fetch('/api/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitorId: myId }),
        });
        const data = await res.json();
        if (cancelled) return;
        applyStatus(data);
      } catch (e) {
        /* ignore transient network errors */
      }
    }

    async function poll() {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        if (cancelled) return;
        applyStatus(data);
      } catch (e) {
        /* ignore transient network errors */
      }
    }

    function applyStatus(data) {
      setOpen(!!data.open);
      setNextWin(data.nextWindow || null);

      // Without shared storage, the server can't track other visitors.
      // Always show at least this visitor so the room doesn't flicker
      // between empty and one shape depending on which endpoint answered.
      const incoming = data.storageOk
        ? new Set(data.visitorIds || [])
        : new Set([myId]);

      setVisitorIds((prev) => {
        const prevSet = new Set(prev);
        const gone = [...prevSet].filter((id) => !incoming.has(id));
        if (gone.length) {
          const nextLeaving = new Set(leavingRef.current);
          gone.forEach((id) => nextLeaving.add(id));
          leavingRef.current = nextLeaving;
          setLeaving(new Set(nextLeaving));
          setTimeout(() => {
            const after = new Set(leavingRef.current);
            gone.forEach((id) => after.delete(id));
            leavingRef.current = after;
            setLeaving(new Set(after));
          }, 550);
        }
        return [...incoming];
      });
    }

    heartbeat();
    heartbeatTimer = setInterval(heartbeat, HEARTBEAT_MS);
    pollTimer = setInterval(poll, POLL_MS);

    function handleUnload() {
      try {
        navigator.sendBeacon(
          '/api/heartbeat',
          new Blob([JSON.stringify({ visitorId: myId, leaving: true })], {
            type: 'application/json',
          })
        );
      } catch (e) {
        /* best effort */
      }
    }
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      cancelled = true;
      clearInterval(heartbeatTimer);
      clearInterval(pollTimer);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  const displayIds = [...new Set([...visitorIds, ...leaving])];
  const showRoom = open === true;
  const showClosed = open === false;

  return (
    <div className="pr-page">
      <div className="pr-stage" style={{ opacity: showRoom ? 1 : 0 }}>
        <div className="pr-shape-layer">
          {displayIds.map((id) => {
            const color = colorFor(id);
            const kind = kindFor(id);
            const { size, top, left, dur, delay, depth } = layoutFor(id);
            const isLeaving = leaving.has(id);
            return (
              <div
                key={id}
                className={`pr-shape${isLeaving ? ' leaving' : ''}`}
                style={{
                  top: `${top}%`,
                  left: `${left}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  animationDuration: `${dur}s, 0.6s`,
                  animationDelay: `${delay}s, 0s`,
                }}
                dangerouslySetInnerHTML={{
                  __html: faceMarkupFor(kind, color, depth),
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="pr-textbox" style={{ opacity: showRoom ? 1 : 0 }}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
        eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
        enim ad minim veniam, quis nostrud exercitation ullamco.
      </div>

      <div className="pr-closed" style={{ opacity: showClosed ? 1 : 0 }}>
        <div className="pr-glyph">&#9679;</div>
        <div>closed for now</div>
        {nextWin && <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
          opens {formatNextWindow(nextWin)}
        </div>}
      </div>
    </div>
  );
}
