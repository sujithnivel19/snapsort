import type { Photo } from './types';

const THUMB_SIZE = 512;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function makeThumbnail(dataUrl: string): Promise<string> {
  const img = new Image();
  img.src = dataUrl;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });
  const scale = THUMB_SIZE / Math.max(img.width, img.height);
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', 0.72);
}

async function filesToPhotos(files: File[]): Promise<Photo[]> {
  const imageFiles = files.filter((f) => f.type.startsWith('image/'));
  const photos: Photo[] = [];
  let n = 0;
  for (const file of imageFiles) {
    const src = await fileToDataUrl(file);
    const thumbSrc = await makeThumbnail(src);
    photos.push({
      id: 'local-' + n++ + '-' + file.name,
      filename: file.name,
      status: 'pending',
      src,
      thumbSrc,
    });
  }
  return photos;
}

/** Uses the File System Access API where available, falling back to a directory <input>. */
export async function pickLocalFolder(): Promise<Photo[] | null> {
  const w = window as unknown as {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  };
  if (w.showDirectoryPicker) {
    let dirHandle: FileSystemDirectoryHandle;
    try {
      dirHandle = await w.showDirectoryPicker();
    } catch {
      return null; // user cancelled
    }
    const files: File[] = [];
    for await (const entry of (dirHandle as any).values()) {
      if (entry.kind === 'file') {
        const file = await entry.getFile();
        files.push(file);
      }
    }
    return filesToPhotos(files);
  }
  return pickLocalFolderViaInput();
}

function pickLocalFolderViaInput(): Promise<Photo[] | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    (input as any).webkitdirectory = true;
    input.multiple = true;
    input.onchange = async () => {
      const files = Array.from(input.files ?? []);
      if (files.length === 0) {
        resolve(null);
        return;
      }
      resolve(await filesToPhotos(files));
    };
    input.click();
  });
}
