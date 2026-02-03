import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  inject,
  NgZone,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import {
  ActivityDocsService,
  UploadResult,
} from '$shared/activity-upload/activity-docs.service';
import { QueuedFile } from '$shared/activity-upload/queued-file.model';
import { ActivityService } from '$backend/services';
import { AppToastService } from '$shared/toast';
import { ProfessorCoursesEventService } from '$features/professor/courses/professor-courses-event.service';
import { ConfirmDeleteSolvedActivityDocumentDialog } from '$shared/dialogs/confirm-delete-solved-activity-document-dialog.component';

@Component({
  selector: 'app-activity-docs-dropzone',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
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
        font-weight: 600;
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
        <div><strong>Drop files here</strong> or click to browse</div>
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
          (click)="startAll()"
          [disabled]="disabled || !hasQueued"
        >
          Upload all
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

          <button
            mat-button
            (click)="uploadOne(item, true)"
            [disabled]="disabled || item.status === 'uploading' || !item.file"
            [hidden]="
              item.status === 'alreadyUploaded' || item.status === 'done'
            "
          >
            Upload
          </button>

          <button
            mat-button
            color="warn"
            (click)="delete(item)"
            [disabled]="item.status === 'uploading'"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ActivityDocsDropzoneComponent {
  @Input({ required: true }) activityId!: string;
  @Input() tenantId = 'default';
  @Input() set queue(value: QueuedFile[]) {
    const incoming = (value ?? []).map((item) => ({ ...item, xhr: null }));

    // Track initially uploaded documents
    for (const doc of incoming) {
      if (doc.id && doc.status === 'alreadyUploaded') {
        this.initiallyUploadedIds.add(doc.id);
      }
    }

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
  @Input() accept = '';
  @Input() maxSizeMB = 10;
  @Input() multiple = true;
  @Input() disabled = false;
  @Output() stateChanged = new EventEmitter<void>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private readonly activityDocsService = inject(ActivityDocsService);
  private readonly activityService = inject(ActivityService);
  private readonly appToastService = inject(AppToastService);
  private readonly professorCoursesEventService = inject(
    ProfessorCoursesEventService
  );
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);

  private _queue: QueuedFile[] = [];

  private deletedIds = new Set<string>();
  private deletedKeys = new Set<string>();
  private initiallyUploadedIds = new Set<string>();
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

  get hasPendingDeletions() {
    return this.pendingDeletions.length > 0;
  }

  get hasPendingAdditions() {
    return this.queue.some(
      (file) =>
        file.status === 'done' &&
        file.id &&
        !this.initiallyUploadedIds.has(file.id)
    );
  }

  get hasPendingChanges() {
    return (
      this.hasQueued || this.hasPendingAdditions || this.hasPendingDeletions
    );
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
    this.stateChanged.emit();
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

  async startAll() {
    const results: UploadResult[] = [];

    for (const q of this._queue.filter(
      (x) => x.status === 'queued' && x.file
    )) {
      const r = await this.uploadOne(q).catch(() => null);
      if (r) {
        results.push(r);
      }
    }
    if (results.length) {
      this.appToastService.open(
        `Successfully uploaded ${results.length} files`
      );
    }

    this.professorCoursesEventService.emitUpdatedActivityCount({
      activityId: this.activityId,
    });

    this.cdr.markForCheck();
  }

  async uploadOne(q: QueuedFile, toast: boolean = false) {
    if (
      this.disabled ||
      q.status === 'uploading' ||
      q.status === 'done' ||
      !q.file
    ) {
      return null;
    }

    this.zone.run(() => {
      q.status = 'uploading';
      q.error = null;
      this.cdr.markForCheck();
    });

    try {
      const result = await this.activityDocsService.uploadOneAsync(
        this.activityId,
        this.tenantId,
        q.file
      );

      if (toast === true) {
        this.appToastService.open(`Successfully uploaded 1 file`);

        this.professorCoursesEventService.emitUpdatedActivityCount({
          activityId: this.activityId,
        });
      }

      this.zone.run(() => {
        q.status = 'done';
        q.id = result.id;
        q.key = result.key;
        this.cdr.markForCheck();
        this.stateChanged.emit();
      });

      return result;
    } catch (error: any) {
      if (error instanceof Error) {
        this.zone.run(() => {
          q.status = 'error';
          q.error = error?.message || 'Upload failed';
          this.appToastService.open(error.message, 'error');
          this.cdr.markForCheck();
        });
      }

      return null;
    }
  }

  async delete(file: QueuedFile) {
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
      // Only queue already-uploaded files for deletion from minio/db
      if (file.status === 'alreadyUploaded' && (file.key || file.id)) {
        this.pendingDeletions.push({
          id: file.id,
          key: file.key,
          bucket: file.bucket,
          originalName: file.originalName ?? file.file?.name,
        });
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
        `Removed ${file.originalName ?? file.file?.name} from activity`
      );

      this._queue = this._queue.filter((f) => f !== file);
      this.cdr.markForCheck();
      this.stateChanged.emit();
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
          await this.activityDocsService.deleteObjectByKeyAsync(
            item.key,
            item.bucket || 'uploads'
          );
        }

        if (item.id) {
          await this.activityService.apiActivityDocumentIdDeleteAsync({
            id: item.id,
          });
        }
      } catch (e: any) {
        errors.push(item.originalName || item.key || item.id || 'document');
      }
    }

    this.pendingDeletions = [];
    this.stateChanged.emit();

    if (errors.length > 0) {
      throw new Error(
        `Failed to delete: ${errors.slice(0, 3).join(', ')}${
          errors.length > 3 ? '…' : ''
        }`
      );
    }

    this.professorCoursesEventService.emitUpdatedActivityCount({
      activityId: this.activityId,
    });
  }

  async cleanupNewFiles(): Promise<void> {
    const newFiles = this._queue.filter(
      (f) =>
        f.key &&
        (f.status === 'done' || f.status === 'uploading') &&
        f.id &&
        !this.initiallyUploadedIds.has(f.id)
    );

    const errors: string[] = [];

    for (const file of newFiles) {
      try {
        if (file.key) {
          await this.activityDocsService.deleteObjectByKeyAsync(
            file.key,
            file.bucket || 'uploads'
          );
        }

        if (file.id) {
          await this.activityService.apiActivityDocumentIdDeleteAsync({
            id: file.id,
          });
        }
      } catch (e: any) {
        errors.push(`${file.originalName}: ${e?.message}`);
      }
    }

    if (errors.length > 0) {
      console.warn('Failed to cleanup some files from Minio:', errors);
    }

    this.professorCoursesEventService.emitUpdatedActivityCount({
      activityId: this.activityId,
    });
  }

  getNewlyUploadedDocuments() {
    return this._queue
      .filter(
        (f) =>
          f.status === 'done' &&
          f.id &&
          !this.initiallyUploadedIds.has(f.id) &&
          f.key
      )
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
}
