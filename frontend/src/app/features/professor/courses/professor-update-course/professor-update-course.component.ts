import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  inject,
} from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';

import { CourseDetailsDto, CourseService } from '$backend/services';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-professor-update-course',
  templateUrl: './professor-update-course.component.html',
  styleUrls: ['./professor-update-course.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatListModule,
    MatIconModule,
    RouterModule,
    MatSelectModule,
    MatSlideToggleModule,
    CommonModule,
    MatProgressSpinner,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessorUpdateCourseComponent implements OnChanges {
  private formBuilder = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private snackBar = inject(MatSnackBar);
  private courseService = inject(CourseService);

  @Input() course!: CourseDetailsDto;

  updateCourseFormGroup = this.formBuilder.group({
    courseId: ['', Validators.required],
    name: [''],
    description: [''],
    courseDomainName: [''],
  });

  submitting = false;
  courseLoading = false;

  get isLoading(): boolean {
    return this.submitting || this.courseLoading;
  }

  get name() {
    return this.updateCourseFormGroup.controls.name;
  }

  get description() {
    return this.updateCourseFormGroup.controls.description;
  }

  get courseDomainName() {
    return this.updateCourseFormGroup.controls.courseDomainName;
  }

  ngOnChanges() {
    this.resetForm();
  }

  resetForm() {
    this.updateCourseFormGroup.reset({
      name: this.course?.name,
      description: this.course?.description,
      courseId: this.course?.id,
      courseDomainName: (this.course as any)?.courseDomainName ?? '',
    });

    this.updateCourseFormGroup.get('name')?.disable();
    this.updateCourseFormGroup.get('courseDomainName')?.disable();
  }

  async getCourse() {
    const courseId = this.course.id;

    if (courseId == null) {
      return;
    }

    if (this.isLoading) {
      return;
    }

    try {
      this.courseLoading = true;

      this.course = await this.courseService.apiCourseIdGetAsync({
        id: courseId,
      });
    } catch (message: any) {
      this.snackBar.open(message.error, 'Close', {
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    } finally {
      this.courseLoading = false;
      this.resetForm();
      this.cdr.detectChanges();
    }
  }

  async updateCourse() {
    this.updateCourseFormGroup.markAllAsTouched();

    const courseId = this.course.id;
    const description = this.updateCourseFormGroup.controls.description.value;

    if (courseId == null || description == null) {
      return;
    }

    if (this.isLoading) {
      return;
    }

    this.submitting = true;
    this.cdr.detectChanges();

    try {
      await this.courseService.apiCoursePutAsync({
        body: {
          description: description,
          id: courseId,
        },
      });
    } catch (message: any) {
      this.snackBar.open(message.error, 'Close', {
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    } finally {
      this.submitting = false;
      this.getCourse();
      this.cdr.detectChanges();
    }
  }
}
