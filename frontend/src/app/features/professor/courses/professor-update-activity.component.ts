import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  inject,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

import { AppPageHeaderComponent } from '$shared/page-header';
import {
  ActivityDetailsDto,
  ActivityService,
  CourseDetailsDto,
} from '$backend/services';
import { AppToastService } from '$shared/toast';
import { ActivityDocsDropzoneComponent } from '$shared/activity-upload/activity-docs-uploader.component';
import { QueuedFile } from '../../../shared/activity-upload/queued-file.model';

@Component({
  selector: 'app-professor-update-activity',
  standalone: true,
  template: `
    <app-page-header
      title="Update activity {{ activity.name }} from course {{
        course.name
      }} 📝"
    >
      <button
        mat-button
        color="primary"
        button
        [disabled]="updateActivityFormGroup.invalid"
        (click)="updateActivity()"
      >
        UPDATE
      </button>

      <button mat-button color="warn" routerLink="../../" button>CLOSE</button>
    </app-page-header>

    <div *ngIf="isLoading" class="form-loader">
      <mat-progress-spinner mode="indeterminate" diameter="56">
      </mat-progress-spinner>
    </div>

    <form [formGroup]="updateActivityFormGroup" *ngIf="!isLoading">
      <mat-form-field>
        <mat-label>Activity name</mat-label>
        <input matInput formControlName="name" />

        <mat-error *ngIf="name.touched && name.hasError('required')">
          The activity name is required.
        </mat-error>
      </mat-form-field>

      <mat-form-field>
        <mat-label>Activity description</mat-label>
        <textarea
          matInput
          formControlName="description"
          placeholder="Add information to guide students solve the activity"
        >
        </textarea>
      </mat-form-field>

      <app-activity-docs-dropzone
        *ngIf="!isLoading && activity.id"
        [activityId]="activity.id"
        [tenantId]="'default'"
        [accept]="
          '.pdf, .doc, .docx, image/*, application/zip, application/x-zip-compressed'
        "
        [maxSizeMB]="10"
        [multiple]="true"
        (uploaded)="
          toastService.open('Uploaded ' + $event.length + ' file(s)', 'info')
        "
        (error)="toastService.open($event, 'error')"
        [queue]="mapExistingToQueue(activity.activityDocuments || [])"
      >
      </app-activity-docs-dropzone>
    </form>
  `,
  styles: `
    :host {
      padding: 32px 24px;
      width: 56vw;
      height: 64vh;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 0 64px;
    }

    .form-loader {
      min-height: 50vh;
      display: grid;
      place-items: center;
    }
  `,
  imports: [
    MatDialogModule,
    MatButtonModule,
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

  readonly toastService = inject(AppToastService);
  readonly activityService = inject(ActivityService);

  @Input() course!: CourseDetailsDto;
  @Input() activity!: ActivityDetailsDto;

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

  mapExistingToQueue(
    docs: NonNullable<ActivityDetailsDto['activityDocuments']>
  ): QueuedFile[] {
    return (docs || []).map((document) => ({
      id: document.id,
      file: null,
      originalName: document.originalName,
      contentType: document.contentType,
      sizeBytes: document.sizeBytes,
      previewUrl: document.contentType?.startsWith('image/') ? null : null,
      status: 'alreadyUploaded',
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
  }

  async getActivity() {
    const activityId = this.activity.id;

    if (activityId == null) {
      return;
    }

    if (this.isLoading) {
      return;
    }

    try {
      this.loadingActivity = true;

      this.activity = await this.activityService.apiActivityIdGetAsync({
        id: activityId,
      });
    } catch (error) {
      if (error instanceof Error) {
        this.toastService.open(error.message, 'error');
      }
    } finally {
      this.loadingActivity = false;
      this.resetForm();
      this.cdr.detectChanges();
    }
  }

  async updateActivity() {
    this.updateActivityFormGroup.markAllAsTouched();

    const activityId = this.activity.id;
    const description = this.updateActivityFormGroup.controls.description.value;

    if (activityId == null || description == null) {
      return;
    }

    if (this.isLoading) {
      return;
    }

    this.submitting = true;
    this.cdr.detectChanges();

    try {
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
        `Succesfully updated ${this.activity.name}`,
        'info'
      );
    } catch (error) {
      if (error instanceof Error) {
        this.toastService.open(error.message, 'error');
      }
    } finally {
      this.submitting = false;
      this.redirecting = false;
      this.cdr.detectChanges();

      this.getActivity();
    }
  }
}
