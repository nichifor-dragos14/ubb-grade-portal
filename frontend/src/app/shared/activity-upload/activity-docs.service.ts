import { inject, Injectable } from '@angular/core';
import {
  ActivityService,
  PresignRequestDto,
  PresignResponseDto,
  UploadService,
} from '$backend/services';

export interface UploadResult {
  key: string;
  id: string;
  etag?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ActivityDocsService {
  private readonly uploadService = inject(UploadService);
  private readonly activityService = inject(ActivityService);

  async uploadOneAsync(
    activityId: string,
    tenantId: string,
    file: File
  ): Promise<UploadResult> {
    const presignRequest: PresignRequestDto = {
      filename: file.name,
      tenantId,
      contentType: file.type || 'application/octet-stream',
    };

    const presignedResponse: PresignResponseDto =
      await this.uploadService.apiUploadPresignPostAsync({
        body: presignRequest,
      });

    const url = presignedResponse.url;

    const putResponse = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });

    if (!putResponse.ok) {
      const text = await putResponse.text().catch(() => '');

      throw new Error(
        `Upload failed (${putResponse.status}): ${text || putResponse.statusText}`
      );
    }

    const etagHeader =
      putResponse.headers.get('ETag') || putResponse.headers.get('Etag');
    const etag = etagHeader ? etagHeader.replace(/"/g, '') : null;

    var id = await this.activityService.apiActivityIdDocumentPostAsync({
      id: activityId,
      body: {
        key: presignedResponse.key,
        originalName: file.name,
        contentType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        bucket: 'uploads',
        etag,
      } as any,
    });

    return { id: id, key: presignedResponse.key, etag };
  }

  async deleteObjectByKeyAsync(key: string, bucket = 'uploads'): Promise<void> {
    const presignedUrl =
      await this.uploadService.apiUploadPresignDeletePostAsync({
        body: { key },
      });

    const resp = await fetch(presignedUrl, { method: 'DELETE' });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');

      throw new Error(
        `Delete failed (${resp.status}): ${text || resp.statusText}`
      );
    }
  }
}
