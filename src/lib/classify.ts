import type { Photo, PhotoGroup } from './types';

const POSE_GROUPS = ['Portrait — Solo', 'Couple — Close', 'Group — Family', 'Portrait — Candid'] as const;

/**
 * Sends photo thumbnails to the backend for pose classification, then buckets
 * them into groups. Falls back to a deterministic mock split if the request
 * fails (e.g. no ANTHROPIC_API_KEY configured on the server).
 */
export async function classifyIntoGroups(photos: Photo[]): Promise<PhotoGroup[]> {
  let labels: string[];
  try {
    const res = await fetch('/api/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photos: photos.map((p) => ({ id: p.id, thumbSrc: p.thumbSrc })) }),
    });
    if (!res.ok) throw new Error('classify request failed');
    const json = await res.json();
    labels = json.labels;
  } catch {
    labels = photos.map((_, i) => POSE_GROUPS[i % POSE_GROUPS.length]);
  }

  const byGroup = new Map<string, Photo[]>();
  photos.forEach((photo, i) => {
    const label = POSE_GROUPS.includes(labels[i] as any) ? labels[i] : POSE_GROUPS[POSE_GROUPS.length - 1];
    if (!byGroup.has(label)) byGroup.set(label, []);
    byGroup.get(label)!.push(photo);
  });

  return POSE_GROUPS.filter((name) => byGroup.has(name)).map((name, gi) => ({
    id: 'g' + gi,
    name,
    photos: byGroup.get(name)!,
  }));
}
