import { inject, Injectable } from '@angular/core';
import {
  ActivityService,
  PresignRequestDto,
  PresignResponseDto,
  UploadService,
} from '$backend/services';

export interface UploadResult {
  key: string;
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

    await this.activityService.apiActivityIdDocumentPostAsync({
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

    return { key: presignedResponse.key, etag };
  }

  async deleteDocumentAsync(
    activityId: string,
    documentId: string
  ): Promise<void> {
    // return this.activityService.apiActivityIdDocumentDocumentIdDeleteAsync({
    //   id: activityId,
    //   documentId,
    // } as any);
  }
}
