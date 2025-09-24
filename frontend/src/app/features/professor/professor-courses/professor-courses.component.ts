import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatBadgeModule } from '@angular/material/badge';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator'; // 👈 NEW
import { DateConverterModule } from '$shared/date-converter';

import {
  CourseService,
  PaginatedProfessorCreatedCourseDto,
  ProfessorCreatedCourseDto,
} from '$backend/services';
import { AppPageHeaderComponent } from '$shared/page-header';

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
    MatPaginatorModule, // 👈 NEW
    DateConverterModule,
    AppPageHeaderComponent,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessorCoursesComponent implements OnInit {
  readonly courseService = inject(CourseService);
  private cdr = inject(ChangeDetectorRef);

  courses: ProfessorCreatedCourseDto[] = [];
  courseCount = 0;

  pageIndex = 0;
  pageSize = 9;

  async ngOnInit() {
    await this.loadPage();
  }

  private async loadPage(): Promise<void> {
    const result = await this.courseService.apiCourseCreatedGetAsync({
      pageNumber: this.pageIndex + 1,
      pageSize: this.pageSize,
    });

    this.courses = result.courses;
    this.courseCount = result.count;
    this.cdr.detectChanges();
  }

  async onPage(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;

    await this.loadPage();
  }
}
