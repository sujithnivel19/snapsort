import type { Photo } from './types';

declare global {
  interface Window { google?: any; gapi?: any; }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const API_KEY   = import.meta.env.VITE_GOOGLE_API_KEY   as string | undefined;
const SCOPE     = 'https://www.googleapis.com/auth/drive.readonly';

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload  = () => resolve();
    s.onerror = () => reject(new Error('Failed to load ' + src));
    document.head.appendChild(s);
  });
}

// Pre-warm: load both scripts and init token client as early as possible
// so requestAccessToken() can be called synchronously on user click.
let tokenClientPromise: Promise<any> | null = null;
let pickerReadyPromise: Promise<void> | null = null;

export function preloadDriveScripts() {
  if (!CLIENT_ID) return;

  if (!tokenClientPromise) {
    tokenClientPromise = loadScript('https://accounts.google.com/gsi/client').then(() =>
      window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        callback: () => {},
      })
    );
  }

  if (!pickerReadyPromise) {
    pickerReadyPromise = loadScript('https://apis.google.com/js/api.js').then(
      () => new Promise<void>((res) => window.gapi.load('picker', () => res()))
    );
  }
}

async function getAccessToken(): Promise<string> {
  if (!tokenClientPromise) {
    tokenClientPromise = loadScript('https://accounts.google.com/gsi/client').then(() =>
      window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        callback: () => {},
      })
    );
  }
  const tokenClient = await tokenClientPromise;
  return new Promise((resolve, reject) => {
    tokenClient.callback = (resp: any) => {
      if (resp.error) reject(new Error(resp.error));
      else resolve(resp.access_token);
    };
    tokenClient.requestAccessToken({ prompt: '' });
  });
}

async function ensurePicker() {
  if (!pickerReadyPromise) {
    pickerReadyPromise = loadScript('https://apis.google.com/js/api.js').then(
      () => new Promise<void>((res) => window.gapi.load('picker', () => res()))
    );
  }
  return pickerReadyPromise;
}

export async function signInAndPickFolder(): Promise<Photo[] | null> {
  if (!CLIENT_ID) {
    throw new Error('Add VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_API_KEY to your .env file to enable Google Drive.');
  }

  // Ensure picker is ready (should already be warming up from preload)
  await ensurePicker();

  // getAccessToken opens the OAuth popup — scripts are pre-loaded so
  // the popup fires close to the user gesture and avoids blocker.
  const accessToken = await getAccessToken();

  const folderId = await new Promise<string | null>((resolve) => {
    let builder = new window.google.picker.PickerBuilder()
      .addView(
        new window.google.picker.DocsView(window.google.picker.ViewId.FOLDERS)
          .setSelectFolderEnabled(true)
          .setIncludeFolders(true)
      )
      .setOAuthToken(accessToken)
      .setCallback((data: any) => {
        if (data.action === window.google.picker.Action.PICKED) resolve(data.docs[0].id);
        else if (data.action === window.google.picker.Action.CANCEL) resolve(null);
      });
    if (API_KEY) builder = builder.setDeveloperKey(API_KEY);
    builder.build().setVisible(true);
  });

  if (!folderId) return null;

  const listRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType+contains+'image/'&fields=files(id,name,mimeType)&pageSize=1000&orderBy=name`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const files: { id: string; name: string }[] = (await listRes.json()).files ?? [];

  const photos: Photo[] = [];
  let n = 0;
  for (const f of files) {
    const res  = await fetch(`https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`, { headers: { Authorization: `Bearer ${accessToken}` } });
    const blob = await res.blob();
    const src  = await blobToDataUrl(blob);
    photos.push({ id: `drive-${n++}-${f.id}`, filename: f.name, status: 'pending', src, thumbSrc: src });
  }
  return photos;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}
