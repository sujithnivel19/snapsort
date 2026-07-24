import { useCallback, useEffect, useRef, useState } from 'react';
import type { HistoryEntry, PhotoGroup, PhotoStatus } from './types';

const SWIPE_THRESHOLD = 110;

export interface ReviewState {
  groups: PhotoGroup[];
  groupIndex: number;
  photoIndex: number;
  history: HistoryEntry[];
  dragX: number;
  dragging: boolean;
  noTransition: boolean;
  undoing: boolean;
  done: boolean;
  deciding: 'kept' | 'rejected' | null;
}

export function useReview(initialGroups: PhotoGroup[]) {
  const [state, setState] = useState<ReviewState>({
    groups: initialGroups,
    groupIndex: 0,
    photoIndex: 0,
    history: [],
    dragX: 0,
    dragging: false,
    noTransition: false,
    undoing: false,
    done: false,
    deciding: null,
  });
  const startXRef = useRef(0);

  const advance = useCallback(() => {
    setState((s) => {
      const { groups } = s;
      let { groupIndex, photoIndex } = s;
      if (photoIndex + 1 < groups[groupIndex].photos.length) {
        photoIndex += 1;
      } else if (groupIndex + 1 < groups.length) {
        groupIndex += 1;
        photoIndex = 0;
      } else {
        return { ...s, done: true, dragX: 0, deciding: null };
      }
      return { ...s, groupIndex, photoIndex, dragX: 0, noTransition: true, deciding: null };
    });
  }, []);

  useEffect(() => {
    if (state.noTransition) {
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setState((s) => ({ ...s, noTransition: false })));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }
  }, [state.noTransition]);

  // source: 'button' = popup 150ms then slide; 'swipe' = immediate slide
  const decide = useCallback(
    (status: Exclude<PhotoStatus, 'pending'>, source: 'button' | 'swipe' = 'button') => {
      setState((s) => {
        if (s.dragging) return s;
        const group = s.groups[s.groupIndex];
        if (!group) return s;
        const photo = group.photos[s.photoIndex];
        if (!photo || photo.status !== 'pending') return s;
        const groups = s.groups.map((g, gi) =>
          gi !== s.groupIndex
            ? g
            : { ...g, photos: g.photos.map((p, pi) => (pi !== s.photoIndex ? p : { ...p, status })) }
        );
        const history = [...s.history, { groupIndex: s.groupIndex, photoIndex: s.photoIndex, status }];

        if (source === 'button') {
          // Phase 1: icon pops in, card holds still
          return { ...s, groups, history, dragging: false, dragX: 0, deciding: status };
        } else {
          // Swipe: slide out immediately
          return { ...s, groups, history, dragging: false, dragX: status === 'kept' ? 1400 : -1400, deciding: null };
        }
      });

      if (source === 'button') {
        // Phase 2 after 150ms: slide out
        setTimeout(() => {
          setState((s) => ({ ...s, dragX: s.deciding === 'kept' ? 600 : -600 }));
          setTimeout(advance, 100);
        }, 150);
      } else {
        setTimeout(advance, 100);
      }
    },
    [advance]
  );

  const undo = useCallback(() => {
    setState((s) => {
      if (s.history.length === 0) return s;
      const last = s.history[s.history.length - 1];
      const groups = s.groups.map((g, gi) =>
        gi !== last.groupIndex
          ? g
          : { ...g, photos: g.photos.map((p, pi) => (pi !== last.photoIndex ? p : { ...p, status: 'pending' as PhotoStatus })) }
      );
      const fromX = last.status === 'kept' ? 600 : -600;
      return {
        ...s,
        groups,
        history: s.history.slice(0, -1),
        groupIndex: last.groupIndex,
        photoIndex: last.photoIndex,
        dragX: fromX,
        noTransition: true,
        undoing: true,
        done: false,
        deciding: null,
      };
    });
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setState((s) => ({ ...s, dragX: 0, noTransition: false })))
    );
    setTimeout(() => setState((s) => ({ ...s, undoing: false })), 320);
  }, []);

  const selectTab = useCallback((gi: number) => {
    setState((s) => {
      if (gi === s.groupIndex) return s;
      const g = s.groups[gi];
      let pi = g.photos.findIndex((p) => p.status === 'pending');
      if (pi === -1) pi = 0;
      return { ...s, groupIndex: gi, photoIndex: pi, dragX: 0 };
    });
  }, []);

  const selectThumb = useCallback((pi: number) => {
    setState((s) => (s.dragging ? s : { ...s, photoIndex: pi, dragX: 0 }));
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    startXRef.current = e.clientX;
    setState((s) => ({ ...s, dragging: true }));
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    setState((s) => (s.dragging ? { ...s, dragX: e.clientX - startXRef.current } : s));
  }, []);

  const onPointerUp = useCallback(() => {
    setState((s) => {
      if (!s.dragging) return s;
      const dx = s.dragX;
      if (dx > SWIPE_THRESHOLD) {
        queueMicrotask(() => decide('kept', 'swipe'));
        return { ...s, dragging: false };
      } else if (dx < -SWIPE_THRESHOLD) {
        queueMicrotask(() => decide('rejected', 'swipe'));
        return { ...s, dragging: false };
      }
      return { ...s, dragging: false, dragX: 0 };
    });
  }, [decide]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') decide('kept');
      else if (e.key === 'ArrowLeft') decide('rejected');
      else if (e.key === 'Backspace') undo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [decide, undo]);

  return { state, decide, undo, selectTab, selectThumb, onPointerDown, onPointerMove, onPointerUp };
}
