import { useState } from 'react';
import type { ImportSource, Photo } from '../lib/types';
import { pickLocalFolder } from '../lib/localImport';
import { signInAndPickFolder, preloadDriveScripts } from '../lib/drive';

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

  const cardStyle = (active: boolean): React.CSSProperties => ({
    ...cardBase,
    border: active ? `1px solid ${ACCENT}` : '1px solid rgba(255,255,255,.14)',
    background: active ? 'rgba(245,160,40,.06)' : 'transparent',
  });

  const checkBase: React.CSSProperties = {
    width: 20, height: 20, flex: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 800, color: '#171410',
  };

  const iconBox: React.CSSProperties = {
    width: 38, height: 38,
    background: 'rgba(245,160,40,.14)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 15, fontWeight: 800, color: ACCENT, flex: 'none',
  };

  async function handleDriveSignIn() {
    setError(null);
    setBusy(true);
    try {
      const photos = await signInAndPickFolder();
      if (photos && photos.length > 0) onStart(photos);
      else if (photos) setError('No images found in that folder.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google Drive sign-in failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleLocalStart() {
    setError(null);
    setBusy(true);
    try {
      const photos = await pickLocalFolder();
      if (photos && photos.length > 0) onStart(photos);
      else if (photos) setError('No images found in that folder.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed.');
    } finally {
      setBusy(false);
    }
  }

  const startDisabled = source !== 'local' || busy;
  const startButtonStyle: React.CSSProperties = {
    padding: 16,
    background: startDisabled ? 'rgba(245,160,40,.25)' : ACCENT,
    color: '#171410',
    border: 'none',
    fontSize: '14.5px',
    fontWeight: 800,
    cursor: startDisabled ? 'not-allowed' : 'pointer',
    width: '100%',
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
    <div style={{ width: '100%', maxWidth: 600, padding: '52px 26px', display: 'flex', flexDirection: 'column', gap: 30 }}>
      <div>
        <div style={{ fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase', color: ACCENT, fontWeight: 800 }}>Snapsort</div>
        <h1 style={{ margin: '10px 0 0', fontSize: 30, fontWeight: 800, lineHeight: 1.16, color: '#fff' }}>
          Cull your shoot,<br />one swipe at a time.
        </h1>
        <p style={{ margin: '16px 0 0', fontSize: '14.5px', lineHeight: 1.55, color: 'rgba(255,255,255,.56)' }}>
          Pull in a shoot and Snapsort sorts every frame by pose, so you review one set at a time — no scrolling a flat folder.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Google Drive */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div onClick={() => { setSource(source === 'drive' ? null : 'drive'); preloadDriveScripts(); }} style={cardStyle(source === 'drive')}>
            <div style={iconBox}>GD</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#fff' }}>Google Drive</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>Import from a shared shoot folder</div>
            </div>
            <div style={{ ...checkBase, background: ACCENT, opacity: source === 'drive' ? 1 : 0 }}>✓</div>
          </div>

          {source === 'drive' && (
            <div style={{ padding: '12px 14px', border: `1px solid ${ACCENT}`, borderTop: 'none', background: 'rgba(245,160,40,.04)' }}>
              <button
                onClick={handleDriveSignIn}
                disabled={busy}
                style={{
                  width: '100%', padding: '10px 16px',
                  background: '#fff', color: '#1f1f1f',
                  border: 'none', cursor: busy ? 'not-allowed' : 'pointer',
                  fontSize: 14, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  opacity: busy ? 0.6 : 1,
                }}>
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                {busy ? 'Connecting…' : 'Sign in with Google'}
              </button>
            </div>
          )}
        </div>

        {/* Local folder */}
        <div onClick={() => setSource('local')} style={cardStyle(source === 'local')}>
          <div style={iconBox}>FS</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#fff' }}>Local folder</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>Point at a folder on this device</div>
          </div>
          <div style={{ ...checkBase, background: ACCENT, opacity: source === 'local' ? 1 : 0 }}>✓</div>
        </div>
      </div>

      {error && <div style={{ fontSize: 12.5, color: '#E2483C' }}>{error}</div>}

      {source === 'local' && (
        <button onClick={handleLocalStart} disabled={startDisabled} style={startButtonStyle}>
          {busy ? 'Importing…' : 'Start review'}
        </button>
      )}

      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', textAlign: 'center', marginTop: source === 'local' ? -14 : 0 }}>
        Photos are grouped automatically by pose before review.
      </div>
    </div>
    </div>
  );
}
