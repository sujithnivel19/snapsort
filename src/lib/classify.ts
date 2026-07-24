import type { Photo, PhotoGroup } from './types';

function naturalSort(a: Photo, b: Photo): number {
  return a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' });
}

export async function classifyIntoGroups(photos: Photo[]): Promise<PhotoGroup[]> {
  // Sort by filename so sequential shoot numbers are in order
  const sorted = [...photos].sort(naturalSort);

  try {
    const res = await fetch('/api/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photos: sorted.map((p) => ({ id: p.id, filename: p.filename, thumbSrc: p.thumbSrc })) }),
    });
    if (!res.ok) throw new Error('classify request failed');
    const json = await res.json();

    const rawGroups: { name: string; indices: number[] }[] = json.groups;
    return rawGroups.map((g, gi) => ({
      id: 'g' + gi,
      name: g.name,
      photos: g.indices.map((i) => sorted[i]).filter(Boolean),
    }));
  } catch {
    return [{ id: 'g0', name: 'All Photos', photos: sorted }];
  }
}
