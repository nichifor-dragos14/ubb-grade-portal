import { inject, Injectable } from '@angular/core';
import {
  ActivityService,
  PresignRequestDto,
  PresignResponseDto,
  UploadService,
} from '$backend/services';

@Injectable({ providedIn: 'root' })
export class SubmissionDocsService {
  private readonly uploadService = inject(UploadService);
  private readonly activityService = inject(ActivityService);

  async submitSolvedActivityAsync(
    activityId: string,
    tenantId: string,
    files: File[]
  ): Promise<string> {
    const presignedDocs: Array<{
      file: File;
      presignedUrl: string;
      key: string;
    }> = [];

    for (const f of files) {
      const presignRequest: PresignRequestDto = {
        filename: f.name,
        tenantId,
        contentType: f.type || 'application/octet-stream',
      };

      const presignedResponse: PresignResponseDto =
        await this.uploadService.apiUploadPresignPostAsync({
          body: presignRequest,
        });

      presignedDocs.push({
        file: f,
        presignedUrl: presignedResponse.url,
        key: presignedResponse.key,
      });
    }

    const uploadedDocs: Array<{
      key: string;
      originalName: string;
      contentType: string;
      sizeBytes: number;
      bucket: string;
      etag: string | null;
    }> = [];

    for (const doc of presignedDocs) {
      const putResponse = await fetch(doc.presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': doc.file.type || 'application/octet-stream',
        },
        body: doc.file,
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

      uploadedDocs.push({
        key: doc.key,
        originalName: doc.file.name,
        contentType: doc.file.type || 'application/octet-stream',
        sizeBytes: doc.file.size,
        bucket: 'uploads',
        etag,
      });
    }

    const payload = {
      activityId: activityId,
      solvedActivityDocuments: uploadedDocs,
    } as any;

    const solvedId = await this.activityService.apiActivitySolvedPostAsync({
      body: payload as any,
    });

    return solvedId;
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
