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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AppPageHeaderComponent } from '$shared/page-header';
import {
  ActivityDto,
  ActivityService,
  SolvedActivityService,
} from '$backend/services';
import { SubmissionDocsDropzoneComponent } from '$shared/submission-upload/submission-docs-uploader.component';
import { DocumentViewerComponent } from '$shared/document-viewer/document-viewer.component';
import { AppToastService } from '$shared/toast';
import { StudentSolvedActivityEventService } from '../student-enrollment-event.service';
import { ConfirmCloseUnsavedDialog } from '$shared/dialogs/confirm-close-unsaved-dialog.component';

@Component({
  selector: 'app-solve-activity',
  standalone: true,
  template: `
    <app-page-header title="Solve '{{ activity.name }}' 📝">
      <span
        class="submit-tooltip"
        button
        [matTooltip]="
          !dropzone?.hasUploadedFiles ? 'Please upload at least one file' : ''
        "
        [matTooltipDisabled]="!!dropzone?.hasUploadedFiles"
      >
        <button
          mat-button
          color="primary"
          (click)="done()"
          [disabled]="submitting || !dropzone?.hasUploadedFiles"
          button
        >
          SUBMIT
        </button>
      </span>
      <button mat-button color="warn" (click)="close()" button>CLOSE</button>
    </app-page-header>

    <div *ngIf="isLoading" class="form-loader">
      <mat-progress-spinner mode="indeterminate" diameter="56">
      </mat-progress-spinner>
    </div>

    <div *ngIf="!isLoading && activity" class="content">
      <section class="card">
        <h2 class="section-title">Activity details 📌</h2>
        <p
          class="activity-description"
          *ngIf="activity.description; else noDescription"
        >
          {{ activity.description }}
        </p>
        <ng-template #noDescription>
          <p class="activity-description empty">
            This activity doesn't have a description yet.
          </p>
        </ng-template>

        <app-document-viewer [documents]="activity.documents!">
        </app-document-viewer>
      </section>

      <section class="card submission-card">
        <h2>Upload your submission 📤</h2>

        <app-submission-docs-dropzone
          #dropzone
          [solvedActivityId]="activity.id!"
          [tenantId]="'default'"
          accept=".pdf, .docx, .zip"
          [maxSizeMB]="5"
          [multiple]="true"
        >
        </app-submission-docs-dropzone>
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
        background: #f9fafb;
      }
      .form-loader {
        min-height: 50vh;
        display: grid;
        place-items: center;
      }
      .content {
        overflow-y: auto;
        overflow-x: visible;
        padding: 0 16px 16px;
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
      .card h2 {
        font-weight: 400;
      }

      .section-title {
        margin: 0 0 10px 0;
        font-size: 16px;
        font-weight: 400;
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
        font-size: 16px;
        font-weight: 400;
        color: #202124;
      }

      .submit-tooltip {
        display: inline-block;
      }
    `,
  ],
  imports: [
    CommonModule,
    RouterModule,
    MatDialogModule,
    MatButtonModule,
    MatTooltipModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AppPageHeaderComponent,
    SubmissionDocsDropzoneComponent,
    DocumentViewerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolveActivityComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(AppToastService);
  private readonly dialog = inject(MatDialog);

  private readonly activityService = inject(ActivityService);
  private readonly solvedActivityService = inject(SolvedActivityService);
  private readonly studentSolvedActivityEventService = inject(
    StudentSolvedActivityEventService
  );

  @Input() activity!: ActivityDto;

  @ViewChild('dropzone')
  dropzone?: SubmissionDocsDropzoneComponent;

  submitting = false;

  get isLoading() {
    return this.submitting;
  }

  async done() {
    const activityId = this.activity.id;

    if (this.submitting) {
      return;
    }

    if (!activityId) {
      this.toast.open('Something went wrong', 'error');
      return;
    }

    if (!this.dropzone?.hasUploadedFiles) {
      this.toast.open(
        'Please upload at least one file before submitting your activity',
        'error'
      );

      return;
    }

    try {
      this.submitting = true;
      const documents = this.dropzone?.getUploadedDocuments();

      if (!documents || documents.length === 0) {
        this.toast.open('Something went wrong', 'error');
        return;
      }

      const solvedActivityId =
        await this.solvedActivityService.apiSolvedActivityPostAsync({
          body: { activityId: activityId, documents: documents },
        });

      if (solvedActivityId) {
        this.toast.open(`Your submission was saved succesfully`, 'info');
        this.studentSolvedActivityEventService.emitAddedSolvedActivity({
          activityId,
        });

        await this.router.navigate(['../../../'], { relativeTo: this.route });
      }
    } catch (error: any) {
      this.toast.open(error?.message || 'Submit failed', 'error');
    } finally {
      this.submitting = false;
    }
  }

  async close() {
    try {
      if (this.dropzone?.hasPendingChanges) {
        const dialogRef = this.dialog.open(ConfirmCloseUnsavedDialog);
        const confirmed = await dialogRef.afterClosed().toPromise();

        if (!confirmed) {
          return;
        }

        await this.dropzone?.cleanupNewFiles();
      }

      await this.router.navigate(['../../../'], { relativeTo: this.route });
    } catch (error: any) {
      this.toast.open(error?.message || 'Failed to navigate', 'error');
    }
  }
}
