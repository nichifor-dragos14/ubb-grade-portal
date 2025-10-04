import { inject, Injectable } from '@angular/core';

import {
  ActivityService,
  PresignRequestDto,
  PresignResponseDto,
  UploadService,
} from '$backend/services';

export interface LinkPayload {
  key: string;
  originalName: string;
  contentType: string;
  size: number;
  etag?: string | null;
}

export interface UploadResult {
  key: string;
  etag?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ActivityDocsService {
  private uploadService = inject(UploadService);
  private activityService = inject(ActivityService);

  async uploadOneAndLinkAsync(
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

    const putResponse = await fetch(presignedResponse.url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    });

    if (!putResponse.ok) {
      const text = await putResponse.text().catch(() => '');
      throw new Error(
        `Upload failed (${putResponse.status}): ${text || putResponse.statusText}`
      );
    }

    const etag =
      (
        putResponse.headers.get('ETag') || putResponse.headers.get('Etag')
      )?.replace(/"/g, '') ?? null;

    const body = {
      key: presignedResponse.key,
      originalName: file.name,
      contentType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      bucket: 'uploads',
      etag,
    };

    await this.activityService.apiActivityIdDocumentPostAsync({
      id: activityId,
      body,
    });

    return { key: presignedResponse.key, etag };
  }

  async uploadManyAndLinkAsync(
    activityId: string,
    tenantId: string,
    files: File[]
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (const file of files) {
      const result = await this.uploadOneAndLinkAsync(
        activityId,
        tenantId,
        file
      );

      results.push(result);
    }

    return results;
  }
}
