import { useState } from 'react';
import type { ImportSource, Photo } from '../lib/types';
import { pickLocalFolder } from '../lib/localImport';
import { pickDriveFolder, isDriveConfigured } from '../lib/drive';

const ACCENT = '#F5A028';

export function ImportScreen({ onStart }: { onStart: (photos: Photo[]) => void }) {
  const [source, setSource] = useState<ImportSource>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const cardBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '13px 14px',
    cursor: 'pointer',
  };
  const driveCardStyle: React.CSSProperties = {
    ...cardBase,
    border: source === 'drive' ? `1px solid ${ACCENT}` : '1px solid rgba(255,255,255,.14)',
    background: source === 'drive' ? 'rgba(245,160,40,.06)' : 'transparent',
  };
  const localCardStyle: React.CSSProperties = {
    ...cardBase,
    border: source === 'local' ? `1px solid ${ACCENT}` : '1px solid rgba(255,255,255,.14)',
    background: source === 'local' ? 'rgba(245,160,40,.06)' : 'transparent',
  };
  const checkBase: React.CSSProperties = {
    width: 20,
    height: 20,
    flex: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 800,
    color: '#171410',
  };

  const startDisabled = !source || busy;
  const startButtonStyle: React.CSSProperties = {
    padding: 16,
    background: startDisabled ? 'rgba(245,160,40,.25)' : ACCENT,
    color: '#171410',
    border: 'none',
    fontSize: '14.5px',
    fontWeight: 800,
    cursor: startDisabled ? 'not-allowed' : 'pointer',
  };

  async function handleStart() {
    setError(null);
    setBusy(true);
    try {
      const photos = source === 'drive' ? await pickDriveFolder() : await pickLocalFolder();
      if (photos && photos.length > 0) {
        onStart(photos);
      } else if (photos) {
        setError('No images found in that folder.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: '52px 26px', display: 'flex', flexDirection: 'column', gap: 30, minHeight: '100vh', justifyContent: 'center' }}>
      <div>
        <div style={{ fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase', color: ACCENT, fontWeight: 800 }}>Snapsort</div>
        <h1 style={{ margin: '10px 0 0', fontSize: 30, fontWeight: 800, lineHeight: 1.16, color: '#fff' }}>
          Cull your shoot,
          <br />
          one swipe at a time.
        </h1>
        <p style={{ margin: '16px 0 0', fontSize: '14.5px', lineHeight: 1.55, color: 'rgba(255,255,255,.56)' }}>
          Pull in a shoot and Snapsort sorts every frame by pose, so you review one set at a time — no scrolling a
          flat folder.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div onClick={() => setSource('drive')} style={driveCardStyle}>
          <div
            style={{
              width: 38,
              height: 38,
              background: 'rgba(245,160,40,.14)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 15,
              fontWeight: 800,
              color: ACCENT,
              flex: 'none',
            }}
          >
            GD
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#fff' }}>Google Drive</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>
              {isDriveConfigured() ? 'Import from a shared shoot folder' : 'Import from a shared shoot folder (not configured)'}
            </div>
          </div>
          <div style={{ ...checkBase, background: ACCENT, opacity: source === 'drive' ? 1 : 0 }}>✓</div>
        </div>
        <div onClick={() => setSource('local')} style={localCardStyle}>
          <div
            style={{
              width: 38,
              height: 38,
              background: 'rgba(245,160,40,.14)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 15,
              fontWeight: 800,
              color: ACCENT,
              flex: 'none',
            }}
          >
            FS
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#fff' }}>Local folder</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>Point at a folder on this device</div>
          </div>
          <div style={{ ...checkBase, background: ACCENT, opacity: source === 'local' ? 1 : 0 }}>✓</div>
        </div>
      </div>

      {error && <div style={{ fontSize: 12.5, color: '#E2483C' }}>{error}</div>}

      <button onClick={handleStart} disabled={startDisabled} style={startButtonStyle}>
        {busy ? 'Importing…' : 'Start review'}
      </button>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', textAlign: 'center', marginTop: -14 }}>
        Photos are grouped automatically by pose before review.
      </div>
    </div>
  );
}
