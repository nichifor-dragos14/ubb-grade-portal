import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  inject,
  Input,
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AppPageHeaderComponent } from '$shared/page-header';
import {
  ActivityService,
  SolvedActivityDetailsDto,
  SolvedActivityStatus,
} from '$backend/services';
import { SubmissionDocsDropzoneComponent } from '$shared/submission-upload/submission-docs-uploader.component';
import { QueuedFile } from '$shared/activity-upload/queued-file.model';
import { DocumentViewerComponent } from '$shared/document-viewer/document-viewer.component';
import { AppToastService } from '$shared/toast';
import { StudentSolvedActivityEventService } from '../student-enrollment-event.service';
import { ConfirmCloseUnsavedDialog } from '$shared/dialogs/confirm-close-unsaved-dialog.component';
import { DateConverterModule } from '$shared/date-converter';

@Component({
  selector: 'app-solved-activity-update',
  standalone: true,
  template: `
    <app-page-header
      title="{{
        isCompleted
          ? 'Your submission for ' + solvedActivity.activity.name + ' ✅'
          : 'Edit your submission for ' + solvedActivity.activity.name + ' 🔄'
      }}"
    >
      <button
        mat-button
        color="primary"
        (click)="done()"
        [disabled]="!canEdit || !dropzone?.hasUploadedFiles"
        *ngIf="!isCompleted"
        button
      >
        RESUBMIT
      </button>
      <button mat-button color="warn" (click)="close()" button>CLOSE</button>
    </app-page-header>

    <div *ngIf="isLoading" class="form-loader">
      <mat-progress-spinner mode="indeterminate" diameter="56">
      </mat-progress-spinner>
    </div>

    <div *ngIf="!isLoading && solvedActivity" class="content">
      <p>{{ solvedActivity.activity.description }}</p>

      <app-document-viewer
        [documents]="solvedActivity.activity.activityDocuments"
      >
      </app-document-viewer>

      <h2>
        {{ isCompleted ? 'Your submission' : 'Your previous submission' }}
      </h2>

      <div class="status-panel">
        <div class="row">
          <span class="label">Status</span>
          <span class="value">{{ statusLabel }}</span>
        </div>
        <div class="row" *ngIf="lastUpdatedOn">
          <span class="label">Last updated</span>
          <span class="value">{{ lastUpdatedOn | dateFormat }}</span>
        </div>
        <div class="row" *ngIf="isCompleted">
          <span class="label">Grade</span>
          <span class="value">{{ solvedActivity.grade }}</span>
        </div>
        <div class="row" *ngIf="isCompleted || isReturned">
          <span class="label">Professor comment</span>
          <span class="value">
            {{ solvedActivity.professorComment || 'No comment yet' }}
          </span>
        </div>
      </div>

      <app-submission-docs-dropzone
        #dropzone
        [solvedActivityId]="solvedActivity.id"
        [tenantId]="'default'"
        [disabled]="!canEdit"
        [allowDelete]="canEdit"
        [queue]="
          mapExistingToQueue(solvedActivity.solvedActivityDocuments || [])
        "
        accept=".pdf, .doc, .docx, image/*, application/zip, application/x-zip-compressed"
        [maxSizeMB]="15"
        [multiple]="true"
      >
      </app-submission-docs-dropzone>
    </div>
  `,
  styles: [
    `
      :host {
        padding: 24px;
        width: 56vw;
        height: 64vh;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .form-loader {
        min-height: 50vh;
        display: grid;
        place-items: center;
      }
      .content {
        overflow: auto;
        padding: 0 12px;
      }
      .status-panel {
        display: grid;
        gap: 6px;
        padding: 12px 16px;
        border: 1px solid #e0e0e0;
        border-radius: 10px;
        background: #fafafa;
        margin-bottom: 12px;
      }
      .status-panel .row {
        display: grid;
        grid-template-columns: 140px 1fr;
        gap: 8px;
        font-size: 13px;
        color: #4a4a4a;
      }
      .status-panel .label {
        font-weight: 600;
        color: #616161;
      }
      .status-panel .value {
        font-weight: 500;
      }
      .actions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }
    `,
  ],
  imports: [
    CommonModule,
    RouterModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AppPageHeaderComponent,
    SubmissionDocsDropzoneComponent,
    DocumentViewerComponent,
    DateConverterModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolvedActivityUpdateComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(AppToastService);
  private readonly dialog = inject(MatDialog);

  private readonly activityService = inject(ActivityService);
  private readonly studentSolvedActivityEventService = inject(
    StudentSolvedActivityEventService
  );

  @Input() solvedActivity!: SolvedActivityDetailsDto;

  @ViewChild('dropzone')
  dropzone?: SubmissionDocsDropzoneComponent;

  mapExistingToQueue(
    docs: NonNullable<SolvedActivityDetailsDto['solvedActivityDocuments']>
  ): QueuedFile[] {
    return (docs || []).map((document) => ({
      id: document.id,
      file: null,
      originalName: document.originalName,
      contentType: document.contentType,
      sizeBytes: document.sizeBytes,
      previewUrl: document.contentType?.startsWith('image/') ? null : null,
      status: 'alreadyUploaded',
      key: document.key,
      bucket: document.bucket,
      error: null,
      xhr: null,
      progress: 100,
    }));
  }

  submitting = false;

  get isLoading() {
    return this.submitting;
  }

  get canEdit(): boolean {
    return (
      this.solvedActivity?.status === SolvedActivityStatus.$0 ||
      this.solvedActivity?.status === SolvedActivityStatus.$2
    );
  }

  get isCompleted(): boolean {
    return this.solvedActivity?.status === SolvedActivityStatus.$1;
  }

  get isReturned(): boolean {
    return this.solvedActivity?.status === SolvedActivityStatus.$2;
  }

  get statusLabel(): string {
    switch (this.solvedActivity?.status) {
      case SolvedActivityStatus.$0:
        return 'Submitted';
      case SolvedActivityStatus.$1:
        return 'Completed';
      case SolvedActivityStatus.$2:
        return 'Returned';
      default:
        return 'Unknown';
    }
  }

  get lastUpdatedOn(): string | null | undefined {
    return this.solvedActivity?.updatedOn || this.solvedActivity?.createdOn;
  }

  async done() {
    const solvedActivityId = this.solvedActivity.id;

    if (!this.canEdit) {
      this.toast.open('Resubmission is not allowed for completed activities');
      return;
    }

    if (!solvedActivityId) {
      this.toast.open('Something went wrong', 'error');
      return;
    }

    if (!this.dropzone?.hasUploadedFiles) {
      this.toast.open(
        'Please upload at least one file before resubmitting your activity',
        'error'
      );

      return;
    }

    try {
      const documents = this.dropzone?.getUploadedDocuments();

      if (!documents || documents.length === 0) {
        this.toast.open('Something went wrong', 'error');
        return;
      }

      const returnedSolvedActivityId =
        await this.activityService.apiActivitySolvedIdPutAsync({
          id: solvedActivityId,
          body: { solvedActivityDocuments: documents },
        });

      if (returnedSolvedActivityId) {
        this.toast.open(`Your submission was saved succesfully`, 'info');
        this.studentSolvedActivityEventService.emitAddedSolvedActivity({
          activityId: returnedSolvedActivityId,
        });

        await this.router.navigate(['../../../'], { relativeTo: this.route });
      }

      this.toast.open(`Your submission was updated succesfully`, 'info');

      await this.router.navigate(['../../../'], { relativeTo: this.route });
    } catch (error: any) {
      this.toast.open(error?.message || 'Update submission failed', 'error');
    }
  }

  async close() {
    try {
      if (this.dropzone?.hasUploadedFiles) {
        const dialogRef = this.dialog.open(ConfirmCloseUnsavedDialog);
        const confirmed = await dialogRef.afterClosed().toPromise();

        await this.dropzone?.cleanupNewFiles();

        if (!confirmed) {
          return;
        }
      }

      await this.router.navigate(['../../../'], { relativeTo: this.route });
    } catch (error: any) {
      this.toast.open(error?.message || 'Failed to navigate', 'error');
    }
  }
}
