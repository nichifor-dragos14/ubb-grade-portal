import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  inject,
  Input,
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AppPageHeaderComponent } from '$shared/page-header';
import { ActivityService, SolvedActivityDetailsDto } from '$backend/services';
import { SubmissionDocsDropzoneComponent } from '$shared/submission-upload/submission-docs-uploader.component';
import { QueuedFile } from '$shared/activity-upload/queued-file.model';
import { DocumentViewerComponent } from '$shared/document-viewer/document-viewer.component';
import { AppToastService } from '$shared/toast';
import { StudentSolvedActivityEventService } from '../student-enrollment-event.service';

@Component({
  selector: 'app-solved-activity-update',
  standalone: true,
  template: `
    <app-page-header
      title="Your submission for '{{ solvedActivity.activity.name }}' 🔄"
    >
      <button
        mat-button
        color="primary"
        (click)="done()"
        [disabled]="!dropzone?.hasUploadedFiles"
        button
      >
        RESUBMIT
      </button>
      <button mat-button color="warn" routerLink="../../../" button>
        CLOSE
      </button>
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

      <h2>Your Previous Submission</h2>

      <app-submission-docs-dropzone
        #dropzone
        [solvedActivityId]="solvedActivity.id"
        [tenantId]="'default'"
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolvedActivityUpdateComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(AppToastService);

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

  async done() {
    // submit update
  }
}
