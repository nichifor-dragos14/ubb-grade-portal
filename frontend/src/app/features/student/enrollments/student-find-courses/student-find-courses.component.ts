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

  courses: CourseDto[] = [];
  isLoading = false;
  private requestId = 0;

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
    this.toastService.open(
      `Enrollment for ${course.name} will be available soon.`,
      'info'
    );
  }

  getActivityCountText(course: CourseDto): string {
    const count = course.numberOfActivities ?? 0;
    if (count === 0) {
      return 'No activities were added by the professor yet';
    }

    return `Contains ${count} ${count === 1 ? 'activity' : 'activities'} that you can solve`;
  }
}
