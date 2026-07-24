import { useEffect, useState } from 'react';
import type { Photo } from '../lib/types';
import { pickLocalFolder } from '../lib/localImport';
import { signInAndPickFolder, preloadDriveScripts } from '../lib/drive';

const iconBox: React.CSSProperties = {
  width: 38, height: 38,
  background: 'rgba(61,123,232,.14)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flex: 'none',
};

const driveIcon = (
  <svg width="20" height="18" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
    <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
  </svg>
);

const folderIcon = (
  <svg width="20" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M2 6.5C2 5.4 2.9 4.5 4 4.5H9.17C9.7 4.5 10.21 4.71 10.59 5.09L11.91 6.41C12.29 6.79 12.8 7 13.33 7H20C21.1 7 22 7.9 22 9V17.5C22 18.6 21.1 19.5 20 19.5H4C2.9 19.5 2 18.6 2 17.5V6.5Z" fill="#3D7BE8" fillOpacity="0.9"/>
  </svg>
);


const ACCENT = '#3D7BE8';

const steps = [
  {
    label: 'Import', sub: 'From Drive or your device',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 3v13M7 11l5 5 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 20h14" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>,
  },
  {
    label: 'Swipe', sub: 'Keep or skip each photo',
    icon: (
      <div style={{ position: 'relative', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 14, height: 18, border: '2px solid #fff', borderRadius: 3 }} />
        <svg style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }} width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M6 1L1 6l5 5" stroke="rgba(255,255,255,.5)" strokeWidth="1.5" strokeLinecap="round"/></svg>
        <svg style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }} width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1l5 5-5 5" stroke="rgba(255,255,255,.5)" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </div>
    ),
  },
  {
    label: 'Save', sub: 'Export your kept photos',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 3v13M7 11l5 5 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="scale(1,-1) translate(0,-24)"/><path d="M5 20h14" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>,
  },
];

function HowItWorks() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', fontWeight: 700, marginBottom: 28 }}>How it works</div>
      {steps.map((step, i) => (
        <div key={step.label}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {step.icon}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{step.label}</div>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.45)', marginTop: 2 }}>{step.sub}</div>
            </div>
          </div>
          {i < steps.length - 1 && (
            <div style={{ marginLeft: 23, height: 36, borderLeft: '2px dashed rgba(255,255,255,.12)' }} />
          )}
        </div>
      ))}
    </div>
  );
}

export function ImportScreen({ onStart }: { onStart: (photos: Photo[]) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'drive' | 'local' | null>(null);
  const [isWide, setIsWide] = useState(() => window.innerWidth >= 900);

  useEffect(() => {
    const handler = () => setIsWide(window.innerWidth >= 900);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  async function handleDriveSignIn() {
    setError(null);
    setBusy('drive');
    try {
      const photos = await signInAndPickFolder();
      if (photos && photos.length > 0) onStart(photos);
      else if (photos) setError('No images found in that folder.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google Drive sign-in failed.');
    } finally {
      setBusy(null);
    }
  }

  async function handleLocalStart() {
    setError(null);
    setBusy('local');
    try {
      const photos = await pickLocalFolder();
      if (photos && photos.length > 0) onStart(photos);
      else if (photos) setError('No images found in that folder.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed.');
    } finally {
      setBusy(null);
    }
  }

  const card: React.CSSProperties = {
    border: '1px solid rgba(255,255,255,.14)',
    background: 'transparent',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  };

  const actionBtn = (disabled: boolean): React.CSSProperties => ({
    width: '100%', padding: '10px 16px',
    background: disabled ? 'rgba(255,255,255,.06)' : '#fff',
    color: disabled ? 'rgba(255,255,255,.3)' : '#171410',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 13, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  });

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '40px 48px' }}>
      {isWide && (
        <>
          <div style={{ flex: '0 0 300px', paddingTop: 8 }}>
            <HowItWorks />
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,.1)', alignSelf: 'stretch', margin: '0 56px', flexShrink: 0 }} />
        </>
      )}
      <div style={{ flex: isWide ? 1 : undefined, width: isWide ? undefined : '100%', maxWidth: isWide ? 560 : 480, display: 'flex', flexDirection: 'column', gap: 30 }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase', color: ACCENT, fontWeight: 800 }}>Snapsort</div>
          <h1 style={{ margin: '10px 0 0', fontSize: 30, fontWeight: 800, lineHeight: 1.16, color: '#fff' }}>
            Pick your best photos,<br />one swipe at a time.
          </h1>
          <p style={{ margin: '16px 0 0', fontSize: '14.5px', lineHeight: 1.55, color: 'rgba(255,255,255,.56)' }}>
            Import your photos and go through them one at a time — swipe to keep or skip, no scrolling through one long list.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Google Drive */}
          <div style={card} onMouseEnter={() => preloadDriveScripts()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px' }}>
              <div style={iconBox}>{driveIcon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#fff' }}>Google Drive</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>Import from a Google Drive folder</div>
              </div>
            </div>
            <div style={{ padding: '0 14px 14px' }}>
              <button onClick={handleDriveSignIn} disabled={busy !== null} style={actionBtn(busy !== null)}>
                {busy === 'drive' ? 'Connecting…' : 'Import from Google Drive folder'}
              </button>
            </div>
          </div>

          {/* Local folder */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px' }}>
              <div style={iconBox}>{folderIcon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#fff' }}>Local folder</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>Point at a folder on this device</div>
              </div>
            </div>
            <div style={{ padding: '0 14px 14px' }}>
              <button onClick={handleLocalStart} disabled={busy !== null} style={actionBtn(busy !== null)}>
                {busy === 'local' ? 'Importing…' : 'Choose folder'}
              </button>
            </div>
          </div>
        </div>

        {error && <div style={{ fontSize: 12.5, color: '#E2483C' }}>{error}</div>}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,.3)', fontWeight: 500 }}>
          <svg width="11" height="13" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor"/>
            <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
          </svg>
          Original files are never modified
        </div>
      </div>
    </div>
  );
}
