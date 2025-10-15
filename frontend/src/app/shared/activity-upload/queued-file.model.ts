export type QueuedFile = {
  // SERVER ELEMENTS
  file: File | null;
  id?: string;
  originalName?: string;
  contentType?: string;
  sizeBytes?: number;

  key?: string;
  bucket?: string;

  // UI ELEMENTS
  previewUrl?: string | null;
  status: 'queued' | 'uploading' | 'done' | 'error' | 'alreadyUploaded';
  error?: string | null;
  xhr?: XMLHttpRequest | null;
  progress?: number;
};
