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

import {
  StatisticsService,
  ProfessorCourseStatisticsDto,
  ProfessorGeneralStatisticsDto,
} from '$backend/services';
import { AppPageHeaderComponent } from '$shared/page-header';
import { AppToastService } from '$shared/toast';

@Component({
  selector: 'app-professor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    AppPageHeaderComponent,
  ],
  templateUrl: './professor-dashboard.component.html',
  styleUrl: './professor-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessorDashboardComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly statisticsService = inject(StatisticsService);
  private readonly toastService = inject(AppToastService);

  generalStats: ProfessorGeneralStatisticsDto | null = null;
  courseStats: ProfessorCourseStatisticsDto | null = null;

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
        await this.statisticsService.apiStatisticsProfessorGeneralGetAsync();

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
        await this.statisticsService.apiStatisticsProfessorCourseCourseIdGetAsync(
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
