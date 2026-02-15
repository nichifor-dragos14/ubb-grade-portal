import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatBadgeModule } from '@angular/material/badge';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { DateConverterModule } from '$shared/date-converter';

import { CourseDto, CourseService } from '$backend/services';
import { AppPageHeaderComponent } from '$shared/page-header';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AppToastService } from '$shared/toast';
import {
  StudentEnrollmentEventService,
  StudentSolvedActivityEventService,
} from '$features/student/student-enrollment-event.service';
import { Subject, takeUntil } from 'rxjs';
@Component({
  selector: 'app-student-enrollments',
  standalone: true,
  imports: [
    RouterModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    CommonModule,
    MatBadgeModule,
    MatPaginatorModule,
    DateConverterModule,
    AppPageHeaderComponent,
    MatProgressSpinnerModule,
  ],
  templateUrl: './student-enrollments.component.html',
  styleUrl: './student-enrollments.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentEnrollmentsComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly toastService = inject(AppToastService);
  private readonly courseService = inject(CourseService);
  private readonly enrollmentService = inject(
    StudentSolvedActivityEventService
  );
  private readonly studentEnrollmentEventService = inject(
    StudentEnrollmentEventService
  );

  private readonly destroy$ = new Subject<void>();

  enrollments: CourseDto[] = [];
  enrollmentsCount = 0;

  pageIndex = 0;
  pageSize = 9;

  isLoading = false;

  async ngOnInit() {
    await this.loadPage();
    this.navigateToMostSubmittedEnrollment();

    this.enrollmentService.addedSolvedActivity$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadPage();
      });

    this.enrollmentService.updatedSolvedActivity$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadPage();
      });

    this.studentEnrollmentEventService.enrolledToCourse$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadPage().then(() => this.navigateToMostSubmittedEnrollment());
      });

    this.studentEnrollmentEventService.unenrolledFromCourse$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadPage().then(() => this.navigateToMostSubmittedEnrollment());
      });
  }

  private async loadPage() {
    try {
      this.isLoading = true;
      this.cdr.detectChanges();

      const result = await this.courseService.apiCourseEnrollmentsGetAsync({
        pageNumber: this.pageIndex + 1,
        pageSize: this.pageSize,
      });

      this.enrollments = result.enrollments;
      this.enrollmentsCount = result.count;
      this.cdr.detectChanges();
    } catch (error) {
      if (error instanceof Error) {
        this.toastService.open(error.message, 'error');
      }
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private navigateToMostSubmittedEnrollment(): void {
    const candidate = this.enrollments
      .map((enrollment) => {
        const totalActivities = enrollment.numberOfActivities ?? 0;
        const submittedActivities = enrollment.numberOfSubmittedActivities ?? 0;
        const completedActivities = enrollment.numberOfSolvedActivities ?? 0;

        return {
          enrollment,
          totalActivities,
          submittedActivities,
          completedActivities,
        };
      })
      .filter(
        (entry) =>
          entry.totalActivities > 0 &&
          entry.submittedActivities > 0 &&
          entry.completedActivities < entry.submittedActivities
      )
      .sort((a, b) => {
        if (b.submittedActivities !== a.submittedActivities) {
          return b.submittedActivities - a.submittedActivities;
        }

        if (b.totalActivities !== a.totalActivities) {
          return b.totalActivities - a.totalActivities;
        }

        return (a.enrollment.name ?? '').localeCompare(b.enrollment.name ?? '');
      })[0]?.enrollment;

    if (!candidate) {
      return;
    }

    void this.router.navigate([
      '/main/student/enrollments/course',
      candidate.id,
    ]);
  }

  async onPageChange(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;

    await this.loadPage();
  }

  openFindCourses(): void {
    const courseId = this.route.firstChild?.snapshot?.params?.['id'];

    if (courseId) {
      void this.router.navigate(['course', courseId, 'find'], {
        relativeTo: this.route,
      });
      return;
    }

    void this.router.navigate(['find'], { relativeTo: this.route });
  }

  getCompletionRate(totalNumber: number, completedNumber: number): number {
    if (totalNumber === 0) {
      return 0;
    }

    return (completedNumber * 100) / totalNumber;
  }

  getCompletionPercentText(totalNumber: number, solvedNumber: number): string {
    if (totalNumber === 0) {
      return '—';
    }

    const pct = Math.round(this.getCompletionRate(totalNumber, solvedNumber));
    return `${pct}%`;
  }

  getCompletionLineText(
    totalNumber: number,
    submittedNumber: number,
    completedNumber: number
  ): string {
    if (totalNumber === 0) {
      return 'No activities were added by the professor yet';
    }

    const inactiveCount = Math.max(
      totalNumber - submittedNumber - completedNumber,
      0
    );

    if (inactiveCount === 0) {
      if (completedNumber >= totalNumber) {
        return 'You have successfully completed this course.';
      }

      return 'Waiting for professor feedback.';
    }

    const activityLabel = inactiveCount === 1 ? 'activity' : 'activities';
    const verbLabel = inactiveCount === 1 ? 'requires' : 'require';

    return `${inactiveCount} / ${totalNumber} ${activityLabel} ${verbLabel} your submission`;
  }

  getCompletionClass(value: number): string {
    if (value < 40) {
      return 'completion-red';
    }

    if (value < 80) {
      return 'completion-yellow';
    }

    return 'completion-green';
  }
}
