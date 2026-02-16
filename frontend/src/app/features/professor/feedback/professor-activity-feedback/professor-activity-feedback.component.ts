import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';

import { AppPageHeaderComponent } from '$shared/page-header';
import { AppToastService } from '$shared/toast';
import { DateConverterModule } from '$shared/date-converter';
import {
  CourseDto,
  CourseService,
  PaginatedProfessorSolvedActivityDto,
  SolvedActivityDto,
  SolvedActivityService,
  SolvedActivityStatus,
  SolvedActivityStatusFilter,
} from '$backend/services';
import { NotificationsService } from '$core/notifications/notifications.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProfessorFeedbackEventService } from '../professor-feedback-event.service';

@Component({
  selector: 'app-professor-activity-feedback',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    AppPageHeaderComponent,
    DateConverterModule,
  ],
  templateUrl: './professor-activity-feedback.component.html',
  styleUrl: './professor-activity-feedback.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessorActivityFeedbackComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toastService = inject(AppToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly solvedActivityService = inject(SolvedActivityService);
  private readonly courseService = inject(CourseService);
  private readonly notificationsService = inject(NotificationsService);
  private readonly professorFeedbackEventService = inject(
    ProfessorFeedbackEventService
  );

  solvedActivities: SolvedActivityDto[] = [];
  totalCount = 0;

  courses: CourseDto[] = [];
  courseFilter = '';

  pageIndex = 0;
  pageSize = 6;

  studentNameFilter = '';
  private studentNameTimer?: ReturnType<typeof setTimeout>;

  statusFilter: SolvedActivityStatusFilter = SolvedActivityStatusFilter.$0;
  filtersOpen = false;

  isLoading = false;

  readonly statusOptions = [
    { value: SolvedActivityStatusFilter.$0, label: 'Submitted' },
    { value: SolvedActivityStatusFilter.$1, label: 'Completed' },
    { value: SolvedActivityStatusFilter.$2, label: 'Returned' },
    { value: SolvedActivityStatusFilter.$3, label: 'All' },
  ];

  async ngOnInit() {
    await this.loadCourses();

    this.professorFeedbackEventService.gradedSolvedActivity$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async () => {
        await this.loadPage();
        this.navigateToFirstSubmission(true);
      });

    this.notificationsService.submissionCreated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async () => {
        if (!this.router.url.startsWith('/main/professor/feedback')) {
          return;
        }

        await this.loadPage();
        this.navigateToFirstSubmission(true);
      });

    await this.loadPage();
    this.navigateToFirstSubmission();
  }

  private navigateToFirstSubmission(force = false) {
    if (this.route.firstChild && !force) {
      return;
    }

    const firstSubmissionId = this.solvedActivities[0]?.id;
    if (!firstSubmissionId) {
      return;
    }

    this.router.navigate([firstSubmissionId], { relativeTo: this.route });
  }

  async onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;

    await this.loadPage();
  }

  async onStatusChange(value: SolvedActivityStatusFilter) {
    this.statusFilter = value;
    this.pageIndex = 0;

    await this.loadPage();
    this.navigateToFirstSubmission(true);
  }

  async onCourseChange(courseId: string) {
    this.courseFilter = courseId;
    this.pageIndex = 0;

    await this.loadPage();
    this.navigateToFirstSubmission(true);
  }

  onStudentNameInput(value: string) {
    this.studentNameFilter = value;
    this.pageIndex = 0;

    if (this.studentNameTimer) {
      clearTimeout(this.studentNameTimer);
    }

    this.studentNameTimer = setTimeout(async () => {
      await this.loadPage();
      this.navigateToFirstSubmission(true);
    }, 400);
  }

  toggleFilters() {
    this.filtersOpen = !this.filtersOpen;
    this.cdr.markForCheck();
  }

  getStatusLabel(status?: SolvedActivityStatus) {
    switch (status) {
      case SolvedActivityStatus.$0:
        return 'Submitted';
      case SolvedActivityStatus.$1:
        return 'Completed';
      case SolvedActivityStatus.$2:
        return 'Returned';
      default:
        return 'Status unknown';
    }
  }

  getStatusClass(status?: SolvedActivityStatus) {
    switch (status) {
      case SolvedActivityStatus.$0:
        return 'status-submitted';
      case SolvedActivityStatus.$1:
        return 'status-completed';
      case SolvedActivityStatus.$2:
        return 'status-returned';
      default:
        return '';
    }
  }

  getSubmittedOn(solvedActivity: SolvedActivityDto) {
    return solvedActivity.updatedOn || solvedActivity.createdOn;
  }

  getSubmitterName(solvedActivity: SolvedActivityDto) {
    return solvedActivity?.solvedByName || 'Unknown student';
  }

  getStatusFilterLabel(): string {
    return (
      this.statusOptions.find((option) => option.value === this.statusFilter)
        ?.label ?? 'Selected'
    );
  }

  getCourseFilterLabel(): string {
    if (!this.courseFilter) {
      return 'All courses';
    }

    return (
      this.courses.find((course) => course.id === this.courseFilter)?.name ??
      'Selected course'
    );
  }

  getEmptySubtitle(): string {
    const courseLabel = this.getCourseFilterLabel();
    const coursePart =
      courseLabel === 'All courses' ? '' : ` for course "${courseLabel}"`;

    if (this.getStatusFilterLabel() === 'All') {
      return `No submissions${coursePart} yet.`;
    }

    const trimmedFilter = this.studentNameFilter.trim();
    const searchPart = trimmedFilter ? ` and search "${trimmedFilter}"` : '';

    return `No submissions matching status ${this.getStatusFilterLabel()}${coursePart}${searchPart} yet.`;
  }

  private async loadCourses() {
    try {
      this.courses =
        await this.courseService.apiCourseCreatedWithActivitiesGetAsync();

      if (this.courseFilter) {
        const stillValid = this.courses.some(
          (course) => course.id === this.courseFilter
        );

        if (!stillValid) {
          this.courseFilter = '';
        }
      }

      this.cdr.detectChanges();
    } catch (error) {
      if (error instanceof Error) {
        this.toastService.open(error.message, 'error');
      }
    }
  }

  private async loadPage() {
    try {
      this.isLoading = true;
      this.cdr.detectChanges();

      const result: PaginatedProfessorSolvedActivityDto =
        await this.solvedActivityService.apiSolvedActivityProfessorGetAsync({
          pageNumber: this.pageIndex + 1,
          pageSize: this.pageSize,
          status: this.statusFilter,
          studentName: this.studentNameFilter.trim() || undefined,
          courseId: this.courseFilter || undefined,
        } as any);

      this.solvedActivities = result.solvedActivities ?? [];
      this.totalCount = result.count ?? 0;
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
}
