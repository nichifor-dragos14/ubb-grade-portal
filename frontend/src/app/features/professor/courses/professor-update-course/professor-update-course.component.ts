import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Input,
  OnChanges,
  OnInit,
  inject,
} from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';

import { CourseDto, CourseService } from '$backend/services';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { ProfessorCoursesEventService } from '../professor-courses-event.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppToastService } from '$shared/toast';
import { DateConverterModule } from '$shared/date-converter';

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
    MatTooltipModule,
    MatListModule,
    MatIconModule,
    RouterModule,
    MatSelectModule,
    MatSlideToggleModule,
    CommonModule,
    MatProgressSpinner,
    MatCardModule,
    RouterModule,
    MatDialogModule,
    DateConverterModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessorUpdateCourseComponent implements OnChanges, OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  private readonly toastService = inject(AppToastService);
  private readonly courseService = inject(CourseService);
  private readonly professorCoursesEventService = inject(
    ProfessorCoursesEventService
  );

  @Input() course!: CourseDto;

  updateCourseFormGroup = this.formBuilder.group({
    courseId: ['', Validators.required],
    name: [''],
    description: [''],
    courseDomainName: [''],
    assistedLlmEvaluation: [false],
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

  get hasChanges(): boolean {
    return this.updateCourseFormGroup.dirty;
  }

  async ngOnInit() {
    this.professorCoursesEventService.activityCreated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async () => {
        this.getCourse();
      });

    this.professorCoursesEventService.updateActivityCount$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async () => {
        this.getCourse();
      });
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
      assistedLlmEvaluation: this.course?.assistedLlmEvaluation ?? false,
    });

    this.updateCourseFormGroup.get('name')?.disable();
    this.updateCourseFormGroup.get('courseDomainName')?.disable();
    this.updateCourseFormGroup.markAsPristine();
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
    } catch (error) {
      if (error instanceof Error) {
        this.toastService.open(error.message, 'error');
      }
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
    const assistedLlmEvaluation =
      this.updateCourseFormGroup.controls.assistedLlmEvaluation.value ?? false;

    if (courseId == null || description == null) {
      return;
    }

    if (this.isLoading) {
      return;
    }

    this.submitting = true;
    this.cdr.detectChanges();

    try {
      await this.courseService.apiCourseIdPutAsync({
        id: courseId,
        body: {
          description: description,
          assistedLlmEvaluation: assistedLlmEvaluation,
        },
      });

      this.toastService.open(
        `Successfully updated ${this.course.name}`,
        'info'
      );
    } catch (error) {
      if (error instanceof Error) {
        this.toastService.open(error.message, 'error');
      }
    } finally {
      this.submitting = false;
      this.getCourse();
      this.cdr.detectChanges();
    }
  }
}
