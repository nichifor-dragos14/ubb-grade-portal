import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

import { AppPageHeaderComponent } from '$shared/page-header';
import { ActivityDto, ActivityService, CourseDto } from '$backend/services';
import { AppToastService } from '$shared/toast';
import { ActivityDocsDropzoneComponent } from '$shared/activity-upload/activity-docs-uploader.component';
import { QueuedFile } from '../../../shared/activity-upload/queued-file.model';
import { ConfirmCloseUnsavedDialog } from '$shared/dialogs/confirm-close-unsaved-dialog.component';
import { ProfessorCoursesEventService } from '../courses/professor-courses-event.service';

@Component({
  selector: 'app-professor-update-activity',
  standalone: true,
  template: `
    <app-page-header
      title="Update '{{ activity.name }}' from '{{ course.name }}' 🛠️"
    >
      <span
        class="update-tooltip"
        button
        [matTooltip]="
          updateActivityFormGroup.invalid || !canUpdate
            ? 'No changes have been currently made'
            : ''
        "
        [matTooltipDisabled]="!(updateActivityFormGroup.invalid || !canUpdate)"
      >
        <button
          mat-button
          color="primary"
          button
          [disabled]="updateActivityFormGroup.invalid || !canUpdate"
          (click)="updateActivity()"
        >
          UPDATE
        </button>
      </span>

      <button mat-button color="warn" (click)="close()" button>CLOSE</button>
    </app-page-header>

    <div *ngIf="isLoading" class="form-loader">
      <mat-progress-spinner mode="indeterminate" diameter="56">
      </mat-progress-spinner>
    </div>

    <form [formGroup]="updateActivityFormGroup" *ngIf="!isLoading">
      <section class="card activity-details-card">
        <div class="card-title">Activity details ✍️</div>

        <mat-form-field appearance="outline">
          <mat-label>Description (optional)</mat-label>
          <textarea
            matInput
            formControlName="description"
            placeholder="Add information to guide students solve the activity"
          >
          </textarea>
        </mat-form-field>
      </section>

      <section class="card activity-docs-card">
        <div class="card-title">Activity resources 📄</div>
        <app-activity-docs-dropzone
          *ngIf="!isLoading && activity.id"
          #dropzone
          [activityId]="activity.id"
          [tenantId]="'default'"
          [accept]="'.pdf, .docx, .zip'"
          [maxSizeMB]="5"
          [multiple]="true"
          [queue]="mapExistingToQueue(activity.documents || [])"
          (stateChanged)="onDocsStateChanged()"
        >
        </app-activity-docs-dropzone>
      </section>
    </form>
  `,
  styles: `
    :host {
      padding: 24px;
      padding-bottom: 36px;
      width: 56vw;
      height: 64vh;
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: #f9fafb;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      overflow-y: auto;
      overflow-x: visible;
      scrollbar-width: none;
      padding: 16px;
    }

    .form-loader {
      min-height: 50vh;
      display: grid;
      place-items: center;
    }

    .card {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
    }

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 18px;
    }

    .activity-details-card mat-form-field {
      width: 100%;
    }

    textarea {
      min-height: 150px;
    }

    .update-tooltip {
      display: inline-block;
    }
  `,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatTooltipModule,
    CommonModule,
    RouterModule,
    AppPageHeaderComponent,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinner,
    ActivityDocsDropzoneComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessorUpdateActivityComponent implements OnChanges {
  private readonly formBuilder = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly professorCoursesEventService = inject(
    ProfessorCoursesEventService
  );

  readonly toastService = inject(AppToastService);
  readonly activityService = inject(ActivityService);

  @Input() course!: CourseDto;
  @Input() activity!: ActivityDto;

  @ViewChild('dropzone')
  dropzone?: ActivityDocsDropzoneComponent;

  docsChanged = false;

  updateActivityFormGroup = this.formBuilder.group({
    description: [''],
    name: ['', Validators.required],
  });

  submitting = false;
  redirecting = false;
  loadingActivity = false;
  loadingDocuments = false;

  get isLoading(): boolean {
    return (
      this.loadingActivity ||
      this.loadingDocuments ||
      this.submitting ||
      this.redirecting
    );
  }

  get name() {
    return this.updateActivityFormGroup.controls.name;
  }

  get hasDescriptionChange() {
    const current = this.updateActivityFormGroup.controls.description.value;
    const original = this.activity?.description ?? '';

    return (current ?? '') !== original;
  }

  get canUpdate() {
    return this.hasDescriptionChange || this.docsChanged;
  }

  mapExistingToQueue(
    docs: NonNullable<ActivityDto['documents']>
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
      error: null,
      xhr: null,
      progress: 100,
    }));
  }

  ngOnChanges() {
    this.resetForm();
  }

  resetForm() {
    this.updateActivityFormGroup.reset({
      name: this.activity?.name,
      description: this.activity?.description,
    });

    this.updateActivityFormGroup.get('name')?.disable();
    this.docsChanged = false;
    this.cdr.markForCheck();
  }

  onDocsStateChanged() {
    this.docsChanged = !!this.dropzone?.hasPendingChanges;
    this.cdr.markForCheck();
  }

  async updateActivity() {
    this.updateActivityFormGroup.markAllAsTouched();

    const activityId = this.activity.id;
    const description = this.updateActivityFormGroup.controls.description.value;

    if (activityId == null) {
      return;
    }

    if (this.isLoading) {
      return;
    }

    if (this.dropzone?.hasPendingDeletions) {
      try {
        await this.dropzone.commitPendingDeletions();
      } catch (deleteError: any) {
        this.toastService.open(
          `Warning: Some documents failed to delete: ${deleteError?.message}`,
          'warning'
        );
      }
    }

    this.submitting = true;
    this.cdr.detectChanges();

    try {
      const newDocuments = this.dropzone?.getNewlyUploadedDocuments() ?? [];

      if (newDocuments.length > 0) {
        for (const doc of newDocuments) {
          await this.activityService.apiActivityIdDocumentPostAsync({
            id: activityId,
            body: {
              key: doc.key,
              originalName: doc.originalName,
              contentType: doc.contentType,
              sizeBytes: doc.sizeBytes,
              bucket: doc.bucket,
              etag: doc.etag ?? null,
            } as any,
          });
        }
      }

      await this.activityService.apiActivityIdPutAsync({
        id: activityId,
        body: {
          description: description,
        },
      });

      this.submitting = false;
      this.redirecting = true;
      this.cdr.detectChanges();

      this.toastService.open(
        `Succesfully updated activity ${this.activity.name}`,
        'info'
      );

      this.professorCoursesEventService.emitUpdatedActivityCount({
        activityId: activityId,
      });

      await this.router.navigate(['../../'], {
        relativeTo: this.activatedRoute,
      });
    } catch (error) {
      if (error instanceof Error) {
        this.toastService.open(error.message, 'error');
      }
    } finally {
      this.submitting = false;
      this.redirecting = false;
      this.cdr.detectChanges();
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

      await this.router.navigate(['../../'], {
        relativeTo: this.activatedRoute,
      });
    } catch (error: any) {
      this.toastService.open(error?.message || 'Failed to navigate', 'error');
    }
  }
}
