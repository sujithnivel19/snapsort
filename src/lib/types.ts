export type PhotoStatus = 'pending' | 'kept' | 'rejected';

export interface Photo {
  id: string;
  filename: string;
  status: PhotoStatus;
  /** Data URL or remote URL for the actual image. */
  src: string;
  /** Thumbnail-sized data URL, used for vision classification and the filmstrip. */
  thumbSrc: string;
}

export interface PhotoGroup {
  id: string;
  name: string;
  photos: Photo[];
}

export type Screen = 'import' | 'processing' | 'review' | 'summary';

export interface HistoryEntry {
  groupIndex: number;
  photoIndex: number;
  status: PhotoStatus;
}

export type ImportSource = 'drive' | 'local' | null;
