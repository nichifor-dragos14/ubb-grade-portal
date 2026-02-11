import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  ViewChild,
  inject,
  NgZone,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';

import { SubmissionDocsService } from '$shared/submission-upload/submission-docs.service';
import { QueuedFile } from '$shared/activity-upload/queued-file.model';
import { AppToastService } from '$shared/toast';
import { ActivityService, SolvedActivityService } from '$backend/services';
import { ConfirmDeleteSolvedActivityDocumentDialog } from '$shared/dialogs/confirm-delete-solved-activity-document-dialog.component';

@Component({
  selector: 'app-submission-docs-dropzone',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        margin-bottom: 16px;
      }

      .dropzone {
        border: 2px dashed #9aa0a6;
        border-radius: 12px;
        padding: 24px;
        text-align: center;
        transition:
          border-color 0.2s,
          background-color 0.2s;

        cursor: pointer;
        user-select: none;
      }

      .dropzone.dragover {
        border-color: #1a73e8;
        background-color: rgba(26, 115, 232, 0.06);
      }

      .hint {
        color: #5f6368;
        margin-top: 6px;
        font-size: 14px;
      }

      .controls {
        display: flex;
        gap: 8px;
        justify-content: center;
        margin-top: 12px;
        flex-wrap: wrap;
      }

      .queue {
        margin-top: 16px;
        display: grid;
        gap: 8px;
      }

      .item {
        border: 1px solid #e0e0e0;
        border-radius: 10px;
        padding: 8px 12px;
        display: flex;
        align-items: center;
        gap: 12px;
        background: #fff;
      }

      .thumb {
        width: 40px;
        height: 40px;
        border-radius: 6px;
        background: #f1f3f4;
        display: grid;
        place-items: center;
        font-size: 12px;
        overflow: hidden;
      }

      .meta {
        flex: 1;
        min-width: 0;
      }

      .name {
        font-weight: 400;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .sub {
        font-size: 12px;
        color: #5f6368;
      }

      .status {
        font-size: 12px;
      }

      .status.error {
        color: #c00;
      }

      .actions {
        display: flex;
        gap: 6px;
        align-items: center;
      }

      .tooltip-wrapper {
        display: inline-flex;
      }

      input[type='file'] {
        display: none;
      }
    `,
  ],
  template: `
    <div
      class="dropzone"
      [class.dragover]="dragOver"
      (click)="onDropzoneClick($event)"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
      [attr.aria-disabled]="disabled || null"
    >
      <div>
        <mat-icon>upload_file</mat-icon>
        <div>
          <strong>Please, drop your submission files here</strong> or click to
          browse
        </div>
        <div class="hint">
          {{ multiple ? 'Multiple files allowed.' : 'Single file.' }}
          <ng-container *ngIf="accept"> • Allowed: {{ accept }}</ng-container>
          <ng-container *ngIf="maxSizeMB">
            • Max {{ maxSizeMB }} MB each</ng-container
          >
        </div>
      </div>

      <div class="controls">
        <button
          mat-stroked-button
          color="primary"
          (click)="browse($event)"
          [disabled]="disabled"
        >
          Choose files
        </button>
        <button
          mat-raised-button
          color="primary"
          (click)="submitAll()"
          [disabled]="disabled || !hasQueued"
        >
          Upload files
        </button>
      </div>

      <input
        #fileInput
        type="file"
        [attr.accept]="accept || null"
        [attr.multiple]="multiple ? '' : null"
        (change)="onFilesSelected($event)"
      />
    </div>

    <div class="queue" *ngIf="queue.length">
      <div class="item" *ngFor="let item of queue; trackBy: trackByItem">
        <div class="thumb">
          <img
            *ngIf="item.previewUrl"
            [src]="item.previewUrl"
            alt=""
            width="40"
            height="40"
          />
          <span *ngIf="!item.previewUrl">{{ extOf(item) }}</span>
        </div>

        <div class="meta">
          <div class="name" [title]="displayNameOf(item)">
            {{ displayNameOf(item) }}
          </div>
          <div class="sub">
            {{ displaySizeOf(item) }} • {{ displayTypeOf(item) }}
          </div>

          <div class="status" [class.error]="item.status === 'error'">
            <ng-container [ngSwitch]="item.status">
              <span *ngSwitchCase="'queued'">Ready</span>
              <span *ngSwitchCase="'uploading'">Uploading…</span>
              <span *ngSwitchCase="'done'" style="color: green">
                Uploaded
              </span>
              <span *ngSwitchCase="'alreadyUploaded'" style="color: green">
                Saved
              </span>
              <span *ngSwitchCase="'error'">Error: {{ item.error }}</span>
            </ng-container>
          </div>
        </div>

        <div class="actions">
          <mat-progress-spinner
            *ngIf="item.status === 'uploading'"
            diameter="24"
            mode="indeterminate"
          >
          </mat-progress-spinner>

          <span
            class="tooltip-wrapper"
            [matTooltip]="getDeleteTooltip(item)"
            [matTooltipDisabled]="!getDeleteTooltip(item)"
          >
            <button
              mat-button
              color="warn"
              (click)="delete(item)"
              [disabled]="
                disabled ||
                !allowDelete ||
                item.status === 'uploading' ||
                isLastSavedFile(item)
              "
            >
              Delete
            </button>
          </span>
        </div>
      </div>
    </div>
  `,
})
export class SubmissionDocsDropzoneComponent {
  @Input({ required: true }) solvedActivityId!: string;
  @Input() tenantId = 'default';
  @Input() set queue(value: QueuedFile[]) {
    const incoming = (value ?? []).map((item) => ({ ...item, xhr: null }));

    const filtered = incoming.filter(
      (d) =>
        !this.deletedIds.has(d?.id ?? '') && !this.deletedKeys.has(d?.key ?? '')
    );

    if (!this._queue.length) {
      this._queue = filtered;
    } else {
      const existingKeys = new Set(
        this._queue.map((document) => document.id ?? document.key)
      );

      for (const file of filtered) {
        const key = file.id ?? file.key;

        if (key && !existingKeys.has(key)) {
          this._queue.push(file);
          existingKeys.add(key);
        }
      }
    }

    this.cdr.markForCheck();
  }
  @Input() accept = '.pdf, .docx, .zip';
  @Input() maxSizeMB = 5;
  @Input() multiple = true;
  @Input() disabled = false;
  @Input() allowDelete = true;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private readonly submissionDocsService = inject(SubmissionDocsService);
  private readonly appToastService = inject(AppToastService);
  private readonly activityService = inject(ActivityService);
  private readonly solvedActivityService = inject(SolvedActivityService);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);

  private _queue: QueuedFile[] = [];

  private deletedIds = new Set<string>();
  private deletedKeys = new Set<string>();
  private pendingDeletions: Array<{
    id?: string;
    key?: string;
    bucket?: string;
    originalName?: string;
  }> = [];

  dragOver = false;

  get queue(): QueuedFile[] {
    return this._queue;
  }

  get hasQueued() {
    return this.queue.some((file) => file.status === 'queued' && !!file.file);
  }

  get hasUploadedFiles() {
    return this.queue.some((file) => file.status === 'done');
  }

  get hasPendingDeletions() {
    return this.pendingDeletions.length > 0;
  }

  get hasPendingAdditions() {
    return this.hasQueued;
  }

  get hasPendingChanges() {
    return (
      this.hasPendingAdditions ||
      this.hasUploadedFiles ||
      this.hasPendingDeletions
    );
  }

  get savedItemsCount() {
    return this.queue.filter((file) => file.status === 'alreadyUploaded')
      .length;
  }

  isLastSavedFile(file: QueuedFile) {
    return file.status === 'alreadyUploaded' && this.savedItemsCount <= 1;
  }

  getDeleteTooltip(file: QueuedFile) {
    if (this.disabled || !this.allowDelete) {
      return 'Deletion is disabled for this submission';
    }

    if (file.status === 'uploading') {
      return 'Please wait for the upload to finish';
    }

    if (this.isLastSavedFile(file)) {
      return 'Keep at least one saved document. Add another document and save changes to delete this one.';
    }

    return '';
  }

  getUploadedDocuments() {
    return this.queue
      .filter((f) => f.status === 'done')
      .map((f) => ({
        key: f.key ?? '',
        originalName: f.originalName ?? f.file?.name ?? '',
        contentType:
          f.contentType ?? f.file?.type ?? 'application/octet-stream',
        sizeBytes: f.sizeBytes ?? f.file?.size ?? 0,
        bucket: f.bucket ?? 'uploads',
        etag: (f as any).etag ?? null,
      }));
  }

  trackByItem = (index: number, file: QueuedFile) =>
    file.id ?? file.key ?? index;

  displayNameOf(file: QueuedFile) {
    return file.file?.name ?? file.originalName ?? 'document';
  }

  displayTypeOf(file: QueuedFile) {
    return file.file?.type || file.contentType || 'application/octet-stream';
  }

  displaySizeOf(file: QueuedFile) {
    const bytes = file.file?.size ?? file.sizeBytes ?? 0;

    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  extOf(file: QueuedFile) {
    const t = this.displayTypeOf(file);

    if (t.includes('/')) {
      return t.split('/')[1];
    }

    const name = this.displayNameOf(file);
    const ext = name.split('.').pop();

    return ext || 'file';
  }

  browse(event?: Event) {
    event?.stopPropagation();

    if (!this.disabled) {
      this.fileInput?.nativeElement?.click();
    }
  }

  onDropzoneClick(event: MouseEvent) {
    if (this.disabled) {
      return;
    }

    const target = event.target as HTMLElement | null;

    if (target && target.closest('.controls')) {
      return;
    }

    this.browse(event);
  }

  onDragOver(event: DragEvent) {
    if (this.disabled) {
      return;
    }

    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent) {
    if (this.disabled) {
      return;
    }

    event.preventDefault();
    this.dragOver = false;
  }

  onDrop(event: DragEvent) {
    if (this.disabled) {
      return;
    }

    event.preventDefault();
    this.dragOver = false;
    this.enqueue(Array.from(event.dataTransfer?.files || []));
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    this.enqueue(files);

    if (input) {
      input.value = '';
    }
  }

  private enqueue(files: File[]) {
    const accepted = this.filterByAccept(files);
    const validated = this.filterBySize(accepted);
    const toQueue = this.multiple ? validated : validated.slice(0, 1);

    const items: QueuedFile[] = toQueue.map((file) => ({
      file,
      previewUrl: file.type.startsWith('image/')
        ? URL.createObjectURL(file)
        : null,
      status: 'queued',
      error: null,
      xhr: null,
    }));

    this._queue = [...this._queue, ...items];
    this.cdr.markForCheck();
  }

  private filterByAccept(files: File[]) {
    if (!this.accept) {
      return files;
    }

    const patterns = this.accept
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const ok = (f: File) => {
      if (!patterns.length) {
        return true;
      }

      const type = f.type || '';
      const name = f.name.toLowerCase();

      return patterns.some((p) => {
        if (p.endsWith('/*')) {
          return type.startsWith(p.slice(0, -2) + '/');
        }

        if (p.startsWith('.')) {
          return name.endsWith(p.toLowerCase());
        }

        return type === p;
      });
    };

    const accepted = files.filter(ok);
    const rejected = files.filter((f) => !ok(f));

    if (rejected.length)
      this.appToastService.open(
        `Some files were rejected by type: ${rejected.map((f) => f.name).join(', ')}`,
        'error'
      );

    return accepted;
  }

  private filterBySize(files: File[]) {
    const max = this.maxSizeMB * 1024 * 1024;
    const accepted = files.filter((f) => f.size <= max);
    const rejected = files.filter((f) => f.size > max);

    if (rejected.length) {
      this.appToastService.open(
        `Some files exceed ${this.maxSizeMB} MB: ${rejected.map((f) => f.name).join(', ')}`,
        'error'
      );
    }

    return accepted;
  }

  async submitAll(): Promise<any[] | null> {
    const toUpload = this._queue.filter((x) => x.status === 'queued' && x.file);

    if (!toUpload.length) {
      this.appToastService.open('No files to submit', 'error');
      return null;
    }

    const uploadedFiles = toUpload.map((q) => q.file!);

    for (const q of toUpload) {
      this.zone.run(() => {
        q.status = 'uploading';
        q.error = null;
        this.cdr.markForCheck();
      });
    }

    try {
      const uploadedDocs =
        await this.submissionDocsService.submitSolvedActivityAsync(
          this.solvedActivityId,
          this.tenantId,
          uploadedFiles
        );

      for (let i = 0; i < toUpload.length; i++) {
        const q = toUpload[i];
        const doc = uploadedDocs[i];

        this.zone.run(() => {
          q.status = 'done';
          q.key = doc.key;
          q.originalName = doc.originalName ?? q.file?.name;
          q.contentType = doc.contentType ?? q.file?.type;
          q.sizeBytes = doc.sizeBytes ?? q.file?.size;
          q.bucket = doc.bucket ?? 'uploads';
          (q as any).etag = doc.etag ?? null;
          this.cdr.markForCheck();
        });
      }

      this.appToastService.open(
        `${uploadedDocs.length} files were uploaded successfully`,
        'info'
      );

      return uploadedDocs;
    } catch (e: any) {
      for (const q of toUpload) {
        this.zone.run(() => {
          q.status = 'error';
          q.error = e?.message || 'Submit failed';
          this.cdr.markForCheck();
        });
      }

      this.appToastService.open(e?.message || 'Submit failed', 'error');
      return null;
    }
  }

  async delete(file: QueuedFile) {
    if (this.disabled || !this.allowDelete) {
      this.appToastService.open('Deletion is disabled for this submission');
      return;
    }

    if (this.isLastSavedFile(file)) {
      this.appToastService.open(
        'You must keep at least one saved document in your submission',
        'error'
      );
      return;
    }

    const dialogRef = this.dialog.open(
      ConfirmDeleteSolvedActivityDocumentDialog,
      {
        data: { fileName: file.originalName ?? file.file?.name },
      }
    );

    const confirmed = await dialogRef.afterClosed().toPromise();

    if (!confirmed) {
      return;
    }

    try {
      if (file.status === 'alreadyUploaded') {
        this.pendingDeletions.push({
          id: file.id,
          key: file.key,
          bucket: file.bucket,
          originalName: file.originalName,
        });
      } else if (file.key) {
        await this.submissionDocsService.deleteObjectByKeyAsync(
          file.key,
          file.bucket || 'uploads'
        );
      }

      if (file.id) {
        this.deletedIds.add(file.id);
      }
      if (file.key) {
        this.deletedKeys.add(file.key);
      }
      if (file.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }

      this.appToastService.open(
        `Removed ${file.originalName ?? file.file?.name} from your submission`
      );

      this._queue = this._queue.filter((f) => f !== file);
      this.cdr.markForCheck();
    } catch (e: any) {
      this.appToastService.open(e?.message || 'Delete failed', 'error');
    }
  }

  async commitPendingDeletions(): Promise<void> {
    if (!this.pendingDeletions.length) {
      return;
    }

    const pending = [...this.pendingDeletions];
    const errors: string[] = [];

    for (const item of pending) {
      try {
        if (item.key) {
          await this.submissionDocsService.deleteObjectByKeyAsync(
            item.key,
            item.bucket || 'uploads'
          );
        }

        if (item.id) {
          await this.solvedActivityService.apiSolvedActivityDocumentIdDeleteAsync(
            {
              id: item.id,
            }
          );
        }
      } catch (e: any) {
        errors.push(item.originalName || item.key || item.id || 'document');
      }
    }

    this.pendingDeletions = [];

    if (errors.length > 0) {
      throw new Error(
        `Failed to delete: ${errors.slice(0, 3).join(', ')}${
          errors.length > 3 ? '…' : ''
        }`
      );
    }
  }

  async cleanupNewFiles(): Promise<void> {
    const newFiles = this._queue.filter(
      (f) => f.key && (f.status === 'done' || f.status === 'uploading')
    );

    const errors: string[] = [];

    for (const file of newFiles) {
      try {
        if (file.key) {
          await this.submissionDocsService.deleteObjectByKeyAsync(
            file.key,
            file.bucket || 'uploads'
          );
        }
      } catch (e: any) {
        errors.push(`${file.originalName}: ${e?.message}`);
      }
    }

    if (errors.length > 0) {
      console.warn('Failed to cleanup some files from Minio:', errors);
    }
  }
}
