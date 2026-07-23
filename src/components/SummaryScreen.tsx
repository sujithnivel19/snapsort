import type { PhotoGroup } from '../lib/types';
import { HeartIcon, XIcon } from './Icons';

export function SummaryScreen({ groups, onReset }: { groups: PhotoGroup[]; onReset: () => void }) {
  const summaryRows = groups.map((g) => ({
    name: g.name,
    kept: g.photos.filter((p) => p.status === 'kept').length,
    rejected: g.photos.filter((p) => p.status === 'rejected').length,
  }));
  const totalPhotos = groups.reduce((s, g) => s + g.photos.length, 0);
  const totalKept = groups.reduce((s, g) => s + g.photos.filter((p) => p.status === 'kept').length, 0);
  const totalRejected = groups.reduce((s, g) => s + g.photos.filter((p) => p.status === 'rejected').length, 0);

  return (
    <div style={{ padding: '44px 24px', display: 'flex', flexDirection: 'column', gap: 26, minHeight: '100vh' }}>
      <div>
        <div style={{ fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase', color: '#F5A028', fontWeight: 800 }}>
          Review complete
        </div>
        <h1 style={{ margin: '10px 0 0', fontSize: 26, fontWeight: 800, lineHeight: 1.2 }}>{totalPhotos} photos sorted.</h1>
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
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#F5E9D6',
                  background: 'rgba(245,233,214,.1)',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <HeartIcon size={11} color="#F5E9D6" /> {row.kept}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#E2483C',
                  background: 'rgba(226,72,60,.1)',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <XIcon size={11} color="#E2483C" /> {row.rejected}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onReset}
        style={{
          marginTop: 'auto',
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
  );
}
