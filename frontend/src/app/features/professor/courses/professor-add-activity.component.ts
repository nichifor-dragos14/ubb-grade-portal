import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

import { AppPageHeaderComponent } from '$shared/page-header';
import { ActivityService, CourseDto } from '$backend/services';
import { AppToastService } from '$shared/toast';
import { ProfessorCoursesEventService } from './professor-courses-event.service';

@Component({
  selector: 'app-professor-add-activity',
  standalone: true,
  template: `
    <app-page-header title="Add an activity to '{{ course.name }}' ✨">
      <span
        class="add-tooltip"
        button
        [matTooltip]="
          addActivityFormGroup.invalid
            ? 'Please fill in all required fields'
            : ''
        "
        [matTooltipDisabled]="!addActivityFormGroup.invalid"
      >
        <button
          mat-button
          color="primary"
          button
          [disabled]="addActivityFormGroup.invalid"
          (click)="createActivity()"
        >
          ADD
        </button>
      </span>

      <button mat-button color="warn" routerLink="../../" button>CLOSE</button>
    </app-page-header>

    <div *ngIf="isLoading" class="form-loader">
      <mat-progress-spinner mode="indeterminate" diameter="56">
      </mat-progress-spinner>
    </div>

    <form [formGroup]="addActivityFormGroup" *ngIf="!isLoading">
      <section class="card activity-details-card">
        <div class="card-title">Activity details ✍️</div>

        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input
            matInput
            formControlName="name"
            placeholder="Ex: First activity"
          />

          <mat-error *ngIf="name.touched && name.hasError('required')">
            The activity name is required.
          </mat-error>
          <mat-error *ngIf="name.touched && name.hasError('maxlength')">
            Title must be at most 30 characters.
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Description (optional)</mat-label>
          <textarea
            matInput
            formControlName="description"
            placeholder="Add information to guide students solve the activity"
          >
          </textarea>
          <mat-error
            *ngIf="
              addActivityFormGroup.controls.description.touched &&
              addActivityFormGroup.controls.description.hasError('maxlength')
            "
          >
            Description must be at most 1500 characters.
          </mat-error>
        </mat-form-field>

        <p class="hint-text">
          After creating this activity, you will be redirected to add resources.
        </p>
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

    .hint-text {
      margin: 4px 0 0 0;
      font-size: 12px;
      color: #6b7280;
    }

    textarea {
      min-height: 150px;
    }

    .add-tooltip {
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessorAddActivityComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  private readonly toastService = inject(AppToastService);
  private readonly activityService = inject(ActivityService);
  private readonly professorCoursesEventService = inject(
    ProfessorCoursesEventService
  );

  @Input() course!: CourseDto;

  addActivityFormGroup = this.formBuilder.group({
    name: ['', [Validators.required, Validators.maxLength(30)]],
    description: ['', [Validators.maxLength(1500)]],
  });

  submitting = false;
  redirecting = false;
  loadingDocuments = false;

  get isLoading(): boolean {
    return this.loadingDocuments || this.submitting || this.redirecting;
  }

  get name() {
    return this.addActivityFormGroup.controls.name;
  }

  async createActivity() {
    this.addActivityFormGroup.markAllAsTouched();

    const courseId = this.course.id;

    const name = this.addActivityFormGroup.controls.name.value;
    const description = this.addActivityFormGroup.controls.description.value;

    if (courseId == null || name == null || description == null) {
      return;
    }

    if (this.isLoading) {
      return;
    }

    this.submitting = true;
    this.cdr.detectChanges();

    try {
      var activityId = await this.activityService.apiActivityPostAsync({
        body: {
          name: name,
          description: description,
          courseId: courseId,
        },
      });

      this.submitting = false;
      this.redirecting = true;
      this.cdr.detectChanges();

      this.professorCoursesEventService.emitCreatedActivity({
        courseId: courseId,
        activityId: activityId,
      });

      this.toastService.open(
        `Succesfully created activity '${name}' ✨`,
        'info'
      );

      await this.router.navigate(['..', activityId], {
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
}
