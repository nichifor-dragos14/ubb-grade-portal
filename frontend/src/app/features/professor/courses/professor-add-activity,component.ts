import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  inject,
} from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AppPageHeaderComponent } from '$shared/page-header';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ActivityService, CourseDetailsDto } from '$backend/services';
import { AppToastService } from '$shared/toast';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-professor-add-activity',
  standalone: true,
  template: `
    <app-page-header title="Add a new activity to {{ course.name }} 📝">
      <button
        mat-button
        color="primary"
        button
        [disabled]="addActivityFormGroup.invalid"
        (click)="createActivity()"
      >
        ADD
      </button>

      <button mat-button color="warn" routerLink="../../" button>CLOSE</button>
    </app-page-header>

    <div *ngIf="isLoading" class="form-loader">
      <mat-progress-spinner mode="indeterminate" diameter="56">
      </mat-progress-spinner>
    </div>

    <form [formGroup]="addActivityFormGroup" *ngIf="!isLoading">
      <mat-form-field>
        <mat-label>Activity name</mat-label>
        <input
          matInput
          formControlName="name"
          placeholder="Ex: First assignment"
        />

        <mat-error *ngIf="name.touched && name.hasError('required')">
          The activity name is required.
        </mat-error>
      </mat-form-field>

      <mat-form-field>
        <mat-label>Activity description</mat-label>
        <textarea matInput formControlName="description"> </textarea>
      </mat-form-field>
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessorAddActivityComponent {
  private formBuilder = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  readonly router = inject(Router);
  readonly toastService = inject(AppToastService);

  readonly activatedRoute = inject(ActivatedRoute);
  readonly activityService = inject(ActivityService);

  @Input() course!: CourseDetailsDto;

  addActivityFormGroup = this.formBuilder.group({
    name: ['', Validators.required],
    description: [''],
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
      await this.activityService.apiActivityPostAsync({
        body: {
          name: name,
          description: description,
          courseId: courseId,
        },
      });

      this.submitting = false;
      this.redirecting = true;
      this.cdr.detectChanges();

      this.toastService.open('Succesfully created activity', 'info');
      await this.router.navigate(['..', '']);
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
