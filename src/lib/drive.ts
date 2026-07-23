import type { Photo } from './types';

declare global {
  interface Window {
    google?: any;
    gapi?: any;
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined;
const SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

export function isDriveConfigured(): boolean {
  return Boolean(CLIENT_ID && API_KEY);
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load ' + src));
    document.head.appendChild(script);
  });
}

let gapiLoaded: Promise<void> | null = null;
async function ensureGapi() {
  if (!gapiLoaded) {
    gapiLoaded = (async () => {
      await loadScript('https://apis.google.com/js/api.js');
      await new Promise<void>((resolve) => window.gapi.load('picker', () => resolve()));
    })();
  }
  return gapiLoaded;
}

async function getAccessToken(): Promise<string> {
  await loadScript('https://accounts.google.com/gsi/client');
  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (resp: any) => {
        if (resp.error) reject(new Error(resp.error));
        else resolve(resp.access_token);
      },
    });
    tokenClient.requestAccessToken();
  });
}

/**
 * Opens the Google Drive picker, lets the user choose a folder, then downloads
 * every image inside it. Requires VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_API_KEY
 * to be set — throws a descriptive error otherwise so the UI can surface it.
 */
export async function pickDriveFolder(): Promise<Photo[] | null> {
  if (!isDriveConfigured()) {
    throw new Error(
      'Google Drive is not configured. Set VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_API_KEY in app/.env to enable it.'
    );
  }
  await ensureGapi();
  const accessToken = await getAccessToken();

  const folderId = await new Promise<string | null>((resolve) => {
    const picker = new window.google.picker.PickerBuilder()
      .addView(
        new window.google.picker.DocsView(window.google.picker.ViewId.FOLDERS)
          .setSelectFolderEnabled(true)
          .setIncludeFolders(true)
      )
      .setOAuthToken(accessToken)
      .setDeveloperKey(API_KEY)
      .setCallback((data: any) => {
        if (data.action === window.google.picker.Action.PICKED) {
          resolve(data.docs[0].id);
        } else if (data.action === window.google.picker.Action.CANCEL) {
          resolve(null);
        }
      })
      .build();
    picker.setVisible(true);
  });

  if (!folderId) return null;

  const listRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType+contains+'image/'&fields=files(id,name,mimeType)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const listJson = await listRes.json();
  const files: { id: string; name: string }[] = listJson.files ?? [];

  const photos: Photo[] = [];
  let n = 0;
  for (const f of files) {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const blob = await res.blob();
    const src = await blobToDataUrl(blob);
    photos.push({ id: 'drive-' + n++ + '-' + f.id, filename: f.name, status: 'pending', src, thumbSrc: src });
  }
  return photos;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
