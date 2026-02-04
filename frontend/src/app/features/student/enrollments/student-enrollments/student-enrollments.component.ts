import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatBadgeModule } from '@angular/material/badge';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { DateConverterModule } from '$shared/date-converter';

import {
  CourseService,
  ProfessorCreatedCourseDto,
  StudentEnrollmentDto,
} from '$backend/services';
import { AppPageHeaderComponent } from '$shared/page-header';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AppToastService } from '$shared/toast';
import { StudentSolvedActivityEventService } from '$features/student/student-enrollment-event.service';
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

  private readonly toastService = inject(AppToastService);
  private readonly courseService = inject(CourseService);
  private readonly enrollmentService = inject(
    StudentSolvedActivityEventService
  );

  private readonly destroy$ = new Subject<void>();

  enrollments: StudentEnrollmentDto[] = [];
  enrollmentsCount = 0;

  pageIndex = 0;
  pageSize = 9;

  isLoading = false;

  async ngOnInit() {
    await this.loadPage();

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

  async onPageChange(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;

    await this.loadPage();
  }

  getCompletionRate(totalNumber: number, solvedNumber: number): number {
    if (totalNumber === 0) {
      return 0;
    }

    if (solvedNumber === 0) {
      return 0;
    }

    return (solvedNumber * 100) / totalNumber;
  }

  getCompletionPercentText(totalNumber: number, solvedNumber: number): string {
    if (totalNumber === 0) {
      return '—';
    }

    const pct = Math.round(this.getCompletionRate(totalNumber, solvedNumber));
    return `${pct}%`;
  }

  getCompletionLineText(totalNumber: number, solvedNumber: number): string {
    if (totalNumber === 0) {
      return 'No activities were added by the professor yet';
    }

    return `You completed ${solvedNumber} / ${totalNumber} activities`;
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
