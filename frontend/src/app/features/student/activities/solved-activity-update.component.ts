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
  ActivityDocumentDto,
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
          : isReturned
            ? 'Resubmit your work for ' + solvedActivity.activity.name + ' ✍️'
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
      <section class="card">
        <h2 class="section-title">Activity details</h2>
        <p
          class="activity-description"
          *ngIf="solvedActivity.activity.description; else noDescription"
        >
          {{ solvedActivity.activity.description }}
        </p>
        <ng-template #noDescription>
          <p class="activity-description empty">
            This activity doesn't have a description yet.
          </p>
        </ng-template>

        <app-document-viewer
          [documents]="solvedActivity.activity.activityDocuments"
        >
        </app-document-viewer>
      </section>

      <section class="card submission-card">
        <div class="submission-header">
          <h2>
            {{ isCompleted ? 'Your submission' : 'Your previous submission' }}
          </h2>
          <span class="status-chip" [ngClass]="statusClass">
            {{ statusLabel }}
          </span>
        </div>
        <p class="status-message" [ngClass]="statusClass">
          {{ statusMessage }}
        </p>

        <div class="status-panel">
          <div class="row">
            <span class="label">Status</span>
            <span class="value" [ngClass]="statusClass">{{ statusLabel }}</span>
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

        <ng-container *ngIf="!isCompleted; else submissionViewer">
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
        </ng-container>
        <ng-template #submissionViewer>
          <app-document-viewer [documents]="submissionDocuments">
          </app-document-viewer>
        </ng-template>
      </section>
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
        padding: 0 12px 12px;
        display: grid;
        gap: 16px;
      }
      .card {
        background: #fff;
        border: 1px solid #e6e6e6;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
      }
      .section-title {
        margin: 0 0 10px 0;
        font-size: 16px;
        font-weight: 600;
        color: #202124;
      }
      .activity-description {
        margin: 0 0 12px 0;
        color: #2d2d2d;
        font-size: 14px;
        line-height: 1.5;
      }
      .activity-description.empty {
        color: #8a8a8a;
        font-style: italic;
      }
      .submission-card h2 {
        margin: 0 0 8px 0;
      }
      .submission-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 6px;
      }
      .status-chip {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 600;
        background: #f1f3f4;
        color: #5f6368;
      }
      .status-message {
        margin: 0 0 12px 0;
        font-size: 13px;
        color: #5f6368;
      }
      .status-panel {
        display: grid;
        gap: 6px;
        padding: 12px 16px;
        border: 1px solid #e0e0e0;
        border-radius: 10px;
        background: #fafafa;
        margin-bottom: 14px;
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
      .status-submitted,
      .status-submitted .value,
      .status-submitted.status-message {
        color: #2e7d32;
      }
      .status-completed,
      .status-completed .value,
      .status-completed.status-message {
        color: #1b5e20;
      }
      .status-returned,
      .status-returned .value,
      .status-returned.status-message {
        color: #c62828;
      }
      .status-submitted.status-chip {
        background: rgba(76, 175, 80, 0.12);
      }
      .status-completed.status-chip {
        background: rgba(46, 125, 50, 0.14);
      }
      .status-returned.status-chip {
        background: rgba(198, 40, 40, 0.12);
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

  get statusClass(): string {
    switch (this.solvedActivity?.status) {
      case SolvedActivityStatus.$0:
        return 'status-submitted';
      case SolvedActivityStatus.$1:
        return 'status-completed';
      case SolvedActivityStatus.$2:
        return 'status-returned';
      default:
        return '';
    }
  }

  get statusMessage(): string {
    switch (this.solvedActivity?.status) {
      case SolvedActivityStatus.$0:
        return 'Awaiting professor feedback.';
      case SolvedActivityStatus.$1:
        return 'Graded and completed. Great job!';
      case SolvedActivityStatus.$2:
        return 'Please review the feedback and resubmit when ready.';
      default:
        return '';
    }
  }

  get submissionDocuments(): ActivityDocumentDto[] {
    return (this.solvedActivity?.solvedActivityDocuments ??
      []) as ActivityDocumentDto[];
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
