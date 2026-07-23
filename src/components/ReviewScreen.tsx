import { useEffect, useRef } from 'react';
import type { PhotoGroup } from '../lib/types';
import { useReview } from '../lib/useReview';
import { HeartIcon, UndoIcon, XIcon } from './Icons';

const ACCENT = '#F5A028';
const CARD_ASPECT = '4 / 5';

export function ReviewScreen({ groups, onDone }: { groups: PhotoGroup[]; onDone: (groups: PhotoGroup[]) => void }) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const { state, decide, undo, selectTab, selectThumb, onPointerDown, onPointerMove, onPointerUp } = useReview(groups);
  const { groups: g, groupIndex, photoIndex, history, dragX, dragging, noTransition, undoing, done } = state;

  useEffect(() => {
    if (done) onDoneRef.current(g);
  }, [done, g]);

  if (done) {
    return null;
  }

  const group = g[groupIndex];
  const photo = group ? group.photos[photoIndex] : null;

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 'none',
    padding: '9px 15px',
    border: active ? `1px solid ${ACCENT}` : '1px solid rgba(255,255,255,.16)',
    background: active ? ACCENT : 'transparent',
    color: active ? '#171410' : 'rgba(255,255,255,.75)',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '.05em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    display: 'flex',
    gap: 7,
    alignItems: 'center',
  });

  const draggingOrMoved = dragging || dragX !== 0;
  const cardStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    aspectRatio: CARD_ASPECT,
    overflow: 'hidden',
    zIndex: 2,
    background: '#000',
    boxShadow: '0 22px 44px rgba(0,0,0,.4)',
    cursor: dragging ? 'grabbing' : 'grab',
    transform: draggingOrMoved ? `translateX(${dragX}px) rotate(${(dragX / 22).toFixed(2)}deg)` : 'translateX(0px)',
    transition: dragging || noTransition ? 'none' : 'transform .26s cubic-bezier(.4,0,.6,1)',
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

  const showFlyX = dragX < -140 && !undoing;
  const showFlyHeart = dragX > 140 && !undoing;
  const showFlyUndo = undoing && dragX !== 0;

  const counterText = group ? `${photoIndex + 1} / ${group.photos.length}` : '';

  return (
    <div>
      <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.01em' }}>Snapsort</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.4)', letterSpacing: '.05em' }}>{counterText}</div>
      </div>

      <div style={{ marginTop: 12, background: '#211e1a', padding: '8px 0', display: 'flex', gap: 5, overflowX: 'auto' }}>
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} style={{ flex: 'none', width: 8, height: 11, marginLeft: 14, background: '#0c0b0a', border: '1px solid rgba(255,255,255,.06)' }} />
        ))}
      </div>

      <div style={{ padding: '12px 20px', display: 'flex', gap: 8, overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        {g.map((tab, gi) => {
          const decided = tab.photos.filter((p) => p.status !== 'pending').length;
          return (
            <div key={tab.id} onClick={() => selectTab(gi)} style={tabStyle(gi === groupIndex)}>
              <span>{tab.name}</span>
              <span style={{ opacity: 0.7, fontWeight: 600 }}>
                {decided}/{tab.photos.length}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ padding: '18px 20px 4px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.65)', marginBottom: 10 }}>{group ? group.name : ''}</div>
        <div style={{ position: 'relative' }}>
          <div style={backCardStyle}>
            {nextPhoto && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `url(${nextPhoto.src})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            )}
          </div>
          <div onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp} style={cardStyle}>
            {photo && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `url(${photo.src})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            )}
            {photo && (
              <div
                style={{
                  position: 'absolute',
                  top: 14,
                  left: 14,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '.05em',
                  color: 'rgba(255,255,255,.55)',
                  background: 'rgba(0,0,0,.35)',
                  padding: '4px 8px',
                }}
              >
                {photo.filename}
              </div>
            )}

            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(226,72,60,.32)',
                opacity: leftOp,
                transition: dragging ? 'none' : 'opacity .25s ease',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(245,233,214,.28)',
                opacity: rightOp,
                transition: dragging ? 'none' : 'opacity .25s ease',
              }}
            />

            {showFlyX && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'flyStamp .2s ease-out both' }}>
                <div style={{ width: 96, height: 96, border: '5px solid #E2483C', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(20,18,16,.55)' }}>
                  <XIcon size={52} color="#E2483C" />
                </div>
              </div>
            )}
            {showFlyHeart && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'flyStamp .2s ease-out both' }}>
                <div style={{ width: 96, height: 96, border: '5px solid #4C7A6B', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(20,18,16,.55)' }}>
                  <HeartIcon size={52} color="#4C7A6B" />
                </div>
              </div>
            )}
            {showFlyUndo && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'flyStamp .2s ease-out both' }}>
                <div style={{ width: 96, height: 96, border: '5px solid #8a8580', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(20,18,16,.55)' }}>
                  <UndoIcon size={44} color="#8a8580" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{photo ? photo.filename : ''}</div>
        <div style={{ fontSize: '12.5px', color: 'rgba(255,255,255,.45)', marginTop: 2 }}>Photo {counterText}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 46, marginTop: 20 }}>
        <button
          onClick={() => decide('rejected')}
          disabled={rejectDisabled}
          style={{ ...circleBtn('rgba(226,72,60,.12)', '#E2483C', 64, rejectDisabled), boxShadow: 'none', border: rejectDisabled ? 'none' : '1px solid rgba(226,72,60,.35)' }}
        >
          <XIcon size="46%" color="currentColor" />
        </button>
        <button onClick={() => decide('kept')} disabled={keepDisabled} style={circleBtn('#4C7A6B', '#fff', 74, keepDisabled)}>
          <HeartIcon size="46%" color="currentColor" />
        </button>
        <button
          onClick={undo}
          disabled={undoDisabled}
          style={{ ...circleBtn('transparent', '#8a8580', 64, undoDisabled), background: 'transparent', boxShadow: 'none', border: 'none' }}
        >
          <UndoIcon size="calc(58% - 6px)" color="currentColor" />
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x', padding: '32px 20px 34px' }}>
        {group &&
          group.photos.map((p, pi) => {
            const active = pi === photoIndex;
            return (
              <div
                key={p.id}
                onClick={() => selectThumb(pi)}
                style={{
                  flex: 'none',
                  width: 54,
                  aspectRatio: CARD_ASPECT,
                  position: 'relative',
                  cursor: 'pointer',
                  transform: active ? 'scale(1.16)' : 'scale(1)',
                  transition: 'transform .2s ease',
                  zIndex: active ? 2 : 1,
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url(${p.thumbSrc})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    outline: active ? `2px solid ${ACCENT}` : '1px solid rgba(255,255,255,.14)',
                    outlineOffset: active ? 2 : 0,
                  }}
                />
                {p.status === 'kept' && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'stampPop .38s cubic-bezier(.34,1.56,.64,1) both' }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#4C7A6B', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,.4)' }}>
                      <HeartIcon size={13} color="#ffffff" />
                    </div>
                  </div>
                )}
                {p.status === 'rejected' && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'stampPop .38s cubic-bezier(.34,1.56,.64,1) both' }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#E2483C', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,.4)' }}>
                      <XIcon size={13} color="#fff" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
