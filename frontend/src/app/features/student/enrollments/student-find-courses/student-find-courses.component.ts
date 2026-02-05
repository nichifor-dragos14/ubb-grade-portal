import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs';

import { AppPageHeaderComponent } from '$shared/page-header';
import { AppToastService } from '$shared/toast';
import { CourseDto, CourseService } from '$backend/services';
import { StudentEnrollmentEventService } from '$features/student/student-enrollment-event.service';

@Component({
  selector: 'app-student-find-courses',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    AppPageHeaderComponent,
  ],
  templateUrl: './student-find-courses.component.html',
  styleUrl: './student-find-courses.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentFindCoursesComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly courseService = inject(CourseService);
  private readonly toastService = inject(AppToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly studentEnrollmentEventService = inject(
    StudentEnrollmentEventService
  );

  courses: CourseDto[] = [];
  isLoading = false;
  private requestId = 0;
  private enrollingIds = new Set<string>();

  searchControl = new FormControl<string>('', { nonNullable: true });

  get resultsTitle(): string {
    const value = this.searchControl.value?.trim();
    return value?.length
      ? `Filtering your search by '${value}'`
      : 'Recommended courses based on your enrollments';
  }

  get resultsSubtitle(): string {
    return this.courses.length
      ? `We found ${this.courses.length} course${
          this.courses.length === 1 ? '' : 's'
        } for you`
      : '';
  }

  async ngOnInit() {
    await this.loadCourses(null);

    this.searchControl.valueChanges
      .pipe(
        tap(() => {
          if (!this.isLoading) {
            this.isLoading = true;
            this.cdr.detectChanges();
          }
        }),
        debounceTime(500),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((value) => {
        const trimmed = value?.trim();
        this.loadCourses(trimmed?.length ? trimmed : null);
      });
  }

  async search() {
    const value = this.searchControl.value?.trim();
    await this.loadCourses(value?.length ? value : null);
  }

  close() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  private async loadCourses(searchString: string | null) {
    const currentRequestId = ++this.requestId;

    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      const courses = await this.courseService.apiCourseFindGetAsync(
        searchString ? { searchString } : {}
      );

      if (currentRequestId === this.requestId) {
        this.courses = courses ?? [];
        this.cdr.detectChanges();
      }
    } catch (error) {
      if (error instanceof Error) {
        this.toastService.open(error.message, 'error');
      }
    } finally {
      if (currentRequestId === this.requestId) {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    }
  }

  enroll(course: CourseDto) {
    if (!course.id || this.enrollingIds.has(course.id)) {
      return;
    }

    this.enrollingIds.add(course.id);
    this.cdr.detectChanges();

    this.courseService
      .apiCourseIdEnrollPutAsync({ id: course.id })
      .then(() => {
        this.toastService.open(`You are enrolled in ${course.name}.`, 'info');
        this.studentEnrollmentEventService.emitEnrolledToCourse({
          courseId: course.id,
        });
        this.loadCourses(this.searchControl.value?.trim() ?? null);
      })
      .catch((error) => {
        if (error instanceof Error) {
          this.toastService.open(error.message, 'error');
        }
      })
      .finally(() => {
        this.enrollingIds.delete(course.id);
        this.cdr.detectChanges();
      });
  }

  isEnrolling(course: CourseDto): boolean {
    return !!course.id && this.enrollingIds.has(course.id);
  }

  getActivityCountText(course: CourseDto): string {
    const count = course.numberOfActivities ?? 0;
    if (count === 0) {
      return 'No activities were added by the professor yet';
    }

    return `Contains ${count} ${count === 1 ? 'activity' : 'activities'} that you can solve`;
  }
}
