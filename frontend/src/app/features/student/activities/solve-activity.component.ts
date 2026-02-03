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
import { ActivityDetailsDto, ActivityService } from '$backend/services';
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
          [disabled]="!dropzone?.hasUploadedFiles"
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
      <p>{{ activity.description }}</p>

      <app-document-viewer [documents]="activity.activityDocuments">
      </app-document-viewer>

      <app-submission-docs-dropzone
        #dropzone
        [solvedActivityId]="activity.id"
        [tenantId]="'default'"
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
  private readonly studentSolvedActivityEventService = inject(
    StudentSolvedActivityEventService
  );

  @Input() activity!: ActivityDetailsDto;

  @ViewChild('dropzone')
  dropzone?: SubmissionDocsDropzoneComponent;

  submitting = false;

  get isLoading() {
    return this.submitting;
  }

  async done() {
    const activityId = this.activity.id;

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
      const documents = this.dropzone?.getUploadedDocuments();

      if (!documents || documents.length === 0) {
        this.toast.open('Something went wrong', 'error');
        return;
      }

      const solvedActivityId =
        await this.activityService.apiActivitySolvedPostAsync({
          body: { activityId: activityId, solvedActivityDocuments: documents },
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
