import { useEffect, useRef, useState } from 'react';
import type { PhotoGroup } from '../lib/types';
import { useReview } from '../lib/useReview';
import { HeartIcon, UndoIcon, XIcon } from './Icons';

const ACCENT = '#F5A028';
const CARD_ASPECT = '4 / 5';

export function ReviewScreen({ groups, onDone }: { groups: PhotoGroup[]; onDone: (groups: PhotoGroup[]) => void }) {
  const onDoneRef = useRef(onDone);
  const [zoomed, setZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const activeThumbRef = useRef<HTMLDivElement>(null);
  onDoneRef.current = onDone;
  const { state, decide, undo, selectTab, selectThumb, onPointerDown, onPointerMove, onPointerUp } = useReview(groups);
  const { groups: g, groupIndex, photoIndex, history, dragX, dragging, noTransition, undoing, done, deciding } = state;

  useEffect(() => {
    if (done) onDoneRef.current(g);
  }, [done, g]);

  useEffect(() => {
    setZoomed(false);
  }, [photoIndex, groupIndex]);

  useEffect(() => {
    activeThumbRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  }, [photoIndex, groupIndex]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') setZoomed(z => !z);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  if (done) return null;

  const group = g[groupIndex];
  const photo = group ? group.photos[photoIndex] : null;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const draggingOrMoved = dragging || dragX !== 0;
  // While dragging: fade proportionally. When settling after a decision: fade to 0 (CSS transition does the work).
  const exitOpacity = dragging
    ? Math.max(0, 1 - Math.abs(dragX) / 320)
    : dragX !== 0 ? 0 : 1;
  const cardStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    aspectRatio: CARD_ASPECT,
    overflow: 'hidden',
    zIndex: 2,
    background: '#000',
    boxShadow: '0 22px 44px rgba(0,0,0,.4)',
    cursor: dragging ? 'grabbing' : zoomed ? 'zoom-in' : 'grab',
    transform: draggingOrMoved ? `translateX(${dragX}px) rotate(${(dragX / 22).toFixed(2)}deg)` : 'translateX(0px)',
    opacity: exitOpacity,
    transition: dragging || noTransition ? 'none' : 'transform .14s ease-in, opacity .14s ease-in',
    touchAction: 'none',
  };

  let nextPhoto = null;
  if (group) {
    if (photoIndex + 1 < group.photos.length) nextPhoto = group.photos[photoIndex + 1];
    else if (g[groupIndex + 1]) nextPhoto = g[groupIndex + 1].photos[0];
  }
  const settling = dragX !== 0 && !dragging;
  const backCardStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    aspectRatio: CARD_ASPECT,
    overflow: 'hidden',
    background: '#000',
    transform: settling ? 'scale(1) translateY(0px)' : 'scale(.94) translateY(14px)',
    opacity: nextPhoto ? 1 : 0,
    transition: noTransition ? 'none' : 'transform .32s cubic-bezier(.2,.7,.3,1)',
    zIndex: 1,
  };

  const rightOp = Math.max(0, Math.min(dragX / 140, 1));
  const leftOp = Math.max(0, Math.min(-dragX / 140, 1));

  const undoDisabled = history.length === 0;
  const rejectDisabled = !photo;
  const keepDisabled = !photo;

  const circleBtn = (bg: string, fg: string, size: number, disabled: boolean): React.CSSProperties => ({
    width: size,
    height: size,
    borderRadius: '50%',
    border: 'none',
    background: disabled ? 'rgba(255,255,255,.06)' : bg,
    color: disabled ? 'rgba(255,255,255,.2)' : fg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: disabled ? 'none' : '0 8px 18px rgba(0,0,0,.35)',
  });

  const showFlyX = (dragX < -140 || deciding === 'rejected') && !undoing;
  const showFlyHeart = (dragX > 140 || deciding === 'kept') && !undoing;
  const showFlyUndo = undoing && dragX !== 0;

  /* ── Action overlay — sibling of card, matches card transform so it slides out together ── */
  const actionOverlay = (showFlyX || showFlyHeart || showFlyUndo) ? (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transform: draggingOrMoved ? `translateX(${dragX}px) rotate(${(dragX / 22).toFixed(2)}deg)` : 'translateX(0px)',
      transition: dragging || noTransition ? 'none' : 'transform .14s ease-in',
      background: showFlyHeart ? 'rgba(76,122,107,.22)' : showFlyX ? 'rgba(226,72,60,.22)' : 'transparent',
    }}>
      {/* Inner wrapper handles the pop-in animation independently of the slide transform */}
      <div style={{ animation: 'flyStamp .15s ease-out both' }}>
        {showFlyHeart && <HeartIcon size={100} color="#4C7A6B" />}
        {showFlyX && <XIcon size={100} color="#E2483C" />}
        {showFlyUndo && <UndoIcon size={80} color="#8a8580" />}
      </div>
    </div>
  ) : null;

  /* ── Shared card inner JSX ── */
  const cardInner = (
    <>
      {photo && (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <div style={{
            width: '100%', height: '100%',
            backgroundImage: `url(${photo.src})`,
            backgroundSize: zoomed ? '200%' : 'cover',
            backgroundPosition: zoomed ? `${mousePos.x}% ${mousePos.y}%` : 'center',
            backgroundRepeat: 'no-repeat',
            transition: dragging ? 'none' : 'background-size .2s ease, background-position .08s ease',
          }} />
        </div>
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(226,72,60,.32)', opacity: leftOp, transition: dragging ? 'none' : 'opacity .25s ease' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(245,233,214,.28)', opacity: rightOp, transition: dragging ? 'none' : 'opacity .25s ease' }} />
    </>
  );

  /* ── Shared action buttons ── */
  const actionButtons = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, padding: '14px 0', flexShrink: 0 }}>
      <button onClick={() => decide('rejected')} disabled={rejectDisabled}
        style={{ ...circleBtn('rgba(226,72,60,.12)', '#E2483C', 56, rejectDisabled), boxShadow: 'none', border: rejectDisabled ? 'none' : '1px solid rgba(226,72,60,.35)' }}>
        <XIcon size="46%" color="currentColor" />
      </button>
      <button onClick={() => decide('kept')} disabled={keepDisabled} style={circleBtn('#4C7A6B', '#fff', 64, keepDisabled)}>
        <HeartIcon size="46%" color="currentColor" />
      </button>
      <button onClick={undo} disabled={undoDisabled}
        style={{ ...circleBtn('transparent', '#8a8580', 56, undoDisabled), background: 'transparent', boxShadow: 'none', border: 'none' }}>
        <UndoIcon size="calc(58% - 6px)" color="currentColor" />
      </button>
    </div>
  );

  /* ── Shared thumbnail renderer ── */
  const thumbItem = (p: typeof photo, pi: number, scrollRef?: React.Ref<HTMLDivElement>) => {
    if (!p) return null;
    const active = pi === photoIndex;
    return (
      <div key={p.id} ref={scrollRef} onClick={() => selectThumb(pi)}
        style={{ flex: 'none', width: 52, height: 66, position: 'relative', cursor: 'pointer', transform: active ? 'scale(1.08)' : 'scale(1)', transition: 'transform .2s ease', zIndex: active ? 2 : 1 }}>
        <div style={{ width: '100%', height: '100%', backgroundImage: `url(${p.thumbSrc})`, backgroundSize: 'cover', backgroundPosition: 'center', outline: active ? `2px solid ${ACCENT}` : '1px solid rgba(255,255,255,.14)', outlineOffset: active ? 2 : 0 }} />
        {p.status === 'kept' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'stampPop .38s cubic-bezier(.34,1.56,.64,1) both' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#4C7A6B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HeartIcon size={11} color="#fff" />
            </div>
          </div>
        )}
        {p.status === 'rejected' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'stampPop .38s cubic-bezier(.34,1.56,.64,1) both' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#E2483C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XIcon size={11} color="#fff" />
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ════════════════════════════════════════
     MOBILE layout
  ════════════════════════════════════════ */
  if (isMobile) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.01em' }}>
            <span style={{ color: ACCENT }}>Snap</span>sort
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,.4)' }}>
            {group && <><span style={{ color: ACCENT }}>{photoIndex + 1}</span>{` / ${group.photos.length}`}</>}
          </div>
        </div>

        {/* Card */}
        <div style={{ flex: 1, minHeight: 0, position: 'relative', padding: '0 16px' }}>
          <div style={{ position: 'absolute', inset: '0 16px', display: 'flex', justifyContent: 'center', alignItems: 'stretch', overflow: 'hidden' }}>
            <div style={{ position: 'relative', height: '100%', aspectRatio: CARD_ASPECT }}>
              <div style={{ ...backCardStyle, position: 'absolute', inset: 0 }}>
                {nextPhoto && <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${nextPhoto.src})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
              </div>
              <div onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}
                style={{ ...cardStyle, width: '100%', height: '100%', aspectRatio: undefined }}>
                {cardInner}
              </div>
              {actionOverlay}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {actionButtons}

        {/* Horizontal filmstrip */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '0 20px 16px', flexShrink: 0 }}>
          {group && group.photos.map((p, pi) => thumbItem(p, pi, pi === photoIndex ? activeThumbRef : undefined))}
        </div>

      </div>
    );
  }

  /* ════════════════════════════════════════
     DESKTOP layout
  ════════════════════════════════════════ */
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0 144px' }}>

      {/* Header */}
      <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
        <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-.01em', flexShrink: 0 }}>
          <span style={{ color: ACCENT }}>Snap</span>sort
        </div>
        <div style={{ flex: 1, height: 1, background: '#DDD', opacity: 0.1, alignSelf: 'center' }} />
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '.05em', color: 'rgba(255,255,255,.4)', flexShrink: 0 }}>
          {group && <><span style={{ color: ACCENT }}>{photoIndex + 1}</span>{` / ${group.photos.length}`}</>}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Middle row: card centred, filmstrip absolutely on left */}
          <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>

            {/* Vertical filmstrip */}
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', padding: '44px 66px', zIndex: 10 }}>
              {group && group.photos.map((p, pi) => thumbItem(p, pi))}
            </div>

            {/* Card centred */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'stretch', padding: '0 20px', overflow: 'hidden' }}>
              <div style={{ position: 'relative', height: '100%', aspectRatio: CARD_ASPECT }}>
                <div style={{ ...backCardStyle, position: 'absolute', inset: 0 }}>
                  {nextPhoto && <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${nextPhoto.src})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
                </div>
                <div onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}
                  onMouseMove={handleMouseMove}
                  style={{ ...cardStyle, width: '100%', height: '100%', aspectRatio: undefined }}>
                  {cardInner}
                </div>
                {actionOverlay}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {actionButtons}

        </div>
      </div>

    </div>
  );
}
