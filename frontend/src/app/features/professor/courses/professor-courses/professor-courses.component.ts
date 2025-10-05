import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatBadgeModule } from '@angular/material/badge';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { DateConverterModule } from '$shared/date-converter';

import { CourseService, ProfessorCreatedCourseDto } from '$backend/services';
import { AppPageHeaderComponent } from '$shared/page-header';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProfessorCoursesEventService } from '../professor-courses-event.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  private courseService = inject(CourseService);
  private readonly professorCoursesEventService = inject(
    ProfessorCoursesEventService
  );

  courses: ProfessorCreatedCourseDto[] = [];
  courseCount = 0;

  pageIndex = 0;
  pageSize = 9;

  isLoading = false;

  async ngOnInit() {
    await this.loadPage();

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
    } catch (message: any) {
      this.snackBar.open(message.error, 'Close', {
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async onPage(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;

    await this.loadPage();
  }
}
