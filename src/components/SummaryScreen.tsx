import { useState } from 'react';
import type { PhotoGroup } from '../lib/types';
import { HeartIcon, XIcon } from './Icons';

async function saveKeptToFolder(groups: PhotoGroup[]) {
  const kept = groups.flatMap((g) => g.photos.filter((p) => p.status === 'kept'));
  const w = window as any;

  if (w.showDirectoryPicker) {
    let dir: FileSystemDirectoryHandle;
    try {
      dir = await w.showDirectoryPicker({ mode: 'readwrite' });
    } catch {
      return;
    }
    for (const photo of kept) {
      const blob = await fetch(photo.src).then((r) => r.blob());
      const fh = await dir.getFileHandle(photo.filename, { create: true });
      const writable = await fh.createWritable();
      await writable.write(blob);
      await writable.close();
    }
  } else {
    // Fallback: trigger individual downloads
    for (const photo of kept) {
      const a = document.createElement('a');
      a.href = photo.src;
      a.download = photo.filename;
      a.click();
    }
  }
}

export function SummaryScreen({ groups, onReset, onBack }: { groups: PhotoGroup[]; onReset: () => void; onBack: () => void }) {
  const [saving, setSaving] = useState<'idle' | 'saving' | 'done'>('idle');
  const [copied, setCopied] = useState(false);
  const summaryRows = groups.map((g) => ({
    name: g.name,
    kept: g.photos.filter((p) => p.status === 'kept').length,
    rejected: g.photos.filter((p) => p.status === 'rejected').length,
  }));
  const totalPhotos = groups.reduce((s, g) => s + g.photos.length, 0);
  const totalKept = groups.reduce((s, g) => s + g.photos.filter((p) => p.status === 'kept').length, 0);
  const totalRejected = groups.reduce((s, g) => s + g.photos.filter((p) => p.status === 'rejected').length, 0);
  const keptPhotos = groups.flatMap((g) => g.photos.filter((p) => p.status === 'kept'));

  const copyFilenames = () => {
    const text = keptPhotos.map((p) => p.filename).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '44px 24px 24px', display: 'flex', flexDirection: 'column', gap: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, flexShrink: 0 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 5L9 12L15 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div>
            <div style={{ fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase', color: '#F5A028', fontWeight: 800 }}>Review complete</div>
            <h1 style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 800, lineHeight: 1.2 }}>{totalPhotos} photos sorted.</h1>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, background: '#1c1a17', padding: 16, border: '1px solid rgba(255,255,255,.07)' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#F5E9D6' }}>{totalKept}</div>
            <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,.5)', marginTop: 4, fontWeight: 600 }}>Kept</div>
          </div>
          <div style={{ flex: 1, background: '#1c1a17', padding: 16, border: '1px solid rgba(255,255,255,.07)' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#E2483C' }}>{totalRejected}</div>
            <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,.5)', marginTop: 4, fontWeight: 600 }}>Kept aside</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          {summaryRows.map((row) => (
            <div
              key={row.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 2px',
                borderBottom: '1px solid rgba(255,255,255,.08)',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600 }}>{row.name}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#F5E9D6', background: 'rgba(245,233,214,.1)', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <HeartIcon size={11} color="#F5E9D6" /> {row.kept}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#E2483C', background: 'rgba(226,72,60,.1)', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <XIcon size={11} color="#E2483C" /> {row.rejected}
                </div>
              </div>
            </div>
          ))}
        </div>

        {keptPhotos.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)' }}>
                Selected files
              </div>
              <button
                onClick={copyFilenames}
                style={{
                  background: 'none',
                  border: '1px solid rgba(255,255,255,.15)',
                  color: copied ? '#F5A028' : 'rgba(255,255,255,.6)',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '4px 10px',
                  cursor: 'pointer',
                  letterSpacing: '.04em',
                }}
              >
                {copied ? 'Copied ✓' : 'Copy all'}
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {keptPhotos.map((photo) => (
                <div
                  key={photo.id}
                  style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,.6)',
                    fontWeight: 500,
                    padding: '5px 10px',
                    background: '#1c1a17',
                    border: '1px solid rgba(255,255,255,.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <HeartIcon size={9} color="#F5A028" />
                  {photo.filename}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Buttons pinned to bottom */}
      <div style={{ flexShrink: 0, padding: '12px 24px 24px', display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <button
          onClick={async () => {
            setSaving('saving');
            await saveKeptToFolder(groups);
            setSaving('done');
          }}
          disabled={saving === 'saving' || totalKept === 0}
          style={{
            padding: 16,
            background: saving === 'done' ? 'rgba(245,160,40,.15)' : '#F5A028',
            border: 'none',
            color: saving === 'done' ? '#F5A028' : '#000',
            fontSize: 14,
            fontWeight: 700,
            cursor: totalKept === 0 || saving === 'saving' ? 'not-allowed' : 'pointer',
            opacity: totalKept === 0 ? 0.4 : 1,
          }}
        >
          {saving === 'saving' ? 'Saving…' : saving === 'done' ? `${totalKept} photos saved ✓` : `Save ${totalKept} kept photos to folder`}
        </button>
        <button
          onClick={onReset}
          style={{
            padding: 16,
            background: 'transparent',
            border: '1px solid rgba(255,255,255,.2)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Start a new shoot
        </button>
      </div>
    </div>
  );
}
