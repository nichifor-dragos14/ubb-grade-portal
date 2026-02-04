import {
  ChangeDetectionStrategy,
  Component,
  Input,
  inject,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DocumentDto, UploadService } from '$backend/services';

@Component({
  selector: 'app-document-viewer',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        margin-bottom: 16px;
      }

      .container {
        border: 1px solid #e0e0e0;
        border-radius: 12px;
        padding: 16px;
        background: #fafafa;
      }

      .title {
        font-weight: 600;
        margin-bottom: 12px;
        color: #202124;
      }

      .empty-state {
        text-align: center;
        padding: 24px;
        color: #5f6368;
        font-size: 14px;
      }

      .documents {
        display: grid;
        gap: 8px;
      }

      .document-item {
        border: 1px solid #e0e0e0;
        border-radius: 10px;
        padding: 8px 12px;
        display: flex;
        align-items: center;
        gap: 12px;
        background: #fff;
        transition: background-color 0.2s;
      }

      .document-item:hover {
        background-color: #f8f9fa;
      }

      .thumbnail {
        width: 40px;
        height: 40px;
        border-radius: 6px;
        background: #f1f3f4;
        display: grid;
        place-items: center;
        font-size: 12px;
        overflow: hidden;
        flex-shrink: 0;
      }

      .thumbnail img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .metadata {
        flex: 1;
        min-width: 0;
      }

      .name {
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: #202124;
      }

      .info {
        font-size: 12px;
        color: #5f6368;
      }

      .actions {
        display: flex;
        gap: 6px;
        align-items: center;
        flex-shrink: 0;
      }

      .download-btn {
        min-width: auto;
      }
    `,
  ],
  template: `
    <div class="container" *ngIf="documents && documents.length > 0">
      <div class="title">📎 Resources ({{ documents.length }})</div>

      <div class="documents">
        <div
          class="document-item"
          *ngFor="let doc of documents; trackBy: trackByDocument"
        >
          <div class="thumbnail">
            <span>{{ getExtension(doc) }}</span>
          </div>

          <div class="metadata">
            <div class="name" [title]="getDisplayName(doc)">
              {{ getDisplayName(doc) }}
            </div>
            <div class="info">
              {{ getDisplaySize(doc) }} • {{ getDisplayType(doc) }}
            </div>
          </div>

          <div class="actions">
            <button
              mat-icon-button
              [matTooltip]="'Download ' + getDisplayName(doc)"
              (click)="downloadDocument(doc)"
              color="primary"
            >
              <mat-icon>download</mat-icon>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="container" *ngIf="!documents || documents.length === 0">
      <div class="empty-state">
        <mat-icon
          style="font-size: 48px; width: 48px; height: 48px; color: #dadce0; margin-bottom: 8px;"
        >
          description
        </mat-icon>
        <div>No resources provided</div>
      </div>
    </div>
  `,
})
export class DocumentViewerComponent {
  @Input() documents: DocumentDto[] | null = [];

  private readonly uploadService = inject(UploadService);

  trackByDocument = (index: number, doc: DocumentDto) => doc.id ?? index;

  getDisplayName(doc: DocumentDto): string {
    return doc.originalName ?? 'document';
  }

  getDisplayType(doc: DocumentDto): string {
    return doc.contentType ?? 'application/octet-stream';
  }

  getDisplaySize(doc: DocumentDto): string {
    const bytes = doc.sizeBytes ?? 0;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  getExtension(doc: DocumentDto): string {
    const type = this.getDisplayType(doc);

    if (type.includes('/')) {
      return type.split('/')[1].substring(0, 3).toUpperCase();
    }

    const name = this.getDisplayName(doc);
    const ext = name.split('.').pop();

    return ext ? ext.substring(0, 3).toUpperCase() : 'FILE';
  }

  async downloadDocument(doc: DocumentDto) {
    try {
      if (!doc.key) {
        console.error('No key available for document', doc);
        return;
      }

      const presignedUrl =
        await this.uploadService.apiUploadPresignGetPostAsync({
          body: { key: doc.key },
        });

      // Force HTTP for localhost:9000 due to SSL certificate issues
      let fetchUrl = presignedUrl;
      if (presignedUrl.startsWith('https://localhost:9000')) {
        fetchUrl = presignedUrl.replace('https://', 'http://');
      }

      // Fetch the file as a blob
      const response = await fetch(fetchUrl);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch: ${response.status} ${response.statusText}`
        );
      }

      const blob = await response.blob();

      // Create blob URL and trigger download
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = this.getDisplayName(doc);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Failed to download document:', error);
    }
  }
}
