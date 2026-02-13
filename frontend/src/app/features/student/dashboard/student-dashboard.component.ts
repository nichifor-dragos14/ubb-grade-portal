import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

import {
  StatisticsService,
  StudentCourseStatisticsDto,
  StudentGeneralStatisticsDto,
} from '$backend/services';
import { AppPageHeaderComponent } from '$shared/page-header';
import { AppToastService } from '$shared/toast';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    RouterModule,
    AppPageHeaderComponent,
  ],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentDashboardComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly statisticsService = inject(StatisticsService);
  private readonly toastService = inject(AppToastService);

  generalStats: StudentGeneralStatisticsDto | null = null;
  courseStats: StudentCourseStatisticsDto | null = null;

  selectedCourseId: string | null = null;

  isLoadingGeneral = false;
  isLoadingCourse = false;

  async ngOnInit() {
    await this.loadGeneralStatistics();
  }

  async loadGeneralStatistics() {
    try {
      this.isLoadingGeneral = true;
      this.cdr.detectChanges();

      this.generalStats =
        await this.statisticsService.apiStatisticsStudentGeneralGetAsync();

      const defaultCourseId =
        this.generalStats.defaultCourseId ??
        this.generalStats.courses[0]?.id ??
        null;

      if (defaultCourseId) {
        this.selectedCourseId = defaultCourseId;
        await this.loadCourseStatistics(defaultCourseId);
      } else {
        this.courseStats = null;
      }

      this.cdr.detectChanges();
    } catch (error) {
      if (error instanceof Error) {
        this.toastService.open(error.message, 'error');
      }
    } finally {
      this.isLoadingGeneral = false;
      this.cdr.detectChanges();
    }
  }

  async onCourseChange(courseId: string) {
    if (!courseId || courseId === this.selectedCourseId) {
      return;
    }

    this.selectedCourseId = courseId;
    await this.loadCourseStatistics(courseId);
  }

  async loadCourseStatistics(courseId: string) {
    try {
      this.isLoadingCourse = true;
      this.cdr.detectChanges();

      this.courseStats =
        await this.statisticsService.apiStatisticsStudentCourseCourseIdGetAsync(
          { courseId }
        );

      this.cdr.detectChanges();
    } catch (error) {
      if (error instanceof Error) {
        this.toastService.open(error.message, 'error');
      }
    } finally {
      this.isLoadingCourse = false;
      this.cdr.detectChanges();
    }
  }

  hasActivities(): boolean {
    return !!this.courseStats && this.courseStats.totalActivitiesCount > 0;
  }

  hasSubmissions(): boolean {
    return !!this.courseStats && this.courseStats.activitiesWithSolvedCount > 0;
  }

  allActivitiesSubmitted(): boolean {
    return (
      !!this.courseStats &&
      this.courseStats.totalActivitiesCount > 0 &&
      this.courseStats.activitiesWithSolvedCount ===
        this.courseStats.totalActivitiesCount
    );
  }

  allActivitiesSolved(): boolean {
    return (
      !!this.courseStats &&
      this.courseStats.totalActivitiesCount > 0 &&
      this.courseStats.completedCount === this.courseStats.totalActivitiesCount
    );
  }

  getCompletionPercent(): number {
    if (!this.courseStats || this.courseStats.totalActivitiesCount === 0) {
      return 0;
    }

    return (
      (this.courseStats.completedCount * 100) /
      this.courseStats.totalActivitiesCount
    );
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

  hasStudentGrades(): boolean {
    return (
      !!this.courseStats &&
      this.courseStats.completedCount > 0 &&
      this.courseStats.studentAverageGrade > 0
    );
  }

  hasAllStudentsAverage(): boolean {
    return !!this.courseStats && this.courseStats.allStudentsAverageGrade > 0;
  }

  canCompareAverage(): boolean {
    return this.hasStudentGrades() && this.hasAllStudentsAverage();
  }

  getAverageDelta(): number {
    if (!this.courseStats || !this.canCompareAverage()) {
      return 0;
    }

    return (
      this.courseStats.studentAverageGrade -
      this.courseStats.allStudentsAverageGrade
    );
  }

  getAverageDeltaLabel(): string {
    const delta = this.getAverageDelta();
    const sign = delta > 0 ? '+' : '';

    return `${sign}${delta.toFixed(2)}`;
  }

  getDeltaClass(): string {
    const delta = this.getAverageDelta();

    if (delta > 0.05) {
      return 'delta-positive';
    }

    if (delta < -0.05) {
      return 'delta-negative';
    }

    return 'delta-neutral';
  }
}
