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
import { ProfessorCoursesEventService } from '../professor-courses-event.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppToastService } from '$shared/toast';

@Component({
  selector: 'app-professor-courses',
  templateUrl: './professor-courses.component.html',
  styleUrls: ['./professor-courses.component.scss'],
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
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessorCoursesComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly toastService = inject(AppToastService);
  private readonly courseService = inject(CourseService);
  private readonly professorCoursesEventService = inject(
    ProfessorCoursesEventService
  );

  courses: CourseDto[] = [];
  courseCount = 0;

  pageIndex = 0;
  pageSize = 9;

  isLoading = false;

  async ngOnInit() {
    await this.loadPage();
    this.navigateToFirstCourse();

    this.professorCoursesEventService.activityCreated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async () => {
        this.loadPage();
      });

    this.professorCoursesEventService.courseCreated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async () => {
        this.loadPage();
      });
  }

  private navigateToFirstCourse() {
    if (this.route.firstChild) {
      return;
    }

    const firstCourseId = this.courses[0]?.id;
    if (!firstCourseId) {
      return;
    }

    this.router.navigate([firstCourseId], { relativeTo: this.route });
  }

  private async loadPage() {
    try {
      this.isLoading = true;
      this.cdr.detectChanges();

      const result = await this.courseService.apiCourseCreatedGetAsync({
        pageNumber: this.pageIndex + 1,
        pageSize: this.pageSize,
      });

      this.courses = result.courses;
      this.courseCount = result.count;
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
}
